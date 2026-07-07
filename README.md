# Verum Project Canvas v2

Sistema de gestão de projetos do ecossistema Verum — substitui o quadro físico de planejamento.
Dark/Light premium (dourado/navy), dashboard executivo, checkboxes exclusivos
(Em andamento ⇄ Concluído), drag & drop, histórico de auditoria append-only,
etiquetas, checklist, anexos por link, exportação CSV e persistência local.

## Uso normal (automático)

O servidor inicia sozinho com o Windows (script em
`shell:startup\verum-canvas.vbs`) e serve site + API + banco em uma porta só:

**http://localhost:3001** — é só abrir no navegador.

Para desativar o início automático, apague o arquivo `verum-canvas.vbs`
da pasta de Inicialização (Win+R → `shell:startup`).

## Desenvolvimento (Cursor / local)

Primeira vez — instalar dependências e criar o banco:

```bash
npm install
cd server && npm install && npx prisma db push && cd ..
```

Rodar em modo dev (dois terminais, com hot-reload):

```bash
npm run api   # terminal 1 — API + banco (porta 3001)
npm run dev   # terminal 2 — frontend (porta 5173)
```

Abra http://localhost:5173

Depois de mudar o código, rode `npm run build` para atualizar a versão
servida em http://localhost:3001 (ou `npm start`, que compila e sobe tudo).

## Build de produção

```bash
npm run build
npm run preview
```

## Persistência

Os projetos/tarefas são salvos no **Supabase** (Postgres na nuvem): todos que
acessam o site veem os mesmos projetos, de qualquer lugar. Preferências
pessoais (tema, usuário) ficam no `localStorage` de cada navegador. Se o
Supabase não estiver configurado ou fora do ar, `src/storage.js` cai para
`localStorage` automaticamente (fallback), sem quebrar o app.

Configuração:

1. Crie um projeto em https://supabase.com
2. Rode `supabase-setup.sql` no SQL Editor do projeto (cria a tabela `entries`)
3. Preencha `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Settings → API do projeto)
4. `npm run build`

O servidor local (`server/`, Express + Prisma + SQLite) segue existindo apenas
para servir o site em http://localhost:3001 e como referência da versão
anterior da persistência.

## Atalhos

- `N` — novo projeto (na tela Projetos) ou nova tarefa (dentro de um projeto)
- `/` — focar a busca
- `D` — dashboard
- `Esc` — fechar modais

## Estrutura

- `src/App.jsx` — aplicação completa (estado, views, modais)
- `src/storage.js` — camada de persistência (ponto de troca p/ API)
- `public/manifest.webmanifest` — base do PWA (adicionar ícones + service worker)

## Roadmap sugerido p/ produção

1. Backend Spring Boot 3 (REST + JWT + refresh token) + PostgreSQL + Redis
2. WebSocket (STOMP) para atualização em tempo real multiusuário
3. Perfis de permissão (Admin, Gerente, Programador, Marketing, Financeiro, Visualizador)
4. Upload real de anexos (S3/MinIO)
5. vite-plugin-pwa para offline sync
