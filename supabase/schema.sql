-- Mar de Lama — esquema do banco na nuvem (Supabase / Postgres)
-- Execute no Supabase: SQL Editor > New query > cole este arquivo > Run.
--
-- O app funciona primeiro no aparelho (IndexedDB) e sincroniza com estas tabelas.
-- Cada tabela guarda colunas relacionais principais + o registro completo em `dados` (jsonb),
-- para que novos campos não exijam migração. Row Level Security garante que cada usuário
-- só enxergue os próprios dados.

create extension if not exists "pgcrypto";

do $$
declare t text;
begin
  foreach t in array array['familias','esmaltes','receitas','versoes','testes','materiais','referencias','grupos','paineis','conteudos','notas','arquivos','ajustes']
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

-- Colunas relacionais derivadas (consultas e integridade lógica no servidor)
alter table public.esmaltes  add column if not exists nome text generated always as (dados->>'nome') stored;
alter table public.esmaltes  add column if not exists codigo text generated always as (dados->>'codigo') stored;
alter table public.esmaltes  add column if not exists receita_id text generated always as (dados->>'receitaId') stored;
alter table public.receitas  add column if not exists nome text generated always as (dados->>'nome') stored;
alter table public.receitas  add column if not exists esmalte_id text generated always as (dados->>'esmalteId') stored;
alter table public.receitas  add column if not exists origem_id text generated always as (dados->>'origemId') stored;
alter table public.versoes   add column if not exists receita_id text generated always as (dados->>'receitaId') stored;
alter table public.testes    add column if not exists codigo text generated always as (dados->>'codigo') stored;
alter table public.testes    add column if not exists esmalte_id text generated always as (dados->>'esmalteId') stored;
alter table public.testes    add column if not exists receita_id text generated always as (dados->>'receitaId') stored;
alter table public.materiais add column if not exists nome text generated always as (dados->>'nome') stored;
alter table public.materiais add column if not exists categoria text generated always as (dados->>'categoria') stored;
alter table public.referencias add column if not exists titulo text generated always as (dados->>'titulo') stored;

-- Rede de conhecimento: relações livres entre quaisquer conteúdos
create table if not exists public.relacoes (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  a_tipo text not null, a_id text not null,
  b_tipo text not null, b_id text not null,
  criado_em bigint not null,
  atualizado_em bigint not null,
  excluido boolean not null default false
);
create index if not exists relacoes_a on public.relacoes (user_id, a_tipo, a_id);
create index if not exists relacoes_b on public.relacoes (user_id, b_tipo, b_id);
alter table public.relacoes enable row level security;
drop policy if exists "dono" on public.relacoes;
create policy "dono" on public.relacoes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fotografias e documentos: bucket privado, uma pasta por usuário
insert into storage.buckets (id, name, public) values ('arquivos', 'arquivos', false)
on conflict (id) do nothing;
drop policy if exists "arquivos do dono" on storage.objects;
create policy "arquivos do dono" on storage.objects for all
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'arquivos' and (storage.foldername(name))[1] = auth.uid()::text);
