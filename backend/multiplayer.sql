create table if not exists public.angio_duel_rooms (
 code text primary key check(code ~ '^[A-Z2-9]{6}$'),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '2 hours',
 status text not null default 'waiting' check(status in ('waiting','playing','finished','cancelled','forfeit')),
 seed integer not null, plan jsonb not null check(jsonb_typeof(plan)='array'),
 token1 text not null, token2 text, name1 text not null, name2 text,
 ready1 boolean not null default false, ready2 boolean not null default false,
 seen1 bigint not null, seen2 bigint, start_ms bigint,
 hits1 jsonb not null default '[]', hits2 jsonb not null default '[]',
 score1 integer not null default 0, score2 integer not null default 0,
 winner integer, revision integer not null default 0
);
alter table public.angio_duel_rooms enable row level security;
revoke all on public.angio_duel_rooms from public, anon, authenticated;
grant select,insert,update,delete on public.angio_duel_rooms to service_role;
create index if not exists angio_duel_rooms_expiry on public.angio_duel_rooms(expires_at);

create or replace function public.angio_duel_score(p_plan jsonb,p_hits jsonb) returns integer
language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare h jsonb; target jsonb; other jsonb; queue jsonb:='[]'; count_combo integer:=0; last_t integer:=-99999; t integer; score integer:=0; syn boolean; bonus integer;
begin
 for h in select value from jsonb_array_elements(p_hits) order by (value->>'t')::integer loop
  t:=(h->>'t')::integer;
  select value into target from jsonb_array_elements(p_plan) where value->>'id'=h->>'id' limit 1;
  count_combo:=case when t-last_t<=2000 then count_combo+1 else 1 end;last_t:=t;
  bonus:=case when count_combo>=20 then 100 when count_combo>=10 then 50 when count_combo>=5 then 25 when count_combo>=3 then 10 else 0 end;
  select coalesce(jsonb_agg(value),'[]') into queue from jsonb_array_elements(queue) where t-(value->>'t')::integer<180;
  select value into other from jsonb_array_elements(queue) where value->>'type'<>target->>'type' limit 1;
  syn:=other is not null;
  if syn then select coalesce(jsonb_agg(value),'[]') into queue from jsonb_array_elements(queue) where value<>other;
  else queue:=queue||jsonb_build_array(jsonb_build_object('type',target->>'type','t',t));end if;
  score:=score+100+bonus+case when syn then 10 else 0 end;
 end loop;
 return score;
