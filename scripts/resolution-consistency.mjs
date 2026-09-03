#!/usr/bin/env node
/**
 * The resolution pages compute almost everything — ratio, megapixels, density,
 * the multiple of 1080p — but each carries one hand-written paragraph, and that
 * paragraph makes arithmetic claims: "twice 1440×900 in each direction", "640
 * extra columns", "a ninth of the pixels of 4K". Nothing connects those to the
 * numbers beside them, and writing this section produced two that were simply
 * wrong (1600×900 called three quarters of 1920×1080, when it is 83%; 720p
 * called a quarter of 4K, when it is a ninth).
 *
 * So: every resolution named in prose must exist in the table, and every
 * "twice A×B" and "N extra columns" claim must hold against the numbers.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const src = fs.readFileSync(path.join(root, 'src/gen/screen-resolutions.mjs'), 'utf8');

// The data rows, not the prose: [w, h, name, cat, note]
const rows = [...src.matchAll(/^ {2}\[(\d+), (\d+), '([^']+)', '([^']+)', '((?:[^'\\]|\\.)*)'\],$/gm)]
  .map(([, w, h, name, cat, note]) => ({ w: +w, h: +h, name, cat, note }));

const key = (w, h) => `${w}x${h}`;
const known = new Set(rows.map((r) => key(r.w, r.h)));
const problems = [];

if (rows.length < 30) problems.push(`only parsed ${rows.length} rows — the row pattern has drifted from the data`);

for (const r of rows) {
  const here = `${key(r.w, r.h)}`;

  // Any A×B written in the prose must be a resolution this section documents.
  for (const m of r.note.matchAll(/(\d{3,4})\s*×\s*(\d{3,4})/g)) {
    if (!known.has(key(+m[1], +m[2]))) {
      problems.push(`${here} — cites ${m[1]}×${m[2]}, which is not a resolution in the table`);
    }
  }

  // "twice A×B in each direction"
  for (const m of r.note.matchAll(/twice (\d{3,4})\s*×\s*(\d{3,4}) in each direction/gi)) {
    if (+m[1] * 2 !== r.w || +m[2] * 2 !== r.h) {
      problems.push(`${here} — says twice ${m[1]}×${m[2]}, which would be ${+m[1] * 2}×${+m[2] * 2}`);
    }
  }

  // "half the linear size of A×B"
  for (const m of r.note.matchAll(/half the linear size of (\d{3,4})\s*×\s*(\d{3,4})/gi)) {
    if (+m[1] !== r.w * 2 || +m[2] !== r.h * 2) {
      problems.push(`${here} — says half of ${m[1]}×${m[2]}, which would make this ${+m[1] / 2}×${+m[2] / 2}`);
    }
  }

  // "N extra columns" is measured against the resolution named just before it.
  for (const m of r.note.matchAll(/(\d{3,4})p? with (\d+) extra columns/gi)) {
    const base = m[1] === '1080' ? 1920 : m[1] === '1440' ? 2560 : m[1] === '720' ? 1280 : null;
    if (base !== null && base + +m[2] !== r.w) {
      problems.push(`${here} — says ${m[1]}p plus ${m[2]} columns, which is ${base + +m[2]}, not ${r.w}`);
    }
  }

  // "N columns wider than UHD"
  for (const m of r.note.matchAll(/(\d+) columns wider than UHD/gi)) {
    if (3840 + +m[1] !== r.w) problems.push(`${here} — says ${m[1]} wider than UHD, which is ${3840 + +m[1]}, not ${r.w}`);
  }

  // "Two X displays side by side" / "Two X displays in one"
  for (const m of r.note.matchAll(/[Tt]wo (\d{3,4})p displays/g)) {
    const base = m[1] === '1080' ? [1920, 1080] : m[1] === '1440' ? [2560, 1440] : null;
    if (base && (base[0] * 2 !== r.w || base[1] !== r.h)) {
      problems.push(`${here} — says two ${m[1]}p displays, which would be ${base[0] * 2}×${base[1]}`);
    }
  }

  // "a ninth / a quarter / a third of the pixels of 4K" and the same against 1080p
  const FRAC = { half: 1 / 2, third: 1 / 3, quarter: 1 / 4, fifth: 1 / 5, sixth: 1 / 6, ninth: 1 / 9, sixteenth: 1 / 16 };
  for (const m of r.note.matchAll(/an? (half|third|quarter|fifth|sixth|ninth|sixteenth) of the pixels of (4K|1080p)/gi)) {
    const target = m[2].toLowerCase() === '4k' ? 3840 * 2160 : 1920 * 1080;
    const claimed = FRAC[m[1].toLowerCase()];
    const actual = (r.w * r.h) / target;
    if (Math.abs(actual - claimed) / claimed > 0.05) {
      problems.push(`${here} — calls itself a ${m[1]} of ${m[2]}, but it is ${(actual * 100).toFixed(1)}% of it`);
    }
  }

  // "N% of a 1080p frame"
  for (const m of r.note.matchAll(/(\d+)% of a 1080p frame/g)) {
    const actual = ((r.w * r.h) / (1920 * 1080)) * 100;
    if (Math.abs(actual - +m[1]) > 1.5) {
      problems.push(`${here} — says ${m[1]}% of a 1080p frame; it is ${actual.toFixed(1)}%`);
    }
  }

  // "N× frames" of a base resolution
  for (const m of r.note.matchAll(/(Sixteen|Four|Nine|Two) (\d{3,4})p frames/gi)) {
    const N = { sixteen: 16, four: 4, nine: 9, two: 2 }[m[1].toLowerCase()];
    const base = m[2] === '1080' ? 1920 * 1080 : m[2] === '720' ? 1280 * 720 : null;
    if (base && Math.abs((r.w * r.h) / base - N) > 0.01) {
      problems.push(`${here} — says ${m[1]} ${m[2]}p frames, but it holds ${((r.w * r.h) / base).toFixed(2)}`);
    }
  }
  for (const m of r.note.matchAll(/(Sixteen|Four|Nine|Two) 4K frames/gi)) {
    const N = { sixteen: 16, four: 4, nine: 9, two: 2 }[m[1].toLowerCase()];
    if (Math.abs((r.w * r.h) / (3840 * 2160) - N) > 0.01) {
      problems.push(`${here} — says ${m[1]} 4K frames, but it holds ${((r.w * r.h) / (3840 * 2160)).toFixed(2)}`);
    }
  }
}

console.log(`\nChecked ${rows.length} screen resolutions\n`);
console.log(`${problems.length ? '✗' : '✓'} arithmetic claims in prose that do not hold   ${problems.length}`);
for (const p of problems) console.log(`    ${p}`);
console.log(`\n${problems.length === 0 ? '✓ every claim a resolution page makes about itself checks out' : '✗ ' + problems.length + ' problems'}\n`);
process.exitCode = problems.length ? 1 : 0;
