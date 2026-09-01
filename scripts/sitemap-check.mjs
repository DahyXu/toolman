#!/usr/bin/env node
/**
 * Validate the generated sitemaps against the sitemaps.org protocol rules.
 *
 * Search Console reports "Couldn't fetch" for anything it rejects, without
 * saying why, so the possible causes have to be ruled out one at a time:
 * size and count limits, encoding, illegal characters, malformed URLs,
 * absolute vs relative locations, and cross-host references.
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'dist');
const HOST = 'https://toolman.top';

const files = fs.readdirSync(dist).filter((f) => /^sitemap.*\.xml$/.test(f)).sort();
let fatal = 0;

for (const f of files) {
  const raw = fs.readFileSync(path.join(dist, f));
  const xml = raw.toString('utf8');
  const issues = [];

  // --- transport-level limits ---
  const bytes = raw.length;
  if (bytes > 50 * 1024 * 1024) issues.push(`exceeds 50 MB uncompressed (${bytes})`);

  // --- encoding ---
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) issues.push('starts with a UTF-8 BOM');
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    issues.push(`declaration is ${JSON.stringify(xml.slice(0, 40))}`);
  }
  // control characters are illegal in XML 1.0 apart from tab/LF/CR
  const ctrl = xml.match(/[\x00-\x08\x0b\x0c\x0e-\x1f]/);
  if (ctrl) issues.push(`contains control character 0x${ctrl[0].charCodeAt(0).toString(16)}`);

  // --- unescaped entities ---
  const badAmp = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i);
  if (badAmp) issues.push('contains an unescaped ampersand');

  const isIndex = xml.includes('<sitemapindex');
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

  // --- structure ---
  if (isIndex) {
    if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) issues.push('missing sitemap namespace');
    if (!/<\/sitemapindex>\s*$/.test(xml)) issues.push('sitemapindex not closed at end of file');
    if (locs.length > 50000) issues.push(`${locs.length} sitemaps, over the 50,000 limit`);
    for (const l of locs) {
      const target = path.join(dist, l.replace(HOST + '/', ''));
      if (!fs.existsSync(target)) issues.push(`index points at a missing file: ${l}`);
    }
  } else {
    if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) issues.push('missing sitemap namespace');
    if (!/<\/urlset>\s*$/.test(xml)) issues.push('urlset not closed at end of file');
    if (locs.length > 50000) issues.push(`${locs.length} URLs, over the 50,000 limit`);
    if (locs.length === 0) issues.push('no URLs');
  }

  // --- every loc must be absolute, same host, and properly encoded ---
  let badUrls = 0, offHost = 0, unencoded = 0;
  for (const l of locs) {
    let u;
    try { u = new URL(l); } catch { badUrls++; continue; }
    if (u.origin !== HOST) offHost++;
    // a raw space or non-ASCII byte in a loc is invalid
    if (/[\s<>"{}|\\^`]/.test(l) || /[^\x20-\x7e]/.test(l)) unencoded++;
  }
  if (badUrls) issues.push(`${badUrls} unparseable URLs`);
  if (offHost) issues.push(`${offHost} URLs on a different host — a sitemap may only list URLs under its own path`);
  if (unencoded) issues.push(`${unencoded} URLs contain characters that must be percent-encoded`);

  // --- lastmod format ---
  const lastmods = [...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].map((m) => m[1]);
  const badDates = lastmods.filter((d) => !/^\d{4}-\d{2}-\d{2}(T[\d:.+\-Z]+)?$/.test(d));
  if (badDates.length) issues.push(`${badDates.length} malformed lastmod values, eg ${badDates[0]}`);

  const mark = issues.length ? '✗' : '✓';
  console.log(`${mark} ${f.padEnd(16)} ${isIndex ? 'index' : 'urlset'}  ${String(locs.length).padStart(5)} locs  ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
  for (const i of issues) console.log(`    ${i}`);
  fatal += issues.length;
}

console.log(`\n${fatal === 0 ? '✓ sitemaps conform to the protocol' : '✗ ' + fatal + ' problems'}\n`);
