#!/usr/bin/env node
/**
 * Search Console said "未检测到引荐来源网页" for /paper/a4/pixels/ and the site
 * agreed: exactly one page linked to it, its own parent. Checking the rest
 * found 380 comparison pages in the same state — one inbound link each, from
 * their own hub.
 *
 * A page with one inbound link is last in the crawl queue, and "discovered,
 * never crawled" is precisely what those pages reported. Nothing about them
 * looks wrong: they are linked, they are in the sitemap, and the audit that
 * checks for orphans passes because one link is not zero.
 *
 * This counts inbound internal links per page, ignoring the header, nav and
 * footer, which link the same places from everywhere and say nothing about how
 * well connected a page is.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

// One inbound link is what a page gets from the index that lists it. Two means
// something else thought it worth pointing at.
const THIN = 2;

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'index.html') continue;
    pages.push(p);
  }
})(dist);

const urlOf = (p) => p.slice(dist.length).split(path.sep).join('/').replace(/index\.html$/, '');
const inbound = new Map(pages.map((p) => [urlOf(p), 0]));

for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const body = html
    .replace(/<header[\s\S]*?<\/header>/g, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/g, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/g, ' ');
  const self = urlOf(p);
  const seen = new Set();
  for (const m of body.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].endsWith('/') ? m[1] : m[1] + '/';
    if (href === self || seen.has(href)) continue;
    seen.add(href);
    if (inbound.has(href)) inbound.set(href, inbound.get(href) + 1);
  }
}

// Deliberately left alone. Every query these three sections serve is answered
// by Google above the results — unit conversions, Roman numerals, colour hex
// codes — so an impression there cannot become a click and spending crawl
// budget on them is the wrong trade. Named rather than silently skipped, so a
// section that develops the problem by accident still shows up.
const LEFT_THIN = new Set(['convert', 'roman', 'color']);

const all = [...inbound].filter(([, n]) => n < THIN && n > 0);
const thin = all.filter(([url]) => !LEFT_THIN.has(url.split('/')[1]));
const skipped = all.length - thin.length;
const bySection = new Map();
for (const [url] of thin) {
  const sec = url.split('/')[1] || '(root)';
  bySection.set(sec, (bySection.get(sec) || 0) + 1);
}

console.log(`\nCounted inbound internal links for ${pages.length.toLocaleString()} pages, excluding site chrome\n`);
console.log(`  ${thin.length ? '✗' : '✓'} pages reachable from only one other page   ${thin.length}`);
for (const [sec, n] of [...bySection].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`      ${sec.padEnd(20)} ${n}`);
}
for (const [url] of thin.slice(0, 6)) console.log(`      ${url}`);

console.log(thin.length
  ? `\n✗ ${thin.length} page(s) that only one other page points at`
  : '\n✓ every page is pointed at by at least two others');
console.log(`  – left thin on purpose (${[...LEFT_THIN].join(', ')})   ${skipped}`);

process.exit(thin.length === 0 ? 0 : 1);