end $$;
revoke all on function public.angio_duel_score(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.angio_duel_score(jsonb,jsonb) to service_role;

create or replace function public.angio_duel_action(p_action text,p_code text,p_hash text,p_payload jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.angio_duel_rooms; ms bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; seat integer; incoming jsonb; hits jsonb; h jsonb; target jsonb; t integer; last_t integer; score integer; n integer; chosen_winner integer;
begin
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_TOKEN';end if;
 if p_code !~ '^[A-Z2-9]{6}$' then raise exception 'INVALID_CODE';end if;
 if p_action='create' then
  delete from public.angio_duel_rooms where code in(select code from public.angio_duel_rooms where expires_at<now() limit 100);
  if(select count(*) from public.angio_duel_rooms where expires_at>now())>=1000 then raise exception 'SERVER_BUSY';end if;
  if jsonb_array_length(p_payload->'plan')>160 then raise exception 'INVALID_PLAN';end if;
  insert into public.angio_duel_rooms(code,seed,plan,token1,name1,seen1) values(p_code,(p_payload->>'seed')::integer,p_payload->'plan',p_hash,left(coalesce(p_payload->>'name','Player 1'),24),ms) returning * into r;
  seat:=1;
 else
  select * into r from public.angio_duel_rooms where code=p_code for update;
  if r.code is null or r.expires_at<now() then raise exception 'ROOM_NOT_FOUND';end if;
  if p_action='join' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   if r.token2 is not null then raise exception 'ROOM_FULL';end if;
   if r.token1=p_hash then raise exception 'SAME_PLAYER';end if;
   r.token2:=p_hash;r.name2:=left(coalesce(p_payload->>'name','Player 2'),24);r.seen2:=ms;seat:=2;
  else
   seat:=case when r.token1=p_hash then 1 when r.token2=p_hash then 2 else 0 end;
   if seat=0 then raise exception 'UNAUTHORIZED';end if;
  end if;
  if seat=1 then r.seen1:=ms;else r.seen2:=ms;end if;
  if p_action='ready' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   if seat=1 then r.ready1:=true;else r.ready2:=true;end if;
   if r.ready1 and r.ready2 and r.token2 is not null then r.status:='playing';r.start_ms:=ms+5000;end if;
  elsif p_action='leave' then
   if r.status='playing' then r.status:='forfeit';r.winner:=case when seat=1 then 2 else 1 end;
   elsif r.status='waiting' then r.status:='cancelled';end if;
  elsif p_action='update' then
   incoming:=coalesce(p_payload->'hits','[]');
   if jsonb_typeof(incoming)<>'array' or jsonb_array_length(incoming)>100 then raise exception 'INVALID_HITS';end if;
   hits:=case when seat=1 then r.hits1 else r.hits2 end;
   select coalesce(max((value->>'t')::integer),-1) into last_t from jsonb_array_elements(hits);
   if r.status='playing' and r.start_ms is not null and ms>=r.start_ms and ms<=r.start_ms+53000 then
    for h in select value from jsonb_array_elements(incoming) loop
     if not exists(select 1 from jsonb_array_elements(hits) where value->>'id'=h->>'id') then
      t:=(h->>'t')::integer;
      select value into target from jsonb_array_elements(r.plan) where value->>'id'=h->>'id' limit 1;
      if target is null or t<0 or t>50000 or t<(target->>'at')::integer or t>least(50000,(target->>'at')::integer+8000) or t>ms-r.start_ms+300 or t<last_t then raise exception 'INVALID_HIT';end if;
      hits:=hits||jsonb_build_array(jsonb_build_object('id',h->>'id','t',t));last_t:=t;
     end if;
    end loop;
    score:=public.angio_duel_score(r.plan,hits);
    if seat=1 then r.hits1:=hits;r.score1:=score;else r.hits2:=hits;r.score2:=score;end if;
   end if;
  elsif p_action not in('state','join') then raise exception 'INVALID_ACTION';end if;
  if r.status='playing' and ms>=r.start_ms+53000 then
   r.status:='finished';r.winner:=case when r.score1>r.score2 then 1 when r.score2>r.score1 then 2 else 0 end;
  end if;
  r.revision:=r.revision+1;
  update public.angio_duel_rooms set token2=r.token2,name2=r.name2,ready1=r.ready1,ready2=r.ready2,seen1=r.seen1,seen2=r.seen2,status=r.status,start_ms=r.start_ms,hits1=r.hits1,hits2=r.hits2,score1=r.score1,score2=r.score2,winner=r.winner,revision=r.revision where code=p_code;
 end if;
 return jsonb_build_object('code',r.code,'status',r.status,'seat',seat,'serverMs',ms,'startMs',r.start_ms,'duration',50,'seed',r.seed,'plan',r.plan,'winner',r.winner,'revision',r.revision,'players',jsonb_build_array(jsonb_build_object('seat',1,'name',r.name1,'score',r.score1,'ready',r.ready1,'seenMs',r.seen1,'cuts',jsonb_array_length(r.hits1)),jsonb_build_object('seat',2,'name',r.name2,'score',r.score2,'ready',r.ready2,'seenMs',r.seen2,'cuts',jsonb_array_length(r.hits2))));
end $$;
revoke all on function public.angio_duel_action(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.angio_duel_action(text,text,text,jsonb) to service_role;
