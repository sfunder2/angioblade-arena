'use strict';const assert=require('node:assert/strict'),fs=require('node:fs');require('../src/adventure.js');const A=require('../src/impact.js');require('../src/impact-render.js');
function fresh(n=3,extra={}){const e=new A.Engine({seed:'V7',stage:n,...extra});e.nextWave=9999;e.nextEnemy=9999;e.stage.obstacles=[];return e;}
function tick(e,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++)e.update(.05);}
function cut(e,x=180,y=300){const f=e.spawn('target',{x,y});e.swipe({x:x-25,y},{x:x+25,y});return f;}
{
 let previous=0;
 for(let n=1;n<=100;n++){
  const e=fresh(n);assert.ok(e.targetSpeed()>previous,'each stage increases speed');previous=e.targetSpeed();
  const early=e.targetSpeed();e.t=e.stage.duration;assert.ok(e.targetSpeed()>early,'speed ramps within a stage');assert.ok(e.targetSpeed()<=150);
 }
 const e=fresh(1),a=e.spawn('target',{x:180,y:300});e.updateEnemy(a,.01);const speed=Math.hypot(a.vx,a.vy);
 e.t=e.stage.duration*.8;e.updateEnemy(a,.01);assert.ok(Math.hypot(a.vx,a.vy)>speed,'already spawned targets accelerate');
 const late=fresh(100),b=late.spawn('target',{x:180,y:300});late.updateEnemy(b,.01);assert.ok(Math.hypot(b.vx,b.vy)>speed*3);
 const restored=fresh(100),c=restored.spawn('target',{x:180,y:300,driftX:10,driftY:0});restored.updateEnemy(c,.01);assert.ok(c.vx>100,'old checkpoints receive current speed');
 const tutorial=fresh(1,{tutorial:true});tutorial.t=100;assert.equal(tutorial.targetSpeed(),18);
}

{
 const e=fresh(1),a=e.spawn('target',{x:180,y:300,expires:9999});
 const x=a.x,y=a.y;tick(e,1);assert.ok(Math.hypot(a.x-x,a.y-y)>15,'early-stage targets move visibly');
 const same=fresh(1),b=same.spawn('target',{x:180,y:300,expires:9999});tick(same,1);assert.equal(a.x,b.x);assert.equal(a.y,b.y);
 const before={x:a.x,y:a.y};e.frozen=e.t+2;tick(e,1);assert.deepEqual({x:a.x,y:a.y},before,'stasis freezes target movement');
 e.frozen=0;for(let i=0;i<300;i++){e.updateEnemy(a,.05);assert.ok(a.x>=40&&a.x<=320&&a.y>=201&&a.y<=509);}
 e.swipe({x:a.x-25,y:a.y},{x:a.x+25,y:a.y});assert.ok(a.dead,'swipe uses the moving target position');
 const wall=fresh(1);wall.stage.obstacles=[{x:230,y:250,w:30,h:100}];const c=wall.spawn('target',{x:210,y:300});c.driftX=40;c.driftY=0;wall.updateEnemy(c,.2);assert.equal(c.x,210);assert.ok(c.driftX<0,'targets bounce off walls');
 const reduced=fresh(1,{options:{motion:true}}),d=reduced.spawn('target',{x:180,y:300});tick(reduced,1);assert.notEqual(d.x,180,'reduced visual effects retain gameplay motion');
 const tutorial=fresh(1,{tutorial:true}),t=tutorial.entities[0],tx=t.x;tick(tutorial,1);assert.notEqual(t.x,tx,'training targets also move');
}

