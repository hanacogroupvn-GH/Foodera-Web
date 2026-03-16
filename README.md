<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16jwJKOeWWbZvyRh2jpULdz06lctc0K5R

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Supabase setup (Admin + persistent data)

1. Create a Supabase project.
2. In Supabase Dashboard → **SQL Editor** run these files (in order):
   - `supabase/schema.sql`
   - `supabase/policies.sql`
3. Create an admin user:
   - Supabase → Authentication → Users → Add user (email/password)
   - Copy the user UID and run:

```sql
insert into public.admin_users (user_id) values ('PASTE-UID-HERE');
```

4. Configure env vars:
   - Copy `.env.example` → `.env.local`
   - Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. Install & run:

```bash
npm install
npm run dev
```

> Deploy (Netlify): add the same env vars in Netlify Site settings.

### Product PDF Upload Notes

- Existing projects should run:
  - `supabase/migrations/20260302_add_products_pdf_url.sql`
  - `supabase/migrations/20260302_enable_product_pdf_storage.sql`
  - `supabase/migrations/20260304_add_news_slug_seo.sql`
  - `supabase/migrations/20260312_enable_cms_image_storage.sql`
  - `supabase/migrations/20260316_reclassify_cashew_category.sql`
- Optional env var:
  - `VITE_SUPABASE_PDF_BUCKET=product-pdfs` (defaults to `product-pdfs` if omitted)
  - `VITE_SUPABASE_IMAGE_BUCKET=cms-images` (defaults to `cms-images` if omitted)

### CMS Image Upload Notes

- In `Admin > Inventory` and `Admin > Insights`, you can now upload a local image file for the primary cover image.
- Uploaded images are stored in the public Supabase Storage bucket `cms-images`.
- Supported formats: JPG, PNG, WEBP, GIF, AVIF, SVG, HEIC, HEIF.
- Maximum file size: 10MB.

### News SEO URL Notes

- News articles now use canonical URLs in the form:
  - `/news/:slug`
- Existing `/news/:id` and `/news/:id/:slug` links are still supported and auto-redirect to canonical URLs.
- The `public.news.slug` column is auto-populated and kept unique via trigger functions.
- In Admin CMS, you can type a custom slug per article. Leave it empty to auto-generate from title.

### CSV Import from Google Sheets (CMS)

- In `Admin > Inventory` and `Admin > Insights`, you can now:
  - paste a Google Sheet link and click `Import Link`
  - or upload a local `.csv` file
- Google Sheet links like `.../edit#gid=0` are converted automatically to CSV export URLs.
- Product CSV supports columns such as:
  - `id`, `name`, `category`, `subCategory`, `shortDescription`, `description`, `image`, `pdfUrl`, `gallery`
  - `specifications` (JSON or `key:value;key2:value2`) or prefixed columns `spec_*`
  - `filters` (JSON or `key:value`) or prefixed columns `filter_*`
- Insight CSV supports columns such as:
  - `id`, `title`, `slug`, `category`, `date`, `excerpt`, `content`, `image`
  - optional segmented content columns: `content_1`, `content_2`, ...
