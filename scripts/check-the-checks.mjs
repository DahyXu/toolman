#!/usr/bin/env node
/**
 * Does every check in the audit actually fail?
 *
 * This project has produced at least three checks that reported a clean site
 * because they could not look: a regex whose backslashes were eaten and became
 * `[d.]+s*×s*`, a comparison evaluated at the one point where both the right and
 * the wrong formula agree, and a day count that stayed at 365 whether or not the
 * rule it was testing ever fired. Each was found by accident.
 *
 * So: plant, for every check, the specific fault it claims to detect. Run it.
 * Restore. A check that passes its own plant is not protecting anything, and
 * this prints which ones those are.
 *
 * It edits `dist` and puts it back. Nothing here touches `src` except where a
 * check reads source rather than output, and those are restored the same way.
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const NODE = process.execPath;

// [script, file it needs, how to break that file, what the fault is]
//
// Each plant is the smallest edit that should trip exactly one check. Where a
// check reads several files, the one named here is the one it will reach first.
const PLANTS = [
  {
    script: 'scripts/audit.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace(/<title>[^<]*<\/title>/, ''),
    fault: 'a page with no <title>',
  },
  {
    script: 'scripts/schema.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace('"@type":"WebSite"', '"@type":"WebSite",,'),
    fault: 'JSON-LD that does not parse',
  },
  {
    script: 'scripts/canonical-check.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace(/<link rel="canonical"[^>]*>/, ''),
    fault: 'a page with no canonical',
  },
  {
    script: 'scripts/contradiction.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace('</main>', '<p>1,000 and 1000 are the same number.</p></main>'),
    fault: 'the same number in two formats on one page',
  },
  {
    script: 'scripts/float-leak.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace('</main>', '<p>210.00000000000003 mm</p></main>'),
    fault: 'a float that leaked its binary representation',
  },
  {
    script: 'scripts/escaped-backslash.mjs',
    file: 'dist/ascii/65/index.html',
    break: (s) => s.split("\\x41").join("\\\\x41"),
    fault: 'a doubled hex escape — the class this check missed on 128 pages',
  },
  {
    script: 'scripts/escaped-backslash.mjs',
    file: 'dist/ascii/10/index.html',
    break: (s) => s.replace('</main>', '<p><code>printf "\\\\n"</code></p></main>'),
    fault: 'a doubled escape sequence',
  },
  {
    script: 'scripts/empty-sections.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace('</main>', '<h2>A heading with nothing under it</h2></main>'),
    fault: 'a heading with no content',
  },
  {
    script: 'scripts/standalone-answers.mjs',
    file: 'dist/paper/a4/index.html',
    break: (s) => s.replace(/"acceptedAnswer":{"@type":"Answer","text":"[^"]*"/, '"acceptedAnswer":{"@type":"Answer","text":"They vary quite a lot."'),
    fault: 'an answer opening with a bare pronoun',
  },
  // title-audit.mjs is deliberately not here. It has no exit code — it prints
  // rows marked ✗ and always returns 0 — so it is a report sitting in a chain
  // of checks, and the faults it looks like it would catch (missing titles,
  // duplicates) are in audit.mjs, which does fail. Planting against it would
  // only assert that a report does not fail.
  {
    script: 'scripts/sitemap-check.mjs',
    file: 'dist/sitemaps/pages-1.xml',
    break: (s) => s.replace('</urlset>', ''),
    fault: 'a sitemap that is not well-formed',
  },
  {
    script: 'scripts/rederive.mjs',
    file: 'dist/resistor/11r/index.html',
    break: (s) => s.replace('Band 2 — second digit</td><td class="out"><span', 'Band 2 — second digit</td><td class="out">XX<span'),
    fault: 'a rendered figure that disagrees with the data behind it',
  },
];

const results = [];

for (const plant of PLANTS) {
  if (!fs.existsSync(plant.file)) {
    results.push({ ...plant, verdict: 'SKIPPED', detail: `${plant.file} does not exist` });
    continue;
  }
  const original = fs.readFileSync(plant.file, 'utf8');
  const broken = plant.break(original);

  if (broken === original) {
    // The plant itself did nothing, which says nothing about the check. This is
    // the failure mode that makes a harness like this worse than useless.
    results.push({ ...plant, verdict: 'PLANT FAILED', detail: 'the edit did not change the file' });
    continue;
  }

  fs.writeFileSync(plant.file, broken);
  let caught = false;
  try {
    execFileSync(NODE, [plant.script], { stdio: 'pipe' });
  } catch {
    caught = true;
  } finally {
    fs.writeFileSync(plant.file, original);
  }

  results.push({ ...plant, verdict: caught ? 'catches it' : 'DID NOT CATCH', detail: '' });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nPlanted ${PLANTS.length} faults, one per check\n`);
for (const r of results) {
  const mark = r.verdict === 'catches it' ? '✓' : '✗';
  console.log(`${mark} ${pad(r.script.replace('scripts/', ''), 26)} ${pad(r.verdict, 14)} ${r.fault}${r.detail ? ` — ${r.detail}` : ''}`);
}

const bad = results.filter((r) => r.verdict !== 'catches it' && r.verdict !== 'SKIPPED');
console.log(bad.length
  ? `\n✗ ${bad.length} check(s) did not fail on the fault they exist to find\n`
  : '\n✓ every check fails on the fault it exists to find\n');
process.exit(bad.length === 0 ? 0 : 1);
