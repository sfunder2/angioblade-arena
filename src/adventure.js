/* AngioBlade Expedition. Deterministic, offline simulation. No network or DOM in Engine. */
(function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clone=x=>JSON.parse(JSON.stringify(x));
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
class Random{constructor(seed){this.s=hash(seed)||1;}next(){let x=this.s;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x>>>0;return this.s/4294967296;}pick(a){return a[Math.floor(this.next()*a.length)];}range(a,b){return a+(b-a)*this.next();}}
const BIOMES=[
 ['Capillary Garden','Kılcal Bahçe','#62ead4','garden'],['Crystal Flow','Kristal Akış','#b9a0ff','flow'],['Living Walls','Canlı Duvarlar','#8ce69e','corridor'],['Pulse Furnace','Nabız Ocağı','#ffa58c','siege'],['Great Vessel','Büyük Damar','#ffc764','twins'],
 ['Neural Mist','Sinir Sisi','#91c9ff','escort'],['Coral Labyrinth','Mercan Labirenti','#ff97c7','corridor'],['Ion Storm','İyon Fırtınası','#d8e983','flow'],['Silent Orbit','Sessiz Yörünge','#a6a6ff','siege'],['Heart of Light','Işığın Kalbi','#fff0bc','twins']
];
const ENEMIES={
 hunter:['Hunter','Avcı','△','Dodge the line; cut during recovery.','Çizgiden kaç; dinlenirken kes.'],
 scout:['Scout','Gözcü','◬','A mark calls the next hunter.','İşareti sonraki avcıyı çağırır.'],
 ambusher:['Ambusher','Pusucu','◇','The shimmer appears before its dash.','Atılmadan önce parıltısı görünür.'],
 sniper:['Sniper','Nişancı','⊕','Leave its aiming line.','Nişan çizgisinden çık.'],
 shield:['Shield bearer','Kalkancı','⬟','Cut from behind its facing arrow.','Yön okunun arkasından kes.'],
 healer:['Healer','Şifacı','✚','Repairs one ally every four seconds.','Dört saniyede bir dostunu onarır.'],
 summoner:['Summoner','Çağırıcı','♜','Cut recovery to stop its two minions.','Dinlenirken kes; iki minyonunu durdur.'],
 miner:['Mine layer','Mayıncı','✳','Stay clear of blinking mines.','Yanıp sönen mayınlardan uzak dur.'],
 mimic:['Mimic','Taklitçi','◈','A diamond with a twitch; never a round target.','Titreyen eşkenar dörtgen; yuvarlak hedef değil.'],
 avenger:['Avenger','İntikamcı','▲','Losing an ally strengthens its next dash.','Dostu düşünce sonraki atılışı güçlenir.'],
 drainer:['Drainer','Sömürücü','⌁','Move away to break the energy link.','Uzaklaşarak enerji bağını kopar.'],
 loot:['Courier','Ganimetçi','◆','Optional: chase and cut three times.','İsteğe bağlı: takip et, üç kez kes.'],
 leader:['Swarm leader','Sürü lideri','♛','Its defeat stuns the entire swarm.','Yenilince bütün sürü sersemler.'],
 directional:['Directional shell','Yönlü kabuk','➜','Swipe along the arrow.','Ok yönünde kes.'],
 linked:['Linked guard','Bağlı muhafız','∞','Cut the cable between the pair first.','Önce ikisinin arasındaki bağı kes.']
};
const CARDS=[
 {id:'wide',en:'Wide edge',tr:'Geniş ağız',icon:'⚔',effect:'+5 cut width',et:'+5 kesim genişliği',cost:'Slower combo decay only with Rhythm',ct:'Ritim ile daha uzun kombo',synergy:'rhythm'},
 {id:'volt',en:'Lightning',tr:'Yıldırım',icon:'ϟ',effect:'Every 5 cuts: one extra target',et:'Her 5 kesimde bir ek hedef',cost:'Never chains into traps',ct:'Tuzaklara sıçramaz',synergy:'chain'},
 {id:'chain',en:'Chain',tr:'Zincir',icon:'⌁',effect:'+1 lightning jump; +0.2 s combo',et:'+1 yıldırım sıçraması; +0,2 sn kombo',cost:'Needs Lightning for jumps',ct:'Sıçrama için Yıldırım gerekir',synergy:'volt'},
 {id:'guard',en:'Barrier',tr:'Bariyer',icon:'⬡',effect:'Block one hit each room',et:'Her odada bir darbeyi engelle',cost:'Does not remove score penalty',ct:'Puan cezasını kaldırmaz',synergy:'focus'},
 {id:'rhythm',en:'Rhythm',tr:'Ritim',icon:'♫',effect:'+0.4 s combo window',et:'+0,4 sn kombo penceresi',cost:'No automatic healing',ct:'Kendiliğinden iyileştirmez',synergy:'wide'},
 {id:'heal',en:'Restoration',tr:'Yenilenme',icon:'♥',effect:'10 cuts: +3 HP, at most twice per room',et:'10 kesim: +3 can, odada en fazla iki kez',cost:'Healing is limited',ct:'İyileştirme sınırlıdır',synergy:'drone'},
 {id:'focus',en:'Focus',tr:'Odak',icon:'◈',effect:'+2 energy per cut',et:'Kesim başına +2 enerji',cost:'Energy cap: 100',ct:'Enerji sınırı: 100',synergy:'guard'},
 {id:'drone',en:'Support',tr:'Destek',icon:'◉',effect:'Support action every 8 seconds',et:'Her 8 saniyede bir destek',cost:'Select protect / collect / warn',ct:'Koru / topla / uyar seç',synergy:'heal'},
 {id:'burst',en:'Prism',tr:'Prizma',icon:'✧',effect:'Every 8 cuts: two nearby targets',et:'Her 8 kesimde yakındaki iki hedef',cost:'Does not counter hunters',ct:'Avcılara karşı saldırı yapmaz',synergy:'volt'}
];
const VARIANTS=['collect','survive','flow','corridor','siege','escort','twins'];
function makeStage(seed,n,options={}){
 n=clamp(Math.floor(n),1,100);const r=new Random(seed+':stage:'+n),region=Math.floor((n-1)/10),boss=n%10===0;
 const kind=boss?'boss':n<3?'collect':n===3?'survive':n===4?'corridor':n===5?'siege':n===6?'escort':n===7?'twins':r.pick([BIOMES[region][3],...VARIANTS]);
 const adaptation=options.adaptive&&options.style==='sweeper'?'precision':options.adaptive&&options.style==='still'?'motion':'balanced';
 const choices=['fight','rest','reward','escort'];const graph=Array.from({length:3},(_,i)=>({id:i,kind:choices[(i+Math.floor(r.next()*4))%4],reward:i===0?'heal':i===1?'power':'shards',next:[0,1,2],modifier:r.pick(['calm','swarm','bounty'])}));
 return {n,region,boss,kind,adaptation,graph,seed:String(seed),duration:boss?52:kind==='survive'?34:38,cuts:18+Math.floor(n/5),side:r.pick(n<3?['clean','combo']:['counter','clean','combo']),sideMax:3,modifier:r.pick(['calm','swarm','bounty']),patterns:Array.from({length:8},()=>r.pick(['dash','cross','summon','sweep'])),obstacles:kind==='corridor'?[{x:25,y:325,w:55,h:100},{x:280,y:325,w:55,h:100}]:[],props:Array.from({length:4},()=>({x:r.range(45,315),y:r.range(200,500),hp:2})),flow:kind==='flow'?(r.next()<.5?-1:1):0};
}
function validateStage(stage){
 if(stage.obstacles.some(o=>o.x<0||o.x+o.w>360||o.y<140||o.y+o.h>570))return false;
 // A continuous 72px-wide central escape lane must remain open, including escort routes.
 return !stage.obstacles.some(o=>o.x<216&&o.x+o.w>144)&&stage.graph.length===3&&stage.graph.every(n=>n.next.length>0)&&stage.patterns.every(p=>['dash','cross','summon','sweep'].includes(p));
}
function generatedStage(seed,n,o){for(let attempt=0;attempt<12;attempt++){const s=makeStage(String(seed)+':'+attempt,n,o);if(validateStage(s))return s;}throw Error('No safe stage');}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
class Engine{
 constructor({seed='ANGIO',stage=1,hp=100,cards={},hero='cutter',blade='balanced',bladeLevel=0,options={},style='balanced',tutorial=false,room='fight',mastery=0,starting='',skills=[]}={}){
  this.skills=Array.isArray(skills)?[...skills]:[];this.starting=starting;this.options={adaptive:true,motion:false,speed:1,sensitivity:1,helper:'warn',...options};this.stage=generatedStage(seed,stage,{...this.options,style});if(this.has('training_time'))this.stage.duration+=5;if(room==='escort')this.stage.kind='escort';this.seed=seed;this.rng=new Random(seed+':simulation:'+stage);this.hp=clamp(hp,1,100);this.cards={...cards};this.hero=hero;this.blade=blade;this.bladeLevel=bladeLevel;this.mastery=mastery;this.room=room;this.t=0;this.energy=starting==='charged'?70:30;this.shields=(cards.guard||0)+(starting==='armored'?1:0)+(this.has('buffer')?1:0)+(this.has('shield_unlock')?1:0);this.entities=[];this.fx=[];this.events=[];this.nextId=0;this.nextWave=1;this.nextEnemy=stage<2?14:5;this.score=0;this.combo=0;this.lastCut=-99;this.bestCombo=0;this.invuln=0;this.skillAt=0;this.supportAt=0;this.heals=0;this.status='playing';this.drone={x:180,y:490,vx:0,vy:0};this.helper={x:180,y:450,hp:60};this.stats={cuts:0,misses:0,trap:0,hunter:0,counter:0,dodge:0,near:0,synergy:0,swipes:0,travel:0,idle:0,friendly:0,damage:0,blocked:0,energyLost:0,loot:0};this.tutorial=tutorial?'target':null;this.slow=0;this.frozen=0;this.arenaShift=0;this.arenaWarning=false;this.arenaCycle=-1;this.safeUntil=0;this.safeZone={x:180,y:490,r:45};this.mark=null;this.wave=0;this.killCount=0;this.feedback='';this.attackSerial=0;this.hitstop=0;this.healBudget=2;this.tutorialAt=0;this.lastBoss=-9;this.intro=this.stage.boss?1.8:0;this.props=clone(this.stage.props);this.bossHP=this.stage.boss||this.stage.kind==='twins'?6+Math.ceil(stage/10)*2:0;this.bossMax=this.bossHP;this.bossPattern=0;this.warning=false;this.finishAt=0;this.victory=0;this.difficulty=1+Math.min(.7,(stage-1)*.007);this.nextDifficulty=this.stage.adaptation==='motion'?1.08:1;
  if(starting==='swift')this.skillAt=-2;if(starting==='precision')this.cards.wide=Math.min(3,(this.cards.wide||0)+1);if(starting==='support')this.cards.drone=Math.min(3,(this.cards.drone||0)+1);if(starting==='storm')this.cards.volt=Math.min(3,(this.cards.volt||0)+1);if(starting==='vital')this.hp=Math.min(100,this.hp+15);if(starting==='focus')this.cards.focus=Math.min(3,(this.cards.focus||0)+1);if(starting==='prism')this.cards.burst=Math.min(3,(this.cards.burst||0)+1);if(starting==='master'){this.cards.rhythm=Math.min(3,(this.cards.rhythm||0)+1);this.energy=80;}if(room==='rest')this.hp=Math.min(100,this.hp+18+(this.has('repair')?5:0));if(room==='reward')this.shields++;if(this.stage.boss)this.emit('intro',this.stage.region);
  if(tutorial){this.spawn('target',{x:180,y:290,expires:9999});this.nextWave=9999;this.nextEnemy=9999;}
 }
 emit(type,value){this.events.push({type,value});if(this.events.length>120)this.events.shift();}
 has(id){return this.skills.includes(id);}
 level(id){return this.cards[id]||0;}
 spawn(kind,fields={}){
  if(this.entities.filter(e=>!e.dead).length>=32)return null;
  const e={id:++this.nextId,kind,x:70+this.rng.next()*220,y:190+this.rng.next()*260,r:kind==='target'?16:kind==='trap'?18:14,state:'idle',since:this.t,expires:this.t+7,hp:kind==='loot'?3:1,facing:Math.PI/2,affix:null,...fields};
  if(kind!=='target'&&kind!=='prop'&&dist(e,this.drone)<95){e.x=this.drone.x<180?300:60;e.y=210;}
  // Newly generated entities cannot occupy an obstacle or the permanent escape lane with a trap.
  if(kind==='trap'&&e.x>125&&e.x<235)e.x=e.x<180?90:270;
  for(const o of this.stage.obstacles)if(e.x>o.x-20&&e.x<o.x+o.w+20&&e.y>o.y-20&&e.y<o.y+o.h+20)e.x=180;
  e.vx=0;e.vy=0;this.entities.push(e);return e;
 }
 hurt(amount,cause){
  if(this.status!=='playing'||this.t<this.invuln||this.tutorial||this.intro>0)return false;
  if(this.t<this.safeUntil&&dist(this.drone,this.safeZone)<this.safeZone.r)return false;
  if(this.shields>0){this.shields--;this.invuln=this.t+1;this.stats.blocked++;this.effect(this.drone,'#a4f2ff','⬡',14);return false;}
  if(this.has('armor'))amount=Math.max(1,Math.ceil(amount*.8));if(cause==='miss'&&this.has('resilience'))amount=1;if(cause==='priority'&&this.has('priority_guard'))amount=Math.max(1,amount-2);this.hp=Math.max(0,this.hp-amount);this.stats.damage+=amount;if(cause==='hunter')this.stats.hunter++;this.combo=0;this.invuln=this.t+1;this.lastCause=cause;this.effect(this.drone,'#ff889e','−'+amount,16);this.emit('damage',cause);if(this.hp===0)this.end(false,cause);return true;
 }
 effect(p,color,text='',count=8,angle=0){
  const limit=this.options.motion?22:this.lowFX?45:100;for(let i=0;i<count&&this.fx.length<limit;i++)this.fx.push({x:p.x,y:p.y,vx:Math.cos(angle+i*2.399)*35,vy:Math.sin(angle+i*2.399)*35,life:.65,max:.65,color,text:i===0?text:'',core:i===1});
 }
 move(x,y){
  if(this.status!=='playing')return;const old={...this.drone};this.drone.x=clamp(x,22+this.arenaShift,338+this.arenaShift);this.drone.y=clamp(y,150,565);
  for(const o of this.stage.obstacles)if(this.drone.x>o.x-10&&this.drone.x<o.x+o.w+10&&this.drone.y>o.y-10&&this.drone.y<o.y+o.h+10){this.drone.x=old.x;this.drone.y=old.y;}
  this.drone.vx=clamp((this.drone.x-old.x)*15,-180,180);this.drone.vy=clamp((this.drone.y-old.y)*15,-180,180);this.stats.travel+=dist(old,this.drone);
 }
 swipe(a,b){
  if(this.status!=='playing'||this.intro>0)return;this.stats.swipes++;const angle=Math.atan2(b.y-a.y,b.x-a.x);const width=Math.max(2,8+(this.cutWidth||0)+this.level('wide')*5+(this.blade==='wide'?7:0)+this.bladeLevel*.8);
  for(const e of [...this.entities])if(!e.dead&&segmentDistance(e,a,b)<e.r+width)this.cut(e,angle,a,b);
  for(const e of this.entities)if(e.kind==='linked'&&e.partner&&!e.dead){const p=this.entities.find(x=>x.id===e.partner&&!x.dead);if(p){const mid={x:(e.x+p.x)/2,y:(e.y+p.y)/2};if(segmentDistance(mid,a,b)<20){e.unlinked=true;p.unlinked=true;this.effect(mid,'#cbb3ff','⌁',10);}}}
  for(const p of this.props)if(p.hp&&segmentDistance(p,a,b)<13){p.hp--;this.effect(p,'#507d7b','',4,angle);}
  if(this.bossHP>0&&this.bossOpen()&&this.t-this.lastBoss>.6){for(const p of this.bossPoints())if(p.open&&segmentDistance(p,a,b)<35){this.bossHP--;this.lastBoss=this.t;this.energy=clamp(this.energy+7,0,100);this.score+=100;this.effect(p,'#ffdd8c','−1',18,angle);this.emit('bossHit',this.bossHP);break;}}
 }
 cut(e,angle,a,b,chain=false){
  if(e.dead||this.status!=='playing')return;
  if(e.kind==='trap'||e.kind==='mimic'){
   if(this.t<e.since+1.1)return;e.dead=true;this.score=Math.max(0,this.score-100);this.combo=0;this.stats.trap++;this.hurt(10,'trap');this.effect(e,'#ff7790','−100',12,angle);this.emit('trap',1);return;
  }
  if(e.kind!=='target'){
   if(chain)return;
   if(e.kind==='linked'&&!e.unlinked){this.effect(e,'#b0a0ef','∞',3);return;}
   if(e.kind==='directional'&&Math.cos(angle-(e.arrow||0))<.75){this.effect(e,'#ffd791','→',3);return;}
   if(e.kind==='shield'&&Math.cos(Math.atan2(a.y-e.y,a.x-e.x)-e.facing)>.15){this.effect(e,'#b7c6dc','⬡',3);return;}
   const free=['loot','directional','linked','shield'].includes(e.kind);
   if(!free&&e.state!=='recover'){this.effect(e,'#c1d2da','◇',2);return;}
   if(this.t-(e.hitAt||-9)<.3)return;e.hitAt=this.t;e.hp--;
   if(e.hp>0){this.effect(e,'#ffe1a3','CRACK',8,angle);return;}
   e.dead=true;this.stats.counter++;this.killCount++;this.energy=clamp(this.energy+12,0,100);this.score+=120;this.effect(e,'#d6b6ff','+'+120,16,angle);this.emit('counter',e.kind);
   if(e.kind==='loot'){this.stats.loot++;this.emit('loot',5);}
   if(e.kind==='leader')this.frozen=this.t+3;
   for(const ally of this.entities)if(!ally.dead&&ally.kind==='avenger')ally.enraged=true;
   if(this.tutorial==='counter'){this.tutorial=null;this.entities=[];this.t=0;this.nextWave=.5;this.nextEnemy=8;this.emit('tutorial','done');}
   return;
  }
  if(e.armor){e.armor--;this.effect(e,'#cad4e4','CRACK',10,angle);this.emit('armor',1);return;}
  e.dead=true;this.stats.cuts++;this.score+=25+(this.has('precision')?5:0)+(e.priority&&this.has('priority_bonus')?(this.has('execution')?75:25):0)+(this.combo>=5?Math.min(50,this.combo*2):0);this.energy=clamp(this.energy+(this.blade==='resonant'?5:3)+this.level('focus')*2+(this.has('energy_flow')?2:0)+Math.min(2,Math.floor(this.mastery/500)),0,100);
  const window=1.9+(this.comboOffset||0)+(this.has('combo_rhythm')?.4:0)+this.level('rhythm')*.4+this.level('chain')*.2;this.combo=this.t-this.lastCut<window?this.combo+1:1;this.lastCut=this.t;this.lastAngle=angle;this.bestCombo=Math.max(this.bestCombo,this.combo);
  this.hitstop=this.options.motion?0:.025;this.effect(e,this.combo>=10?'#ffdf86':'#68efdd','+'+(25+Math.min(50,this.combo*2)),this.combo>=10?18:10,angle);this.emit('cut',this.combo);
  if(this.level('heal')&&this.stats.cuts%10===0&&this.heals<this.healBudget){this.heals++;this.hp=Math.min(100,this.hp+3*this.level('heal'));}
  if(!chain){let hits=this.level('volt')&&this.stats.cuts%5===0?this.level('volt')+this.level('chain'):0;if(this.level('burst')&&this.stats.cuts%8===0)hits+=2*this.level('burst');if(hits){this.stats.synergy++;if(this.has('synergy_charge'))this.energy=Math.min(100,this.energy+6);this.emit('synergy',hits);for(const other of this.entities.filter(x=>!x.dead&&x.kind==='target').sort((a,b)=>dist(a,e)-dist(b,e)).slice(0,hits))this.cut(other,angle,e,other,true);}}
  if(this.tutorial==='target'){this.tutorial='trap';this.tutorialAt=this.t;this.spawn('trap',{x:180,y:300,expires:9999});this.emit('tutorial','trap');}
 }
 ability(){
  if(this.status!=='playing'||this.energy<50||this.t<this.skillAt)return false;this.energy-=50;this.skillAt=this.t+(this.starting==='swift'?4.5:6);
  if(this.hero==='guardian'){this.shields=Math.min(3,this.shields+2);this.effect(this.drone,'#a2deff','⬡',18);}
  else if(this.hero==='energy'){this.slow=this.t+3;this.effect(this.drone,'#d3b0ff','ϟ',18);}
  else {for(const e of this.entities.filter(e=>!e.dead&&e.kind==='target').slice(0,5))this.cut(e,0,this.drone,e,true);this.effect(this.drone,'#7ff3e2','⚔',18);}
  this.emit('ability',this.hero);return true;
 }
 bossOpen(){return this.t>this.intro&&this.t%7>2.3&&this.t%7<5.8;}
 bossPoints(){const twin=this.stage.kind==='twins'||this.stage.region===4;const active=Math.floor(this.t/3)%2;return (twin?[105,255]:[180]).map((x,i)=>({x:x+Math.sin(this.t*.8)*12,y:205+Math.cos(this.t)*8,open:this.bossOpen()&&(!twin||i===active)}));}
 threatBudget(){return this.stage.n<30?1:2;}
 waveSpawn(){
  const n=this.stage.n,r=this.rng;this.wave++;const count=this.stage.kind==='siege'?3:2+Number(this.stage.n>40);const xs=[75,180,285];
  for(let i=0;i<count;i++){let x=xs[(i+this.wave)%3]+r.range(-20,20),y=r.range(225,460);if(this.stage.adaptation==='precision')y=250+i*80;this.spawn('target',{x,y,priority:this.wave%5===0&&i===0,armor:n>=15&&this.wave%5===0?1:0,expires:this.t+(this.stage.kind==='flow'?6:7)});}
  if(n>=2&&this.wave%3===0)this.spawn('trap',{x:r.next()<.5?80:280,y:r.range(220,450),expires:this.t+7});
  this.nextWave=this.t+(this.stage.kind==='siege'?1.35:1.75)/(this.room==='reward'?1.1:1);
 }
 enemySpawn(){
  const n=this.stage.n;if(n<3)return;
  const count=this.entities.filter(e=>!e.dead&&e.kind!=='target'&&e.kind!=='trap').length;if(count>=Math.min(6,1+Math.floor(n/12)))return;
  const pool=n<6?['hunter']:n<12?['hunter','scout','directional','loot']:n<25?['hunter','ambusher','sniper','shield','healer','loot','linked']:Object.keys(ENEMIES);
  const regional=this.stage.region%3===0?'hunter':this.stage.region%3===1?'sniper':'shield';let kind=this.rng.next()<.3&&pool.includes(regional)?regional:this.rng.pick(pool);if(n>=25&&(!this.learned||this.learned.scout&&this.learned.sniper)&&this.entities.some(e=>!e.dead&&e.kind==='scout'))kind='sniper';else if(n>=25&&(!this.learned||this.learned.shield&&this.learned.healer)&&this.entities.some(e=>!e.dead&&e.kind==='shield'))kind='healer';if(this.stage.kind==='siege'&&count===0&&n>20)kind='leader';
  const e=this.spawn(kind,{expires:Infinity,arrow:this.rng.next()<.5?0:Math.PI});if(!e)return;
  if(n>50&&this.rng.next()<.25)e.affix=this.rng.pick(['swift','armored','charged']);
  if(e.affix==='armored')e.hp=2;
  if(kind==='linked'){const p=this.spawn('linked',{x:clamp(e.x+70,35,325),y:e.y+30,expires:Infinity});if(p){if(dist(e,p)<50)p.y=clamp(e.y+75,185,520);e.partner=p.id;p.partner=e.id;}}
  this.nextEnemy=this.t+(this.stage.kind==='siege'?4:7)/this.nextDifficulty;
 }
 beginAttack(e){
  const active=this.entities.filter(x=>!x.dead&&['windup','attack'].includes(x.state)).length;
  if(active>=this.threatBudget()||this.intro>0||this.t<this.frozen)return false;
  e.state='windup';e.since=this.t;const aim=this.mark?.until>this.t?this.mark:this.drone;e.lock={x:clamp(aim.x+this.drone.vx*.15,20,340),y:clamp(aim.y+this.drone.vy*.15,160,560)};
  e.from={x:e.x,y:e.y};const lanes=[{x:145,y:500},{x:215,y:500},{x:180,y:420},{x:145,y:330},{x:215,y:330}];const committed=this.entities.filter(x=>x!==e&&!x.dead&&['windup','attack'].includes(x.state));const escape=lanes.some(p=>segmentDistance(p,e.from,e.lock)>32&&committed.every(x=>segmentDistance(p,x.from||x,x.lock||x)>32));if(!escape){e.state='approach';e.since=this.t;return false;}e.facing=Math.atan2(e.lock.y-e.y,e.lock.x-e.x);e.tell=1.15+(this.options.motion?.25:0);e.speed=this.difficulty*(e.affix==='swift'?1.15:1)*(e.enraged?1.15:1);e.enraged=false;this.attackSerial++;return true;
 }
 updateEnemy(e,dt){
  if(e.kind==='target'){if(this.stage.flow){e.x+=this.stage.flow*dt*12;if(e.x<40)e.x=320;if(e.x>320)e.x=40;}return;}
  if(e.kind==='trap'||e.kind==='mimic')return;
  if(this.t<this.frozen){e.state='recover';e.since=this.t;return;}
  if(this.t<this.slow)e.since+=dt*1.5;const age=this.t-e.since;
  if(e.kind==='loot'){e.x=clamp(e.x+Math.sin(this.t*2+e.id)*dt*55,35,325);e.y=clamp(e.y+Math.cos(this.t+e.id)*dt*30,180,530);e.state='recover';if(age>9)e.dead=true;return;}
  if(['linked','directional'].includes(e.kind))return;
  if(e.state==='idle'&&age>1.5){e.state='approach';e.since=this.t;}
  if(e.state==='approach'){
   const d=dist(e,this.drone)||1;e.facing=Math.atan2(this.drone.y-e.y,this.drone.x-e.x);
   if(d>150){e.x+=(this.drone.x-e.x)/d*dt*17;e.y+=(this.drone.y-e.y)/d*dt*17;}
   if(age>1.3)this.beginAttack(e);
  }else if(e.state==='windup'&&age>=e.tell){
   e.state='attack';e.since=this.t;e.attackHit=false;e.helperHit=false;
   if(e.kind==='healer'){const other=this.entities.find(x=>!x.dead&&x.kind==='shield')||this.entities.find(x=>!x.dead&&x!==e&&x.kind!=='target'&&x.kind!=='trap');if(other){other.hp=Math.min(3,other.hp+1);this.effect(other,'#b9f6bb','+',6);}}
   if(e.kind==='summoner')for(let i=0;i<2;i++)if(this.entities.filter(x=>!x.dead&&x.parent===e.id).length<2)this.spawn('hunter',{x:clamp(e.x+(i?30:-30),30,330),y:e.y+20,parent:e.id,expires:Infinity});
   if(e.kind==='miner')this.spawn('trap',{x:e.lock.x,y:e.lock.y,expires:this.t+6});
   if(e.kind==='scout'){this.mark={...e.lock,until:this.t+4};}
  }else if(e.state==='attack'){
   const ranged=['sniper','scout','drainer','healer','miner','summoner'].includes(e.kind);
   if(!ranged){const f=clamp(age*e.speed*2.3,0,1);e.x=e.from.x+(e.lock.x-e.from.x)*f;e.y=e.from.y+(e.lock.y-e.from.y)*f;
    if(dist(e,this.drone)<24&&!e.attackHit){e.attackHit=true;this.hurt(e.affix==='charged'?18:14,'hunter');}
    if((this.stage.kind==='escort'||this.room==='escort')&&!e.helperHit&&dist(e,this.helper)<30){e.helperHit=true;this.helper.hp=Math.max(0,this.helper.hp-12);e.attackHit=true;}
    for(const other of this.entities)if(other!==e&&!other.dead&&other.kind!=='target'&&other.kind!=='trap'&&dist(e,other)<18){other.dead=true;this.stats.friendly++;this.effect(other,'#ffcda1','✦',7);}
   }else if(e.kind==='sniper'&&!e.attackHit){e.attackHit=true;if(segmentDistance(this.drone,e.from,e.lock)<18)this.hurt(16,'hunter');for(const other of this.entities)if(other!==e&&!other.dead&&other.kind!=='target'&&other.kind!=='trap'&&segmentDistance(other,e.from,e.lock)<14){other.dead=true;this.stats.friendly++;this.effect(other,'#ffcda1','✦',7);}}
   else if(e.kind==='drainer'&&dist(e,this.drone)<140){this.energy=Math.max(0,this.energy-dt*12);this.stats.energyLost+=dt*12;}
   if(age>.6){
    e.state='recover';e.since=this.t;
    if(!e.attackHit&&!['healer','summoner','miner','scout'].includes(e.kind)){this.stats.dodge++;const near=segmentDistance(this.drone,e.from,e.lock)<55;if(near){this.stats.near++;this.energy=clamp(this.energy+8,0,100);this.effect(this.drone,'#d8e6ff','DODGE',10);this.emit('dodge',1);}if(this.tutorial==='dodge'){this.tutorial='counter';e.since=this.t+30;}}
   }
  }else if(e.state==='recover'&&age>(e.kind==='shield'?2.8:2.1)){e.state='idle';e.since=this.t;}
 }
 update(dt){
  if(this.status!=='playing')return;dt=clamp(dt,0,.05)*this.options.speed;if(this.hitstop>0){this.hitstop-=dt;return;}this.t+=dt;
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return;}
  if(this.tutorial==='trap'&&this.t-this.tutorialAt>1.2&&this.stats.travel>120&&this.entities.filter(e=>e.kind==='trap').every(e=>dist(e,this.drone)>100)){this.tutorial='dodge';this.entities=this.entities.filter(e=>e.kind!=='trap');const e=this.spawn('hunter',{x:180,y:220,expires:Infinity});e.state='approach';e.since=this.t-2;this.emit('tutorial','dodge');}
  if(!this.tutorial){if(this.t>=this.nextWave)this.waveSpawn();if(this.t>=this.nextEnemy)this.enemySpawn();}
  const enemyDt=this.t<this.slow?dt*.4:dt;
  for(const e of this.entities){if(e.dead)continue;this.updateEnemy(e,enemyDt);
   if(this.t>=e.expires){e.dead=true;if(e.kind==='target'&&!this.tutorial){this.stats.misses++;this.hurt(e.priority?6:2,e.priority?'priority':'miss');}}
  }
  this.entities=this.entities.filter(e=>!e.dead);
  for(const f of this.fx){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;if(f.core){f.x+=(this.drone.x-f.x)*dt*5;f.y+=(this.drone.y-f.y)*dt*5;}}
  this.fx=this.fx.filter(f=>f.life>0);
  this.stats.idle+=Math.hypot(this.drone.vx,this.drone.vy)<3?dt:0;this.drone.vx*=.92;this.drone.vy*=.92;
  if(this.stage.n>=12&&Math.floor(this.t/12)!==Math.floor((this.t-dt)/12)){this.safeZone={x:180,y:460,r:42};this.safeUntil=this.t+2.8;}
  if(this.level('drone')&&this.t-this.supportAt>8){this.supportAt=this.t;
   if(this.options.helper==='protect')this.shields=Math.min(2,this.shields+1);
   if(this.options.helper==='collect'){const e=this.entities.find(e=>e.kind==='target');if(e)this.cut(e,0,this.drone,e,true);}
   if(this.options.helper==='warn'){this.energy=Math.min(100,this.energy+8);this.emit('warn',this.entities.filter(e=>e.state==='windup').length);}
  }
  if(this.stage.kind==='escort'||this.room==='escort'){this.helper.x=180+Math.sin(this.t*.25)*30;this.helper.y=460-this.t*3;if(this.helper.hp===0)this.end(false,'escort');}
  if(this.bossHP>0&&this.t>3&&Math.floor(this.t/7)>this.bossPattern){this.bossPattern=Math.floor(this.t/7);const pattern=this.stage.patterns[this.bossPattern%8];
   if(pattern==='summon'){this.spawn('hunter',{x:80,y:220,expires:Infinity});}
   else {const e=this.spawn(pattern==='cross'?'sniper':'hunter',{x:pattern==='sweep'?60:180,y:210,expires:this.t+6});if(e){e.state='approach';e.since=this.t-2;}}
  }
  if(this.stage.kind==='flow'&&this.stage.n>30){const phase=this.t%9;this.arenaWarning=phase<1.3;if(phase>=1.3&&this.arenaCycle!==Math.floor(this.t/9)){this.arenaCycle=Math.floor(this.t/9);this.arenaShift=this.arenaCycle%2?8:-8;this.move(this.drone.x,this.drone.y);}}this.warning=this.entities.some(e=>e.state==='windup')||this.arenaWarning;
  const goal=this.objective();if(!this.tutorial&&this.t>12&&goal.value>=goal.max){this.end(true,'complete');}
  if(!this.tutorial&&this.t>=this.stage.duration)this.end(false,'timeout');
 }
 objective(){
  if(this.bossMax)return {key:'boss',value:this.bossMax-this.bossHP,max:this.bossMax};
  if(['survive','siege','escort'].includes(this.stage.kind)||this.room==='escort')return {key:this.stage.kind==='escort'||this.room==='escort'?'escort':'survive',value:Math.floor(this.t),max:this.stage.duration-1};
  return {key:'collect',value:this.stats.cuts,max:this.stage.cuts};
 }
 sideComplete(){return this.stage.side==='counter'?this.stats.counter>=3:this.stage.side==='clean'?this.stats.damage===0:this.bestCombo>=10;}
 end(won,cause){if(this.status!=='playing')return;this.status=won?'won':'lost';this.lastCause=cause;this.victory=won?1.8:0;if(won){this.effect(this.drone,'#eeffc6','VICTORY',30);for(const p of this.bossPoints())this.effect(p,'#ffdb9a','✦',22);}this.emit('finish',{won,cause});}
 coach(){
  if(this.lastCause==='escort')return ['Protect your helper: intercept recovering hunters.','Yardımcını koru: dinlenen avcıları öncelikle kes.'];
  if(this.stats.trap>0)return ['Use short swipes between spiked traps.','Dikenli tuzakların arasında kısa kesimler yap.'];
  if(this.stats.hunter>0)return ['Move away during the striped warning; counter the violet recovery.','Çizgili uyarıda uzaklaş; mor dinlenme anında karşı saldır.'];
  if(this.stats.misses>2)return ['Prioritize targets marked ! before they expire.','Süresi dolmadan ! işaretli hedefleri önce kes.'];
  if(this.lastCause==='timeout')return ['Build a combo and use your ability at 50 energy.','Kombo kur; 50 enerjide becerini kullan.'];
  return ['Keep moving. Counter after the dash for extra energy.','Hareket et. Atılıştan sonra karşı saldırıyla enerji kazan.'];
 }
 style(){return this.stats.travel<150&&this.t>10?'still':this.stats.travel/Math.max(1,this.stats.swipes)>65?'sweeper':'balanced';}
}
const API={Random,Engine,makeStage,generatedStage,validateStage,segmentDistance,BIOMES,ENEMIES,CARDS,hash};
if(typeof module!=='undefined'&&module.exports)module.exports=API;root.AngioAdventure=API;
})(typeof globalThis!=='undefined'?globalThis:this);
