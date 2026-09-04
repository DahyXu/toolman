#!/usr/bin/env node
/**
 * A bed comparison page printed "Area 3.9200000000000004 m²". The arithmetic
 * was right and the rounding was applied twice, which in binary floating point
 * is not the same as applying it once. Nothing failed; the page just looked
 * like a spreadsheet accident, and I found it by reading one page out of 8,317.
 *
 * Three versions of this check measured the wrong thing before this one:
 *
 *   Decimal places >= 4 flagged 45,766 numbers, nearly all of them real —
 *   0.0641 inches is a wire diameter.
 *
 *   Decimal places >= 8 still flagged 3.785411784, the exact definition of a
 *   gallon in litres, and 11111111.10000000, a netmask written in binary.
 *
 *   A run of ten or more zeros or nines caught the float noise and missed
 *   684.8949517666849, a screen height that was simply never rounded. Widening
 *   to ten decimal places to catch that flagged 0.00002295684 — one square foot
 *   in acres, which needs every one of those places to carry seven figures.
 *
 * What separates all of them is significant digits rather than decimal places.
 * Nothing on this site is known to more than ten: the gallon definition is the
 * deepest real precision here. Sixteen or seventeen figures is a double printed
 * raw, whether the tail is noise or simply unrounded.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

const NUMBER = /\d[\d,]*\.\d+/g;
// Ten is the deepest real precision on the site; thirteen leaves room and still
// catches every double printed at full width.
const MAX_SIGNIFICANT = 13;

// Leading zeros are placeholders and trailing zeros after the point are
// formatting; neither is a figure anyone measured.
function significantDigits(s) {
  const [whole, frac = ''] = s.replace(/,/g, '').split('.');
  const digits = (whole + frac).replace(/^0+/, '').replace(/0+$/, '');
  return digits.length;
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') files.push(p);
  }
})(dist);

const hits = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  // Only what a reader sees: drop scripts, styles and the JSON-LD block.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  for (const m of text.matchAll(NUMBER)) {
    // A netmask written in binary is a bit pattern that happens to contain a
    // dot: 11111111.11111111 is not a number printed to sixteen figures.
    if (/^[01.]+$/.test(m[0])) continue;
    if (significantDigits(m[0]) < MAX_SIGNIFICANT) continue;
    hits.push({ page: f.slice(dist.length).split(path.sep).join('/').replace(/index\.html$/, ''), value: m[0] });
  }
}

console.log(`\nChecked ${files.length} pages for numbers printed at full double width\n`);

if (hits.length) {
  const seen = new Map();
  for (const h of hits) if (!seen.has(h.value)) seen.set(h.value, h.page);
  for (const [value, page] of [...seen].slice(0, 20)) {
    console.log(`  ✗ ${value.padEnd(24)} ${significantDigits(value)} figures   ${page}`);
  }
  if (seen.size > 20) console.log(`  … and ${seen.size - 20} more distinct values`);
  console.log(`\n✗ ${hits.length} number(s) printed to more than ${MAX_SIGNIFICANT - 1} significant figures`);
  process.exit(1);
}

console.log(`✓ nothing printed beyond ${MAX_SIGNIFICANT - 1} significant figures`);
