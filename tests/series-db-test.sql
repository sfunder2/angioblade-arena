begin;
do $$
declare qa_room_code text:=translate(upper(substr(md5(random()::text),1,6)),'01','AB'); qa_coop_code text:=translate(upper(substr(md5(random()::text),1,6)),'01','AB');
 h text;profile text;hashes text[]:='{}';profiles text[]:='{}';d jsonb;p jsonb:='[{"id":"1","at":1200,"type":"cyan","x":0.5,"y":0.5,"angle":0,"speed":3}]';i integer;round integer;expected integer;
begin
 for i in 1..17 loop
  h:=md5('series-QA-player-'||i)||md5('series-QA-token-'||i);profile:=md5('series-QA-profile-'||i)||md5('series-QA-profile2-'||i);hashes:=hashes||h;profiles:=profiles||profile;
  perform public.angio_profile_action(profile,jsonb_build_object('name','QA '||i));
  if i=1 then d:=public.angio_series_action('create',qa_room_code,h,jsonb_build_object('name','QA 1','profile',profile,'seed',17,'plan',p,'seriesFormat','tournament'));
  elsif i<=16 then d:=public.angio_series_action('join',qa_room_code,h,jsonb_build_object('name','QA '||i,'profile',profile));end if;
 end loop;
 if d#>>'{series,format}'<>'tournament' then raise exception 'missing tournament';end if;
 begin perform public.angio_series_action('join',qa_room_code,hashes[17],jsonb_build_object('name','QA17','profile',profiles[17]));raise exception '17th joined';exception when others then if sqlerrm<>'ROOM_FULL' then raise;end if;end;
 begin perform public.angio_series_action('state',qa_room_code,repeat('f',64),'{}');raise exception 'bad token accepted';exception when others then if sqlerrm<>'UNAUTHORIZED' then raise;end if;end;
 for round in 1..4 loop
  for i in 1..16 loop
   if not exists(select 1 from public.angio_arena_players where angio_arena_players.code=qa_room_code and seat=i and left_room) then perform public.angio_series_action('ready',qa_room_code,hashes[i],'{}');end if;
  end loop;
  perform public.angio_series_action('start',qa_room_code,hashes[1],'{}');
  update public.angio_arena_rooms r set start_ms=(extract(epoch from clock_timestamp())*1000)::bigint-54000 where r.code=qa_room_code;
  update public.angio_arena_players t set hits='[{"id":"1","t":1300}]',score=1000-t.seat where t.code=qa_room_code and not left_room;
  d:=public.angio_series_action('state',qa_room_code,hashes[1],'{}');
  expected:=16/(2^round)::integer;
  if jsonb_array_length(d#>'{series,qualified}')<>expected then raise exception 'wrong qualification round %: %',round,d;end if;
  if round<4 then
   d:=public.angio_series_action('advance',qa_room_code,hashes[1],jsonb_build_object('seed',round+17,'plan',p));
   if (d#>>'{series,round}')::integer<>round+1 then raise exception 'round not advanced';end if;
   d:=public.angio_series_action('state',qa_room_code,hashes[16],'{}');if (d->>'seat')::integer<>16 then raise exception 'spectator seat leaked';end if;
   begin perform public.angio_series_action('ready',qa_room_code,hashes[16],'{}');raise exception 'eliminated ready accepted';exception when others then if sqlerrm<>'ELIMINATED' then raise;end if;end;
  end if;
 end loop;
 if d#>>'{series,complete}'<>'true' then raise exception 'tournament did not finish';end if;
 if jsonb_array_length(d#>'{series,history}')<>4 then raise exception 'missing bracket history';end if;
 if position('token_hash' in d::text)>0 then raise exception 'token exposed';end if;
 for i in 1..16 loop
  d:=public.angio_series_action('rematch',qa_room_code,hashes[i],jsonb_build_object('seed',99,'plan',p));
  if i<16 and d->>'status'='waiting' then raise exception 'rematch reset before all votes';end if;
 end loop;
 if d->>'status'<>'waiting' or d#>>'{series,round}'<>'1' then raise exception 'rematch failed';end if;
 if (select count(*) from public.angio_arena_players t where t.code=qa_room_code and not left_room)<>16 then raise exception 'rematch did not restore 16';end if;
 if (select league_points from public.angio_player_profiles where profile_hash=profiles[1])<>0 then raise exception 'private event awarded league points';end if;
 -- Team opening: a guardian cut followed by a cutter within 2 seconds is counted once.
 perform public.angio_series_action('create',qa_coop_code,hashes[1],jsonb_build_object('name','QA1','profile',profiles[1],'seed',1,'plan',p,'roomMode','coop'));
 perform public.angio_series_action('join',qa_coop_code,hashes[2],jsonb_build_object('name','QA2','profile',profiles[2]));
 update public.angio_arena_players t set hits=case seat when 1 then '[{"id":"1","t":1300}]'::jsonb else '[{"id":"2","t":1600}]'::jsonb end where t.code=qa_coop_code;
 d:=public.angio_series_action('state',qa_coop_code,hashes[1],'{}');
 if (d#>>'{coop,openings}')::integer<>1 then raise exception 'team opening missing';end if;
 if (d#>>'{coop,repair}')::integer<2 then raise exception 'team opening reward missing';end if;
 if has_function_privilege('anon','public.angio_series_action(text,text,text,jsonb)','execute') then raise exception 'anon RPC exposed';end if;
end $$;
rollback;
