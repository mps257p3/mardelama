-- Mar de Lama — migração 007 (Superfícies > Ideias de esmaltação)
-- Cria a tabela das ideias. Pode ser executada mais de uma vez sem problema.
-- Supabase: SQL Editor > New query > cole este arquivo > Run.

create table if not exists public.ideias (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em bigint not null default (extract(epoch from now()) * 1000)::bigint,
  atualizado_em bigint not null default (extract(epoch from now()) * 1000)::bigint,
  excluido boolean not null default false,
  dados jsonb not null default '{}'::jsonb
);
create index if not exists ideias_user_atualizado on public.ideias (user_id, atualizado_em);
alter table public.ideias enable row level security;
drop policy if exists "dono" on public.ideias;
create policy "dono" on public.ideias for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.ideias to authenticated;
