-- Mar de Lama — migração 006 (sincronização rápida)
-- Uma única consulta devolve o último horário de alteração de cada tabela do usuário,
-- para o app pular as tabelas em que nada mudou. Pode ser executada mais de uma vez.
-- Supabase: SQL Editor > New query > cole este arquivo > Run.

create or replace function public.ultimas_alteracoes()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  t text;
  v bigint;
  r jsonb := '{}'::jsonb;
begin
  for t in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'atualizado_em'
      and exists (select 1 from information_schema.columns u
                  where u.table_schema = 'public' and u.table_name = c.table_name and u.column_name = 'user_id')
  loop
    execute format('select max(atualizado_em) from public.%I where user_id = auth.uid()', t) into v;
    r := r || jsonb_build_object(t, coalesce(v, 0));
  end loop;
  return r;
end;
$$;

grant execute on function public.ultimas_alteracoes() to authenticated;
