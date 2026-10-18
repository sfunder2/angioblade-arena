-- Shared team roles are assigned by seat; only validated unique hits power the team pulse.
create or replace function public.angio_arena_action(p_action text,p_code text,p_hash text,p_payload jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.angio_arena_rooms; me public.angio_arena_players; member public.angio_arena_players;
 ms bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; chosen_seat integer; incoming jsonb; h jsonb; target jsonb; t integer; last_t integer;
 total integer; active_count integer; public_players jsonb; winners jsonb; top_score integer; points integer; is_winner boolean; shared_claimed jsonb; shared_count integer; shared_missed integer; shared_integrity integer; shared_goal integer; team_pulses integer; team_heal integer; team_step integer; shared_openings integer; opener_ms integer;
begin
 if coalesce(p_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(p_code,'') !~ '^[A-Z2-9]{6}$' then raise exception 'INVALID_TOKEN';end if;
 if p_action in ('create','join') and (coalesce(p_payload->>'profile','') !~ '^[a-f0-9]{64}$' or not exists(select 1 from public.angio_player_profiles where profile_hash=p_payload->>'profile')) then raise exception 'INVALID_PROFILE';end if;
 if p_action='create' then
  if (select count(*) from public.angio_arena_rooms where expires_at>now())>=1000 then raise exception 'SERVER_BUSY';end if;
  if jsonb_typeof(p_payload->'plan') is distinct from 'array' or jsonb_array_length(p_payload->'plan')>160 then raise exception 'INVALID_PLAN';end if;
  insert into public.angio_arena_rooms(code,seed,plan,game_mode) values(p_code,(p_payload->>'seed')::integer,p_payload->'plan',case when p_payload->>'roomMode'='coop' then 'coop' else 'versus' end) returning * into r;
  chosen_seat:=1;
  insert into public.angio_arena_players(code,seat,token_hash,profile_hash,name,seen_ms) values(p_code,1,p_hash,p_payload->>'profile',left(coalesce(nullif(p_payload->>'name',''),'Player'),24),ms) returning * into me;
 else
  select * into r from public.angio_arena_rooms where code=p_code for update;
  if r.code is null or r.expires_at<now() then raise exception 'ROOM_NOT_FOUND';end if;
  if p_action='join' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   if exists(select 1 from public.angio_arena_players where code=p_code and not left_room and profile_hash=p_payload->>'profile') then raise exception 'SAME_PROFILE';end if;
   select min(s) into chosen_seat from generate_series(1,case when r.game_mode='coop' then 4 else 16 end) s where not exists(select 1 from public.angio_arena_players where code=p_code and seat=s and not left_room);
   if chosen_seat is null then raise exception 'ROOM_FULL';end if;
   insert into public.angio_arena_players(code,seat,token_hash,profile_hash,name,seen_ms) values(p_code,chosen_seat,p_hash,p_payload->>'profile',left(coalesce(nullif(p_payload->>'name',''),'Player'),24),ms)
   on conflict(code,seat) do update set token_hash=excluded.token_hash,profile_hash=excluded.profile_hash,name=excluded.name,seen_ms=excluded.seen_ms,ready=false,left_room=false,hits='[]',score=0 returning * into me;
  else
   select * into me from public.angio_arena_players where code=p_code and token_hash=p_hash;
   if me.code is null or me.left_room then raise exception 'UNAUTHORIZED';end if;
   chosen_seat:=me.seat;
  end if;
  me.seen_ms:=ms;
  if p_action='ready' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   me.ready:=true;
  elsif p_action='start' then
   if r.status<>'waiting' then raise exception 'MATCH_ALREADY_STARTED';end if;
   if chosen_seat<>r.host_seat then raise exception 'NOT_HOST';end if;
   select count(*) into total from public.angio_arena_players where code=p_code and not left_room;
   if total<2 then raise exception 'NOT_ENOUGH_PLAYERS';end if;
   if exists(select 1 from public.angio_arena_players where code=p_code and not left_room and not ready) then raise exception 'PLAYERS_NOT_READY';end if;
   r.status:='playing';r.start_ms:=ms+5000;
  elsif p_action='leave' then
   me.left_room:=true;me.ready:=false;
  elsif p_action='update' then
   incoming:=coalesce(p_payload->'hits','[]');
   if jsonb_typeof(incoming)<>'array' or jsonb_array_length(incoming)>100 then raise exception 'INVALID_HITS';end if;
   select coalesce(max((value->>'t')::integer),-1) into last_t from jsonb_array_elements(me.hits);
   if r.status='playing' and ms>=r.start_ms and ms<=r.start_ms+53000 then
    for h in select value from jsonb_array_elements(incoming) loop
     if not exists(select 1 from jsonb_array_elements(me.hits) where value->>'id'=h->>'id') then
      if r.game_mode='coop' and exists(select 1 from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) q where p.code=p_code and p.seat<>chosen_seat and q->>'id'=h->>'id') then continue;end if;
      t:=(h->>'t')::integer;
      select value into target from jsonb_array_elements(r.plan) where value->>'id'=h->>'id' limit 1;
      if target is null or t is null or t<0 or t>50000 or t<(target->>'at')::integer or t>least(50000,(target->>'at')::integer+8000) or t>ms-r.start_ms+300 or t<last_t then raise exception 'INVALID_HIT';end if;
      me.hits:=me.hits||jsonb_build_array(jsonb_build_object('id',h->>'id','t',t));last_t:=t;
     end if;
    end loop;
    me.score:=public.angio_duel_score(r.plan,me.hits);
   end if;
  elsif p_action not in ('state','join') then raise exception 'INVALID_ACTION';end if;
  update public.angio_arena_players set ready=me.ready,left_room=me.left_room,seen_ms=me.seen_ms,hits=me.hits,score=me.score where code=p_code and seat=chosen_seat;
  select count(*) into active_count from public.angio_arena_players where code=p_code and not left_room;
  if r.game_mode='coop' then
   select coalesce(jsonb_agg(distinct q->>'id'),'[]') into shared_claimed from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) q where p.code=p_code;
   shared_count:=jsonb_array_length(shared_claimed);shared_goal:=ceil(jsonb_array_length(r.plan)*0.65)::integer;
   select count(*) into shared_missed from jsonb_array_elements(r.plan) q where (q->>'at')::bigint+8000<least(50000,greatest(0,ms-coalesce(r.start_ms,ms))) and not (shared_claimed ? (q->>'id'));
   select case when exists(select 1 from public.angio_arena_players where code=p_code and not left_room and mod(seat-1,3)=2) then 10 else 12 end into team_step;
   team_pulses:=shared_count/team_step;
   select team_pulses*(case when exists(select 1 from public.angio_arena_players where code=p_code and not left_room and mod(seat-1,3)=0) then 6 else 4 end)+coalesce(sum(case when mod(seat-1,3)=1 then jsonb_array_length(hits)/5*2 else 0 end),0) into team_heal from public.angio_arena_players where code=p_code and not left_room;
   with ordered_hits as (
    select p.seat,(hx.value->>'t')::integer as hit_ms,
     lag(p.seat) over(order by (hx.value->>'t')::integer,p.seat,hx.value->>'id') previous_seat,
     lag((hx.value->>'t')::integer) over(order by (hx.value->>'t')::integer,p.seat,hx.value->>'id') previous_hit_ms
    from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) hx where p.code=p_code
   ) select count(*) filter(where mod(oh.seat-1,3)=1 and mod(oh.previous_seat-1,3)=0 and oh.hit_ms-oh.previous_hit_ms between 0 and 2000) into shared_openings from ordered_hits oh;
   select max((hx.value->>'t')::integer) into opener_ms from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) hx where p.code=p_code and mod(p.seat-1,3)=0;
   team_heal:=team_heal+shared_openings*2;
   shared_integrity:=greatest(0,least(100,100-shared_missed*2+team_heal));
  end if;
  if r.status='waiting' then
   if active_count=0 then r.status:='cancelled';
   elsif not exists(select 1 from public.angio_arena_players where code=p_code and seat=r.host_seat and not left_room) then
    select min(seat) into r.host_seat from public.angio_arena_players where code=p_code and not left_room;
   end if;
  elsif r.status='playing' and (active_count<=1 or ms>=r.start_ms+53000 or (r.game_mode='coop' and shared_integrity=0)) then
   r.status:=case when active_count<=1 then 'forfeit' else 'finished' end;
   if r.game_mode='coop' then
    select coalesce(jsonb_agg(seat order by seat),'[]') into r.winners from public.angio_arena_players where code=p_code and not left_room and r.status='finished' and shared_count>=shared_goal and shared_integrity>0;
   else
   select max(score) into top_score from public.angio_arena_players where code=p_code and not left_room;
   select coalesce(jsonb_agg(seat order by seat),'[]') into r.winners from public.angio_arena_players where code=p_code and not left_room and score=top_score;
   end if;
  end if;
  r.revision:=r.revision+1;
  update public.angio_arena_rooms set status=r.status,start_ms=r.start_ms,host_seat=r.host_seat,winners=r.winners,revision=r.revision where code=p_code;
 end if;
 -- A single settlement for the complete room, with stable profile-lock order.
 if r.game_mode='versus' and r.status in ('finished','forfeit') and not r.league_settled then
  perform 1 from public.angio_player_profiles where profile_hash in(select profile_hash from public.angio_arena_players where code=p_code) order by profile_hash for update;
  for member in select * from public.angio_arena_players where code=p_code loop
   is_winner:=r.winners @> jsonb_build_array(member.seat);
   points:=case when is_winner and jsonb_array_length(r.winners)=1 then 30 when is_winner then 10 else 0 end;
   update public.angio_player_profiles set league_points=league_points+points,
    wins=wins+case when is_winner and jsonb_array_length(r.winners)=1 then 1 else 0 end,
    draws=draws+case when is_winner and jsonb_array_length(r.winners)>1 then 1 else 0 end,
    losses=losses+case when not is_winner then 1 else 0 end,updated_at=now() where profile_hash=member.profile_hash;
  end loop;
  update public.angio_arena_rooms set league_settled=true where code=p_code;
 end if;
  if r.game_mode='coop' then
   select coalesce(jsonb_agg(distinct q->>'id'),'[]') into shared_claimed from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) q where p.code=p_code;
   shared_count:=jsonb_array_length(shared_claimed);shared_goal:=ceil(jsonb_array_length(r.plan)*0.65)::integer;
   select count(*) into shared_missed from jsonb_array_elements(r.plan) q where (q->>'at')::bigint+8000<least(50000,greatest(0,ms-coalesce(r.start_ms,ms))) and not (shared_claimed ? (q->>'id'));
   select case when exists(select 1 from public.angio_arena_players where code=p_code and not left_room and mod(seat-1,3)=2) then 10 else 12 end into team_step;
   team_pulses:=shared_count/team_step;
   select team_pulses*(case when exists(select 1 from public.angio_arena_players where code=p_code and not left_room and mod(seat-1,3)=0) then 6 else 4 end)+coalesce(sum(case when mod(seat-1,3)=1 then jsonb_array_length(hits)/5*2 else 0 end),0) into team_heal from public.angio_arena_players where code=p_code and not left_room;
   with ordered_hits as (
    select p.seat,(hx.value->>'t')::integer as hit_ms,
     lag(p.seat) over(order by (hx.value->>'t')::integer,p.seat,hx.value->>'id') previous_seat,
     lag((hx.value->>'t')::integer) over(order by (hx.value->>'t')::integer,p.seat,hx.value->>'id') previous_hit_ms
    from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) hx where p.code=p_code
   ) select count(*) filter(where mod(oh.seat-1,3)=1 and mod(oh.previous_seat-1,3)=0 and oh.hit_ms-oh.previous_hit_ms between 0 and 2000) into shared_openings from ordered_hits oh;
   select max((hx.value->>'t')::integer) into opener_ms from public.angio_arena_players p cross join lateral jsonb_array_elements(p.hits) hx where p.code=p_code and mod(p.seat-1,3)=0;
   team_heal:=team_heal+shared_openings*2;
   shared_integrity:=greatest(0,least(100,100-shared_missed*2+team_heal));
  end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.seat),'[]') into public_players from (
  select p.seat,p.name,p.score,p.ready,p.left_room as "left",p.seen_ms as "seenMs",jsonb_array_length(p.hits) as cuts,
   case when r.status in ('finished','forfeit') then public.angio_duel_stats(r.plan,p.hits) else null end as stats,public.angio_profile_view(p.profile_hash) as profile
  from public.angio_arena_players p where p.code=p_code and (r.status<>'waiting' or not p.left_room)
 ) x;
 return jsonb_build_object('arenaVersion',2,'capacity',case when r.game_mode='coop' then 4 else 16 end,'roomMode',r.game_mode,'coop',case when r.game_mode='coop' then jsonb_build_object('cuts',shared_count,'goal',shared_goal,'total',jsonb_array_length(r.plan),'integrity',shared_integrity,'pulses',team_pulses,'pulseStep',team_step,'repair',team_heal,'openings',shared_openings,'openingUntil',coalesce(r.start_ms+opener_ms+2000,0),'claimed',shared_claimed,'success',r.status='finished' and shared_count>=shared_goal and shared_integrity>0) else null end,'hostSeat',r.host_seat,'code',r.code,'status',r.status,'seat',chosen_seat,'serverMs',ms,'startMs',r.start_ms,'duration',50,'seed',r.seed,'plan',r.plan,'winners',r.winners,'winner',case when jsonb_array_length(r.winners)=1 then (r.winners->>0)::integer when r.status in ('finished','forfeit') then 0 else null end,'revision',r.revision,'players',public_players,'career',public.angio_profile_view(me.profile_hash));
end $$;
revoke all on function public.angio_arena_action(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.angio_arena_action(text,text,text,jsonb) to service_role;
