begin;
do $$
declare r jsonb;i integer;plan jsonb;hits jsonb;
begin
 select jsonb_agg(jsonb_build_object('id',g.n::text,'at',0,'type','cyan')) into plan from generate_series(1,25) g(n);
 for i in 1..3 loop perform public.angio_profile_action(lpad(i::text,64,'d'),jsonb_build_object('name','RPG QA '||i));end loop;
 perform public.angio_arena_action('create','RP2345',lpad('1',64,'e'),jsonb_build_object('profile',lpad('1',64,'d'),'seed',42,'plan',plan,'roomMode','coop'));
 for i in 2..3 loop perform public.angio_arena_action('join','RP2345',lpad(i::text,64,'e'),jsonb_build_object('profile',lpad(i::text,64,'d')));end loop;
 for i in 1..3 loop perform public.angio_arena_action('ready','RP2345',lpad(i::text,64,'e'));end loop;
 perform public.angio_arena_action('start','RP2345',lpad('1',64,'e'));
 update public.angio_arena_rooms set start_ms=(extract(epoch from clock_timestamp())*1000)::bigint-4000 where code='RP2345';
 select jsonb_agg(jsonb_build_object('id',g.n::text,'t',2000+g.n)) into hits from generate_series(1,10) g(n);
 r:=public.angio_arena_action('update','RP2345',lpad('2',64,'e'),jsonb_build_object('hits',hits));
 if (r->'coop'->>'pulses')::int<>1 or (r->'coop'->>'pulseStep')::int<>10 or (r->'coop'->>'repair')::int<>10 then raise exception 'team roles and pulse failed %',r->'coop';end if;
 r:=public.angio_arena_action('update','RP2345',lpad('3',64,'e'),jsonb_build_object('hits',hits));
 if (r->'coop'->>'cuts')::int<>10 or (r->'coop'->>'pulses')::int<>1 then raise exception 'duplicates powered extra pulse';end if;
 update public.angio_arena_rooms set start_ms=(extract(epoch from clock_timestamp())*1000)::bigint-54000 where code='RP2345';
 r:=public.angio_arena_action('state','RP2345',lpad('1',64,'e'));
 if (r->'coop'->>'integrity')::int<>80 then raise exception 'shared repair integrity failed %',r->'coop';end if;
 if has_function_privilege('anon','public.angio_arena_action(text,text,text,jsonb)','execute') then raise exception 'anon execute exposed';end if;
 raise notice 'PASS shared RPG roles, validated energy pulse, cutter/guardian repair, duplicate safety, final integrity and permissions';
end $$;
rollback;
