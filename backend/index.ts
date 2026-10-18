// Room capabilities authenticate each player. Service credentials stay on the server.
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
function makePlan(seed:number){let s=seed;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};const plan=[];for(let at=1200;at<48500;at+=1300){const count=1+Math.floor(random()*3);for(let j=0;j<count;j++){plan.push({id:String(plan.length+1),at,type:random()<.29?'plum':'cyan',x:.12+random()*.76,y:.12+random()*.76,angle:random()*Math.PI*2,speed:2.5+random()*2});}}return plan;}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return reply({error:'METHOD_NOT_ALLOWED'},405);
 try{
  const text=await req.text();if(text.length>100000)return reply({error:'REQUEST_TOO_LARGE'},413);const body=JSON.parse(text);
  const action=String(body.action||'');if(!['create','join','state','ready','update','leave','profile','leaderboard','score','start','cloud_create','cloud_load','cloud_save','advance','rematch'].includes(action))return reply({error:'INVALID_ACTION'},400);
  const cloud=action.startsWith('cloud_');let cloudKey=String(body.cloudKey||'');if(action==='cloud_create')cloudKey=randomToken();if(cloud&&!/^[a-f0-9]{64}$/.test(cloudKey))return reply({error:'INVALID_ACCOUNT'},401);
  let token=String(body.token||'');let code=String(body.code||'').toUpperCase();const payload:Record<string,unknown>={};
  if(action==='create'||action==='join'){token=randomToken();payload.name=String(body.name||'Player').trim().slice(0,24)||'Player';}
  if(action==='create'){payload.seriesFormat=body.seriesFormat==='tournament'?'tournament':null;payload.roomMode=body.roomMode==='coop'?'coop':'versus';const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';code=Array.from(crypto.getRandomValues(new Uint8Array(6))).map(n=>alphabet[n%alphabet.length]).join('');const seed=crypto.getRandomValues(new Uint32Array(1))[0]&0x7fffffff;payload.seed=seed;payload.plan=makePlan(seed);}
  if(!cloud&&!['profile','leaderboard','score'].includes(action)&&(!/^[A-Z2-9]{6}$/.test(code)||!/^[a-f0-9]{64}$/.test(token)))return reply({error:'INVALID_ROOM_OR_TOKEN'},401);
  if(['advance','rematch'].includes(action)){const seed=crypto.getRandomValues(new Uint32Array(1))[0]&0x7fffffff;payload.seed=seed;payload.plan=makePlan(seed);}
  if(action==='update'){if(!Array.isArray(body.hits)||body.hits.length>100)return reply({error:'INVALID_HITS'},400);payload.hits=body.hits.map((h:Record<string,unknown>)=>({id:String(h.id),t:Math.round(Number(h.t))}));}
  const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');const key=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');const url=Deno.env.get('SUPABASE_URL');
  if(!key||!url)return reply({error:'SERVER_NOT_CONFIGURED'},503);
  let profileToken=String(body.profileToken||'');if(action==='profile'&&!profileToken)profileToken=randomToken();
  if(profileToken&&!/^[a-f0-9]{64}$/.test(profileToken))return reply({error:'INVALID_PROFILE'},401);
  const profileHash=profileToken?await hash(profileToken):null;
  if((action==='create'||action==='join')&&profileHash)payload.profile=profileHash;
  if(action==='score'&&(!profileHash||!['comparison','challenge'].includes(body.mode)||!Number.isInteger(body.score)||body.score<1||body.score>1000000))return reply({error:'INVALID_SCORE'},400);
  if(action==='leaderboard'&&!['comparison','challenge','duel'].includes(body.mode))return reply({error:'INVALID_MODE'},400);
  const rpcName=cloud?'angio_cloud_action':action==='leaderboard'?'angio_leaderboard':action==='score'?'angio_record_score':action==='profile'?'angio_profile_action':body.seriesVersion===1?'angio_series_action':body.arenaVersion===2?'angio_arena_action':'angio_duel_action';
  const rpcBody=cloud?{p_action:action,p_hash:await hash(cloudKey),p_payload:body.snapshot||{},p_revision:Math.max(0,Math.trunc(Number(body.revision)||0)),p_rate_hash:await hash(req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown')}:action==='leaderboard'?{p_mode:body.mode}:action==='score'?{p_hash:profileHash,p_mode:body.mode,p_score:body.score}:action==='profile'?{p_hash:profileHash,p_payload:{name:body.name,badge:body.badge,skin:body.skin}}:{p_action:action,p_code:code,p_hash:await hash(token),p_payload:payload};
  const rpc=await fetch(url+'/rest/v1/rpc/'+rpcName,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(rpcBody)});
  const data=await rpc.json();if(!rpc.ok){const msg=String(data.message||'SERVER_ERROR');const known=['ACCOUNT_NOT_FOUND','SAVE_CONFLICT','INVALID_SAVE','INVALID_ACCOUNT','RATE_LIMITED','ROOM_NOT_FOUND','ROOM_FULL','UNAUTHORIZED','MATCH_ALREADY_STARTED','INVALID_HIT','SERVER_BUSY','SAME_PLAYER','SAME_PROFILE','INVALID_PROFILE','INVALID_ACTION','NOT_HOST','NOT_ENOUGH_PLAYERS','PLAYERS_NOT_READY','ELIMINATED'];return reply({error:known.find(x=>msg.includes(x))||'SERVER_ERROR'},400);}
  if(cloud)return reply({...data,...(action==='cloud_create'?{cloudKey}:{})});
  if(action==='leaderboard')return reply({rows:data});
  if(action==='score')return reply({saved:data===true});
  if(action==='profile')return reply({career:data,profileToken});
  return reply({...data,...(action==='create'||action==='join'?{token}:{})});
 }catch{return reply({error:'REQUEST_FAILED'},400);}
});
