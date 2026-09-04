#!/usr/bin/env node
/**
 * A bed comparison page printed "Area 3.9200000000000004 m²". The arithmetic
 * was right and the rounding was applied twice, which in binary floating point
 * is not the same as applying it once. Nothing failed; the page just looked
 * like a spreadsheet accident, and I found it by reading one page out of 8,317.
 *
 * Any number a reader sees with a long decimal tail is that same bug. Real
 * measurements in this site are quoted to at most three decimals — a wire
 * diameter in inches, a resistivity constant — so a tail longer than that is
 * float noise rather than precision.
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dist = path.join(here, '..', 'dist');

// The count of decimal places is not the signature. 3.785411784 is the exact
// definition of a gallon in litres and 0.0641 is a real wire diameter, while
// 11111111.10000000 is a CIDR netmask in binary. What every float artifact has
// and none of those has is a long run of zeros or nines in the tail, because
// the noise appears around the sixteenth significant digit: 3.9200000000000004,
// 0.30000000000000004, 2.9999999999999996.
const LEAK = /\d+\.\d*(?:0{10,}|9{10,})\d*/g;
const ALLOWED = [];

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
  for (const m of text.matchAll(LEAK)) {
    if (ALLOWED.some((re) => re.test(m[0]))) continue;
    hits.push({ page: f.slice(dist.length).replace(/\\/g, '/').replace(/index\.html$/, ''), value: m[0] });
  }
}

console.log(`\nChecked ${files.length} pages for floating-point tails in visible text\n`);

if (hits.length) {
  // One example per distinct value is enough to find the generator at fault.
  const seen = new Map();
  for (const h of hits) if (!seen.has(h.value)) seen.set(h.value, h.page);
  for (const [value, page] of [...seen].slice(0, 20)) {
    console.log(`  ✗ ${value.padEnd(24)} ${page}`);
  }
  if (seen.size > 20) console.log(`  … and ${seen.size - 20} more distinct values`);
  console.log(`\n✗ ${hits.length} number(s) printed with a floating-point tail`);
  process.exit(1);
}

console.log('✓ no floating-point tails on any page');
