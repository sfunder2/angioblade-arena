const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements=new Map();const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});function el(){return {style:{setProperty(){}},classList:{add(){},remove(){},contains(){return false},toggle(){}},children:[{},{}],append(){},prepend(){},insertBefore(){},addEventListener(){},querySelectorAll(){return []},setAttribute(){},getContext(){return ctx},closest(){return null},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},dataset:{}}}const doc={querySelector(){return null},getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(){},documentElement:{},body:el(),createTreeWalker(){return {nextNode(){return null}}}};let mem={};const c=vm.createContext({document:doc,window:{innerWidth:1200,innerHeight:850,addEventListener(){},removeEventListener(){}},NodeFilter:{SHOW_TEXT:4},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},AbortController,localStorage:{getItem:k=>mem[k],setItem:(k,v)=>mem[k]=v},console,Date,Math,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(){}});const s=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);function run(s){return vm.runInContext(s,c)};run("initAudio=()=>{};playChimeSound=()=>{};startMusic=()=>{};stopMusic=()=>{}");


let clock=Date.now();class SimDate extends Date{static now(){return clock}}c.Date=SimDate;
run("selectLanguage('tr');nameAccepted=true;growth.skills=[];rgMeta().earned=100");
for(const screenWidth of [1200,390,320]){
 run(`performRestart();window.innerWidth=${screenWidth};resize();rgBegin()`);
 assert.equal(run('rgActive()'),true);assert.equal(run('journey.leg'),1);assert.equal(run('durationLimit'),32);assert.equal(run('campaignRun.stage.cuts'),16);
 for(let leg=1;leg<=5;leg++){
  for(let frame=0;frame<(leg===5?403:323);frame++){
   clock+=100;run('mainLoop()');
   if(run('gameState===STATE_PLAY'))run(`for(const f of [...fruits])if(!f.healthy&&!f.sliced)f.slice(0);if(campaignRun.boss&&bossPoint().open){const p=bossPoint();tryBossCut({x:p.x-50,y:p.y},{x:p.x+50,y:p.y},0);}`);
  }
  assert.equal(run('gameState'),run('STATE_RESULTS'),'results '+leg);assert.equal(run('journey.cleared'),leg,'encounter '+leg+' can be completed');
  if(leg<5){
   assert.equal(run('journey.phase'),'cards');assert.equal(run('journey.offers.length'),3);
   assert.equal(run("rgChoose('card:missing')"),false);const hp=run('journey.hp'),offered=run('journey.offers[0]');assert.equal(run(`rgChoose('card:${offered}')`),true);
   if(leg===2){assert.equal(run('journey.phase'),'camp');run("journey.hp=60;rgChoose('rest:heal')");assert.equal(run('journey.hp'),85);}
   if(leg===3){assert.equal(run('journey.phase'),'relic');run("rgChoose('relic:rush')");assert.equal(run('journey.relic'),'rush');}
   assert.equal(run('journey.phase'),'path');const before=run('journey.hp');run("rgChoose('path:normal')");assert.equal(run('campaignRun.integrity'),before,'health carries');assert.equal(run('journey.leg'),leg+1);
  }else{assert.equal(run('journey.done'),true);assert.ok(run('journey.shards')>0);assert.equal(run('rgSaved()'),null);}
 }
}
assert.equal(run('rgMeta().wins[0]'),1);assert.equal(run('rgMeta().wins[1]'),1);assert.equal(run('rgMeta().wins[2]'),1);
run("performRestart();rgBegin();journey.cards={volt:2,chain:2,wide:1,rhythm:1,guard:1};campaignRun.integrity=23;journey.hp=23;journey.phase='cards';journey.offers=['heal','focus','wide'];gameState=STATE_RESULTS;rgSaveCheckpoint()");
assert.equal(run('rgSaved().hp'),23);assert.equal(run('rgChoose("card:wide")'),true);assert.equal(run('journey.cards.wide'),2);assert.equal(run('rgChoose("card:wide")'),false,'cannot double pick');run("rgChoose('path:hard')");assert.equal(run('campaignRun.integrity'),23);assert.equal(run('journey.path'),'hard');assert.equal(run('activeSkills.charges'),1);
const initial=run('rpgState().materials');run('journey.attemptCuts=16;campaignRun.integrity=0;gameTimeRemaining=12;finishCampaign()');assert.equal(run('journey.done'),true);assert.ok(run('rpgState().materials')>initial,'failure keeps effort reward');const paid=run('rpgState().materials');run('finishCampaign()');assert.equal(run('rpgState().materials'),paid,'no duplicate payout');
run("performRestart();rgBegin()");assert.equal(run('Object.keys(journey.cards).length'),0,'temporary cards reset');
run('db.set("angio-crystals",70)');assert.equal(run('rpgState().materials'),70);run('rpgState().materials=61;growthDirty=true;saveGrowth()');assert.equal(run('crystals'),61);assert.equal(run('db.get("angio-crystals",0)'),61,'single currency stays synchronized');
run('performRestart();mode="duel";duel.started=true;startPlay()');assert.equal(run('rgActive()'),false);assert.equal(run('rgLevel("wide")'),0);
console.log('PASS roguelite: all five encounters at 1200/390/320, boss win, three region progression, deterministic offers, invalid/double choice isolation, camp/relic/path, carried HP, shields, checkpoint, partial defeat payout, reward idempotence, fresh build reset, unified currency and online isolation');
