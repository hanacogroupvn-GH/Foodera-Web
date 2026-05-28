import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Check products translations
const products = (await client.execute('SELECT id, name, translations FROM products LIMIT 5')).rows;
for (const p of products) {
  const t = JSON.parse(p.translations || '{}');
  const zh = t.zh;
  if (zh) {
    console.log(`\nProduct [${p.id}]:`);
    console.log('  zh.name:', zh.name?.substring(0, 80));
    console.log('  zh.shortDescription:', zh.shortDescription?.substring(0, 100));
  } else {
    console.log(`\nProduct [${p.id}]: no zh translations`);
  }
}

// Check news
const news = (await client.execute('SELECT id, title, translations FROM news LIMIT 3')).rows;
for (const n of news) {
  const t = JSON.parse(n.translations || '{}');
  const zh = t.zh;
  if (zh) {
    console.log(`\nNews [${n.id}]:`);
    console.log('  zh.title:', zh.title?.substring(0, 100));
  } else {
    console.log(`\nNews [${n.id}]: no zh translations`);
  }
}

process.exit(0);
