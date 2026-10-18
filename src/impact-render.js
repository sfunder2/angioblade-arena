/* All geometry is world-space and shares the simulation's bounded tracks. */
(function(root){
'use strict';const A=root.AngioAdventure,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function ring(g,x,y,r,color,w=1){g.beginPath();g.arc(x,y,Math.max(.1,r),0,Math.PI*2);g.strokeStyle=color;g.lineWidth=w;g.stroke();}
function stroke(g,a,b,c,w=1){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=c;g.lineWidth=w;g.stroke();}
function text(g,s,x,y,c='#e5fff2',size=12){g.font=`800 ${size}px system-ui`;g.textAlign='center';g.fillStyle=c;g.fillText(s,x,y);}
function piece(g,a,side,k){
 const nx=-Math.sin(a.angle),ny=Math.cos(a.angle),travel=(a.material==='metal'?32:48)*k,spin=(a.material==='metal'?.8:.45)*side*k;
 const sx=Math.cos(a.angle)*k*10,sy=Math.sin(a.angle)*k*10;
 g.save();g.translate(a.x+nx*side*travel+sx,a.y+ny*side*travel+sy+k*k*18);g.rotate(a.angle+spin);const squash=k<.18?1-Math.sin(k/.18*Math.PI)*.15:1;g.scale(1/squash,squash);
 g.beginPath();g.rect(-a.r-4,side>0?0:-a.r-4,a.r*2+8,a.r+4);g.clip();
 if(a.shape==='cell'){g.beginPath();g.arc(0,0,a.r,0,Math.PI*2);g.fillStyle=a.material==='energy'?'#a589d4':a.material==='metal'?'#758ea4':'#4ba99c';g.fill();g.strokeStyle=a.color;g.lineWidth=1.5;g.stroke();g.beginPath();g.arc(-4,-4,a.r*.55,0,Math.PI*2);g.fillStyle=a.color+'66';g.fill();}
 else{g.beginPath();g.moveTo(0,-a.r);g.lineTo(a.r,a.r);g.lineTo(-a.r,a.r);g.closePath();g.fillStyle=a.color;g.fill();}
 stroke(g,{x:-a.r,y:0},{x:a.r,y:0},'#effff4',2);g.restore();
}
A.drawImpact=function(g,e,{text:loc=(en)=>en,ghost=null,shake=1}={}){
 if(!e.animations)return;
 if(ghost&&Array.isArray(ghost.path)&&ghost.path.length){const target=e.t*10,p=ghost.path.reduce((best,p)=>Math.abs(p[0]-target)<Math.abs(best[0]-target)?p:best,ghost.path[0]);g.globalAlpha=.28;ring(g,p[1],p[2],13,'#e5ddff',2);text(g,'◇',p[1],p[2]+4,'#ddd5ff',17);g.globalAlpha=1;}
 if(e.hazard){const h=e.hazard,t=e.t-h.at;if(t<3.4){g.save();g.setLineDash([5,7]);const c=t<1.3?'#ffd3a6':'#ffbfa0';if(h.axis==='x'){stroke(g,{x:h.position,y:170},{x:h.position,y:550},c,t<1.3?1:3);}else stroke(g,{x:30,y:h.position},{x:330,y:h.position},c,t<1.3?1:3);g.setLineDash([]);text(g,loc('FLOW SHIFT','AKIŞ DEĞİŞİMİ'),180,170,c,10);g.restore();}}
 for(const s of e.slashes||[]){const k=clamp(s.age/.24,0,1),dx=s.bx-s.ax,dy=s.by-s.ay,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,col=s.blade==='resonant'?'#d7bdff':s.blade==='wide'?'#c5f5dd':'#8ff7e1';g.save();g.globalAlpha=(1-k)*.6;g.beginPath();g.moveTo(s.ax,s.ay);g.quadraticCurveTo((s.ax+s.bx)/2+nx*8,(s.ay+s.by)/2+ny*8,s.bx,s.by);g.lineTo(s.bx-nx*(1-k)*5,s.by-ny*(1-k)*5);g.quadraticCurveTo((s.ax+s.bx)/2-nx*3,(s.ay+s.by)/2-ny*3,s.ax,s.ay);g.fillStyle=col;g.fill();stroke(g,{x:s.ax,y:s.ay},{x:s.bx,y:s.by},'#edfff9',1);g.restore();}
 for(const a of e.animations){const k=clamp(a.age/a.duration,0,1),alpha=Math.min(1,(1-k)*2);g.save();g.globalAlpha=alpha;
  if(a.type==='split'){if(e.options.motion){ring(g,a.x,a.y,a.r+k*10,a.color,1);}else{piece(g,a,-1,k);piece(g,a,1,k);if(k<.3){stroke(g,{x:a.x-Math.cos(a.angle)*a.r*1.6,y:a.y-Math.sin(a.angle)*a.r*1.6},{x:a.x+Math.cos(a.angle)*a.r*1.6,y:a.y+Math.sin(a.angle)*a.r*1.6},'#faffee',2*(1-k));}}}
  else if(['impact','parry','barrier','stasis','recover','intent','spawn','biome','cleave'].includes(a.type)){
   const size=a.type==='stasis'?90:a.type==='cleave'?65:a.type==='barrier'?38:a.r+18;ring(g,a.x,a.y,a.r+(size-a.r)*k,a.color,a.type==='impact'?2*(1-k)+.5:1.5);
   if(a.type==='cleave'){g.beginPath();g.arc(a.x,a.y,50,-Math.PI*.8,Math.PI*.3);g.strokeStyle='#d6fff4';g.lineWidth=4*(1-k);g.stroke();}
   if(a.type==='stasis'){g.setLineDash([3,7]);ring(g,a.x,a.y,55+k*40,'#ddd0ff',1);g.setLineDash([]);}
  }else if(a.type==='crack'){
   for(let i=0;i<5;i++){const ang=i*Math.PI*.4+a.angle;stroke(g,{x:a.x+Math.cos(ang)*4,y:a.y+Math.sin(ang)*4},{x:a.x+Math.cos(ang)*(16+k*20),y:a.y+Math.sin(ang)*(16+k*20)},'#e4efff',1.5);}
  }else if(a.type==='precision'){text(g,loc('CLEAN +10','TEMİZ +10'),a.x,a.y-25-k*20,'#ffe8b6',10);}
  else if(a.type==='clutch'){text(g,loc('LAST-SECOND SAVE','SON ANDA KURTULUŞ'),180,330,'#ffe8b6',16);ring(g,a.x,a.y,25+k*45,'#ffe8b6',2);}
  else if(a.type==='combo'){text(g,a.count+' '+loc('COMBO','KOMBO'),180,275-k*10,'#ffedb2',18+Math.sin(k*Math.PI)*4);}
  else if(a.type==='fusion'){const ids=['ϟ','⌁','✦'];for(let i=0;i<3;i++){const ang=k*4+i*Math.PI*2/3;const x=a.x+Math.cos(ang)*(18+18*k),y=a.y+Math.sin(ang)*(18+18*k);text(g,ids[i],x,y,'#e7cfff',16);}}
  else if(a.type==='finisher'||a.type==='victory'){
   const boss=a.type==='finisher';ring(g,a.x,a.y,20+k*(boss?220:110),a.color,3*(1-k)+.5);if(!e.options.motion){for(let i=0;i<12;i++){const ang=i*Math.PI/6;const r=20+k*150;stroke(g,{x:a.x+Math.cos(ang)*r,y:a.y+Math.sin(ang)*r},{x:a.x+Math.cos(ang)*(r+12),y:a.y+Math.sin(ang)*(r+12)},a.color,2);}}
   if(k>.3)text(g,boss?loc('CORE RESTORED','ÇEKİRDEK KURTARILDI'):loc('CLEARED','TAMAMLANDI'),180,325,a.color,boss?20:17);
  }
  g.restore();
 }
 if(e.phaseNotice>e.animClock){const labels={prepare:['Find the rhythm','Ritmi bul'],pressure:['Pressure rises','Baskı yükseliyor'],final:['Final push','Son mücadele']};text(g,loc(...labels[e.phase]),180,188,'#f6e4ba',12);}
 if(e.flash>0&&!e.options.motion){g.globalAlpha=Math.min(.12,e.flash);g.fillStyle='#ffb0c2';g.fillRect(0,140,360,420);g.globalAlpha=1;}
};
A.actorTransform=function(g,e,f){g.save();const age=e.animClock-(f.born||0),appear=e.options.motion?1:clamp(age/.25,.1,1),h=e.animClock-(f.squashAt||-9),s=e.options.motion?0:h>=0&&h<.24?Math.sin(h/.24*Math.PI)*.18:0;g.translate(f.x,f.y);g.scale(appear*(1+s),appear*(1-s));g.translate(-f.x,-f.y);};
})(typeof globalThis!=='undefined'?globalThis:this);
