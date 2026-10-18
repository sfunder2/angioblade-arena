/* Server-coordinated elimination and consensual rematches use validated arena hit schedules. */
let chosenSeriesFormat='';
(function(){
'use strict';
const request=duelRequest;
duelRequest=async function(action,extra={}){
 const previous=duel.room,round=previous?.series?.round||0;
 const data=await request(action,{seriesVersion:1,...extra,...(action==='create'?{seriesFormat:chosenSeriesFormat,roomMode:chosenSeriesFormat==='tournament'?'versus':extra.roomMode||chosenRoomMode}:{})});
 if(data.series&&((previous&&['finished','forfeit'].includes(previous.status)&&data.status==='waiting')||data.series.round>round&&round>0)){
  duel.started=false;duel.done=false;duel.ended=false;duel.pending=[];duel.waveIndex=0;duel.lastHitTime=0;duel.verdictSignature='';duel.nextPoll=0;gameState=STATE_INTRO;mode='duel';
  document.getElementById('screenResults').classList.add('hidden');document.getElementById('duelLobby').hidden=false;document.getElementById('overlayContainer').classList.remove('hidden');renderDuelLobby();
 }
 return data;
};
function seriesHTML(room){const s=room.series;if(!s)return '';const out=s.eliminated.includes(duel.seat),qualified=s.qualified.includes(duel.seat);return `<section class="series-banner"><b>${s.format==='tournament'?'🏆 '+L('Elimination','Eleme')+' · '+L('Round ','Tur ')+s.round:L('Rematch room','Rövanş odası')}</b><p>${s.format==='tournament'?L('Equal equipment · private event · no league points','Eşit ekipman · özel etkinlik · lig puanı yok'):''}</p>${out?`<strong>${L('You are spectating after elimination.','Elendiniz; izleyici olarak devam ediyorsunuz.')}</strong>`:''}${qualified&&room.status==='finished'?`<p>✓ ${L('You qualified.','Üst tura çıktınız.')}</p>`:''}<small>${L('Tie-break: score, cuts, then seat number.','Eşitlik: puan, kesim sayısı, ardından koltuk numarası.')}</small>${s.history.length?`<details><summary>${L('Round history','Tur geçmişi')}</summary>${s.history.map(h=>`<p>${L('Round','Tur')} ${h.round}: ${h.players.map(p=>escapeText(p.name)+' '+p.score+(h.qualified.includes(p.seat)?' ✓':'')).join(' · ')}</p>`).join('')}</details>`:''}</section>`;}
const lobby=renderDuelLobby;renderDuelLobby=function(message=''){
 lobby(message);const node=document.getElementById('duelLobby');
 if(!duel.room){const choice=document.createElement('div');choice.className='room-mode-choice series-choice';choice.innerHTML=`<button id="seriesTournament" aria-pressed="${chosenSeriesFormat==='tournament'}">🏆 ${L('Elimination · up to 16','Eleme · en fazla 16')}</button>`;node.prepend(choice);document.getElementById('seriesTournament').onclick=()=>{chosenSeriesFormat=chosenSeriesFormat==='tournament'?'':'tournament';chosenRoomMode='versus';renderDuelLobby();};
  const vs=document.getElementById('versusChoice'),co=document.getElementById('coopChoice');vs.onclick=()=>{chosenSeriesFormat='';chosenRoomMode='versus';renderDuelLobby();};co.onclick=()=>{chosenSeriesFormat='';chosenRoomMode='coop';renderDuelLobby();};
 }else if(duel.room.series){const section=document.createElement('section');section.innerHTML=seriesHTML(duel.room);node.prepend(section);if(duel.room.series.eliminated.includes(duel.seat)){const b=document.getElementById('readyDuel');if(b)b.disabled=true;}}
};
const verdict=showDuelResult;showDuelResult=function(){
 verdict();const r=duel.room;if(!r||!['finished','forfeit'].includes(r.status))return;const node=document.getElementById('duelVerdict');if(node.querySelector?.('.series-actions'))return;
 const box=document.createElement('section');box.className='series-actions';const s=r.series;
 box.innerHTML=seriesHTML(r)+(s?.format==='tournament'&&!s.complete?(duel.seat===r.hostSeat?`<button id="seriesAdvance">▶ ${L('Open next round','Sonraki turu aç')}</button>`:`<p>${L('The host will open the next round.','Oda sahibi sonraki turu açacak.')}</p>`):`<button id="seriesRematch">↻ ${L('Request a rematch','Rövanş iste')}</button><p>${s?.votes.length||0}/${r.players.filter(p=>!s?.departed.includes(p.seat)).length} ${L('rematch votes','rövanş onayı')}</p>`);
 node.append(box);const advance=box.querySelector?.('#seriesAdvance'),rematch=box.querySelector?.('#seriesRematch');
 const send=async(action)=>{try{await duelRequest(action);duel.verdictSignature='';box.remove?.();if(duel.room.status==='waiting')renderDuelLobby();else showDuelResult();}catch(e){const p=document.createElement('p');p.textContent=duelError(e.message);box.append(p);}};
 if(advance)advance.onclick=()=>send('advance');if(rematch)rematch.onclick=()=>send('rematch');
};
const tick=tickDuel;tickDuel=function(){
 const r=duel.room,s=r?.series;
 if(mode==='duel'&&r&&s&&(['finished','forfeit'].includes(r.status)||s.eliminated.includes(duel.seat))){
  if(Date.now()>=(duel.seriesPollAt||0)&&!duel.busy){duel.seriesPollAt=Date.now()+1800;duel.busy=true;duelRequest('state').then(()=>{duel.verdictSignature='';const old=document.querySelector?.('.series-actions');old?.remove();if(duel.room.status==='waiting'||duel.room.series?.eliminated.includes(duel.seat))renderDuelLobby();else showDuelResult();}).catch(()=>{}).finally(()=>duel.busy=false);}
  if(s.eliminated.includes(duel.seat))return;
 }
 tick();
};
const growthAward=applyDuelGrowth;applyDuelGrowth=function(r){if(r?.series?.format==='tournament')return;return growthAward(r);};
})();
(function(){
 const summary=coOpSummary;coOpSummary=function(r){const html=summary(r);if(!r?.coop)return html;return html+`<p class="team-opening">${r.coop.openingUntil>duelNow()?'✦ '+L('Guardian opening! Cutter: hit now for team repair.','Koruyucu fırsat açtı! Kesici: ortak onarım için şimdi vur.'):'⌁ '+L('Guardian → Cutter in 2 seconds: +2 shared repair.','Koruyucu → Kesici, 2 saniye içinde: +2 ortak onarım.')} · ${r.coop.openings||0}</p>`;};
 const draw=molecularRenderer.drawTarget;molecularRenderer.drawTarget=function(item){draw.call(this,item);if(mode==='duel'&&duel.room?.coop?.openingUntil>duelNow()&&!item.sliced&&item.panel==='right'){ctx.save();ctx.strokeStyle='#c2f7a6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(item.x,item.y,item.radius+6,0,Math.PI*2);ctx.stroke();ctx.restore();}};
 const error=duelError;duelError=function(msg){return msg==='ELIMINATED'?L('You are spectating.','İzleyici olarak devam ediyorsunuz.'):error(msg);};
})();
