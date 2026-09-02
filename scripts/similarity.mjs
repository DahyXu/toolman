#!/usr/bin/env node
/**
 * Measure how much unique text each family of generated pages actually has.
 *
 * The failure mode for a large programmatic site is Google deciding the pages
 * are the same page with different numbers in it, and indexing a handful. The
 * question is not "are these pages templated" — of course they are — but "how
 * much of each page survives once the template is removed".
 *
 * Method: strip the values that vary (numbers, hex codes, the page's own
 * subject) and hash what is left. Pages sharing a boilerplate hash are
 * identical apart from their data. Then measure what fraction of each page's
 * text that boilerplate accounts for.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'dist');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const text = (html) =>
  (html.split('</head>')[1] || '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/g, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/g, ' ')
    .replace(/<header[\s\S]*?<\/header>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Remove everything that legitimately varies between siblings.
const skeleton = (t) =>
  t.toLowerCase()
    .replace(/#[0-9a-f]{3,8}\b/g, '#')      // hex colours
    .replace(/[\d.,]+/g, '#')               // any number
    .replace(/\b[ivxlcdm]{2,}\b/g, '#')     // roman numerals
    .replace(/\s+/g, ' ')
    .trim();

const groups = new Map();
for (const f of walk(dist)) {
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const section = url === '/' ? '(home)' : url.split('/').filter(Boolean)[0];
  const t = text(fs.readFileSync(f, 'utf8'));
  const words = t ? t.split(' ').length : 0;
  const sk = skeleton(t);
  const key = crypto.createHash('sha1').update(sk).digest('hex').slice(0, 12);
  if (!groups.has(key)) groups.set(key, { n: 0, section, words, sample: url, skelWords: sk.split(' ').length });
  const g = groups.get(key);
  g.n++;
  g.words = Math.max(g.words, words);
}

const big = [...groups.values()].filter((g) => g.n > 1).sort((a, b) => b.n - a.n);
const total = [...groups.values()].reduce((s, g) => s + g.n, 0);
const inClones = big.reduce((s, g) => s + g.n, 0);

console.log(`\n${total.toLocaleString()} pages, ${groups.size.toLocaleString()} distinct skeletons\n`);
console.log(`${inClones.toLocaleString()} pages share a skeleton with at least one other page`);
console.log(`${(total - inClones).toLocaleString()} pages are structurally unique\n`);

if (big.length) {
  console.log('largest groups of structurally identical pages');
  console.log('  count  section       words  example');
  for (const g of big.slice(0, 15)) {
    console.log(`  ${String(g.n).padStart(5)}  ${g.section.padEnd(12)} ${String(g.words).padStart(5)}  ${g.sample}`);
  }
}

// The number that actually matters: how much of a typical page is data rather
// than boilerplate. Sample one page per section and diff it against a sibling.
console.log('\nunique text per page, by section');
const bySection = {};
for (const f of walk(dist)) {
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const section = url === '/' ? '(home)' : url.split('/').filter(Boolean)[0];
  (bySection[section] ||= []).push(f);
}
for (const [section, files] of Object.entries(bySection).sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
  if (files.length < 2) continue;
  const a = new Set(text(fs.readFileSync(files[0], 'utf8')).toLowerCase().split(' '));
  const b = new Set(text(fs.readFileSync(files[Math.floor(files.length / 2)], 'utf8')).toLowerCase().split(' '));
  const shared = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  const jaccard = shared / union;
  const mark = jaccard > 0.9 ? '✗' : jaccard > 0.8 ? '~' : '✓';
  console.log(`  ${mark} ${section.padEnd(12)} ${String(files.length).padStart(5)} pages   ${(jaccard * 100).toFixed(0)}% vocabulary overlap between two siblings`);
}
console.log('\n  ✓ under 80% — siblings read as genuinely different pages');
console.log('  ~ 80–90% — templated but carrying distinct data');
console.log('  ✗ over 90% — at risk of being treated as duplicates\n');
