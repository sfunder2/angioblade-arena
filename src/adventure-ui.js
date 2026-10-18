/* The expedition view uses its own bounded renderer; legacy arenas keep their rules. */
(function(){
'use strict';
const A=AngioAdventure,copy=x=>JSON.parse(JSON.stringify(x)),safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const text=(en,tr)=>L(en,tr),biome=n=>A.BIOMES[Math.min(9,Math.floor((n-1)/10))];
const KEY='angio-expedition-v6';let saved=db.get(KEY,null);
if(!saved||saved.version!==6)saved={version:6,meta:{frontier:1,runs:0,stars:{},mastery:{},builds:[],seenBoss:[],style:'balanced',feedback:null,analytics:[],settings:{adaptive:true,sound:true,music:true,haptic:true,motion:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,speed:1,sensitivity:1,helper:'warn',bigText:false,analytics:true},starting:'',tiers:{}},run:null};
const meta=saved.meta;let run=saved.run,engine=null,root=null,canvas=null,g=null,last=0,raf=false,pressed=false,prev=null,pausedAX=false,countdown=0,drawAt=0,lastTickSave=0,soundAt=-9,musicAt=-9,frameAverage=16,modal='',guideType='hunter',gearUndo=null,saveOK=true;
function persist(){saved.run=run?.practice?engine?.keep||saved.run:run;saveOK=db.set(KEY,saved);}
function level(){return growthInfo().level;}
function eventCount(k){return meta.analytics.filter(e=>e.type===k).length;}
function record(type,data){if(!meta.settings.analytics)return;meta.analytics.push({type,data,at:Date.now()});if(meta.analytics.length>160)meta.analytics.splice(0,meta.analytics.length-160);}
function badge(n){return Math.floor((n-1)/10);}
function button(action,label,extra=''){return `<button data-ax="${safe(action)}" ${extra}>${label}</button>`;}
function heroMarkup(){return `<div class="ax-emblem ${safe(rpgState().classId)} lv-${Math.min(3,Math.floor(level()/20))}" aria-hidden="true"><i></i><span>✦</span><b></b><em></em></div>`;}
function menu(){
 const m=meta,n=Math.min(100,m.frontier),r=biome(n),resume=!!run&&!run.done;
 return `<section class="ax-home"><div class="ax-kicker">${text('EXPEDITION · 100 STAGES','MACERA · 100 AŞAMA')}</div><h2>${text('Every cut matters.','Her kesim önemli.')}</h2><p>${text('Slice. Dodge. Grow stronger.','Kes. Kaçın. Güçlen.')}</p>${heroMarkup()}<div class="ax-region"><span style="color:${r[2]}">${text(r[0],r[1])}</span><b>${text('Stage','Aşama')} ${n}/100</b></div><div class="ax-track">${A.BIOMES.map((b,i)=>`<span class="${m.frontier>i*10+10?'done':badge(n)===i?'now':''}" title="${safe(text(b[0],b[1]))}">${m.frontier>i*10+10?'✓':i+1}</span>`).join('')}</div>${button(resume?'resume':'start','▶ '+(resume?text('Continue','Devam et'):text('Play','Oyna')),'class="ax-primary"')}<small class="ax-next">${resume?text('Your health, powers and seed are saved.','Canın, güçlerin ve bölüm kodun kayıtlı.'):text('One finger · 30–50 second encounters','Tek parmak · 30–50 saniyelik mücadeleler')}</small><div class="ax-menu-row">${button('map',text('World map','Bölge haritası'))}${button('guide',text('Enemy guide','Düşman rehberi'))}${button('settings','⚙ '+text('Settings','Ayarlar'))}</div><details class="ax-details"><summary>${text('Builds, seeds & mastery','Güçler, bölüm kodu ve ustalık')}</summary><p>${text('Level','Seviye')} ${level()}/100 · ${text('Class mastery','Sınıf ustalığı')}: ${meta.mastery[rpgState().classId]||0} XP</p><label>${text('Shared seed (same map & enemies)','Ortak bölüm kodu (aynı harita ve düşmanlar)')}<input id="axSeed" maxlength="24" placeholder="ANGIO-2026" autocomplete="off"></label>${button('seed',text('Play this seed','Bu kodla oyna'))}${meta.frontier>100?button('endless',text('Endless waves','Sonsuz dalgalar')):''}<p>${text('Starting option: unlocks every 10 levels','Başlangıç seçeneği: her 10 seviyede açılır')}</p><div class="ax-chips">${[['','Standard','Standart'],['charged','Charged core','Dolu çekirdek'],['armored','Armor cell','Zırh hücresi'],['swift','Quick recovery','Hızlı toparlanma'],['precision','Precision edge','Hassas ağız'],['support','Support core','Destek çekirdeği'],['storm','Storm charge','Fırtına yükü'],['vital','Vital core','Yaşam çekirdeği'],['focus','Focused edge','Odaklı ağız'],['prism','Prism echo','Prizma yankısı'],['master','Master core','Usta çekirdek']].map(([id,en,tr],i)=>button('starting:'+id,text(en,tr),`aria-pressed="${meta.starting===id}" ${level()<i*10?'disabled':''}`)).join('')}</div><p>${text('Blade comparison · tap to equip','Bıçak karşılaştırması · dokun ve kuşan')}</p><div class="ax-chips">${[['balanced','Balanced · standard width, standard energy','Dengeli · standart genişlik, standart enerji'],['wide','Wide · +7 width, harder to avoid traps','Geniş · +7 genişlik, tuzaktan kaçınmak zorlaşır'],['resonant','Resonant · +2 energy, standard width','Rezonans · +2 enerji, standart genişlik']].map(([id,en,tr])=>button('blade:'+id,text(en,tr),`aria-pressed="${rpgState().blade===id}" ${(id==='wide'&&rgMeta().earned<15||id==='resonant'&&rgMeta().earned<30)?'disabled':''}`)).join('')}</div>${gearUndo?button('gear-undo',text('Undo equipment','Kuşanmayı geri al')):''}<p>${text('Saved successful builds','Kayıtlı başarılı güç dizilimleri')}: ${meta.builds.length}/8</p>${meta.builds.slice(-3).map(b=>`<p>${safe(b.name)} · ${text('Stage','Aşama')} ${b.stage} · ${Object.keys(b.cards).map(id=>text(A.CARDS.find(c=>c.id===id)?.en||id,A.CARDS.find(c=>c.id===id)?.tr||id)).join(', ')}</p>`).join('')}<p>${text('Local expedition records','Bu cihazdaki macera rekorları')}</p>${db.get('angio-records-expedition',[]).slice(0,3).map(r=>`<p>${safe(r.name)} · ${r.score} · ${text('stage','aşama')} ${r.stage}</p>`).join('')}${button('legacy',text('Classic adventure & collections','Klasik serüven ve koleksiyonlar'))}</details></section>`;
}
const oldHome=rgHome;rgHome=menu;const legacyLoop=mainLoop;mainLoop=function(){if(root&&!root.hidden){lastFrameTime=Date.now();requestAnimationFrame(mainLoop);return;}return legacyLoop();};const oldUIIntersect=detectUIIntersections;detectUIIntersections=function(){if(root&&!root.hidden)return;return oldUIIntersect();};
const oldRender=renderMenu;renderMenu=function(){oldRender();if(hubTab==='play'){const box=document.querySelector?.('.hub-main');if(box)box.querySelectorAll('[data-ax]').forEach(b=>b.onclick=()=>action(b.dataset.ax));}};
function ensure(){
 if(root)return;root=document.createElement('section');root.id='axRoot';root.hidden=true;root.setAttribute('aria-label',text('Expedition','Macera'));root.innerHTML='<canvas id="axCanvas" aria-label="Slicing arena"></canvas><div id="axHud"></div><div id="axControls"></div><div id="axModal"></div>';
 document.body.append(root);canvas=root.querySelector('canvas');g=canvas.getContext('2d');
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ax]');if(b&&!b.disabled&&Date.now()>=inputGate)action(b.dataset.ax);});
 root.addEventListener('change',e=>{const id=e.target.dataset.axOption;if(id){meta.settings[id]=e.target.type==='checkbox'?e.target.checked:(e.target.value!==''&&Number.isFinite(Number(e.target.value))?Number(e.target.value):e.target.value);if(engine)engine.options={...engine.options,...meta.settings};persist();settings();}});
 const point=e=>{const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)/rect.width*360,y:(e.clientY-rect.top)/rect.height*640-35*meta.settings.sensitivity};};
 canvas.addEventListener('pointerdown',e=>{if(!engine||pausedAX||countdown||modal)return;e.preventDefault();pressed=true;prev=point(e);canvas.setPointerCapture?.(e.pointerId);engine.move(prev.x,prev.y);engine.sampleInput?.('down',prev);});
 canvas.addEventListener('pointermove',e=>{if(!pressed||!engine||pausedAX||countdown||modal)return;e.preventDefault();const p=point(e);engine.move(p.x,p.y);engine.swipe(prev,p);engine.sampleInput?.('move',p);prev=p;});
 const release=()=>{if(engine&&prev)engine.sampleInput?.('up',prev);pressed=false;prev=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 window.addEventListener('resize',resizeAX);window.addEventListener('keydown',e=>{if(root.hidden||!engine||modal)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key===' ')engine.ability();else{const dx=e.key==='ArrowLeft'?-22:e.key==='ArrowRight'?22:0,dy=e.key==='ArrowUp'?-22:e.key==='ArrowDown'?22:0,a={...engine.drone};engine.move(a.x+dx,a.y+dy);engine.swipe(a,engine.drone);}}});resizeAX();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&engine?.status==='playing'){pausedAX=true;checkpoint();pauseView();}});
 window.addEventListener('pagehide',()=>{checkpoint();persist();});
}
function resizeAX(){if(!canvas)return;const r=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round((root.clientWidth||window.innerWidth)*r);canvas.height=Math.round((root.clientHeight||window.innerHeight)*r);}
function show(){ensure();root.hidden=false;root.classList.toggle('ax-large',meta.settings.bigText);root.classList.toggle('ax-reduced',meta.settings.motion);document.body.classList.add('ax-open');resizeAX();if(!raf){raf=true;requestAnimationFrame(loop);}}
function modalView(html){modal=html;const box=document.getElementById('axModal');box.innerHTML=html?`<section class="ax-dialog" role="dialog" aria-modal="true">${html}</section>`:'';box.hidden=!html;}
function showPanel(html){show();modalView(html);document.getElementById('axHud').innerHTML='';document.getElementById('axControls').innerHTML='';}
function close(){checkpoint();root.hidden=true;modal='';engine=null;pausedAX=false;document.body.classList.remove('ax-open');performRestart();hubTab='play';renderMenu();}
function defaultRun(seed){const first=Math.min(100,Math.floor((Math.min(100,meta.frontier)-1)/10)*10+1);return {id:Date.now().toString(36)+'-'+A.hash(seed).toString(36),seed,stage:first,phase:'fight',hp:100,cards:{},shards:0,settled:[],done:false,path:'fight',tier:0,initial:meta.starting,hero:rpgState().classId,blade:rpgState().blade,bladeLevel:rpgState().levels[rpgState().blade],skills:[...growth.skills],log:[],endless:false};}
function begin(seed){
 if(!languageChosen)return;if(!nameAccepted){showNameEntry();return;}
 initAudio();if(run&&!run.done&&seed===undefined)return resume();
 performRestart();run=defaultRun(seed||'AB-'+Math.floor(Math.random()*0xffffff).toString(36).toUpperCase());meta.runs++;record('start',{seed:run.seed,stage:run.stage});persist();startRoom(true);
}
function checkpoint(){if(run?.practice)return;if(engine&&run&&engine.status==='playing'){run.snapshot=copy({...engine,rng:{s:engine.rng.s},fx:[],events:[]});run.hp=engine.hp;}persist();}
function resume(){
 if(!run||run.done)return begin();initAudio();show();if(run.phase==='fight')startRoom(false);else if(run.phase==='cards')cardView();else routeView();
}
function startRoom(fresh){
 show();modalView('');pausedAX=false;pressed=false;
 const snap=run.snapshot;engine=new A.Engine({seed:run.seed,stage:run.stage,hp:run.hp,cards:run.cards,hero:run.hero,blade:run.blade,bladeLevel:run.bladeLevel,options:meta.settings,style:meta.style,tutorial:meta.runs===1&&run.stage===1&&!snap,room:run.path,mastery:meta.mastery[run.hero]||0,starting:run.initial,skills:run.skills||[]});
 if(snap){const rand=engine.rng;Object.assign(engine,snap);engine.rng=rand;engine.rng.s=snap.rng.s;engine.options={...meta.settings};engine.entities.forEach(e=>{if(e.expires===null)e.expires=Infinity;});}
 else{
  if(run.tier)engine.difficulty+=run.tier*.1;engine.stage.modifier=run.modifier||engine.stage.modifier;if(run.modifier==='swarm'){engine.nextDifficulty*=1.15;engine.stage.kind=engine.stage.boss?'boss':'siege';}if(run.modifier==='calm')engine.nextEnemy+=2;if(run.modifier==='bounty')engine.nextWave=.5;
  if(run.stage<4&&meta.runs<4)engine.nextEnemy+=4-meta.runs;engine.healBudget=2;
  if(engine.stage.boss){if(meta.seenBoss.includes(engine.stage.region))engine.intro=0;else meta.seenBoss.push(engine.stage.region);}
 }
 run.snapshot=null;run.phase='fight';countdown=fresh?1:3;drawAt=0;last=0;checkpoint();renderHUD();
}
function grant(amount,xp,key){
 const r=rpgState();if(!Array.isArray(r.adventurePaid))r.adventurePaid=[];if(r.adventurePaid.includes(key))return;
 r.adventurePaid.push(key);if(r.adventurePaid.length>300)r.adventurePaid.shift();r.materials=Math.min(99999,r.materials+amount);rgMeta().earned+=amount;awardXP(xp,'completion');if(engine&&!run.practice){const s=engine.stats;progress.cuts+=s.cuts;progress.bestCombo=Math.max(progress.bestCombo,engine.bestCombo);progress.synergies+=s.synergy;progressDirty=true;ensureDay();daily.cuts+=s.cuts;daily.combo=Math.max(daily.combo,engine.bestCombo);daily.synergies+=s.synergy;dailyDirty=true;checkTrophies();saveProgress();saveDaily();}rpgSave();
}
function settle(){
 if(!engine||!run||run.phase!=='fight')return;const e=engine,won=e.status==='won',key=run.id+':'+run.stage;
 run.snapshot=null;run.hp=e.hp;meta.style=e.style();run.log.push({stage:run.stage,stats:copy(e.stats),combo:e.bestCombo,won,cause:e.lastCause});if(run.log.length>20)run.log.shift();
 if(!run.settled.includes(key)){
  run.settled.push(key);let amount=won?12+Math.floor(run.stage/10)+(run.path==='reward'?6:0)+(e.sideComplete()?4:0):Math.min(5,Math.floor(e.stats.cuts/5));amount+=e.stats.loot*5;
  run.shards+=amount;grant(amount,(won?Math.min(2200,90+run.stage*15):0)+e.stats.cuts*8,key);
  meta.mastery[run.hero]=(meta.mastery[run.hero]||0)+(won?40+e.stats.counter*5:Math.min(20,e.stats.cuts));
  if(won){meta.frontier=Math.max(meta.frontier,run.stage+1);const stars=1+Number(e.stats.damage===0)+Number(e.sideComplete());meta.stars[run.stage]=Math.max(stars,meta.stars[run.stage]||0);if(stars===3)meta.tiers[badge(run.stage)]=Math.min(3,(meta.tiers[badge(run.stage)]||0)+.1);}
  const rows=db.get('angio-records-expedition',[]);db.set('angio-records-expedition',[...rows,{name:playerNick,score:e.score,stage:run.stage,date:new Date().toISOString()}].sort((a,b)=>b.score-a.score).slice(0,5));record(won?'win':'death',{stage:run.stage,stats:e.stats,cause:e.lastCause,cards:run.cards});
 }
 if(!won){run.done=true;run.phase='lost';persist();result(false);return;}
 if(run.stage%10===0){meta.builds.push({name:text('Region ','Bölge ')+Math.ceil(run.stage/10),stage:run.stage,cards:copy(run.cards),hero:run.hero,seed:run.seed});if(meta.builds.length>8)meta.builds.shift();}
 if(run.stage===100&&!run.endless){run.done=true;run.phase='won';persist();result(true);return;}
 run.phase='cards';run.offers=offers();persist();cardView();
}
function offers(){const rng=new A.Random(run.seed+':cards:'+run.stage),pool=A.CARDS.filter(c=>(run.cards[c.id]||0)<3);for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng.next()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3).map(c=>c.id);}
function cardView(){
 show();const e=engine||new A.Engine({seed:run.seed,stage:run.stage});if(!engine&&run.log?.length){e.stats={...e.stats,...run.log[run.log.length-1].stats};e.lastCause=run.log[run.log.length-1].cause;}const coach=e.coach();
 const recap=`<div class="ax-recap"><span>♥ ${Math.ceil(run.hp)} · ◇ +${run.shards}</span><b>${text('Stage complete','Aşama tamamlandı')} ${run.stage}/100</b></div>`;
 showPanel(`<div class="ax-kicker">${text('A STRONGER BUILD','DAHA GÜÇLÜ BİR DİZİLİM')}</div><h2>${text('Choose a power','Bir güç seç')}</h2>${recap}<p class="ax-coach">${text(...coach)}</p><div class="ax-cards">${(run.offers||offers()).map(id=>{const c=A.CARDS.find(c=>c.id===id);return button('card:'+id,`<span class="ax-mini ax-mini-${id}">${c.icon}<i></i><i></i></span><b>${text(c.en,c.tr)} ${(run.cards[id]||0)+1}/3</b><p>${text(c.effect,c.et)}</p><small>${run.cards[c.synergy]?'✦ '+text('Synergy ready','Sinerji hazır'):text(c.cost,c.ct)}</small>`,'class="ax-card"');}).join('')}</div>${run.stage%10===0?`<details class="ax-details"><summary>${text('Optional: how was the difficulty?','İsteğe bağlı: zorluk nasıldı?')}</summary>${['easy','balanced','hard'].map((k,i)=>button('feedback:'+k,text(['Easy','Balanced','Hard'][i],['Kolay','Dengeli','Zor'][i]))).join('')}</details>`:''}${button('save',text('Save & leave','Kaydet ve çık'),'class="ax-subtle"')}`);
}
function routeView(){
 show();const next=run.stage+1,stage=A.generatedStage(run.seed,Math.min(100,next),{...meta.settings,style:meta.style});run.routes=stage.graph;persist();
 showPanel(`<div class="ax-kicker">${text('CHOOSE YOUR NEXT ROOM','SONRAKİ ODANI SEÇ')}</div><h2>${text('Your route, your risk.','Yolunu sen seç.')}</h2><p>♥ ${Math.ceil(run.hp)} · ${text('Stage','Aşama')} ${next} · ${text(...biome(Math.min(100,next)).slice(0,2))}</p><div class="ax-cards">${run.routes.map((node,i)=>{const k=node.kind,labels={fight:['Fight','Mücadele'],rest:['Rest station','Dinlenme noktası'],reward:['Risk & shards','Risk ve parçalar'],escort:['Escort','Koruma görevi']},descs={fight:['Balanced encounter. +1 power after victory.','Dengeli mücadele. Galibiyet sonrası +1 güç.'],rest:['+18 health before the fight.','Mücadeleden önce +18 can.'],reward:['More targets; +6 shards and one barrier.','Daha çok hedef; +6 parça ve bir bariyer.'],escort:['Protect the helper until time expires.','Süre bitene kadar yardımcıyı koru.']};return button('route:'+i,`<span>${['⚔','♥','◇'][i]}</span><b>${text(...labels[k])}</b><p>${text(...descs[k])}</p><small>${text('Biome rule','Bölge kuralı')}: ${text(...({calm:['Calmer start','Sakin başlangıç'],swarm:['More enemies','Daha çok düşman'],bounty:['Early rewards','Erken ödüller']}[node.modifier]))}</small>`,'class="ax-card"');}).join('')}</div>${button('undo',text('Undo last power choice','Son güç seçimini geri al'),'class="ax-subtle"')}${button('save',text('Save & leave','Kaydet ve çık'),'class="ax-subtle"')}`);
}
function result(won){
 const e=engine,st=e?.stats||{},tip=e?text(...e.coach()):'';
 showPanel(`<div class="ax-kicker">${won?'🏆 '+text('ALL REGIONS RESCUED','TÜM BÖLGELER KURTARILDI'):text('KEEP YOUR PROGRESS','KAZANIMLARIN SENDE')}</div><h2>${won?text('You are the guardian.','Koruyucu sensin.'):text('A stronger next attempt.','Bir sonraki deneme daha güçlü.')}</h2><div class="ax-summary"><div><b>${run.stage}/100</b><small>${text('Stage','Aşama')}</small></div><div><b>◇ ${run.shards}</b><small>${text('Kept shards','Kalıcı parçalar')}</small></div><div><b>${e?.bestCombo||0}</b><small>${text('Best combo','En iyi kombo')}</small></div></div><p class="ax-coach">${tip}</p><p>${text('Damage','Hasar')}: ${st.damage||0} · ${text('Trap cuts','Tuzak kesimi')}: ${st.trap||0} · ${text('Hunter hits','Avcı darbesi')}: ${st.hunter||0}</p>${button('retry','▶ '+text('Try again','Yeniden dene'),'class="ax-primary"')}${button('practice',text('Practice this weakness','Bu noktayı çalış'))}${button('home',text('Hero & upgrades','Kahraman ve yükseltmeler'))}${won?button('endless',text('Endless waves','Sonsuz dalgalar')):''}<details class="ax-details"><summary>${text('Match data & optional feedback','Maç verisi ve isteğe bağlı değerlendirme')}</summary><p>${text('Accuracy','İsabet')}: ${Math.round((st.cuts||0)/Math.max(1,(st.cuts||0)+(st.misses||0))*100)}% · ${text('Counters','Karşı saldırı')}: ${st.counter||0} · ${text('Synergies','Sinerji')}: ${st.synergy||0}</p><p>${text('How was the difficulty?','Zorluk nasıldı?')}</p>${['easy','balanced','hard'].map((k,i)=>button('feedback:'+k,text(['Easy','Balanced','Hard'][i],['Kolay','Dengeli','Zor'][i]))).join('')}<p>${text('Local rule-based coach. No data is uploaded.','Cihazda çalışan kural tabanlı koç. Veriler gönderilmez.')}</p></details>`);
}
function pauseView(){if(!engine)return;showPanel(`<div class="ax-kicker">${text('PAUSED · SAVED','DURAKLATILDI · KAYDEDİLDİ')}</div><h2>${text('Take a breath.','Bir nefes al.')}</h2>${saveOK?'':`<p role="alert">${text('Save failed. Free device storage before leaving.','Kayıt yapılamadı. Çıkmadan önce cihazda yer aç.')}</p>`}<p>${text('Stage','Aşama')} ${run.stage}/100 · ♥ ${Math.ceil(engine.hp)} · ${safe(run.seed)}</p><p class="ax-save-time">${text('Last saved','Son kayıt')}: ${new Date(lastSaveAt||meta.lastSaveAt||Date.now()).toLocaleTimeString()}</p><p>${Object.keys(run.cards).map(id=>text(A.CARDS.find(c=>c.id===id)?.en||id,A.CARDS.find(c=>c.id===id)?.tr||id)).join(' · ')||text('No cards yet','Henüz kart yok')}</p>${button('unpause','▶ '+text('Continue (3 s)','Devam et (3 sn)'),'class="ax-primary"')}${button('settings',text('Settings','Ayarlar'))}${button('coach',text('Ask the guide','Rehbere sor'))}${button('save',text('Save & leave','Kaydet ve çık'))}`);}
function settings(){
 showPanel(`<div class="ax-kicker">${text('YOUR COMFORT','SANA GÖRE')}</div><h2>${text('Settings','Ayarlar')}</h2><div class="ax-settings">${[['sound','Effects sound','Efekt sesi'],['music','Ambient pulse','Ortam nabzı'],['haptic','Vibration','Titreşim'],['motion','Reduced motion','Azaltılmış hareket'],['bigText','Large text','Büyük yazı'],['adaptive','Adapt next encounter','Sonraki mücadeleyi uyarla'],['analytics','Local play statistics','Yerel oyun istatistikleri']].map(([id,en,tr])=>`<label><span>${text(en,tr)}</span><input type="checkbox" data-ax-option="${id}" ${meta.settings[id]?'checked':''}></label>`).join('')}<label>${text('Game speed','Oyun hızı')}<select data-ax-option="speed">${[.8,1,1.15].map(n=>`<option value="${n}" ${meta.settings.speed===n?'selected':''}>${n}×</option>`).join('')}</select></label><label>${text('Finger offset','Parmak uzaklığı')}<input type="range" data-ax-option="sensitivity" min="0.5" max="1.6" step="0.1" value="${meta.settings.sensitivity}"></label><label>${text('Helper mode','Yardımcı modu')}<select data-ax-option="helper">${[['protect','Protect','Koru'],['collect','Collect','Topla'],['warn','Warn','Uyar']].map(([id,en,tr])=>`<option value="${id}" ${meta.settings.helper===id?'selected':''}>${text(en,tr)}</option>`).join('')}</select></label></div><p>${text('Adaptation changes the next room only. Online matches always keep fixed rules. Statistics stay on this device.','Uyarlama yalnız sonraki odayı etkiler. Çevrim içi maçlarda kurallar sabittir. İstatistikler bu cihazda kalır.')}</p>${button('back',text('Done','Tamam'),'class="ax-primary"')}${button('clear-data',text('Clear local play statistics','Yerel oyun istatistiklerini temizle'),'class="ax-subtle"')}`);
 root.classList.toggle('ax-large',meta.settings.bigText);root.classList.toggle('ax-reduced',meta.settings.motion);
}
function mapView(){showPanel(`<div class="ax-kicker">100 ${text('STAGES','AŞAMA')}</div><h2>${text('Rescue the network','Ağı kurtar')}</h2><div class="ax-map">${A.BIOMES.map((b,i)=>`<section style="--ax-accent:${b[2]}"><h3>${i+1}. ${text(b[0],b[1])} <small>${'✦'.repeat(Math.floor(meta.tiers[i]||0))}</small></h3><div>${Array.from({length:10},(_,j)=>{const n=i*10+j+1;return button('stage:'+n,(n%10===0?'♛ ':n+' ')+(meta.stars[n]?'★'.repeat(meta.stars[n]):''),`aria-label="${text('Stage','Aşama')} ${n}" ${n>meta.frontier?'disabled':''} class="${n===meta.frontier?'current':''}"`)}).join('')}</div></section>`).join('')}</div>${button('home',text('Back','Geri'))}`);}
function guide(){const spec=A.ENEMIES[guideType];showPanel(`<div class="ax-kicker">${text('WATCH THE INTENT','NİYETİNİ OKU')}</div><h2>${text('Enemy guide','Düşman rehberi')}</h2><div class="ax-guide-demo ${safe(guideType)}"><span>${spec[2]}</span><i></i><b>✦</b><em>${text('WARN → DASH → COUNTER','UYARI → ATILIŞ → KARŞI SALDIRI')}</em></div><h3>${text(spec[0],spec[1])}</h3><p>${text(spec[3],spec[4])}</p><div class="ax-chips">${Object.entries(A.ENEMIES).map(([id,v])=>button('guide:'+id,v[2]+' '+text(v[0],v[1]),`aria-pressed="${guideType===id}"`)).join('')}</div>${button('practice:'+guideType,text('Try safely','Güvenle dene'),'class="ax-primary"')}${button('back',text('Back','Geri'))}`);}
function practice(type){
 // Practice has its own run and cannot pay shards, XP, unlock campaign stages or overwrite the real checkpoint.
 if(run&&!run.done)checkpoint();const keep=copy(run);const key=meta.settings;show();engine=new A.Engine({seed:'PRACTICE',stage:3,options:key,hp:100});engine.nextEnemy=9999;engine.nextWave=9999;engine.practice=true;engine.practiceType=type||'hunter';engine.keep=keep;engine.stage.duration=9999;engine.stage.cuts=9999;engine.spawn(type||'hunter',{x:180,y:220,expires:Infinity});run={id:'practice',stage:3,cards:{},hero:'cutter',seed:'PRACTICE',practice:true,phase:'fight',hp:100};modalView('');pausedAX=false;countdown=2;renderHUD();}
