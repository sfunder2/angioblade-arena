create table public.angio_player_profiles (
 profile_hash text primary key check(profile_hash ~ '^[a-f0-9]{64}$'),
 display_name text not null default 'Player',
 league_points integer not null default 0 check(league_points>=0), wins integer not null default 0, losses integer not null default 0, draws integer not null default 0,
 badge text not null default 'none' check(badge in ('none','first','hundred','combo','synergy','level','champion')),
 skin text not null default 'default', updated_at timestamptz not null default now()
);
alter table public.angio_player_profiles enable row level security;
revoke all on public.angio_player_profiles from public,anon,authenticated;
grant select,insert,update on public.angio_player_profiles to service_role;
alter table public.angio_duel_rooms add column profile1 text references public.angio_player_profiles(profile_hash), add column profile2 text references public.angio_player_profiles(profile_hash), add column league_settled boolean not null default false;
create index angio_rooms_profile1 on public.angio_duel_rooms(profile1) where profile1 is not null;
create index angio_rooms_profile2 on public.angio_duel_rooms(profile2) where profile2 is not null;

create function public.angio_profile_view(p_hash text) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('name',display_name,'leaguePoints',league_points,'wins',wins,'losses',losses,'draws',draws,'badge',badge,'skin',skin) from public.angio_player_profiles where profile_hash=p_hash;
$$;
create function public.angio_profile_action(p_hash text,p_payload jsonb default '{}') returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_PROFILE';end if;
 insert into public.angio_player_profiles(profile_hash,display_name) values(p_hash,left(coalesce(nullif(p_payload->>'name',''),'Player'),24)) on conflict(profile_hash) do nothing;
 update public.angio_player_profiles set display_name=case when coalesce(p_payload->>'name','')<>'' then left(p_payload->>'name',24) else display_name end,
 badge=case when p_payload->>'badge' in ('none','first','hundred','combo','synergy','level','champion') then p_payload->>'badge' else badge end,
 skin=case when p_payload->>'skin' in ('default','cyan','violet','gold','aurora') then p_payload->>'skin' else skin end, updated_at=now() where profile_hash=p_hash;
 return public.angio_profile_view(p_hash);
end $$;
create function public.angio_duel_stats(p_plan jsonb,p_hits jsonb) returns jsonb language plpgsql immutable security invoker set search_path=public,pg_temp as $$
declare h jsonb; item jsonb; other jsonb; queue jsonb:='[]'; last_t integer:=-99999; t integer; combo integer:=0; best integer:=0; synerg integer:=0; cuts integer:=jsonb_array_length(p_hits);
begin
 for h in select value from jsonb_array_elements(p_hits) order by (value->>'t')::integer loop
 t:=(h->>'t')::integer;combo:=case when t-last_t<=2000 then combo+1 else 1 end;last_t:=t;best:=greatest(best,combo);
 select value into item from jsonb_array_elements(p_plan) where value->>'id'=h->>'id' limit 1;
 select coalesce(jsonb_agg(value),'[]') into queue from jsonb_array_elements(queue) where t-(value->>'t')::integer<180;
 select value into other from jsonb_array_elements(queue) where value->>'type'<>item->>'type' limit 1;
 if other is not null then synerg:=synerg+1;select coalesce(jsonb_agg(value),'[]') into queue from jsonb_array_elements(queue) where value<>other;
 else queue:=queue||jsonb_build_array(jsonb_build_object('type',item->>'type','t',t));end if;
 end loop;
 return jsonb_build_object('cuts',cuts,'targets',jsonb_array_length(p_plan),'capture',case when jsonb_array_length(p_plan)>0 then round(cuts*100.0/jsonb_array_length(p_plan)) else 0 end,'bestCombo',best,'synergies',synerg);
end $$;
create function public.angio_duel_settle(p_code text) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.angio_duel_rooms;
begin
 select * into r from public.angio_duel_rooms where code=p_code for update;
 if r.code is null or r.league_settled or r.status not in ('finished','forfeit') or r.winner is null then return;end if;
 if r.profile1 is not null and r.profile2 is not null and r.profile1<>r.profile2 then
  perform 1 from public.angio_player_profiles where profile_hash in(r.profile1,r.profile2) order by profile_hash for update;
  update public.angio_player_profiles set league_points=league_points+case when r.winner=0 then 10 when (profile_hash=r.profile1 and r.winner=1) or (profile_hash=r.profile2 and r.winner=2) then 30 else 0 end,
  wins=wins+case when (profile_hash=r.profile1 and r.winner=1) or (profile_hash=r.profile2 and r.winner=2) then 1 else 0 end,
  draws=draws+case when r.winner=0 then 1 else 0 end,
  losses=losses+case when (profile_hash=r.profile1 and r.winner=2) or (profile_hash=r.profile2 and r.winner=1) then 1 else 0 end,updated_at=now() where profile_hash in(r.profile1,r.profile2);
 end if;
 update public.angio_duel_rooms set league_settled=true where code=p_code;
