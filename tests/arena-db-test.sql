begin;
do $$
declare i integer; result jsonb; token text; profile text; plan jsonb:='[{"id":"1","at":0,"type":"cyan"},{"id":"2","at":0,"type":"plum"}]';lp integer;
begin
 for i in 1..17 loop
  profile:=lpad(i::text,64,'a');perform public.angio_profile_action(profile,jsonb_build_object('name','QA Arena '||i));
 end loop;
 result:=public.angio_arena_action('create','QA2345',lpad('1',64,'b'),jsonb_build_object('profile',lpad('1',64,'a'),'name','QA1','seed',42,'plan',plan));
 begin perform public.angio_arena_action('start','QA2345',lpad('1',64,'b'));raise exception 'test missed minimum';exception when others then if SQLERRM<>'NOT_ENOUGH_PLAYERS' then raise;end if;end;
 for i in 2..16 loop
  result:=public.angio_arena_action('join','QA2345',lpad(i::text,64,'b'),jsonb_build_object('profile',lpad(i::text,64,'a'),'name','QA'||i));
 end loop;
 if jsonb_array_length(result->'players')<>16 then raise exception 'test capacity';end if;
 if result::text like '%token_hash%' or result::text like '%profile_hash%' then raise exception 'test leaked hashes';end if;
 begin perform public.angio_arena_action('join','QA2345',lpad('17',64,'b'),jsonb_build_object('profile',lpad('17',64,'a')));raise exception 'test missed full';exception when others then if SQLERRM<>'ROOM_FULL' then raise;end if;end;
 begin perform public.angio_arena_action('state','QA2345',repeat('f',64));raise exception 'test missed auth';exception when others then if SQLERRM<>'UNAUTHORIZED' then raise;end if;end;
 begin perform public.angio_arena_action('start','QA2345',lpad('2',64,'b'));raise exception 'test missed host';exception when others then if SQLERRM<>'NOT_HOST' then raise;end if;end;
 begin perform public.angio_arena_action('start','QA2345',lpad('1',64,'b'));raise exception 'test missed ready';exception when others then if SQLERRM<>'PLAYERS_NOT_READY' then raise;end if;end;
 for i in 1..16 loop perform public.angio_arena_action('ready','QA2345',lpad(i::text,64,'b'));end loop;
 result:=public.angio_arena_action('start','QA2345',lpad('1',64,'b'));
 if result->>'status'<>'playing' then raise exception 'test start';end if;
 begin perform public.angio_arena_action('join','QA2345',lpad('17',64,'b'),jsonb_build_object('profile',lpad('17',64,'a')));raise exception 'test missed late';exception when others then if SQLERRM<>'MATCH_ALREADY_STARTED' then raise;end if;end;
 update public.angio_arena_rooms set start_ms=(extract(epoch from clock_timestamp())*1000)::bigint-200 where code='QA2345';
 result:=public.angio_arena_action('update','QA2345',lpad('16',64,'b'),'{"hits":[{"id":"1","t":100}]}');
 if (result->'players'->15->>'score')::integer<>100 then raise exception 'test hit';end if;
 result:=public.angio_arena_action('update','QA2345',lpad('16',64,'b'),'{"hits":[{"id":"1","t":100}]}');
 if (result->'players'->15->>'score')::integer<>100 then raise exception 'test duplicate';end if;
 result:=public.angio_arena_action('leave','QA2345',lpad('2',64,'b'));
 if result->>'status'<>'playing' then raise exception 'test leave ended full room';end if;
 update public.angio_arena_rooms set start_ms=(extract(epoch from clock_timestamp())*1000)::bigint-54000 where code='QA2345';
 result:=public.angio_arena_action('state','QA2345',lpad('1',64,'b'));
 if result->>'status'<>'finished' or result->'winners'<>'[16]'::jsonb then raise exception 'test winner %',result;end if;
 select league_points into lp from public.angio_player_profiles where profile_hash=lpad('16',64,'a');
 perform public.angio_arena_action('state','QA2345',lpad('16',64,'b'));
 if (select league_points from public.angio_player_profiles where profile_hash=lpad('16',64,'a'))<>lp then raise exception 'test duplicate reward';end if;
 -- Waiting host departure transfers ownership, vacated seats can be reused.
 perform public.angio_arena_action('create','QB2345',lpad('1',64,'c'),jsonb_build_object('profile',lpad('1',64,'a'),'seed',42,'plan',plan));
 perform public.angio_arena_action('join','QB2345',lpad('2',64,'c'),jsonb_build_object('profile',lpad('2',64,'a')));
 result:=public.angio_arena_action('leave','QB2345',lpad('1',64,'c'));
 if (result->>'hostSeat')::integer<>2 then raise exception 'test host transfer';end if;
 result:=public.angio_arena_action('join','QB2345',lpad('3',64,'c'),jsonb_build_object('profile',lpad('3',64,'a')));
 if (result->>'seat')::integer<>1 then raise exception 'test seat reuse';end if;
 begin perform public.angio_arena_action('state','QB2345',lpad('1',64,'c'));raise exception 'test stale token';exception when others then if SQLERRM<>'UNAUTHORIZED' then raise;end if;end;
end $$;
select 'PASS: 16 seats, 17th rejection, auth, host start, readiness, score validation, duplicates, leave, settlement, host transfer, seat reuse' as result;
rollback;
