create table public.angio_solo_records (
 profile_hash text not null references public.angio_player_profiles(profile_hash),
 mode text not null check(mode in ('comparison','challenge')),
 score integer not null check(score between 1 and 1000000),
 recorded_at timestamptz not null default now(),
 primary key(profile_hash,mode)
);
alter table public.angio_solo_records enable row level security;
revoke all on public.angio_solo_records from public,anon,authenticated;
grant select,insert,update on public.angio_solo_records to service_role;
create index angio_solo_ranking on public.angio_solo_records(mode,score desc,recorded_at);
create function public.angio_record_score(p_hash text,p_mode text,p_score integer) returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_hash !~ '^[a-f0-9]{64}$' or p_mode not in ('comparison','challenge') or p_score not between 1 and 1000000 then raise exception 'INVALID_SCORE';end if;
 if not exists(select 1 from public.angio_player_profiles where profile_hash=p_hash) then raise exception 'INVALID_PROFILE';end if;
 insert into public.angio_solo_records(profile_hash,mode,score) values(p_hash,p_mode,p_score)
 on conflict(profile_hash,mode) do update set score=excluded.score,recorded_at=now() where excluded.score>angio_solo_records.score;
 return true;
end $$;
create function public.angio_leaderboard(p_mode text) returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if p_mode='duel' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select row_number() over(order by league_points desc,wins desc,updated_at,profile_hash) as rank,display_name as name,league_points as score,wins,badge from public.angio_player_profiles where wins+draws+losses>0 order by league_points desc,wins desc,updated_at,profile_hash limit 100) x;
 elsif p_mode in ('comparison','challenge') then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]') into result from (select row_number() over(order by r.score desc,r.recorded_at,r.profile_hash) as rank,p.display_name as name,r.score,p.badge from public.angio_solo_records r join public.angio_player_profiles p using(profile_hash) where r.mode=p_mode order by r.score desc,r.recorded_at,r.profile_hash limit 100) x;
 else raise exception 'INVALID_MODE';end if;
 return result;
end $$;
revoke all on function public.angio_record_score(text,text,integer),public.angio_leaderboard(text) from public,anon,authenticated;
grant execute on function public.angio_record_score(text,text,integer),public.angio_leaderboard(text) to service_role;
