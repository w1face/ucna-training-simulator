const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../trainers/tractor-beam.html'),'utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map(),saved=new Map();let now=0;
const context={Math,console,performance:{now:()=>now},localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},document:{getElementById(id){if(!elements.has(id))elements.set(id,{value:0,disabled:false,setAttribute(){},focus(){}});return elements.get(id)}}};
vm.createContext(context);vm.runInContext(script.slice(0,script.indexOf("const canvas=$('radar')")),context);
function run(s){return vm.runInContext(s,context)}
run("exercise='maze';resetMaze();run.state='running';run.started=0");
assert.equal(run('mazeBlocked(object)'),false);
assert(Math.abs(run('bearingOf(object)')-10)<.001,'start bearing 10');
assert.equal(run('beam.direction'),10);
assert.equal(run('mazeBlocked(polar(0,1060))'),true,'zero divider solid across old gap');
assert.equal(run('mazeBlocked(polar(45,1100))'),true);
assert.equal(run('mazeBlocked(polar(45,760))'),false);
run('Object.assign(object,polar(40,1100));moveObject(...Object.values(polar(50,1100)))');
assert(run('bearingOf(object)')<45,'swept collision blocks wall tunnelling');
run('resetMaze();run.state="running";moveObject(...Object.values(polar(350,1060)))');
assert(run('bearingOf(object)')>0&&run('bearingOf(object)')<10,'backwards shortcut blocked by solid wall');
assert.equal(run('run.passed'),0,'backwards crossing cannot finish');
assert.equal(run('run.state'),'running');
run('resetMaze();run.state="running"');
// An actual operator replay: radial Push/Pull between gates, Hold to sweep.
let ticks=0;function tick(){now+=1000/120;ticks++;run('advance(1/120)')}
function radius(){return run('Math.hypot(object.x,object.y)')}
function setDirection(a){run('beam.direction='+(((a+180)%360+360)%360-180))}
function holdSweep(to){let a=run('run.lap'),r=radius();run(`beam.mode=3;beam.range=${r+141};beam.arc=Math.min(15,24000000/(beam.range*beam.range))`);while(a<to){a=Math.min(to,a+.06);setDirection(a);tick();if(run('run.contact'))throw Error('Wall at sweep '+a+' r '+radius())}for(let i=0;i<120&&run('run.state')==='running';i++)tick()}
const gateAngles=run('MAZE.gates.map(g=>g.angle)');
assert.deepStrictEqual(Array.from(gateAngles),[45,90,135,170,190,225,270,315]);
for(let i=0;i<gateAngles.length;i++){
 const angle=((i===0?10:gateAngles[i-1])+gateAngles[i])/2;
 holdSweep(angle);
 const target=run(`(MAZE.gates[${i}].low+MAZE.gates[${i}].high)/2`);setDirection(angle);
 const outward=radius()<target;run(`beam.mode=${outward?2:1};beam.range=1700;beam.arc=8`);
 let limit=10000;while((outward?radius()<target:radius()>target)&&--limit){tick();if(run('run.contact'))throw Error('Wall at radial '+angle+' radius '+radius())}assert(limit>0,'radial move reachable');
 holdSweep(gateAngles[i]+.3);
 assert.equal(run('run.passed'),i+1,'ordered gate '+(i+1));
}
assert.equal(run('run.state'),'running','eighth gate is not the finish');
holdSweep(350.3);
assert.equal(run('run.state'),'finished');assert(run('run.lap')>=350&&run('run.lap')<350.5);assert.equal(saved.size,1,'local best stored');
const finish=run('run.elapsed');now+=10000;assert.equal(run('elapsed()'),finish,'finish stops timer');
run('resetMaze()');assert.equal(run('run.state'),'ready');assert.equal(run('run.passed'),0);assert.equal(run('run.elapsed'),0);assert.equal(radius(),1060);assert.equal(run('best'),finish,'restart retains best');
run("exercise='basic';Object.assign(object,{x:0,y:-750,radius:100});Object.assign(beam,{mode:1,range:1000,arc:24,direction:0})");for(let i=0;i<1200;i++)tick();assert(Math.abs(radius()-200)<.01,'basic pull unchanged');

// Radius is the game's size term; there is no mass variable in tractor movement.
// Measure free movement well away from each mode's destination.
for(const r of [10,50,60,100,200]){
 for(const mode of [1,2,3]){
  run(`exercise='basic';paused=false;Object.assign(object,{x:0,y:-1000,radius:${r}});Object.assign(beam,{mode:${mode},range:2000,arc:6,direction:0})`);
  const before=radius();run('advance(.1)');
  const expected=.1*100*(mode===3?2:1)*100/r;
  assert(Math.abs(Math.abs(radius()-before)-expected)<1e-6,'radius '+r+' mode '+mode+' drag scaling');
 }
}
// Preserve source order: clamp distance first, then multiply by 100 / radius.
// Small objects can overshoot near the holding point in the actual game too.
run("Object.assign(object,{x:0,y:-1910,radius:10});Object.assign(beam,{mode:3,range:2000,arc:6,direction:0});advance(.1)");
assert(Math.abs(radius()-1900)<1e-6,'source-faithful small-object overshoot');
console.log('PASS: source drag 100, five radii, Pull/Push/Hold multipliers and source clamp/scaling order.');

console.log('PASS: fixed course, swept wall collisions, backwards shortcut rejection, clockwise 010-to-350 Push/Pull/Hold replay, ordered gates, finish timer, local best, reset, Basic regression. Replay time '+finish.toFixed(2)+'s');
