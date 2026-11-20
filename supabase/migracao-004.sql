-- Mar de Lama — migração 004: conexões com serviços externos (Pinterest).
-- Rode uma vez no Supabase: SQL Editor > New query > cole este arquivo > Run.
-- Os tokens ficam cifrados pelo servidor (Vercel) na coluna `cifrado`; o app nunca vê o token em texto.
-- Nenhum dado existente é alterado.

create table if not exists public.integracoes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provedor text not null,
  cifrado text,
  conta jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  atualizado_em bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (user_id, provedor)
);
alter table public.integracoes enable row level security;
drop policy if exists "dono" on public.integracoes;
create policy "dono" on public.integracoes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.integracoes to authenticated;