{
 const e=fresh();cut(e);assert.equal(e.stats.precise,1);assert.ok(e.animations.some(a=>a.type==='split'));assert.ok(e.animations.some(a=>a.type==='precision'));assert.ok(e.slashes.length);assert.ok(e.score>=35);
 const edge=fresh();edge.spawn('target',{x:180,y:300});edge.swipe({x:150,y:300},{x:158,y:300});assert.equal(edge.stats.precise,1,'center-aligned short pointer segments are recognized');
 const a=e.spawn('target',{x:80,y:280,armor:1});e.swipe({x:50,y:280},{x:110,y:280});assert.equal(a.armor,0);assert.ok(e.animations.some(a=>a.type==='crack'));assert.equal(e.hitstop,.04);
 for(let n=0;n<140;n++)cut(e,100+n%50,320);assert.ok(e.animations.length<=70);assert.ok(e.slashes.length<=10);tick(e,1.5);assert.ok(e.animations.length<=18);
}
{
 const e=fresh(3,{options:{motion:true}});cut(e);assert.equal(e.hitstop,0);assert.ok(e.animations.length<=18);e.end(true,'complete');assert.ok(e.animations.some(a=>a.type==='victory'));
 const boss=fresh(10);boss.end(true,'complete');assert.ok(boss.finisher);assert.ok(boss.animations.some(a=>a.type==='finisher'));
}
{
 const e=fresh(3,{artifact:'glass'});e.hurt(10,'hunter');assert.equal(e.hp,87);const score=e.score;cut(e);assert.ok(e.score-score>=41);
 const anchor=fresh(3,{artifact:'anchor'});assert.equal(anchor.shields,1);assert.equal(anchor.cutWidth,-8);
 const spark=fresh(3,{artifact:'spark'});assert.equal(spark.comboOffset,-.3);const start=spark.energy;cut(spark);assert.ok(spark.energy-start>=6);
 const fair=fresh(12,{fair:true,cards:{guard:3,wide:3},hero:'guardian',blade:'wide',bladeLevel:5,skills:['armor'],mastery:50000,artifact:'anchor',specialization:'bastion',options:{speed:1.15,adaptive:true}});assert.equal(fair.hero,'cutter');assert.deepEqual(fair.cards,{});assert.equal(fair.artifact,'');assert.equal(fair.options.speed,1);assert.equal(fair.options.adaptive,false);assert.equal(fair.mastery,0);
}
{
 const precision=fresh(3,{specialization:'precision'}),standard=fresh();cut(precision);cut(standard);assert.equal(precision.energy-standard.energy,4);
 const guard=fresh(3,{hero:'guardian',variant:'fortify'});guard.energy=100;assert.ok(guard.ability());assert.equal(guard.shields,3);assert.equal(guard.skillAt,10);
 const light=fresh(3,{hero:'guardian',variant:'sustain'});light.energy=100;light.ability();assert.equal(light.shields,1);assert.equal(light.skillAt,4);
 const orb=fresh(3,{hero:'cutter',variant:'orbit'});orb.energy=100;for(let i=0;i<8;i++)orb.spawn('target');assert.ok(orb.ability());assert.equal(orb.stats.cuts,8);assert.equal(orb.skillAt,8);
 const clutch=fresh();clutch.hp=5;clutch.shields=1;clutch.hurt(10,'hunter');assert.equal(clutch.stats.clutch,1);assert.equal(clutch.hp,5);
 const parry=fresh(),h=parry.spawn('hunter',{x:80,y:240,expires:Infinity});parry.beginAttack(h);tick(parry,1);parry.swipe({x:h.x-20,y:h.y},{x:h.x+20,y:h.y});assert.equal(parry.stats.interrupt,1);assert.ok(h.dead);
}
{
 const e=fresh(12);tick(e,12);assert.equal(e.phase,'pressure');assert.ok(e.hazard);tick(e,20);assert.equal(e.phase,'final');assert.ok(e.finalSpawned);
 const m=fresh(15);tick(m,11);assert.ok(m.entities.some(e=>e.mini));
 const one=fresh(12,{rule:'onehp'});assert.equal(one.hp,1);one.hurt(2,'hunter');assert.equal(one.status,'lost');
 const counter=fresh(12,{rule:'counter'});counter.waveSpawn();assert.equal(counter.objective().key,'counter');assert.equal(counter.entities.filter(e=>e.kind==='target').length,0);assert.ok(counter.entities.some(e=>e.kind==='hunter'));
}
{
 const code=A.encodeGhost({seed:'Türkçe-✦',stage:12,score:123,path:[{t:1,x:30,y:200},{t:2,x:60,y:300},{t:3,x:70,y:400},{t:4,x:80,y:500}]});const d=A.decodeGhost(code);assert.equal(d.seed,'Türkçe-✦');assert.equal(d.score,123);assert.equal(d.path.length,2);assert.throws(()=>A.decodeGhost('invalid!'));assert.throws(()=>A.decodeGhost(Buffer.from(JSON.stringify({v:1,seed:'X',stage:101,score:1,path:[]})).toString('base64')));
 assert.equal(A.dailyCode('2026-10-18'),'DAILY-2026-10-18');assert.equal(A.weeklyRule('2026-10-18'),A.weeklyRule('2026-10-19'));
}
// Exercise every rendering branch without unbounded paths or non-finite coordinates.
{
 let draws=0;const ctx=new Proxy({},{get:(o,k)=>o[k]||((...args)=>{if(['translate','scale','arc','lineTo','moveTo'].includes(k))for(const n of args)assert.ok(typeof n!=='number'||Number.isFinite(n));draws++;}),set:(o,k,v)=>(o[k]=v,true)});const e=fresh();for(const type of ['split','impact','crack','precision','clutch','combo','fusion','finisher','victory','parry','barrier','stasis','recover','intent','spawn','biome','cleave'])e.addAnimation(type,{x:180,y:300},{age:.1,count:10,duration:.6,shape:'cell',material:'organic'});e.slashes=[{ax:40,ay:200,bx:80,by:240,age:.1,blade:'wide'}];A.drawImpact(ctx,e,{ghost:{path:[[1,200,300]]}});assert.ok(draws>100);
}
let wins=0,fail=[];
for(let n=1;n<=100;n++){
 const e=new A.Engine({seed:'V7-BOT',stage:n,cards:{guard:2,wide:1,focus:1},options:{adaptive:false}});
 for(let f=0;f<1500&&e.status==='playing';f++){
  const attacks=e.entities.filter(x=>x.state==='windup'||x.state==='attack'),spots=[{x:135,y:510},{x:225,y:510},{x:180,y:430},{x:110,y:450},{x:250,y:450}];
  const score=p=>Math.min(200,...attacks.map(x=>A.segmentDistance(p,x.from||x,x.lock||x)))-(e.hazard&&Math.abs((e.hazard.axis==='x'?p.x:p.y)-e.hazard.position)<25?100:0);
  const p=spots.sort((a,b)=>score(b)-score(a))[0];
  for(const x of [...e.entities])if(x.kind==='target'||x.state==='recover'){e.move(x.x+20,x.y);e.swipe({x:x.x-20,y:x.y},{x:x.x+20,y:x.y});}
  if(e.bossOpen())for(const b of e.bossPoints())if(b.open){e.move(b.x+25,b.y);e.swipe({x:b.x-25,y:b.y},{x:b.x+25,y:b.y});}
  e.move(p.x,p.y);e.update(.05);
 }
 if(e.status==='won')wins++;else fail.push([n,e.status,e.lastCause,e.hp,e.bossHP,e.stage.kind]);
}
assert.deepEqual(fail,[]);assert.equal(wins,100);
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');for(const f of ['impact.js','impact-render.js','impact.css','impact-ui.inc.js','series-client.js'])assert.ok(html.includes(fs.readFileSync(require('node:path').join(__dirname,'../src',f),'utf8')));
console.log('PASS Impact v7: material reactions, split/precision/cracks, reduced-motion bounds, variants, artifact tradeoffs, locked fair gear, parries/clutch, phases/hazards, UTF-8 ghost codes, renderer and 100 full-stage bot victories');
