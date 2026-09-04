#!/usr/bin/env node
/**
 * Google was crawling 3,500 pages a day and indexing almost none of them. The
 * page-side reasons that stop a crawled URL from being indexed are few and all
 * silent: a canonical tag pointing somewhere else hands the page's identity to
 * another URL, a missing one leaves Google to guess, and a stray noindex
 * removes the page outright. None of them show up as an error anywhere.
 *
 * This checks every built page declares itself canonical at its own address.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');
const ORIGIN = 'https://toolman.top';

// Deliberate. A site-search results page is Google's own example of what not
// to index; it is noindex on purpose and named here so a page that becomes
// noindex by accident still shows up.
const INTENTIONAL_NOINDEX = new Set(['/search/']);

const missing = [];
const mismatch = [];
const noindex = [];
let n = 0;

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'index.html') continue;
    n++;
    const html = fs.readFileSync(p, 'utf8');
    const rel = p.slice(dist.length).split(path.sep).join('/');
    const url = ORIGIN + rel.replace(/index\.html$/, '');
    const m = html.match(/<link rel="canonical" href="([^"]*)"/);
    if (!m) missing.push(url);
    else if (m[1] !== url) mismatch.push(`${url} → ${m[1]}`);
    const rp = rel.replace(/index\.html$/, '');
    if (/<meta[^>]+noindex/i.test(html) && !INTENTIONAL_NOINDEX.has(rp)) noindex.push(url);
  }
})(dist);

console.log(`\nChecked ${n} pages for what stops a crawled URL being indexed\n`);

const show = (label, list) => {
  const bad = list.length > 0;
  console.log(`  ${bad ? '✗' : '✓'} ${label.padEnd(42)} ${list.length}`);
  for (const x of list.slice(0, 8)) console.log(`      ${x}`);
  if (list.length > 8) console.log(`      … and ${list.length - 8} more`);
  return list.length;
};

const fatal =
  show('pages with no canonical link', missing) +
  show('canonical pointing at another URL', mismatch) +
  show('pages carrying an unintended noindex', noindex);

console.log(fatal === 0
  ? '\n✓ every page claims itself, and none opt out of the index'
  : `\n✗ ${fatal} page(s) that Google may crawl and decline to index`);

process.exit(fatal === 0 ? 0 : 1);
