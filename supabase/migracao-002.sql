-- Mar de Lama — migração 002 (Versão 2.0 e base de conhecimento do laboratório)
-- Cria as novas tabelas. Pode ser executada mais de uma vez sem problema.
-- Supabase: SQL Editor > New query > cole este arquivo > Run.

do $$
declare t text;
begin
  foreach t in array array['curvas','queimas','comerciais','lotes','fornecedores','compras','projetos','entrada','paletas']
  loop
    execute format($f$
      create table if not exists public.%1$I (
        id text primary key,
        user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
        criado_em bigint not null default (extract(epoch from now()) * 1000)::bigint,
        atualizado_em bigint not null default (extract(epoch from now()) * 1000)::bigint,
        excluido boolean not null default false,
        dados jsonb not null default '{}'::jsonb
      );
      create index if not exists %1$s_user_atualizado on public.%1$I (user_id, atualizado_em);
      alter table public.%1$I enable row level security;
      drop policy if exists "dono" on public.%1$I;
      create policy "dono" on public.%1$I for all using (user_id = auth.uid()) with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;
