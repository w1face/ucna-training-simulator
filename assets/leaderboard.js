/* UCNA Public Leaderboard (opt-in; local records remain private by default). */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const cfg = window.UCNA_LEADERBOARD_CONFIG || {};
  const STORAGE = "ucn.academy.results.v1";
  const categoryNames = {
    "radar-icons|mixed": "Icon Recognition · Mixed",
    "radar-icons|ship": "Icon Recognition · Ships",
    "radar-icons|ordnance": "Icon Recognition · Ordnance",
    "radar-signatures|basic": "Signatures · Basic",
    "radar-signatures|combined": "Signatures · Combined",
    "scanning|initial": "Scanning · Initial",
    "scanning|full": "Scanning · Complete",
    "hacking|Basic": "Hacking · Basic",
    "hacking|Secure": "Hacking · Secure",
    "hacking|Hardened": "Hacking · Hardened",
    "hacking|Fortified": "Hacking · Fortified"
  };
  const categories=Object.keys(categoryNames);
  const scoreKeys = new Set(categories);
  const dataElem=$("publicRows"), select=$("publicCategory"), recent=$("publicLocalResult");
  const msg=$("publicStatus"), publish=$("publicSubmit"), alias=$("publicCallsign"), consent=$("publicConsent");
  const challenge=$("ucnaTurnstile");
  let entries=[],busy=false,serviceReady=false;
  const prepared=typeof cfg.endpoint==="string" && /^https:\/\/[^/]+/.test(cfg.endpoint)
    && typeof cfg.turnstileSiteKey==="string" && cfg.turnstileSiteKey.length>10;
  const status=(s)=>{msg.textContent=s};
  function records(){
    try{const r=JSON.parse(localStorage.getItem(STORAGE)||"[]");return Array.isArray(r)?r:[]}
    catch{return []}
  }
  function scoreFrom(record){
    const r=record.record||{},module=record.module;let variant,score,maximum,seconds;
    if(module==="radar-icons"){
      variant=r.type;
      score=Number(r.correct);maximum=10;seconds=Number(r.avg)*10;
    }else if(module==="radar-signatures"){
      variant=r.mode;score=Number(!!r.sectorCorrect)+Number(!!r.bandCorrect);
      maximum=2;seconds=Number(r.seconds);
    }else if(module==="hacking"){
      if(r.success!==true)return null;
      variant=r.tierName;score=100;maximum=100;seconds=Number(r.secs);
    }else if(module==="scanning"){
      variant=r.mode;score=100;maximum=100;
      seconds=Number(variant==="initial"?r.initial:r.complete);
      if((variant==="initial"&&r.initial==null)||(variant==="full"&&r.complete==null))return null;
    }else return null;
    if(!scoreKeys.has(module+"|"+variant)||!Number.isInteger(score)||!Number.isInteger(maximum)
      ||score<0||score>maximum||!Number.isFinite(seconds)||seconds<0.1||seconds>7200)return null;
    return {module,variant,score,maximum,seconds:Math.round(seconds*100)/100};
  }
  function localSelection(){
    const list=records(), previous=recent.value;recent.replaceChildren();
    let count=0;
    for(let i=list.length-1;i>=0 && count<100;i--){
      const r=list[i],score=scoreFrom(r);if(!score)continue;
      const opt=document.createElement("option");opt.value=String(i);
      const when=r.receivedAt?new Date(r.receivedAt).toLocaleDateString("en-GB"):"";
      const figure=score.module==="scanning"||score.module==="hacking"?
        score.seconds+"s":score.score+"/"+score.maximum;
      opt.textContent=when+" · "+categoryNames[score.module+"|"+score.variant]+" · "+figure;
      recent.append(opt);count++;
    }
    if(!count){const o=document.createElement("option");o.value="";o.textContent="Complete an eligible training exercise first";recent.append(o)}
    if(previous && [...recent.options].some(o=>o.value===previous))recent.value=previous;
    updateEnabled();
  }
  function updateEnabled(){
    publish.disabled=busy||!serviceReady||!consent.checked||!recent.value||!
      /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,23}$/.test(alias.value.trim());
  }
  function compare(a,b){
    // Each category is separate. Accuracy first, then fastest completion.
    return (b.score/b.maximum)-(a.score/a.maximum) || a.seconds-b.seconds;
  }
  function render(){
    const key=select.value;dataElem.replaceChildren();
    const sorted=entries.filter(e=>e.module+"|"+e.variant===key).sort(compare);
    const best=new Map();
    for(const e of sorted){
      const who=String(e.callsign||"").toLowerCase();
      if(!best.has(who))best.set(who,e);
    }
    const leaders=[...best.values()].slice(0,15);
    if(!leaders.length){
      const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=4;
      td.textContent="No public results in this category yet.";tr.append(td);dataElem.append(tr);return;
    }
    for(let i=0;i<leaders.length;i++){
      const e=leaders[i],tr=document.createElement("tr");
      const fields=[String(i+1),e.callsign,Math.round(e.score/e.maximum*100)+"%",e.seconds.toFixed(2)+"s"];
      for(const val of fields){const td=document.createElement("td");td.textContent=val;tr.append(td)}
      dataElem.append(tr);
    }
  }
  async function refresh(){
    try{
      const r=await fetch("data/leaderboard.json?v="+Date.now(),{cache:"no-store"});
      if(!r.ok)throw Error();
      const j=await r.json();entries=Array.isArray(j.entries)?j.entries.filter(e=>
        e&&scoreKeys.has(e.module+"|"+e.variant)&&typeof e.callsign==="string"): [];
      render();
      $("publicLastSync").textContent="Public entries: "+entries.length;
    }catch{status("Unable to load the public scoreboard. Local records are unaffected.");}
  }
  async function checkService(){
    serviceReady=false;updateEnabled();
    if(!prepared){
      status("Public publishing is not yet enabled. Private training and record export work normally.");
      return;
    }
    try{
      const r=await fetch(cfg.endpoint.replace(/\\/+$/,"")+"/health",{cache:"no-store"});
      if(!r.ok)throw new Error("Service unavailable");
      const info=await r.json();
      serviceReady=info.status==="ok" && info.writesEnabled===true;
      if(serviceReady)status("Public publishing is ready. Select an attempt and consent to publish.");
      else status("Public publishing is being configured. Private training remains available.");
    }catch{
      status("Public publishing is temporarily unavailable. Local records are unaffected.");
    }
    updateEnabled();
  }
  let scriptLoading=null;
  function loadTurnstile(){
    if(window.turnstile)return Promise.resolve();
    if(scriptLoading)return scriptLoading;
    scriptLoading=new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(Error("Verification could not load"));
      document.head.append(script);
    });
    return scriptLoading;
  }
  async function submitWithToken(token,payload){
    try{
      const r=await fetch(cfg.endpoint.replace(/\/+$/,"")+"/scores",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({...payload,token,consent:true})
      });
      const data=await r.json();
      if(!r.ok)throw Error(data.error||"Submission failed");
      status("Published under callsign "+payload.callsign+". GitHub Pages may take a short time to refresh.");
      consent.checked=false;await refresh();
    }catch(e){status("Not published: "+e.message)}
    finally{busy=false;updateEnabled();if(window.turnstile)window.turnstile.remove(challenge.dataset.widgetId)}
  }
  async function publishSelected(){
    if(!serviceReady||busy)return;
    const score=scoreFrom(records()[Number(recent.value)]||{});
    const callsign=alias.value.trim();
    if(!score||!consent.checked||!(/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,23}$/.test(callsign))){
      status("Choose a completed result, a public callsign and confirm consent.");return;
    }
    busy=true;updateEnabled();status("Complete the human verification to publish.");
    try{
      await loadTurnstile();
      challenge.replaceChildren();
      const widgetId=window.turnstile.render(challenge,{
        sitekey:cfg.turnstileSiteKey,action:"ucna-public-score",
        callback:token=>submitWithToken(token,{...score,callsign}),
        "error-callback":()=>{status("Verification unavailable. Try again.");busy=false;updateEnabled()},
        "expired-callback":()=>{status("Verification expired. Try again.");busy=false;updateEnabled()}
      });
      challenge.dataset.widgetId=widgetId;
    }catch(e){status(e.message);busy=false;updateEnabled()}
  }
  for(const category of categories){
    const opt=document.createElement("option");opt.value=category;opt.textContent=categoryNames[category];select.append(opt);
  }
  select.value="radar-icons|mixed";
  select.addEventListener("change",render);
  publish.addEventListener("click",publishSelected);
  consent.addEventListener("change",updateEnabled);
  alias.addEventListener("input",updateEnabled);
  recent.addEventListener("change",updateEnabled);
  $("publicRefresh").addEventListener("click",refresh);
  window.addEventListener("ucna-records-changed",localSelection);
  window.addEventListener("storage",e=>{if(e.key===STORAGE)localSelection()});
  localSelection();refresh();checkService();
})();