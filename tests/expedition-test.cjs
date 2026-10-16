'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../src/adventure.js');
let generated=0;
// Thousands of regenerated maps must retain the central escape lane and connected graph.
for(let seed=0;seed<40;seed++)for(let n=1;n<=100;n++){
 const s=A.generatedStage('QA-'+seed,n,{adaptive:true,style:seed%2?'sweeper':'still'});
 assert.ok(A.validateStage(s));assert.equal(s.n,n);assert.equal(s.region,Math.floor((n-1)/10));assert.equal(s.boss,n%10===0);generated++;
 const twin=A.generatedStage('QA-'+seed,n,{adaptive:true,style:seed%2?'sweeper':'still'});assert.deepEqual(s,twin,'same seed produces identical stage');
}
assert.notDeepEqual(A.generatedStage('A',22),A.generatedStage('B',22));
assert.equal(A.generatedStage('A',22,{adaptive:false,style:'still'}).adaptation,'balanced');
assert.equal(A.generatedStage('A',22,{adaptive:true,style:'still'}).adaptation,'motion');
function tick(e,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++)e.update(.05);}
function fresh(stage=3,extra={}){const e=new A.Engine({seed:'QA',stage,...extra});e.nextEnemy=9999;e.nextWave=9999;e.stage.obstacles=[];return e;}
// Traps punish sweeping, leave accurate damage causes, and never instantly spawn on the hero.
{
 const e=fresh();e.score=200;const trap=e.spawn('trap',{x:70,y:300});assert.ok(Math.hypot(trap.x-e.drone.x,trap.y-e.drone.y)>=95);tick(e,1.2);e.swipe({x:trap.x-25,y:trap.y},{x:trap.x+25,y:trap.y});assert.equal(e.hp,90);assert.equal(e.score,100);assert.equal(e.stats.trap,1);assert.equal(e.combo,0);assert.ok(e.coach()[1].includes('kısa'));
 e.hurt(99,'hunter');assert.equal(e.hp,90,'one-second invulnerability');tick(e,1.1);e.hurt(99,'hunter');assert.equal(e.status,'lost');assert.equal(e.lastCause,'hunter');
}
// Idle play actually loses: priority misses and a measurable timeout are failure states.
{
 const e=fresh();for(let i=0;i<17;i++){e.spawn('target',{priority:true,expires:e.t+.1});tick(e,1.2);}assert.equal(e.status,'lost');assert.ok(e.stats.misses>0);
 const t=fresh(1);tick(t,39);assert.equal(t.status,'lost');assert.equal(t.lastCause,'timeout');
}
// All telegraphs last at least 1.15 seconds; the director budgets simultaneous attacks.
{
 const e=fresh(21),foes=[];for(let i=0;i<5;i++)foes.push(e.spawn('hunter',{x:40+i*60,y:220,expires:Infinity}));for(const f of foes)e.beginAttack(f);assert.equal(foes.filter(f=>f.state==='windup').length,1);const f=foes[0];const lock=JSON.stringify(f.lock);tick(e,.6);e.move(35,500);tick(e,.4);assert.equal(f.state,'windup');assert.equal(JSON.stringify(f.lock),lock,'committed aim never reads future input');tick(e,1.1);assert.equal(f.state,'recover');const energy=e.energy;e.swipe({x:f.x-25,y:f.y},{x:f.x+25,y:f.y});assert.ok(f.dead);assert.ok(e.energy>energy);assert.equal(e.stats.counter,1);
}
// Shields and directional targets have functional weaknesses, not color-only hints.
{
 const e=fresh(21),s=e.spawn('shield',{x:150,y:260,expires:Infinity,facing:0});e.swipe({x:185,y:260},{x:130,y:260});assert.equal(s.dead,undefined);e.swipe({x:115,y:260},{x:165,y:260});assert.equal(s.dead,true);
 const d=e.spawn('directional',{x:250,y:350,arrow:0,expires:Infinity});e.swipe({x:280,y:350},{x:220,y:350});assert.ok(!d.dead);e.swipe({x:220,y:350},{x:280,y:350});assert.ok(d.dead);
 const a=e.spawn('linked',{x:80,y:350,expires:Infinity}),b=e.spawn('linked',{x:180,y:350,expires:Infinity});a.partner=b.id;b.partner=a.id;e.swipe({x:130,y:320},{x:130,y:380});assert.ok(a.unlinked&&b.unlinked);e.swipe({x:55,y:350},{x:100,y:350});assert.ok(a.dead);
}
// Support enemies, bounded summons, warning mines, friendly fire and vengeance are real behaviors.
{
 const e=fresh(71);const healer=e.spawn('healer',{x:80,y:230,expires:Infinity}),ally=e.spawn('hunter',{x:250,y:230,expires:Infinity});e.beginAttack(healer);tick(e,1.3);assert.equal(ally.hp,2);
 const sum=e.spawn('summoner',{x:50,y:220,expires:Infinity});e.entities=[sum];for(let i=0;i<4;i++){sum.state='idle';e.beginAttack(sum);tick(e,1.3);}assert.ok(e.entities.filter(f=>f.parent===sum.id).length<=2);
 const miner=e.spawn('miner',{x:280,y:220,expires:Infinity});e.entities=[miner];e.beginAttack(miner);tick(e,1.3);assert.ok(e.entities.some(f=>f.kind==='trap'&&e.t-f.since<1.1));
 const fire=fresh(71),h=fire.spawn('hunter',{x:180,y:220,expires:Infinity}),other=fire.spawn('healer',{x:180,y:350,expires:Infinity});fire.beginAttack(h);tick(fire,1.65);assert.ok(other.dead);assert.ok(fire.stats.friendly>0);
 const v=fresh(71),leader=v.spawn('leader',{x:100,y:280,state:'recover',expires:Infinity}),av=v.spawn('avenger',{x:280,y:220,expires:Infinity});v.swipe({x:70,y:280},{x:130,y:280});assert.ok(v.frozen>v.t);assert.ok(av.enraged);
}
// Cards cannot heal forever, chain into a trap, or overflow the fixed particle/entity budgets.
{
 const e=fresh(21,{cards:{heal:3,volt:3,chain:3,burst:3,focus:3}});e.hp=20;const trap=e.spawn('trap',{x:50,y:250,expires:Infinity});
 for(let n=0;n<100;n++){const f=e.spawn('target',{x:180,y:320});e.cut(f,0,f,f);e.t+=.1;e.entities=e.entities.filter(f=>!f.dead);}assert.equal(e.heals,2);assert.equal(e.hp,38);assert.ok(!trap.dead);assert.ok(e.fx.length<=100);assert.ok(e.energy<=100);
 const p=fresh();for(let n=0;n<100;n++)p.spawn('target');assert.equal(p.entities.length,32);
}
// Tutorial requires input, shields damage, and resets the encounter clock once learned.
{
 const e=fresh(1,{tutorial:true});tick(e,10);assert.equal(e.tutorial,'target');const f=e.entities[0];e.swipe({x:f.x-20,y:f.y},{x:f.x+20,y:f.y});assert.equal(e.tutorial,'trap');e.move(40,500);tick(e,2);assert.equal(e.tutorial,'dodge');e.move(300,480);tick(e,4);assert.equal(e.tutorial,'counter');const h=e.entities.find(f=>f.kind==='hunter');e.swipe({x:h.x-30,y:h.y},{x:h.x+30,y:h.y});assert.equal(e.tutorial,null);assert.equal(e.t,0);assert.equal(e.hp,100);
}
// A deterministic input bot completes every stage using legal cuts, dodges and recovery counters.
let victories=0,failed=[];
for(let n=1;n<=100;n++){
 const e=new A.Engine({seed:'BOT',stage:n,cards:{guard:2,wide:1,focus:1},options:{adaptive:false}});
 for(let frame=0;frame<1300&&e.status==='playing';frame++){
  // Central escape lane: choose the farthest safe point from committed attack lines.
  const attacks=e.entities.filter(x=>x.state==='windup'||x.state==='attack');const spots=[{x:135,y:510},{x:225,y:510},{x:180,y:430},{x:110,y:450},{x:250,y:450}];
  const score=p=>Math.min(200,...attacks.map(f=>A.segmentDistance(p,f.from||f,f.lock||f)));
  const p=spots.sort((a,b)=>score(b)-score(a))[0];e.move(p.x,p.y);
  for(const f of [...e.entities])if(f.kind==='target'){e.move(f.x+20,f.y);e.swipe({x:f.x-20,y:f.y},{x:f.x+20,y:f.y});}else if(f.state==='recover'){e.move(f.x+25,f.y);e.swipe({x:f.x-25,y:f.y},{x:f.x+25,y:f.y});}
  if(e.bossOpen())for(const b of e.bossPoints())if(b.open){e.move(b.x+30,b.y);e.swipe({x:b.x-30,y:b.y},{x:b.x+30,y:b.y});}
  e.move(p.x,p.y);e.update(.05);
 }
 if(e.status==='won')victories++;else failed.push([n,e.lastCause,e.hp,e.stats.cuts,e.bossHP,e.stage.kind]);
}
assert.deepEqual(failed,[],'all campaign stages must be completable by the input bot');assert.equal(victories,100);
// Inline deploy artifacts must exactly match their editable sources, including the offline engine.
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');for(const f of ['adventure.js','adventure-ui.js','adventure.css'])assert.ok(html.includes(fs.readFileSync(require('node:path').join(__dirname,'../src',f),'utf8')));
console.log(`PASS: ${generated} generated layouts, deterministic seeds, 100 full-stage bot victories, loss states, fair tells, counters, enemy teams, card limits, bounded effects and interactive tutorial`);
