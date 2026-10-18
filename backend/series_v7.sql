-- Private, capability-authenticated series metadata. No browser role can read tokens or write rounds.
create table if not exists public.angio_arena_series(
 code text primary key references public.angio_arena_rooms(code) on delete cascade,
 format text not null check(format in ('tournament','rematch')),
 round_no integer not null default 1 check(round_no between 1 and 8),
 eliminated jsonb not null default '[]', departed jsonb not null default '[]',
 qualified jsonb not null default '[]',history jsonb not null default '[]',votes jsonb not null default '[]',complete boolean not null default false
);
alter table public.angio_arena_series enable row level security;
revoke all on public.angio_arena_series from public,anon,authenticated;
grant select,insert,update,delete on public.angio_arena_series to service_role;
create or replace function public.angio_series_action(p_action text,p_code text,p_hash text,p_payload jsonb default '{}') returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.angio_arena_series;r public.angio_arena_rooms;me public.angio_arena_players;
 result jsonb;delegate text;mine integer;participants integer;keep_count integer;keepers jsonb;round_rows jsonb;ranked jsonb;is_series boolean;ready_votes integer;needed_votes integer;
begin
 if coalesce(p_code,'') !~ '^[A-Z2-9]{6}$' or coalesce(p_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'UNAUTHORIZED';end if;
 if p_action='create' then
  result:=public.angio_arena_action('create',p_code,p_hash,p_payload);
  if p_payload->>'seriesFormat'='tournament' then
   insert into public.angio_arena_series(code,format) values(p_code,'tournament');
   update public.angio_arena_rooms set league_settled=true where code=p_code;
  end if;
 else
  select * into r from public.angio_arena_rooms where code=p_code for update;
  if r.code is null or r.expires_at<now() then raise exception 'ROOM_NOT_FOUND';end if;
  select * into s from public.angio_arena_series where code=p_code for update;
  if p_action='join' then
   if s.code is not null and s.round_no>1 then raise exception 'MATCH_ALREADY_STARTED';end if;
   result:=public.angio_arena_action('join',p_code,p_hash,p_payload);
  else
   select * into me from public.angio_arena_players where code=p_code and token_hash=p_hash;
   if me.code is null or (s.departed is not null and s.departed @> jsonb_build_array(me.seat)) then raise exception 'UNAUTHORIZED';end if;
   mine:=me.seat;delegate:=p_hash;
   if me.left_room then
    if s.code is null or not(s.eliminated @> jsonb_build_array(me.seat)) or p_action not in ('state','rematch','leave') then raise exception 'ELIMINATED';end if;
    select token_hash into delegate from public.angio_arena_players where code=p_code and seat=r.host_seat and not left_room;
    if delegate is null then raise exception 'ROOM_NOT_FOUND';end if;
   end if;
   if p_action='advance' then
    if mine<>r.host_seat then raise exception 'NOT_HOST';end if;
    if s.code is null or s.format<>'tournament' or s.complete or r.status not in ('finished','forfeit') then raise exception 'INVALID_ACTION';end if;
    keepers:=s.qualified;if jsonb_array_length(keepers)<2 then raise exception 'INVALID_ACTION';end if;
    if jsonb_typeof(p_payload->'plan') is distinct from 'array' or jsonb_array_length(p_payload->'plan')>160 then raise exception 'INVALID_PLAN';end if;
    select coalesce(jsonb_agg(seat),'[]') into s.eliminated from public.angio_arena_players where code=p_code and not(keepers @> jsonb_build_array(seat));
    update public.angio_arena_players set left_room=not(keepers @> jsonb_build_array(seat)),ready=false,hits='[]',score=0 where code=p_code;
    update public.angio_arena_rooms set status='waiting',start_ms=null,winners='[]',seed=(p_payload->>'seed')::integer,plan=p_payload->'plan',host_seat=(select min((value)::integer) from jsonb_array_elements_text(keepers)),revision=revision+1,league_settled=true where code=p_code;
    update public.angio_arena_series set eliminated=s.eliminated,round_no=round_no+1,qualified='[]',votes='[]' where code=p_code;
    select token_hash into delegate from public.angio_arena_players where code=p_code and not left_room order by seat limit 1;
    result:=public.angio_arena_action('state',p_code,delegate,'{}');
   elsif p_action='rematch' then
    if r.status not in ('finished','forfeit') then raise exception 'INVALID_ACTION';end if;
    if s.code is null then insert into public.angio_arena_series(code,format) values(p_code,'rematch') returning * into s;end if;
    if not(s.votes @> jsonb_build_array(mine)) then s.votes:=s.votes||jsonb_build_array(mine);end if;
    select count(*) into needed_votes from public.angio_arena_players where code=p_code and not(s.departed @> jsonb_build_array(seat));
    ready_votes:=jsonb_array_length(s.votes);
    update public.angio_arena_series set votes=s.votes where code=p_code;
    if ready_votes>=needed_votes and needed_votes>=2 then
     if jsonb_typeof(p_payload->'plan') is distinct from 'array' or jsonb_array_length(p_payload->'plan')>160 then raise exception 'INVALID_PLAN';end if;
     update public.angio_arena_players set left_room=(s.departed @> jsonb_build_array(seat)),ready=false,hits='[]',score=0 where code=p_code;
     update public.angio_arena_rooms set status='waiting',start_ms=null,winners='[]',seed=(p_payload->>'seed')::integer,plan=p_payload->'plan',host_seat=(select min(seat) from public.angio_arena_players where code=p_code and not left_room),revision=revision+1,league_settled=(s.format='tournament') where code=p_code;
     update public.angio_arena_series set round_no=1,eliminated='[]',qualified='[]',history='[]',complete=false,votes='[]' where code=p_code;
     select token_hash into delegate from public.angio_arena_players where code=p_code and not left_room order by seat limit 1;
    end if;
    result:=public.angio_arena_action('state',p_code,delegate,'{}');
   elsif p_action='leave' and me.left_room then
    update public.angio_arena_series set departed=departed||jsonb_build_array(mine) where code=p_code;
    result:=public.angio_arena_action('state',p_code,delegate,'{}');
   else
    result:=public.angio_arena_action(p_action,p_code,case when p_action='state' then delegate else p_hash end,p_payload);
    if p_action='leave' and s.code is not null then update public.angio_arena_series set departed=departed||jsonb_build_array(mine) where code=p_code;end if;
   end if;
   result:=result||jsonb_build_object('seat',mine,'career',public.angio_profile_view(me.profile_hash));
  end if;
 end if;
 select * into s from public.angio_arena_series where code=p_code;
 if s.code is null then return result;end if;
 select * into r from public.angio_arena_rooms where code=p_code;
 if s.format='tournament' and r.status in ('finished','forfeit') and not exists(select 1 from jsonb_array_elements(s.history) q where (q->>'round')::integer=s.round_no) then
  select count(*) into participants from public.angio_arena_players where code=p_code and not left_room;
  keep_count:=greatest(1,ceil(participants/2.0)::integer);
  select coalesce(jsonb_agg(seat order by score desc,cuts desc,seat),'[]') into keepers from(select seat,score,jsonb_array_length(hits) cuts from public.angio_arena_players where code=p_code and not left_room order by score desc,jsonb_array_length(hits) desc,seat limit keep_count) q;
  select coalesce(jsonb_agg(jsonb_build_object('seat',seat,'name',name,'score',score,'cuts',jsonb_array_length(hits)) order by score desc,jsonb_array_length(hits) desc,seat),'[]') into round_rows from public.angio_arena_players where code=p_code and not left_room;
  update public.angio_arena_series set qualified=keepers,complete=keep_count=1,history=history||jsonb_build_array(jsonb_build_object('round',round_no,'players',round_rows,'qualified',keepers)) where code=p_code returning * into s;
 end if;
 return result||jsonb_build_object('series',jsonb_build_object('format',s.format,'round',s.round_no,'eliminated',s.eliminated,'departed',s.departed,'qualified',s.qualified,'history',s.history,'complete',s.complete,'votes',s.votes,'tieRule','score_cuts_seat'),'ranked',s.format<>'tournament');
end $$;
revoke all on function public.angio_series_action(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.angio_series_action(text,text,text,jsonb) to service_role;
