-- Mar de Lama — migração 003: dá ao usuário logado acesso às tabelas (o RLS continua limitando cada um aos próprios dados).
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
