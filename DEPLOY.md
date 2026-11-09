# Publicação no Render

1. Crie um repositório privado ou público para este código.
2. No Render, crie um Blueprint usando `render.yaml`.
3. Configure `APP_PASSWORD`, `DATABASE_URL` e `GITHUB_DATA_TOKEN` como segredos, mais a chave de IA: `OPENAI_API_KEY` e/ou `ANTHROPIC_API_KEY`. Escolha o provedor em `IA_PROVEDOR` (`openai` ou `anthropic`).
4. Crie um repositório privado separado para os dados e ajuste `GITHUB_DATA_REPO`.
5. Aguarde o deploy ficar `Live` e acesse `/api/health`.

O banco PostgreSQL/Neon é a fonte primária. O arquivo `dados/turmas.json` no GitHub funciona como cópia de segurança versionada.
