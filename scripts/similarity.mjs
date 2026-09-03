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

// How much vocabulary a page shares with its siblings, as a Jaccard overlap.
// LOWER IS BETTER — 100% would mean two pages made of exactly the same words.
// This heading used to read "unique text per page", the opposite of what the
// number is, and I read it that way: convert at 38% was reported to the user as
// the site's thinnest section when it is in fact the least repetitive one on the
// site, while paper at 75% was the second worst and read as second best.
console.log('\nvocabulary shared with sibling pages (lower is better)');
// Group by section, and split one where a single prefix holds structurally
// different page types. /convert/ contains "N-unit-to-unit" value pages and
// "zone-to-zone" timezone pages, which share nothing; averaging them together
// hid a 91% timezone pair behind a 41% section average.
const family = (url) => {
  const parts = url.split('/').filter(Boolean);
  const section = parts[0];
  // /paper/a4/ and /paper/a4/pixels/ are different page types under one prefix,
  // and the sampler compares neighbours alphabetically — so it was pairing a
  // size page against a pixel page and reporting 23%, a number that looked like
  // a large improvement and measured nothing. Same failure as lumping the
  // convert families together, in the flattering direction this time.
  if (section === 'paper') return parts.length > 2 && parts[2] === 'pixels' ? 'paper:pixels' : 'paper';
  if (section !== 'convert' || parts.length < 2) return section;
  const slug = parts[1];
  if (/^[0-9]/.test(slug)) return 'convert:values';
  if (/^[a-z]{2,5}-to-[a-z]{2,5}$/.test(slug)) return 'convert:zones';
  return 'convert:pairs';
};
const bySection = {};
for (const f of walk(dist)) {
  const url = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  const section = url === '/' ? '(home)' : family(url);
  (bySection[section] ||= []).push(f);
}
// Comparing a single pair per section is not enough: it reported /cron/ at 79%,
// safely under the threshold, while the worst pair in that section was 97%. The
// risk is a duplicate *pair*, so sample many and report the worst one found.
const vocab = (f) => new Set(text(fs.readFileSync(f, 'utf8')).toLowerCase().split(' '));
const overlap = (a, b) => [...a].filter((w) => b.has(w)).length / new Set([...a, ...b]).size;

// Every section, not the twelve largest. The cutoff was silently dropping the
// newest sections off the bottom as the site grew — and a small, heavily
// templated section is exactly where the duplicate risk lives, so reporting by
// size was filtering out the pages most likely to be in trouble.
for (const [section, files] of Object.entries(bySection).sort((a, b) => b[1].length - a[1].length)) {
  if (files.length < 2) continue;
  // Neighbours are the likeliest duplicates, so walk consecutive pairs, and add
  // spread-out pairs so a section ordered by something unrelated is still seen.
  // Eighty pairs out of 4,589 pages is 1.7% coverage, and the stride was
  // files.length/40 — so which pairs got sampled depended on the page count.
  // Adding oven pages elsewhere moved this section's reported worst pair from
  // 79% to 91% with no content change at all. The cap is now fixed and large,
  // so the number describes the pages rather than how many there happen to be.
  const pairs = [];
  const CAP = 600;
  const stride = Math.max(1, Math.floor(files.length / CAP));
  for (let i = 0; i + stride < files.length && pairs.length < CAP; i += stride) pairs.push([files[i], files[i + stride]]);
  for (let i = 0; i + 1 < files.length && pairs.length < CAP * 2; i += stride) pairs.push([files[i], files[i + 1]]);

  let worst = 0, worstPair = null, sum = 0;
  const cache = new Map();
  const v = (f) => (cache.has(f) ? cache.get(f) : (cache.set(f, vocab(f)), cache.get(f)));
  for (const [x, y] of pairs) {
    const j = overlap(v(x), v(y));
    sum += j;
    if (j > worst) { worst = j; worstPair = [x, y]; }
  }
  const avg = sum / pairs.length;
  const mark = worst > 0.9 ? '✗' : worst > 0.8 ? '~' : '✓';
  const where = worstPair
    ? worstPair.map((f) => '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '')).join(' vs ')
    : '';
  console.log(`  ${mark} ${section.padEnd(12)} ${String(files.length).padStart(5)} pages   avg ${(avg * 100).toFixed(0)}%  worst ${(worst * 100).toFixed(0)}%`);
  if (worst > 0.8) console.log(`      worst pair: ${where}`);
}
console.log('\n  ✓ under 80% — siblings read as genuinely different pages');
console.log('  ~ 80–90% — templated but carrying distinct data');
console.log('  ✗ over 90% — at risk of being treated as duplicates\n');
