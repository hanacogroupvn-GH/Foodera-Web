# Foodmax Global Agri Export

Foodmax website and CMS for Vietnamese rice, coffee, cashew, and interactive province content.

## Stack

- Frontend: React + Vite
- Backend: Express
- Database: Turso in production, SQLite file for local development when needed
- AI routes: Gemini or Ollama
- Deploy target: Netlify Functions for `/api/*`

## Local development

Prerequisites:
- Node.js 18+

Install and run:

```bash
npm install
npm run dev
```

Explicit database mode during local development:

```bash
npm run dev:local
npm run dev:turso
```

Recommended split:
- Keep shared or official-style defaults in `.env`
- Put machine-only overrides in `.env.local`
- `.env.local` overrides `.env` locally, while shell/hosting environment variables still win

Refresh the local seed snapshot after catalog/news changes:

```bash
npm run generate:local-seed
```

Client runs on `http://localhost:3000`.
Server runs on `http://localhost:8787` by default.

## Environment variables

Copy `.env.example` to `.env`. If you want local-only overrides, copy `.env.local.example` to `.env.local`.

Required in all environments:
- `SESSION_SECRET`

Database:
- `DATABASE_MODE=auto|turso|local`
- `LOCAL_DATABASE_PATH` optional for local SQLite mode
- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` required for production/serverless
- Local SQLite databases auto-seed on first boot from `generated/local-seed-content.json`

Admin bootstrap:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_BOOTSTRAP_PASSWORD`

Optional AI configuration:
- `AI_PROVIDER=auto|gemini|ollama|openai`
- `VITE_GEMINI_API_KEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_API_KEY`
- `VITE_OLLAMA_BASE_URL`
- `VITE_OLLAMA_MODEL`
- `VITE_OLLAMA_API_KEY`

## CMS capabilities

- Product CRUD
- News CRUD
- Province map profile CRUD
- CSV import for products and news
- Image upload in local Node runtime

On Netlify Functions, local disk uploads are not durable. If CMS image upload is needed in production, move uploads to external object storage.

## Build

```bash
npm run build
```

## Netlify

The repository includes `netlify.toml` and a function wrapper that serves the Express app through Netlify Functions.

Required Netlify environment variables:
- `DATABASE_MODE=turso`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_BOOTSTRAP_PASSWORD`

Optional:
- `VITE_GEMINI_API_KEY`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_API_KEY`
- `AI_PROVIDER`

## Notes

- Production content data should be stored in Turso.
- Local Node development can run against `LOCAL_DATABASE_PATH` when `DATABASE_MODE=local` or when Turso credentials are absent and `DATABASE_MODE=auto`.
- Local SQLite mode now auto-imports the default product/news dataset on a fresh database.
- Product images migrated from the legacy object storage now live under `public/media/migrated`.
- Legacy migration scripts and deployment artifacts have been removed from this project.
