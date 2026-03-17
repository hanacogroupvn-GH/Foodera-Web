# Foodmax Global Agri Export

Premium B2B export website for Foodmax, focused on Vietnamese rice, coffee, and cashew portfolios.

## Local development

Prerequisites:
- Node.js 18+

Run locally:
```bash
npm install
npm run dev
```

## Environment variables

Create `.env.local` from `.env.example`.

Required for persistent CMS/admin data:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:
- `VITE_SUPABASE_PDF_BUCKET=product-pdfs`
- `VITE_SUPABASE_IMAGE_BUCKET=cms-images`
- `VITE_GEMINI_API_KEY=...` to enable the AI assistant's live market lookup mode
- `VITE_OLLAMA_BASE_URL=http://127.0.0.1:11434` and `VITE_OLLAMA_MODEL=qwen2.5:7b` for local browser-side CMS translation fallback
- `OLLAMA_BASE_URL=http://127.0.0.1:11434` and `OLLAMA_MODEL=qwen2.5:7b` for the local Vite dev-server translation proxy
- `SUPABASE_SERVICE_ROLE_KEY=...` for server-side maintenance scripts
- `AI_PROVIDER=auto|gemini|ollama|openai` for translation backfill
- `AI_MODEL=...` generic model override for backfill
- `GEMINI_MODEL=...` Gemini-only model override
- `OLLAMA_MODEL=...` Ollama-only model override
- `OPENAI_MODEL=gpt-5-mini` OpenAI GPT model override
- `GEMINI_API_KEY=...` for Gemini backfill
- `OLLAMA_BASE_URL=http://127.0.0.1:11434` for local Ollama or `https://ollama.com` for Ollama cloud
- `OLLAMA_API_KEY=...` for Ollama cloud
- `OPENAI_BASE_URL=https://api.openai.com/v1` and `OPENAI_API_KEY=...` for OpenAI Responses API
- `scripts/backfill.env.example` contains a minimal server-side example for the translation runner

## Supabase setup

1. Create a Supabase project.
2. Run these SQL files in order:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
3. Create an admin user in Supabase Authentication.
4. Insert that user's UID into `public.admin_users`:

```sql
insert into public.admin_users (user_id) values ('PASTE-UID-HERE');
```

## Storage and migrations

For existing projects, also run:
- `supabase/migrations/20260302_add_products_pdf_url.sql`
- `supabase/migrations/20260302_enable_product_pdf_storage.sql`
- `supabase/migrations/20260304_add_news_slug_seo.sql`
- `supabase/migrations/20260312_enable_cms_image_storage.sql`
- `supabase/migrations/20260316_add_content_translations.sql`
- `supabase/migrations/20260316_reclassify_cashew_category.sql`
- `supabase/migrations/20260317_add_content_is_active.sql`

## Shared CMS translation with Ollama

If multiple admins will use the CMS from different IP addresses or devices, do not point the browser at `127.0.0.1`.

Use the included Supabase Edge Function instead:

1. Run Ollama on a shared server or expose it behind a secure HTTPS endpoint.
2. Set Supabase function secrets:

```bash
npx supabase secrets set OLLAMA_BASE_URL=https://your-ollama-endpoint.example.com
npx supabase secrets set OLLAMA_MODEL=qwen2.5:7b
npx supabase secrets set OLLAMA_API_KEY=YOUR_OPTIONAL_OLLAMA_KEY
```

3. Deploy the function:

```bash
npx supabase functions deploy cms-translate-zh
```

Behavior:
- Admin CMS translation buttons call `supabase/functions/cms-translate-zh`
- The function verifies the caller is in `public.admin_users`
- Ollama credentials stay server-side instead of shipping in `VITE_*`

For local-only development:
- `npm run dev` can fall back to a local Vite proxy that uses `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_API_KEY`
- if that proxy is unavailable, the frontend can still fall back to `VITE_OLLAMA_BASE_URL`

## CMS features

Admin CMS supports:
- Product CRUD
- News/insight CRUD
- PDF links for products
- Image upload to Supabase Storage
- CSV import from a Google Sheet link
- CSV file upload for products and news

### Product CSV fields

Supported columns include:
- `id`
- `name`
- `category`
- `subCategory`
- `shortDescription`
- `description`
- `image`
- `pdfUrl`
- `gallery`
- `specifications` or `spec_*`
- `filters` or `filter_*`

### News CSV fields

Supported columns include:
- `id`
- `title`
- `slug`
- `category`
- `date`
- `excerpt`
- `content` or `content_1`, `content_2`, ...
- `image`

## Build

```bash
npm run build
```

## Chinese translation backfill

To backfill `translations.zh` for existing `products` and `news` automatically, use the server-side script below.

Preview what still needs translation:

```bash
npm run backfill:zh:dry
```

Generate a SQL patch for review:

```bash
npm run backfill:zh:sql
```

Write translations directly to Supabase:

```bash
npm run backfill:zh:supabase
```

Useful options:

```bash
node scripts/backfill-zh-translations-cli.mjs --provider auto --table products --limit 5 --dry-run
node scripts/backfill-zh-translations-cli.mjs --provider ollama --model your-model --base-url https://ollama.com --write sql
node scripts/backfill-zh-translations-cli.mjs --provider openai --model gpt-5-mini --write supabase
node scripts/backfill-zh-translations-cli.mjs --provider auto --cache-file supabase/generated/zh-cache.json --write sql
```

## Optimized provider strategy

The backfill runner is optimized to avoid unnecessary paid API calls.

- `AI_PROVIDER=auto` is the recommended default.
- In `auto` mode, the script tries providers in this order: `ollama -> openai -> gemini`.
- If Ollama is running locally, it is preferred automatically.
- A persistent cache is stored at `supabase/generated/backfill_zh_cache.json` by default, so repeated runs do not re-translate identical prompts.
- If one provider fails, the script can fall through to the next available provider in the plan.

## Free local option with Ollama

If you do not want to pay for Gemini quota, use Ollama locally.

1. Install Ollama on your machine.
2. Pull an instruction model you trust for bilingual generation.
3. Set these values in `.env.local`:

```env
AI_PROVIDER=auto
OLLAMA_MODEL=your-local-model
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

4. Run:

```bash
npm run backfill:zh:dry
npm run backfill:zh:sql
```

Notes:
- The script only fills missing `translations.zh` fields by default, so manual Chinese edits are preserved.
- `--overwrite` forces the model to regenerate zh content even when a row already has Chinese data.
- `--write supabase` should use `SUPABASE_SERVICE_ROLE_KEY`; relying on the anon key may fail because of RLS.
- `--write sql` writes a generated patch file without touching the database.
- Local models are free to run after setup, but translation quality depends on the model you choose and your machine resources.



