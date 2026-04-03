import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import {
  createTursoConnection,
  ensureDatabaseSchema,
  hashPassword,
  importContentSnapshot,
  upsertAdminUser
} from '../server/db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const parseEnvFile = (content) =>
  Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) {
          return [line, ''];
        }

        const key = line.slice(0, separatorIndex).trim();
        let value = line.slice(separatorIndex + 1).trim();
        value = value.replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );

const readMergedEnv = async () => {
  const merged = { ...process.env };

  for (const fileName of ['.env.example', '.env.local']) {
    try {
      const content = await fs.readFile(path.join(projectRoot, fileName), 'utf8');
      Object.assign(merged, parseEnvFile(content));
    } catch {
      // ignore missing env file
    }
  }

  return merged;
};

const optionalSelectAll = async (supabase, tableName, orderColumn, ascending = true) => {
  try {
    const { data, error } = await supabase.from(tableName).select('*').order(orderColumn, { ascending });
    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
};

const main = async () => {
  const env = await readMergedEnv();

  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL and/or Supabase key in .env.local.');
  }

  const bootstrapPassword = env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || env.ADMIN_PASSWORD?.trim() || 'ChangeThisNow123!';
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const [productsResult, newsResult, contactInquiries, quotationRequests] = await Promise.all([
    supabase.from('products').select('*').order('id', { ascending: true }),
    supabase.from('news').select('*').order('date', { ascending: false }),
    optionalSelectAll(supabase, 'contact_inquiries', 'id', true),
    optionalSelectAll(supabase, 'quotation_requests', 'id', true)
  ]);

  if (productsResult.error) {
    throw new Error(`Failed to read Supabase products: ${productsResult.error.message}`);
  }

  if (newsResult.error) {
    throw new Error(`Failed to read Supabase news: ${newsResult.error.message}`);
  }

  const snapshot = {
    products: (productsResult.data ?? []).map((row) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      isActive: row.is_active !== false,
      category: String(row.category ?? ''),
      subCategory: String(row.sub_category ?? ''),
      description: String(row.description ?? ''),
      shortDescription: String(row.short_description ?? ''),
      image: String(row.image ?? ''),
      pdfUrl: row.pdf_url ? String(row.pdf_url) : undefined,
      gallery: row.gallery ?? undefined,
      specifications: row.specifications ?? {},
      packaging: row.packaging ?? {},
      payment: row.payment ?? {},
      filters: row.filters ?? {},
      translations: row.translations ?? undefined
    })),
    news: (newsResult.data ?? []).map((row) => ({
      id: String(row.id ?? ''),
      slug: String(row.slug ?? ''),
      title: String(row.title ?? ''),
      isActive: row.is_active !== false,
      date: String(row.date ?? ''),
      category: String(row.category ?? ''),
      excerpt: String(row.excerpt ?? ''),
      content: Array.isArray(row.content) ? row.content : [],
      image: String(row.image ?? ''),
      translations: row.translations ?? undefined
    }))
  };

  const turso = createTursoConnection(env);
  await ensureDatabaseSchema(turso);
  await importContentSnapshot(turso, snapshot);

  for (const inquiry of contactInquiries) {
    await turso.execute({
      sql: `
        insert into contact_inquiries (
          company_name, full_name, email, phone_whatsapp, subject, message, created_at
        ) values (?, ?, ?, ?, ?, ?, coalesce(?, CURRENT_TIMESTAMP))
      `,
      args: [
        String(inquiry.company_name ?? ''),
        String(inquiry.full_name ?? ''),
        String(inquiry.email ?? ''),
        inquiry.phone_whatsapp ? String(inquiry.phone_whatsapp) : null,
        String(inquiry.subject ?? ''),
        String(inquiry.message ?? ''),
        inquiry.created_at ? String(inquiry.created_at) : null
      ]
    });
  }

  for (const inquiry of quotationRequests) {
    await turso.execute({
      sql: `
        insert into quotation_requests (
          product_id, full_name, email, company_name, order_volume, message, created_at
        ) values (?, ?, ?, ?, ?, ?, coalesce(?, CURRENT_TIMESTAMP))
      `,
      args: [
        String(inquiry.product_id ?? ''),
        String(inquiry.full_name ?? ''),
        String(inquiry.email ?? ''),
        inquiry.company_name ? String(inquiry.company_name) : null,
        inquiry.order_volume ? String(inquiry.order_volume) : null,
        String(inquiry.message ?? ''),
        inquiry.created_at ? String(inquiry.created_at) : null
      ]
    });
  }

  try {
    const { data: adminRows, error: adminRowsError } = await supabase.from('admin_users').select('user_id');

    if (!adminRowsError && Array.isArray(adminRows) && supabase.auth.admin?.getUserById) {
      for (const row of adminRows) {
        const userId = String(row.user_id ?? '').trim();
        if (!userId) {
          continue;
        }

        try {
          const { data: adminUserPayload } = await supabase.auth.admin.getUserById(userId);
          const adminEmail = adminUserPayload?.user?.email?.trim().toLowerCase();
          if (!adminEmail) {
            continue;
          }

          await upsertAdminUser(turso, {
            email: adminEmail,
            passwordHash: hashPassword(bootstrapPassword)
          });
        } catch {
          // ignore individual admin migration failures
        }
      }
    }
  } catch {
    // ignore admin migration failures
  }

  if (env.ADMIN_EMAIL?.trim() && (env.ADMIN_PASSWORD?.trim() || env.ADMIN_BOOTSTRAP_PASSWORD?.trim())) {
    await upsertAdminUser(turso, {
      email: env.ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash: hashPassword(env.ADMIN_PASSWORD?.trim() || env.ADMIN_BOOTSTRAP_PASSWORD?.trim() || bootstrapPassword)
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        migrated: {
          products: snapshot.products.length,
          news: snapshot.news.length,
          contactInquiries: contactInquiries.length,
          quotationRequests: quotationRequests.length
        }
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
