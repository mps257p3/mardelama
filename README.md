# Mar de Lama

App pessoal (PWA) do ateliê de cerâmica: laboratório de esmaltes, referências, biblioteca, caderno e calculadoras.

- React + TypeScript + Vite, instalável no celular e no computador, funciona sem internet.
- Dados no aparelho (IndexedDB/Dexie), sincronizados com o Supabase (Postgres, login por e-mail e armazenamento de arquivos).

## Rodar localmente

    npm install
    npm run dev

## Colocar no ar

1. **Supabase** — crie um projeto em supabase.com. Em *SQL Editor*, rode `supabase/schema.sql`.
   Em *Authentication > URL Configuration*, coloque o endereço do app publicado em *Site URL* e em *Redirect URLs* (`https://SEU-APP.vercel.app/ajustes`).
2. **Vercel** — importe o repositório do GitHub. Framework: Vite. Em *Environment Variables*, defina
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Supabase > Settings > API). Opcional: também dá para informar esses dois valores em Ajustes, dentro do app.
3. Abra o app, vá em **Ajustes > Sincronização**, informe seu e-mail e clique no link recebido.
4. No celular, abra o endereço e use "Adicionar à tela de início" para instalar.

## Estrutura

- `src/db` — banco local, backup, sincronização, códigos sequenciais.
- `src/lib` — cálculos de receita, cones, paleta, IA (contrato de provedor e regras).
- `src/pages` — telas por área (`lab`, `ref`, `bib`, `cad`, `calc`).
- `supabase/schema.sql` — tabelas, RLS e bucket de arquivos.
