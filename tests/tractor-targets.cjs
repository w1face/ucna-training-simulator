const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const file=path.join(__dirname,'../trainers/tractor-beam.html'),html=fs.readFileSync(file,'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();const sandbox={Math,document:{getElementById(id){if(!nodes.has(id))nodes.set(id,{value:'',setAttribute(){},focus(){}});return nodes.get(id)}},localStorage:{getItem(){return null},setItem(){}},performance:{now:()=>0}};vm.createContext(sandbox);vm.runInContext(script.slice(0,script.indexOf("const canvas=$('radar')")),sandbox);const run=s=>vm.runInContext(s,sandbox);
const targets=run('TARGETS');assert.equal(targets.length,20);assert.equal(new Set(targets.map(t=>t.id)).size,20);
for(const t of targets){
 assert(html.includes('value="'+t.id+'"'),'selector option '+t.id);
 if(t.icon)assert(fs.existsSync(path.join(__dirname,'../assets/targets',t.icon)),t.id+' icon');
 run(`exercise='basic';selectedTargetId=${JSON.stringify(t.id)};paused=false;resetBasicTarget();updateTargetReadouts()`);
 assert.equal(run('object.radius'),t.radius);assert.equal(run('Math.hypot(object.x,object.y)'),750);
 for(const mode of [1,2,3]){
  run(`Object.assign(object,{x:0,y:-1000});Object.assign(beam,{mode:${mode},range:2000,arc:6,direction:0});advance(.008333333333333333)`);
  const expected=100*100/t.radius*(mode===3?2:1)/1000;
  assert(Math.abs(run('objectSpeed')-expected)<1e-9,t.id+' speed '+mode);
 }
 run("beam.mode=0;advance(1/120)");assert.equal(run('objectSpeed'),0,'off speed');
 run("beam.mode=1;paused=true;advance(1/120)");assert.equal(run('objectSpeed'),0,'pause speed');
}
assert(targets.filter(t=>t.group==='Ordnance').every(t=>t.radius===10));assert.equal(targets.find(t=>t.id==='mine').radius,50);
const h=run("selectedTargetId='freighter-heavy';resetBasicTarget();object.radius");assert.equal(h,350);
run('resetMaze()');assert.equal(run('object.radius'),60,'maze target unchanged after changing Basic');
run('resetBasicTarget()');assert.equal(run('object.radius'),350,'Basic selection survives maze switch');
console.log('PASS: all 20 selector presets, icon files, target radii, measured speed in all three beam modes, pause/off speed, reset and maze isolation.');
