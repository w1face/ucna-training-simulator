// UCNA public scores API — Cloudflare Worker.
// POST requires a verified Turnstile challenge. Never expose GITHUB_TOKEN or TURNSTILE_SECRET to clients.
const GH = "https://api.github.com/repos/w1face/ucna-training-simulator/contents/data/leaderboard.json";
const ORIGIN = "https://w1face.github.io";
const ACCEPT = "application/vnd.github+json";
const MODULES = ["scanning", "radar-icons", "radar-signatures", "hacking"];
const json = (data,status=200) => new Response(JSON.stringify(data), {status,headers:{
  "content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "access-control-allow-origin":ORIGIN,"vary":"Origin","x-content-type-options":"nosniff"
}});
function fail(message,status){return json({error:message},status)}
function validEntry(v){
  if(!v || typeof v!=="object" || Array.isArray(v))return null;
  const callsign=String(v.callsign||"").trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,23}$/.test(callsign) || /https?:|www[.]/i.test(callsign))return null;
  const module=String(v.module||"");
  if(!MODULES.includes(module))return null;
  const variant=String(v.variant||"");
  const score=Number(v.score),maximum=Number(v.maximum),seconds=Number(v.seconds);
  if(!Number.isInteger(score) || !Number.isInteger(maximum) || !Number.isFinite(seconds) || seconds<0.1 || seconds>7200)return null;
  if(module==="radar-icons" && (!["ship","ordnance","mixed"].includes(variant) || maximum!==10 || score<0 || score>10))return null;
  if(module==="radar-signatures" && (!["basic","combined"].includes(variant) || maximum!==2 || score<0 || score>2))return null;
  if(module==="scanning" && (!["initial","full"].includes(variant) || maximum!==100 || score!==100))return null;
  if(module==="hacking" && (!["Basic","Secure","Hardened","Fortified"].includes(variant) || maximum!==100 || score!==100))return null;
  return {callsign,module,variant,score,maximum,seconds:Math.round(seconds*100)/100};
}
async function githubFile(env){
  const r=await fetch(GH+"?ref=main",{headers:{"accept":ACCEPT,"authorization":"Bearer "+env.GITHUB_TOKEN,
    "x-github-api-version":"2022-11-28","user-agent":"UCNA-Academy-Worker"},cache:"no-store"});
  if(!r.ok)throw Error("GitHub read "+r.status);
  const j=await r.json();
  if(!j.sha||typeof j.content!=="string")throw Error("GitHub file response incomplete");
  const bytes=Uint8Array.from(atob(j.content.replace(/\s/g,"")),ch=>ch.charCodeAt(0));
  const data=JSON.parse(new TextDecoder().decode(bytes));
  if(!data || !Array.isArray(data.entries))throw Error("Invalid scoreboard");
  return {sha:j.sha,data};
}
async function verifyTurnstile(token,env,ip){
  if(!token || typeof token!=="string" || token.length>2048)return false;
  const payload=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
  if(ip)payload.set("remoteip",ip);
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",body:payload,headers:{"content-type":"application/x-www-form-urlencoded"}
  });
  if(!r.ok)return false;
  const d=await r.json();
  return d.success===true && d.hostname==="w1face.github.io" && d.action==="ucna-public-score";
}
function encodeBase64(s){
  const bytes=new TextEncoder().encode(s);
  let raw="";for(let i=0;i<bytes.length;i++)raw+=String.fromCharCode(bytes[i]);
  return btoa(raw);
}
async function saveEntry(env,entry){
  // GitHub's contents API uses the previous blob SHA as its optimistic concurrency check.
  for(let attempt=0;attempt<4;attempt++){
    const {sha,data}=await githubFile(env);
    const recent=data.entries.filter(e=>e.callsign?.toLowerCase()===entry.callsign.toLowerCase()
      && new Date(e.receivedAt).getTime()>Date.now()-120000);
    if(recent.length>=3)return {error:"Please leave two minutes between batches of submissions",status:429};
    const all=[...data.entries,entry].slice(-1000);
    const content=encodeBase64(JSON.stringify({version:1,entries:all},null,2)+"\n");
    const r=await fetch(GH,{method:"PUT",headers:{"accept":ACCEPT,"authorization":"Bearer "+env.GITHUB_TOKEN,
      "content-type":"application/json","x-github-api-version":"2022-11-28","user-agent":"UCNA-Academy-Worker"},
      body:JSON.stringify({message:"Academy opt-in public score: "+entry.module,content,sha,branch:"main"})});
    if(r.ok)return {ok:true,id:entry.id};
    if(r.status!==409 && r.status!==422)throw Error("GitHub write "+r.status);
  }
  return {error:"Scoreboard was busy; retry later",status:503};
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{
      "access-control-allow-origin":ORIGIN,"access-control-allow-methods":"GET, POST, OPTIONS",
      "access-control-allow-headers":"Content-Type","access-control-max-age":"7200","vary":"Origin"
    }});
    if(request.method==="GET" && url.pathname==="/health")return json({status:"ok",writesEnabled:!!env.GITHUB_TOKEN&&!!env.TURNSTILE_SECRET});
    if(request.method==="GET" && url.pathname==="/scores"){
      try{
        if(!env.GITHUB_TOKEN)return fail("Scoreboard not configured",503);
        const {data}=await githubFile(env);
        return json({version:1,entries:data.entries});
      }catch(e){return fail("Scoreboard temporarily unavailable",503)}
    }
    if(request.method!=="POST"||url.pathname!=="/scores")return fail("Not found",404);
    if(request.headers.get("origin")!==ORIGIN)return fail("Invalid origin",403);
    if(!env.GITHUB_TOKEN||!env.TURNSTILE_SECRET)return fail("Publishing not configured",503);
    if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return fail("Expected JSON",415);
    if(Number(request.headers.get("content-length")||0)>4096)return fail("Request too large",413);
    let req;try{const raw=await request.text();if(raw.length>4096)return fail("Request too large",413);req=JSON.parse(raw)}
    catch{return fail("Invalid JSON",400)}
    if(req.consent!==true)return fail("Explicit public opt-in required",400);
    const proposed=validEntry(req);
    if(!proposed)return fail("Invalid score or callsign",400);
    let valid=false;
    try{valid=await verifyTurnstile(req.token,env,request.headers.get("cf-connecting-ip"))}catch{}
    if(!valid)return fail("Human verification failed or expired",403);
    const entry={id:crypto.randomUUID(),...proposed,receivedAt:new Date().toISOString(),selfReported:true};
    try{
      const saved=await saveEntry(env,entry);
      return saved.error?fail(saved.error,saved.status):json(saved,201);
    }catch{return fail("Unable to store result in GitHub",503)}
  }
};