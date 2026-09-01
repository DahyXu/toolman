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

// sitemap.xml is a sitemap index once the site passes one chunk, so its <loc>
// entries are other sitemaps rather than pages. Read the chunks in that case.
function sitemapUrls() {
  const distDir = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), '..', 'dist');
  const read = (f) => fs.readFileSync(path.join(distDir, f), 'utf8');
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  const root = read('sitemap.xml');
  if (!root.includes('<sitemapindex')) return locs(root);

  return locs(root).flatMap((u) => locs(read(u.replace(/^https?:\/\/[^/]+\//, ''))));
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
