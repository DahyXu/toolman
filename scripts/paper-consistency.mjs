#!/usr/bin/env node
/**
 * The paper pages state their size twice: once as millimetres in a generated
 * table, and once in prose written by hand — "9 × 12 inches", "two ARCH A
 * sheets". Nothing connects the two, so a wrong inch figure in the prose sits
 * next to a correct millimetre one and reads as authoritative.
 *
 * This checks the inch figures against the dimensions they are describing, and
 * that every size has a detail paragraph rather than falling back to the short
 * note, which is silent when it happens.
 */
import DETAIL from '../src/data/paper-detail.mjs';
import SIZES from '../src/data/paper-sizes-data.mjs';

const rows = SIZES.map((d) => ({ name: d.name, id: d.id, w: d.w, h: d.h }));

const missing = rows.filter((r) => !DETAIL[r.id]).map((r) => r.id);
const extra = Object.keys(DETAIL).filter((k) => !rows.some((r) => r.id === k));

// A good paragraph names other sheets on purpose — A3 explains itself by
// comparing with Tabloid, the US A7 envelope by warning about ISO A7. Checking
// the first dimension pair against *this* sheet therefore flagged four correct
// comparisons and nothing else. What is actually worth checking is that every
// pair of dimensions written anywhere in the prose corresponds to some real
// sheet, which is what a typo would fail.
const known = [];
for (const r of rows) known.push([r.w, r.h], [r.w / 25.4, r.h / 25.4]);

// Dimensions the prose cites on purpose that are not sheets in this table. Each
// one is here because the comparison is the point of the sentence — the whole
// value of the B0 paragraph is that JIS B0 is a different size from ISO B0.
// Named rather than silenced, so that a genuine typo still has nowhere to hide.
const EXTERNAL = [
  [1030, 1456, 'JIS B0, cited on the B0 page to warn that ISO B and JIS B differ'],
  [63.5, 88.9, 'a poker-size playing card, cited on the B8 page as a comparison'],
];
for (const [w, h] of EXTERNAL) known.push([w, h], [w / 25.4, h / 25.4]);
// Trade names round: Super A3 is 329 × 483 mm and is sold as "13 × 19 inches".
const nearKnown = (a, b, tol) => known.some(([x, y]) => Math.abs(x - a) <= tol && Math.abs(y - b) <= tol);

const wrong = [];
for (const r of rows) {
  const text = DETAIL[r.id];
  if (!text) continue;
  for (const m of text.matchAll(/([\d.]+)\s*×\s*([\d.]+)\s*(mm|inch)/g)) {
    const a = +m[1], b = +m[2];
    const isMm = m[3] === 'mm';
    // ISO sizes are published rounded to the millimetre, so allow 1 mm; inch
    // figures are trade designations and allow a twentieth of an inch.
    if (!nearKnown(a, b, isMm ? 1 : 0.05)) {
      wrong.push(`${r.id} — "${m[0]}" matches no sheet in the table`);
    }
  }
}

const line = (label, arr) => {
  console.log(`${arr.length ? '✗' : '✓'} ${label.padEnd(46)} ${arr.length}`);
  for (const x of arr) console.log(`    ${x}`);
};

console.log(`\nChecked ${rows.length} paper sizes\n`);
line('sizes with no detail paragraph', missing);
line('detail entries matching no size', extra);
line('dimensions in prose disagreeing with the table', wrong);

const fatal = missing.length + extra.length + wrong.length;
console.log(`\n${fatal === 0 ? '✓ every sheet is described, and describes itself correctly' : '✗ ' + fatal + ' problems'}\n`);
process.exitCode = fatal ? 1 : 0;
