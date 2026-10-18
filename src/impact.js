/* Impact v7: bounded animation tracks and encounter extensions; no DOM or network. */
(function(root){
'use strict';
const A=root.AngioAdventure,Base=A.Engine,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const SPECIALIZATIONS={cutter:['precision','momentum','execution'],guardian:['bastion','parry','rescue'],energy:['conductor','battery','stasis']};
const ARTIFACTS={glass:{en:'Glass edge',tr:'Cam ağız',good:'+25% cut score',gt:'+%25 kesim puanı',bad:'+25% damage taken',bt:'+%25 alınan hasar'},anchor:{en:'Anchor core',tr:'Çapa çekirdek',good:'+1 barrier per room',gt:'Her odada +1 bariyer',bad:'−8 cut width',bt:'−8 kesim genişliği'},spark:{en:'Spark prism',tr:'Kıvılcım prizması',good:'+3 energy per cut',gt:'Kesim başına +3 enerji',bad:'−0.3 s combo window',bt:'−0,3 sn kombo süresi'}};
const STORIES=[['The first capillaries breathe again. Follow the fading signal upstream.','İlk kılcallar yeniden nefes alıyor. Zayıflayan sinyali akıntının yukarısına kadar izle.'],['The crystals were storing stolen pulses. One still points to the living wall.','Kristaller çalınan nabızları saklıyordu. Biri hâlâ canlı duvarı işaret ediyor.'],['The wall remembers every rescue. Its passage opens toward the furnace.','Duvar her kurtarışı hatırlıyor. Geçit nabız ocağına açılıyor.'],['The furnace is quiet. A second heartbeat answers from the great vessel.','Ocak sakinleşti. Büyük damardan ikinci bir kalp atışı geliyor.'],['Two cores, one stolen rhythm. The neural mist hides their source.','İki çekirdek, çalınmış tek ritim. Kaynakları sinir sisinde saklı.'],['The helper carries a memory of light through the coral maze.','Yardımcı, ışığın hatırasını mercan labirentine taşıyor.'],['The maze reveals a storm fed by every lost pulse.','Labirent, kayıp nabızlarla beslenen fırtınayı açığa çıkarıyor.'],['The ion storm breaks. Beyond it, an orbit has gone silent.','İyon fırtınası dağılıyor. Ötesindeki yörünge sessizliğe bürünmüş.'],['The silent orbit wakes. Its last gate leads to the heart of light.','Sessiz yörünge uyanıyor. Son kapı ışığın kalbine çıkıyor.'],['The network beats as one again. Now keep its light alive.','Ağ yeniden tek kalp gibi atıyor. Şimdi ışığını canlı tut.']];
function dailyCode(day){return 'DAILY-'+day;}
function weeklyRule(day){const i=Math.floor(Date.parse(day+'T12:00:00Z')/604800000)%3;return ['counter','onehp','nocards'][i];}
function fixedOptions(){return {adaptive:false,motion:false,speed:1,sensitivity:1,helper:'warn'};}
function collectionGoals(meta){return [{id:'researcher',value:Object.keys(meta.discovered||{}).length,goal:10,en:'Enemy researcher',tr:'Düşman araştırmacısı'},{id:'alchemist',value:Object.keys(meta.fusions||{}).length,goal:3,en:'Fusion alchemist',tr:'Birleşim ustası'},{id:'rescuer',value:Object.values(meta.masteryTasks||{}).reduce((a,b)=>a+b,0),goal:50,en:'Rescuer',tr:'Kurtarıcı'}];}
class ImpactEngine extends Base{
 constructor(config={}){
  if(config.fair)config={...config,hero:'cutter',blade:'balanced',bladeLevel:0,skills:[],cards:{},mastery:0,starting:'',specialization:'',variant:'standard',artifact:'',options:{...config.options,...fixedOptions(),motion:!!config.options?.motion}};super(config);this.animClock=0;this.animations=[];this.slashes=[];this.trail=[];this.ripples=[];this.shake=0;this.flash=0;this.lastAnimDelta=.016;this.specialization=config.specialization||'';this.variant=config.variant||'standard';this.artifact=config.artifact||'';this.rule=config.rule||'';this.fair=!!config.fair;this.phase='prepare';this.phaseAt=0;this.phaseNotice=0;this.miniSpawned=false;this.finalSpawned=false;this.rescueUntil=0;this.parryUntil=0;this.supportWindow=0;this.opener=0;this.stats.precise=0;this.stats.interrupt=0;this.stats.clutch=0;this.stats.powerUses=0;this.stats.phaseClears=0;this.lastSavedInput=-1;this.trace=[];this.motionSample=[];this.inputStroke=false;this.currentStroke=0;this.learned={...(config.learned||{})};this.newEnemy=null;this.reactionId=0;
  if(this.artifact==='anchor')this.shields++;if(this.rule==='onehp')this.hp=1;
  this.cutWidth=this.artifact==='anchor'?-8:0;this.comboOffset=this.artifact==='spark'?-.3:0;this.basePattern=this.stage.patterns.slice();this.fixedWaves=!!config.fixedWaves;
 }
 addAnimation(type,p,fields={}){
  const max=this.options.motion?18:this.lowFX?32:70;
  if(this.animations.length>=max)this.animations.splice(0,this.animations.length-max+1);
  this.animations.push({id:++this.reactionId,type,x:p.x,y:p.y,r:p.r||16,age:0,duration:.6,angle:0,color:'#8bf4de',...fields});
 }
 animate(dt){
  dt=clamp(dt,0,.05);this.lastAnimDelta=dt;this.animClock+=dt;this.shake=Math.max(0,this.shake-dt*16);this.flash=Math.max(0,this.flash-dt*3);
  for(const a of this.animations)a.age+=dt;this.animations=this.animations.filter(a=>a.age<a.duration);
  for(const a of this.slashes)a.age+=dt;this.slashes=this.slashes.filter(a=>a.age<.24);
  this.trail=this.trail.filter(a=>this.animClock-a.at<.4);
 }
 spawn(kind,fields={}){
  const e=super.spawn(kind,fields);if(!e)return e;
  e.born=this.animClock||0;e.squashAt=-9;e.hitFlash=-9;e.material=e.armor?'metal':e.priority?'energy':kind==='target'?'organic':'metal';
  if(this.animations)this.addAnimation('spawn',e,{duration:.35,color:kind==='target'?'#79f3dc':'#ffc58a'});
  return e;
 }
 sampleInput(type,p){
  if(this.trace.length>=2200)return;const at=Math.round(this.t*1000);
  if(type==='move'&&at-this.lastSavedInput<60)return;this.lastSavedInput=at;
  this.trace.push({t:at,k:type,x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10});
 }
 move(x,y){
  const old={...this.drone};super.move(x,y);
  if(this.trail){this.trail.push({x:this.drone.x,y:this.drone.y,at:this.animClock});if(this.trail.length>24)this.trail.shift();}
  if(this.motionSample&&this.t-(this.motionSample.at(-1)?.t||-1)>=.12){this.motionSample.push({t:this.t,x:this.drone.x,y:this.drone.y});if(this.motionSample.length>600)this.motionSample.shift();}
 }
 swipe(a,b){
  if(this.status!=='playing'||this.intro>0)return;
  this.currentStroke++;const len=distance(a,b);
  for(const e of this.entities)e.precise=len>2&&Math.abs((b.x-a.x)*(e.y-a.y)-(b.y-a.y)*(e.x-a.x))/len<=Math.max(3,e.r*.23);
  super.swipe(a,b);
  if(len>2){this.slashes.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,age:0,blade:this.blade});if(this.slashes.length>10)this.slashes.shift();}
 }
 cut(e,angle,a,b,chain=false){
  const wasDead=e.dead,armor=e.armor||0,hp=e.hp||0,cuts=this.stats.cuts,counters=this.stats.counter,combo=this.combo;
  // Skilled interruption: a narrow late-windup parry, never random early sweeping.
  if(!chain&&e.kind!=='target'&&e.kind!=='trap'&&e.kind!=='mimic'&&e.state==='windup'&&this.t-e.since>=e.tell-.2&&this.t>=e.since+.6){
   e.state='recover';e.since=this.t;this.stats.interrupt++;this.addAnimation('parry',e,{color:'#fff0b6',duration:.5});this.emit('interrupt',e.kind);
  }
  super.cut(e,angle,a,b,chain);
  if(wasDead)return;
  const cracked=(e.armor||0)<armor||e.hp<hp&&!e.dead;
  if(cracked){e.hitFlash=this.animClock;e.squashAt=this.animClock;this.addAnimation('crack',e,{color:'#d4e5ff',angle,duration:.45});if(!this.options.motion)this.hitstop=.04;this.emit('material','metal');}
  if(e.dead){
   const reward=e.kind==='target'||this.stats.counter>counters,color=reward?(e.material==='energy'?'#d5b8ff':e.kind==='target'?'#7df4d9':'#d6b4ff'):'#ff9db7';
   this.addAnimation('split',e,{angle,color,shape:e.kind==='target'?'cell':'triangle',duration:this.options.motion?.22:.7,material:e.material});
   this.addAnimation('impact',e,{angle,color,duration:.35});this.shake=this.options.motion?0:Math.min(2.8,this.shake+(this.stats.counter>counters?1.8:.4));
   if(this.stats.counter>counters){if(!this.options.motion)this.hitstop=.055;this.emit('material','metal');}
   if(this.stats.cuts>cuts){
    if(e.precise&&!chain){this.stats.precise++;this.score+=10;this.addAnimation('precision',e,{color:'#f7e5a8',duration:.65});this.emit('precise',this.stats.precise);}
    if(this.artifact==='glass')this.score+=Math.round(25*.25);if(this.artifact==='spark')this.energy=clamp(this.energy+3,0,100);
    if(this.specialization==='precision'&&e.precise)this.energy=clamp(this.energy+4,0,100);
    if(this.specialization==='momentum'&&this.combo>=5)this.skillAt=Math.max(this.t,this.skillAt-.1);
    if(this.specialization==='execution'&&e.priority)this.score+=30;
    if(this.specialization==='conductor'&&this.stats.cuts%5===0)this.energy=clamp(this.energy+5,0,100);
    if(this.specialization==='battery')this.energy=clamp(this.energy+1,0,100);
    if(this.artifact==='spark'&&this.t-this.lastCut>1.6)this.combo=1;
    this.emit('material',e.material);if([5,10,20,30].includes(this.combo)&&combo<this.combo)this.addAnimation('combo',e,{color:'#ffe7a0',count:this.combo,duration:.8});
   }
  }
  if(this.stats.synergy&&(this.stats.cuts>cuts)&&this.stats.cuts%5===0){this.addAnimation('fusion',e,{color:'#dfbdff',duration:.65});}
 }
 hurt(amount,cause){
  const before=this.hp,barriers=this.shields;
  if(this.artifact==='glass')amount=Math.ceil(amount*1.25);
  const result=super.hurt(amount,cause);
  if(this.shields<barriers){this.addAnimation('barrier',this.drone,{color:'#b6e7ff',duration:.5});
   if(before<=amount){this.stats.clutch++;this.addAnimation('clutch',this.drone,{duration:.8,color:'#ffe3b3'});this.emit('clutch',1);}
  }
  if(this.hp<before){this.flash=.16;this.shake=this.options.motion?0:2;}
  return result;
 }
 ability(){
  const old=this.energy;if(this.hero==='cutter'&&this.variant==='orbit'&&this.energy>=75&&this.t>=this.skillAt){this.energy-=75;this.skillAt=this.t+8;for(const e of this.entities.filter(e=>e.kind==='target'&&!e.dead).slice(0,8))this.cut(e,0,this.drone,e,true);this.addAnimation('cleave',this.drone,{duration:.9,color:'#beffe1'});this.stats.powerUses++;return true;}
  if(this.variant==='fortify'&&this.hero==='guardian'&&this.energy>=50&&this.t>=this.skillAt){this.energy-=50;this.shields=Math.min(4,this.shields+3);this.skillAt=this.t+10;this.addAnimation('barrier',this.drone,{duration:.9,color:'#bceaff'});this.stats.powerUses++;return true;}
  if(this.variant==='sustain'&&this.hero==='guardian'&&this.energy>=50&&this.t>=this.skillAt){this.energy-=50;this.shields=Math.min(2,this.shields+1);this.skillAt=this.t+4;this.addAnimation('barrier',this.drone,{duration:.6,color:'#bceaff'});this.stats.powerUses++;return true;}
  const ok=super.ability();if(!ok)return false;
  this.stats.powerUses++;this.addAnimation(this.hero==='energy'?'stasis':this.hero==='guardian'?'barrier':'cleave',this.drone,{duration:.7,color:this.hero==='energy'?'#dbc7ff':'#b9f4e3'});
  if(this.specialization==='bastion')this.invuln=Math.max(this.invuln,this.t+.5);
  if(this.specialization==='parry')this.parryUntil=this.t+1;
  if(this.specialization==='rescue'&&this.heals<2){this.hp=clamp(this.hp+5,0,100);this.heals++;}
  if(this.specialization==='stasis')this.slow+=1;
  if(this.variant==='surge'&&this.hero==='energy'){this.slow=this.t+1.5;this.shields=Math.min(2,this.shields+1);}
  return old!==this.energy;
 }
 updateEnemy(e,dt){
  if(this.t<this.parryUntil&&e.state==='attack'&&distance(e,this.drone)<45){e.state='recover';e.since=this.t;this.addAnimation('parry',e,{color:'#fff0b6'});this.stats.interrupt++;}
  const before=e.state;super.updateEnemy(e,dt);
  if(before!==e.state){e.transitionAt=this.animClock;if(e.state==='windup')this.addAnimation('intent',e,{duration:.28,color:'#ffcca0'});if(e.state==='recover')this.addAnimation('recover',e,{duration:.4,color:'#cfb3ff'});}
 }
 waveSpawn(){
  super.waveSpawn();if(this.phase==='pressure')this.nextWave-=.1;if(this.phase==='final')this.nextWave-=.22;
  if(this.rule==='counter'){this.entities=this.entities.filter(e=>e.kind!=='target');if(this.entities.filter(e=>e.kind==='hunter').length<3)this.spawn('hunter',{x:70+this.wave%3*90,y:220,expires:Infinity});}
 }
 enemySpawn(){
  const before=this.entities.length;super.enemySpawn();
  for(const e of this.entities.slice(before)){if(this.riskDoor)e.hp=Math.min(4,e.hp+1);if(e.kind==='loot'&&this.stage.n>10){this.spawn('trap',{x:e.x<180?50:310,y:Math.min(490,e.y+40),expires:this.t+7});}if(!this.learned[e.kind]){this.learned[e.kind]=true;this.newEnemy=e.kind;this.emit('discovery',e.kind);this.nextEnemy+=1.2;} }
 }
 objective(){if(this.rule==='counter')return {key:'counter',value:this.stats.counter,max:6};return super.objective();}
 update(dt){
  this.animate(dt);
  if(this.tutorial){super.update(dt);return;}
  const phase=this.t<this.stage.duration*.25?'prepare':this.t<this.stage.duration*.75?'pressure':'final';
  if(phase!==this.phase){this.phase=phase;this.phaseAt=this.t;this.phaseNotice=this.animClock+1.2;this.emit('phase',phase);}
  if(!this.miniSpawned&&this.stage.n>=8&&this.stage.n%5===0&&!this.stage.boss&&this.t>10){const e=this.spawn('shield',{x:180,y:250,expires:Infinity,hp:3});if(e){e.mini=true;e.affix='armored';this.miniSpawned=true;this.emit('miniboss',1);}}
  if(this.phase==='final'&&!this.finalSpawned){this.finalSpawned=true;if(this.stage.n>=4&&!this.stage.boss){const e=this.spawn(this.stage.region%2?'sniper':'hunter',{x:70,y:220,expires:Infinity});if(e)e.finale=true;}this.addAnimation('phase',this.drone,{color:'#f4d9ad',duration:.8});}
  // Each region adds an explicit hazard with a readable tell; all preserve the escape lane.
  if(this.stage.n>=12&&Math.floor(this.t/11)!==Math.floor((this.t-dt)/11)){this.hazard={at:this.t,axis:this.stage.region%2?'x':'y',position:this.stage.region%2?(this.wave%2?75:285):350};this.addAnimation('biome',this.drone,{color:A.BIOMES[this.stage.region][2],duration:1});}if(this.hazard){const h=this.hazard,age=this.t-h.at;if(age>1.3&&age<3.4&&Math.abs((h.axis==='x'?this.drone.x:this.drone.y)-h.position)<13)this.hurt(5,'flow');}
  super.update(dt);
 }
 end(won,cause){
  const old=this.status;super.end(won,cause);if(old!=='playing')return;
  if(won){const boss=this.bossMax>0;this.finisher=boss;this.addAnimation(boss?'finisher':'victory',{x:180,y:boss?205:340},{duration:boss?1.8:1.1,color:boss?'#ffe1a3':'#a4f5d0'});if(boss){this.shake=this.options.motion?0:2.5;this.emit('finisher',1);}}
 }
}
// Small, bounded share codes contain only score/seed/path; names are supplied by the sender explicitly.
function encodeGhost(data){const d={v:1,seed:String(data.seed).slice(0,24),stage:clamp(data.stage|0,1,100),score:clamp(data.score|0,0,100000),path:(data.path||[]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.t)).filter((_,i)=>i%3===0).slice(0,180).map(p=>[Math.round(p.t*10),Math.round(clamp(p.x,0,360)),Math.round(clamp(p.y,0,640))])};const json=JSON.stringify(d).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));return typeof Buffer!=='undefined'?Buffer.from(json).toString('base64'):btoa(json);}
function decodeGhost(code){if(typeof code!=='string'||code.length>12000)throw Error('Invalid ghost');const raw=typeof Buffer!=='undefined'?Buffer.from(code,'base64').toString():atob(code),d=JSON.parse(raw);if(d.v!==1||!Array.isArray(d.path)||d.path.length>180||typeof d.seed!=='string'||d.seed.length>24||!Number.isInteger(d.stage)||d.stage<1||d.stage>100||!Number.isFinite(d.score)||d.score<0||d.score>100000||d.path.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))||p[0]<0||p[0]>10000||p[1]<0||p[1]>360||p[2]<0||p[2]>640))throw Error('Invalid ghost');return d;}
A.Engine=ImpactEngine;Object.assign(A,{SPECIALIZATIONS,ARTIFACTS,STORIES,dailyCode,weeklyRule,fixedOptions,collectionGoals,encodeGhost,decodeGhost});
if(typeof module!=='undefined'&&module.exports)module.exports=A;
})(typeof globalThis!=='undefined'?globalThis:this);