end $$;
revoke all on function public.angio_profile_view(text), public.angio_profile_action(text,jsonb),public.angio_duel_stats(jsonb,jsonb),public.angio_duel_settle(text) from public,anon,authenticated;
grant execute on function public.angio_profile_view(text), public.angio_profile_action(text,jsonb),public.angio_duel_stats(jsonb,jsonb),public.angio_duel_settle(text) to service_role;

create or replace function public.angio_duel_action(p_action text,p_code text,p_hash text,p_payload jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.angio_duel_rooms; ms bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; seat integer; incoming jsonb; hits jsonb; h jsonb; target jsonb; t integer; last_t integer; score integer; n integer; chosen_winner integer;
begin
 if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_TOKEN';end if;
 if p_action in ('create','join') and p_payload->>'profile' is not null and not exists(select 1 from public.angio_player_profiles where profile_hash=p_payload->>'profile') then raise exception 'INVALID_PROFILE';end if;
 if p_code !~ '^[A-Z2-9]{6}$' then raise exception 'INVALID_CODE';end if;
 if p_action='create' then
  delete from public.angio_duel_rooms where code in(select code from public.angio_duel_rooms where expires_at<now() limit 100);
  if(select count(*) from public.angio_duel_rooms where expires_at>now())>=1000 then raise exception 'SERVER_BUSY';end if;
  if jsonb_array_length(p_payload->'plan')>160 then raise exception 'INVALID_PLAN';end if;
  insert into public.angio_duel_rooms(code,seed,plan,token1,name1,seen1,profile1) values(p_code,(p_payload->>'seed')::integer,p_payload->'plan',p_hash,left(coalesce(p_payload->>'name','Player 1'),24),ms,p_payload->>'profile') returning * into r;
  seat:=1;
 else
  select * into r from public.angio_duel_rooms where code=p_code for update;
  if r.code is null or r.expires_at<now() then raise exception 'ROOM_NOT_FOUND';end if;
  if p_action='join' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   if r.token2 is not null then raise exception 'ROOM_FULL';end if;
   if r.token1=p_hash then raise exception 'SAME_PLAYER';end if;
   if r.profile1 is not null and r.profile1=p_payload->>'profile' then raise exception 'SAME_PROFILE';end if;r.profile2:=p_payload->>'profile';r.token2:=p_hash;r.name2:=left(coalesce(p_payload->>'name','Player 2'),24);r.seen2:=ms;seat:=2;
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
  update public.angio_duel_rooms set profile2=r.profile2,token2=r.token2,name2=r.name2,ready1=r.ready1,ready2=r.ready2,seen1=r.seen1,seen2=r.seen2,status=r.status,start_ms=r.start_ms,hits1=r.hits1,hits2=r.hits2,score1=r.score1,score2=r.score2,winner=r.winner,revision=r.revision where code=p_code;
 end if;
 perform public.angio_duel_settle(r.code);
 return jsonb_build_object('career',public.angio_profile_view(case when seat=1 then r.profile1 else r.profile2 end),'code',r.code,'status',r.status,'seat',seat,'serverMs',ms,'startMs',r.start_ms,'duration',50,'seed',r.seed,'plan',r.plan,'winner',r.winner,'revision',r.revision,'players',jsonb_build_array(jsonb_build_object('seat',1,'name',r.name1,'score',r.score1,'ready',r.ready1,'seenMs',r.seen1,'cuts',jsonb_array_length(r.hits1),'stats',public.angio_duel_stats(r.plan,r.hits1),'profile',public.angio_profile_view(r.profile1)),jsonb_build_object('seat',2,'name',r.name2,'score',r.score2,'ready',r.ready2,'seenMs',r.seen2,'cuts',jsonb_array_length(r.hits2),'stats',public.angio_duel_stats(r.plan,r.hits2),'profile',public.angio_profile_view(r.profile2))));
end $$;
revoke all on function public.angio_duel_action(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.angio_duel_action(text,text,text,jsonb) to service_role;