function coach(){const tip=engine?engine.coach():['Start with the Hunter practice.','Avcı antrenmanıyla başla.'];showPanel(`<div class="ax-kicker">${text('LOCAL TACTICAL GUIDE','YEREL TAKTİK REHBER')}</div><h2>${text('Your next move','Sıradaki hamlen')}</h2><p class="ax-coach">${text(...tip)}</p><p>${text('Advice comes from your actual cuts, misses and damage.','Öneriler gerçek kesim, kaçırma ve hasar verilerinden çıkarılır.')}</p>${button('unpause',text('Back to game','Oyuna dön'),'class="ax-primary"')}${button('practice',text('Practice after saving','Kaydedip antrenman yap'))}`);}
function action(value){
 const [kind,id]=value.split(':');
 if(kind==='start'){run=null;begin();}else if(kind==='seed'){const code=document.getElementById('axSeed')?.value.trim().slice(0,24);if(code){run=null;begin(code);}}
 else if(kind==='resume')resume();else if(kind==='retry'){run=null;begin();}
 else if(kind==='pause'){pausedAX=true;checkpoint();pauseView();}
 else if(kind==='unpause'){pausedAX=false;modalView('');countdown=3;pressed=false;renderHUD();}
 else if(kind==='ability'){if(!modal&&!pausedAX&&!countdown)engine?.ability();}
 else if(kind==='save'||kind==='home'){if(run?.practice){run=engine.keep;engine=null;}close();}
 else if(kind==='back'){if(engine?.status==='playing'&&!engine.practice){pausedAX=true;pauseView();}else close();}
 else if(kind==='settings'){if(engine?.status==='playing'){pausedAX=true;checkpoint();}settings();}
 else if(kind==='map')mapView();else if(kind==='guide'){if(id)guideType=id;guide();}
 else if(kind==='stage'){if(+id<=meta.frontier){run=defaultRun('REPLAY-'+id+'-'+Date.now());run.stage=+id;run.tier=Math.floor(meta.tiers[badge(+id)]||0);run.replay=true;persist();startRoom(true);}}
 else if(kind==='card'&&run?.phase==='cards'&&run.offers.includes(id)){run.undo=copy(run.cards);run.cards[id]=Math.min(3,(run.cards[id]||0)+1);run.phase='route';record('card',id);persist();routeView();}
 else if(kind==='undo'&&run?.phase==='route'&&run.undo){run.cards=run.undo;delete run.undo;run.phase='cards';persist();cardView();}
 else if(kind==='route'&&run?.phase==='route'&&run.routes[+id]){run.path=run.routes[+id].kind;run.modifier=run.routes[+id].modifier;run.stage++;if(run.endless&&run.stage>100){run.stage=91;run.tier++;}run.phase='fight';run.snapshot=null;delete run.undo;persist();startRoom(true);}
 else if(kind==='blade'){if(['balanced','wide','resonant'].includes(id)&&!(id==='wide'&&rgMeta().earned<15||id==='resonant'&&rgMeta().earned<30)){gearUndo=rpgState().blade;rpgEquip('blade',id);renderMenu();}}else if(kind==='gear-undo'&&gearUndo){rpgEquip('blade',gearUndo);gearUndo=null;renderMenu();}else if(kind==='starting'){meta.starting=id;persist();renderMenu();}
 else if(kind==='feedback'){meta.feedback=id;record('feedback',id);persist();const b=root.querySelector(`[data-ax="${value}"]`);if(b)b.textContent='✓ '+text('Saved','Kaydedildi');}
 else if(kind==='practice'){const type=id||(engine?.stats.trap?'mimic':engine?.stats.hunter?'hunter':'directional');practice(type);}
 else if(kind==='coach'){pausedAX=true;coach();}
 else if(kind==='endless'&&meta.frontier>100){run=defaultRun('ENDLESS-'+Date.now());run.stage=91;run.endless=true;run.tier=1;startRoom(true);}
 else if(kind==='legacy'){hubTab='campaign';renderMenu();}
 else if(kind==='clear-data'){meta.analytics=[];persist();settings();}
}
function renderHUD(){
 if(!engine||modal)return;const e=engine,goal=e.objective(),labels={collect:['Slice targets','Hedefleri kes'],survive:['Survive','Hayatta kal'],escort:['Protect your helper','Yardımcını koru'],boss:['Defeat the guardian','Bölge düşmanını yen'],counter:['Land counters','Karşı saldırı yap']},tip=e.tutorial==='target'?text('Swipe across the round target','Yuvarlak hedefin üzerinden kaydır'):e.tutorial==='trap'?text('Avoid spiked traps. Keep your finger away.','Dikenli tuzaktan uzaklaş. Parmağını kaydır.'):e.tutorial==='dodge'?text('Move out of the striped attack line','Çizgili saldırı hattından uzaklaş'):e.tutorial==='counter'?text('Cut the violet hunter now!','Şimdi mor avcıyı kes!'):'';
 document.getElementById('axHud').innerHTML=`<div class="ax-hud-top"><span>${run.practice?text('PRACTICE · NO REWARDS','ANTRENMAN · ÖDÜLSÜZ'):text('STAGE','AŞAMA')+' '+run.stage+'/100'}<b>${text(...biome(run.stage).slice(0,2))}</b></span>${button('pause','Ⅱ',`aria-label="${text('Pause','Duraklat')}"`)}</div><div class="ax-goal"><b>${tip||text(...labels[goal.key])}</b><span>${Math.min(goal.max,goal.value)}/${goal.max}</span><i style="width:${Math.min(100,goal.value/goal.max*100)}%"></i></div>${saveOK?'':`<p role="alert">${text('Save unavailable','Kayıt yapılamadı')}</p>`}<div class="ax-status"><span class="${e.hp<30?'danger':''}">♥ ${Math.ceil(e.hp)} ${e.shields?'⬡ '+e.shields:''}</span><span>✦ ${e.score}</span><span>◷ ${e.tutorial?'∞':Math.max(0,Math.ceil(e.stage.duration-e.t))}</span></div>${e.combo>1?`<div class="ax-combo">${e.combo}<small>${text('COMBO','KOMBO')}</small></div>`:''}${countdown>0?`<p class="ax-resume-cards">${Object.keys(run.cards).map(id=>text(A.CARDS.find(c=>c.id===id)?.en||id,A.CARDS.find(c=>c.id===id)?.tr||id)).join(' · ')}</p>`:''}${e.stats.damage===0&&e.t>5?`<div class="ax-mastery">✧ ${text('No hit','Darbe yok')}</div>`:''}`;
 document.getElementById('axControls').innerHTML=`<span>${text('Dodge lines · counter violet enemies','Çizgiden kaç · mor düşmana karşı saldır')}<small>${e.stage.side==='counter'?text('Bonus: 3 counters','Ek hedef: 3 karşı saldırı'):e.stage.side==='clean'?text('Bonus: no damage','Ek hedef: hasar alma'):text('Bonus: 10 combo','Ek hedef: 10 kombo')}</small></span>${button('ability',(e.hero==='guardian'?'⬡':e.hero==='energy'?'ϟ':'⚔')+' '+Math.floor(e.energy),`class="ax-ability ${e.energy>=50&&e.t>=e.skillAt?'ready':''}" ${e.energy<50||e.t<e.skillAt?'disabled':''} aria-label="${text('Ability: costs 50 energy','Beceri: 50 enerji harcar')}"`)}`;
}
function tone(freq,duration=.06,volume=.025,type='triangle'){
 if(!meta.settings.sound)return;rpgTone(freq,duration,type,volume);
}
function handleEvents(){
 for(const event of engine.events.splice(0)){
  if(event.type==='cut'&&engine.t-soundAt>.07){soundAt=engine.t;const notes=[261.63,293.66,329.63,392,440,523.25,587.33,659.25];tone(notes[Math.min(7,Math.floor((event.value-1)/2))],.09,.025);tone(120,.025,.012,'triangle');}if(event.type==='material'){tone(event.value==='metal'?170:event.value==='energy'?720:420,.05,.012,event.value==='metal'?'square':'sine');}if(event.type==='finisher'){tone(72,.35,.045,'triangle');tone(523,.25,.018,'sine');}if(event.type==='precise')tone(1046,.035,.012,'sine');
  if(event.type==='damage'){tone(105,.12,.05,'sawtooth');if(meta.settings.haptic&&typeof navigator!=='undefined')navigator.vibrate?.(18);}
  if(event.type==='counter')tone(620,.10,.035);if(event.type==='dodge')tone(860,.09,.025);if(event.type==='synergy')tone(1040,.12,.03);
  if(event.type==='bossHit')tone(150,.1,.05,'triangle');if(event.type==='armor')tone(240,.04,.03,'square');
 }
 if(meta.settings.music&&engine.t-musicAt>2){musicAt=engine.t;const danger=engine.hp<30||engine.stage.boss;rpgTone(danger?85:65,.5,'sine',.009);}
}
function loop(now){
 if(!root||root.hidden){raf=false;return;}const ms=last?now-last:16;last=now;const dt=Math.min(.05,ms/1000);frameAverage=frameAverage*.97+ms*.03;if(engine&&!modal&&performanceSamples.length<1200)performanceSamples.push(ms);
 if(engine&&!modal&&!pausedAX){if(countdown>0)countdown=Math.max(0,countdown-dt);else{engine.lowFX=frameAverage>24;if(engine.status==='playing')engine.update(dt);else engine.animate?.(dt);if(run?.practice&&!engine.entities.length)engine.spawn(engine.practiceType,{x:180,y:220,expires:Infinity});handleEvents();if(engine.status!=='playing'){if(run.practice){engine.hp=100;engine.status='playing';engine.t=0;engine.entities=[];engine.spawn(engine.practiceType,{x:180,y:220,expires:Infinity});}else{engine.finishAt+=dt;for(const f of engine.fx){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;}if(engine.finishAt>(engine.finisher&&!meta.settings.motion?1.8:.8))settle();}}}
  if(now-drawAt>120){drawAt=now;renderHUD();}if(now-lastTickSave>1200&&!run?.practice){lastTickSave=now;checkpoint();}}
 draw();requestAnimationFrame(loop);
}
function circle(x,y,r,color,fill=true){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g[fill?'fillStyle':'strokeStyle']=color;g.lineWidth=1.5;fill?g.fill():g.stroke();}
function line(a,b,color,w=1){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=color;g.lineWidth=w;g.stroke();}
function label(s,x,y,color='#dffcf6',size=13){g.fillStyle=color;g.font=`700 ${size}px system-ui`;g.textAlign='center';g.fillText(s,x,y);}
function polygon(x,y,r,count,color,rot=0){g.beginPath();for(let i=0;i<count;i++){const a=rot+i*Math.PI*2/count;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();g.fillStyle=color;g.fill();}
function draw(){
 if(!g)return;g.setTransform(canvas.width/360,0,0,canvas.height/640,0,0);g.fillStyle='#06191d';g.fillRect(0,0,360,640);const e=engine,n=e?.stage.n||meta.frontier,b=biome(Math.min(100,n)),t=e?.t||0,accent=b[2];
 const grad=g.createRadialGradient(180,315,20,180,315,400);grad.addColorStop(0,badge(Math.min(100,n))%2?'#222137':'#143936');grad.addColorStop(1,'#061218');g.fillStyle=grad;g.fillRect(0,0,360,640);
 // Readability wins over decoration during an attack warning.
 g.globalAlpha=e?.warning?.09:.22;
 for(let i=0;i<6;i++){g.beginPath();g.moveTo(i*72-60,0);g.bezierCurveTo(120+Math.sin((meta.settings.motion?0:t)*.12+i)*20,220,40+i*62,420,i*85,640);g.strokeStyle=accent;g.lineWidth=1.5;g.stroke();}g.globalAlpha=1;
 if(!e)return;g.save();if(!meta.settings.motion&&meta.settings.shake){g.translate(Math.sin(e.animClock*83)*(e.shake||0)*meta.settings.shake,Math.cos(e.animClock*71)*(e.shake||0)*meta.settings.shake);}if(e.status==='won'){g.fillStyle='#c2ffe00b';g.fillRect(0,140,360,420);for(let i=0;i<9;i++)circle(35+i*37,520+Math.sin(i*2)*25,3,accent+'55');}
 for(const p of e.props)if(p.hp){polygon(p.x,p.y,12,6,'#345354',Math.PI/6);circle(p.x,p.y,4,'#6a8e85');}
 for(const o of e.stage.obstacles){g.fillStyle='#335456';g.fillRect(o.x,o.y,o.w,o.h);g.strokeStyle='#98b7ae';g.lineWidth=2;g.strokeRect(o.x,o.y,o.w,o.h);}
 if(e.stage.flow){for(let i=0;i<5;i++)label(e.stage.flow>0?'›':'‹',65+i*55,375,'#75cfc844',25);}
 if(e.stage.kind==='corridor'){g.setLineDash([3,8]);line({x:144,y:160},{x:144,y:550},'#a0e8d640');line({x:216,y:160},{x:216,y:550},'#a0e8d640');g.setLineDash([]);}
 if(e.stage.kind==='flow'&&e.stage.n>30){const offset=e.arenaShift;g.strokeStyle='#b5e6d060';g.strokeRect(25+offset,160,310,395);if(e.arenaWarning)label(text('ARENA SHIFT →','ALAN KAYIYOR →'),180,390,'#efdfa6',12);}
 if(e.safeUntil>t){circle(e.safeZone.x,e.safeZone.y,e.safeZone.r,'#94d9c422');circle(e.safeZone.x,e.safeZone.y,e.safeZone.r,'#baffd1',false);label('⬡',e.safeZone.x,e.safeZone.y+5,'#c5ffe3',20);}
 // Telegraphs and links appear before enemies and effects.
 for(const foe of e.entities){
  if(foe.kind==='linked'&&foe.partner&&!foe.unlinked){const p=e.entities.find(x=>x.id===foe.partner);if(p)line(foe,p,'#c3a4fc',3);}
  if(foe.kind==='drainer'&&foe.state==='attack'&&Math.hypot(foe.x-e.drone.x,foe.y-e.drone.y)<140)line(foe,e.drone,'#e7aaff',3);
  if(foe.state==='windup'||foe.kind==='sniper'&&foe.state==='attack'){
   const from=foe.from||foe,to=foe.lock||e.drone;line(from,to,'#ffba7950',22);g.setLineDash([8,7]);line(from,to,'#ffd39b',2);g.setLineDash([]);circle(to.x,to.y,21,'#ffd39b',false);label('!',to.x,to.y+5,'#ffe8c2',20);
   if(foe.x<30||foe.x>330||foe.y<160||foe.y>550)label('▲',clamp(foe.x,30,330),clamp(foe.y,165,540),'#ffca9b',22);
  }
 }
 for(const f of e.entities){
  A.actorTransform?.(g,e,f);const recovery=f.state==='recover',warn=f.state==='windup',col=recovery?'#c5a2ff':warn?'#ffba7f':'#90a8b7';
  if(f.kind==='target'){
   const pulse=meta.settings.motion?0:Math.sin(t*3+f.id)*1.5;circle(f.x,f.y,f.r+4+pulse,'#68efdb10');circle(f.x,f.y,f.r,'#4cb9ac');circle(f.x-4,f.y-5,f.r*.55,'#bcfff070');circle(f.x,f.y,f.r+2,'#b6fff1',false);circle(f.x+4,f.y+4,3,'#eafff5');
   if(f.armor){circle(f.x,f.y,f.r+5,'#c9d3e7',false);label('⬡',f.x,f.y+5,'#fff');}if(f.priority)label('!',f.x,f.y-23,'#ffe3a0',18);
   const expiry=Math.max(0,(f.expires-t)/7);g.strokeStyle=expiry<.3?'#ffbf84':'#7cebd6';g.lineWidth=2;g.beginPath();g.arc(f.x,f.y,f.r+6,-Math.PI/2,-Math.PI/2+Math.PI*2*expiry);g.stroke();
  }else if(f.kind==='trap'||f.kind==='mimic'){
   const ready=t>f.since+1.1;polygon(f.x,f.y,f.r, f.kind==='mimic'?4:12,ready?'#893c52':'#523c4c',f.kind==='mimic'?Math.PI/4:meta.settings.motion?0:t*.1);circle(f.x,f.y,10,'#291921');label(f.kind==='mimic'?'◈':'×',f.x,f.y+5,'#ffb0c1',19);if(!ready)circle(f.x,f.y,23,'#ffb0c1',false);
  }else{
   if(f.kind==='ambusher'&&f.state==='approach')g.globalAlpha=.4;
   polygon(f.x,f.y,f.r+3,f.kind==='shield'?6:f.kind==='directional'?4:3,col,f.facing||0);circle(f.x,f.y,6,'#132735');label(A.ENEMIES[f.kind]?.[2]||'△',f.x,f.y+4,'#0a2430',12);g.globalAlpha=1;
   if(f.kind==='shield')line({x:f.x+Math.cos(f.facing-1)*22,y:f.y+Math.sin(f.facing-1)*22},{x:f.x+Math.cos(f.facing+1)*22,y:f.y+Math.sin(f.facing+1)*22},'#d9ecff',4);
   if(f.kind==='directional')label(f.arrow===0?'→':'←',f.x,f.y-23,'#ffefbd',22);
   if(f.affix)label(f.affix==='swift'?'ϟ':f.affix==='armored'?'⬡':'✦',f.x,f.y-24,'#e8d09e',13);
   if(recovery)circle(f.x,f.y,23,'#c5a2ff',false);
  }g.restore();
 }
 if(e.bossHP>0){for(const p of e.bossPoints()){
  circle(p.x,p.y,39,p.open?'#ffcb6940':'#59738b30');polygon(p.x,p.y,27,6,p.open?'#ffcd7b':'#697f91',meta.settings.motion?0:t*.13);circle(p.x,p.y,13,'#193139');label(p.open?'✦':'⬡',p.x,p.y+6,p.open?'#ffdc9a':'#bfd8e3',21);label(e.bossHP+'/'+e.bossMax,p.x,p.y-44,'#fff1d0',13);
 }}
 if(e.stage.kind==='escort'||e.room==='escort'){circle(e.helper.x,e.helper.y,12,'#aecbf5');label('♥',e.helper.x,e.helper.y+4,'#22394f',11);label(Math.ceil(e.helper.hp),e.helper.x,e.helper.y-19,'#d2e9ff',11);}
 if(e.mark?.until>t){circle(e.drone.x,e.drone.y,24,'#fba9a9',false);label('◎',e.drone.x,e.drone.y-30,'#ffbfaf',15);}
 // Directional shards, value text and a returning energy spark share a strict global effect budget.
 for(const f of e.fx){g.globalAlpha=clamp(f.life/f.max,0,1);if(f.text)label(f.text,f.x,f.y-12,f.color,12);else polygon(f.x,f.y,2.5,3,f.color,f.life*5);}g.globalAlpha=1;
 if(e.stats.near&&e.t-e.lastCut<.2&&!meta.settings.motion){circle(e.drone.x-e.drone.vx*.08,e.drone.y-e.drone.vy*.08,10,'#d4d9ff30');}
 const d=e.drone,cls=e.hero,c=e.hp<25?'#ffadc2':cls==='guardian'?'#b0d7ff':cls==='energy'?'#d9b3ff':'#8bf6df';
 if(t<e.invuln&&Math.floor(t*14)%2)g.globalAlpha=.45;
 if((meta.tiers[e.stage.region]||0)>=1)circle(d.x,d.y,27,A.BIOMES[e.stage.region][2]+'77',false);if(e.shields)circle(d.x,d.y,23,'#b9edff66',false);
 polygon(d.x-18,d.y+4,10,3,c,-Math.PI/2);polygon(d.x+18,d.y+4,10,3,c,Math.PI/2);polygon(d.x,d.y,13,6,'#284e5b',Math.PI/6);circle(d.x,d.y,7,c);circle(d.x-2,d.y-3,3,'#fff');g.globalAlpha=1;
 const chassis=1+Math.floor(level()/20);if(chassis>1)circle(d.x,d.y,16+chassis,c+'66',false);
 if(e.level('drone')){const h={x:d.x+Math.cos(meta.settings.motion?0:t)*31,y:d.y+Math.sin(meta.settings.motion?0:t)*22};circle(h.x,h.y,5,'#e9d7ff');}
 if(pressed&&prev){const trailColor=e.level('volt')?'#e1c0ff':e.level('heal')?'#b8ffb9':e.blade==='resonant'?'#d2bbff':'#97ffea';line({x:d.x-d.vx*.12,y:d.y-d.vy*.12},d,trailColor,3+e.level('wide'));}
 if(meta.cosmetic){const color=meta.cosmetic==='alchemist'?'#e5beff':meta.cosmetic==='rescuer'?'#ffdbcb':'#a6f7e6';circle(d.x,d.y,26,color+'88',false);if(meta.cosmetic==='alchemist'){for(let i=0;i<3;i++)circle(d.x+Math.cos(i*2.094)*26,d.y+Math.sin(i*2.094)*26,3,color);}}A.drawImpact?.(g,e,{text,ghost:activeGhost,shake:meta.settings.shake});g.restore();
 if(countdown>0){g.fillStyle='#06191d88';g.fillRect(0,130,360,420);label(String(Math.ceil(countdown)),180,335,'#eafff6',55);label(text('Get ready','Hazır ol'),180,375,'#9abfb9',15);}
 if(e.intro>0){g.fillStyle='#091923dd';g.fillRect(0,185,360,160);label('♛',180,245,'#ffdda3',38);label(text('REGION GUARDIAN','BÖLGE KORUYUCUSU'),180,285,'#ffdda3',17);label(text('Watch. Dodge. Counter.','İzle. Kaçın. Karşı saldır.'),180,316,'#c6e2de',12);}
}
/* IMPACT_UI_EXTENSIONS */
// Public inspection surface for deterministic QA; no hidden network-backed AI.
window.angioExpedition={action,begin,resume,get engine(){return engine},get state(){return saved},get run(){return run},menu};
renderMenu();
})();
