# Foodmax Global Agri Export

Foodmax website and CMS for Vietnamese rice, coffee, cashew, and interactive province content.

## Stack

- Frontend: React + Vite
- Backend: Express
- Database: Turso
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

Client runs on `http://localhost:3000`.
Server runs on `http://localhost:8787` by default.

## Environment variables

Copy `.env.example` to `.env` or `.env.local`.

Required:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SESSION_SECRET`

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

- Content data is stored in Turso.
- Product images migrated from the legacy object storage now live under `public/media/migrated`.
- Legacy migration scripts and deployment artifacts have been removed from this project.
