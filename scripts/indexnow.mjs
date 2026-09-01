#!/usr/bin/env node
/**
 * Submit the sitemap's URLs to IndexNow, which notifies Bing, Yandex,
 * Seznam and Naver immediately. No account or API key registration is
 * needed — the key file hosted at the site root is the proof of ownership.
 *
 *   node scripts/indexnow.mjs            # submit everything in the sitemap
 *   node scripts/indexnow.mjs /a/ /b/    # submit specific paths
 */
import fs from 'node:fs';
import path from 'node:path';

const HOST = process.env.TOOLMAN_DOMAIN || 'toolman.top';
const ORIGIN = `https://${HOST}`;
const KEY = fs.readFileSync(new URL('../.indexnow-key', import.meta.url), 'utf8').trim();
const BATCH = 10000;

function sitemapUrls() {
  const file = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), '..', 'dist', 'sitemap.xml');
  const xml = fs.readFileSync(file, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const args = process.argv.slice(2);
const urls = args.length ? args.map((a) => (a.startsWith('http') ? a : ORIGIN + a)) : sitemapUrls();

if (!urls.length) {
  console.error('No URLs to submit — run the build first.');
  process.exit(1);
}

console.log(`Submitting ${urls.length} URLs to IndexNow as ${HOST} (key ${KEY.slice(0, 8)}…)`);

// Verify the key file is actually reachable first; IndexNow rejects otherwise.
const check = await fetch(`${ORIGIN}/${KEY}.txt`).catch(() => null);
if (!check || !check.ok) {
  console.error(`✗ Key file ${ORIGIN}/${KEY}.txt is not reachable (${check ? check.status : 'network error'}).`);
  console.error('  Deploy the site first — IndexNow verifies ownership through that file.');
  process.exit(1);
}
const body = (await check.text()).trim();
if (body !== KEY) {
  console.error(`✗ Key file content mismatch: expected ${KEY}, got "${body.slice(0, 40)}".`);
  process.exit(1);
}
console.log('✓ Key file verified');

for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: chunk }),
  });
  const text = await r.text().catch(() => '');
  console.log(`batch ${i / BATCH + 1}: ${chunk.length} URLs → HTTP ${r.status} ${r.status === 200 || r.status === 202 ? '✓' : '✗ ' + text.slice(0, 200)}`);
}
