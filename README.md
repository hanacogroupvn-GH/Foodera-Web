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
