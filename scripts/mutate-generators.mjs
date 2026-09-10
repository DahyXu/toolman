#!/usr/bin/env node
/**
 * Would a corrupted data table be caught?
 *
 * `check-the-checks.mjs` verifies the audit scripts fire on the fault they name.
 * This asks the same question one level down, of the 140 assertions inside the
 * generators — the first line of defence, and the one that runs before anything
 * reaches disk.
 *
 * Testing each assertion individually would mean knowing what fault each one
 * names. Mutation asks the cheaper, broader question: change one number in a
 * generator's own data and see whether anything notices.
 *
 * A surviving mutation is not automatically a hole. Some numbers have no
 * invariant to violate — a screen resolution is whatever it says it is, and
 * every figure derived from it stays consistent. The output names the file and
 * line so the answer can be looked at rather than assumed.
 *
 * Numbers inside quotes are skipped. The first version of this script mutated a
 * 7 inside `#7b3f00` and a 4 inside "a 4:3 or 3:2 ratio", then reported those
 * generators as holes for not noticing text change under them — the same error
 * as a plant that never creates the fault.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIR = 'src/gen';
const QUOTES = ['\'', '"', '`'];
const BACKSLASH = String.fromCharCode(92);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.mjs')).sort();
const results = [];

// Import the generator under a fresh URL so the module cache does not serve the
// unmutated copy, and read its complaint out of the exit code it sets.
async function runGenerator(file, tag) {
  const url = pathToFileURL(path.resolve(DIR, file)).href + `?mut=${tag}`;
  const before = process.exitCode;
  process.exitCode = 0;
  let threw = null;
  try {
    const mod = await import(url);
    if (typeof mod.default === 'function') await mod.default();
  } catch (e) {
    threw = e;
  }
  const complained = process.exitCode !== 0 || threw !== null;
  process.exitCode = before;
  return { complained, threw };
}

// Replace the first number over 1 that sits outside every quoted string.
function mutateOutsideStrings(line) {
  let quote = null;
  let out = '';
  let changed = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      out += c;
      if (c === quote && line[i - 1] !== BACKSLASH) quote = null;
      continue;
    }
    if (QUOTES.includes(c)) { out += c; quote = c; continue; }
    if (!changed && c >= '0' && c <= '9') {
      const rest = line.slice(i);
      let j = 0;
      while (j < rest.length && ((rest[j] >= '0' && rest[j] <= '9') || rest[j] === '.')) j++;
      const num = rest.slice(0, j);
      if (Math.abs(Number(num)) > 1) {
        changed = num;
        out += String(Math.round(Number(num) * 1.1 * 100) / 100);
        i += num.length - 1;
        continue;
      }
    }
    out += c;
  }
  return { line: out, changed };
}

for (const file of files) {
  const full = path.join(DIR, file);
  const original = fs.readFileSync(full, 'utf8');
  const nl = original.includes('\r\n') ? '\r\n' : '\n';
  const lines = original.split(nl);

  // A data row: opens a bracket or brace, is not a comment, and carries at least
  // two numbers over 1 outside quotes. Two means measurements rather than a lone
  // constant, and a row of measurements is what a corrupted table looks like.
  let target = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const t = l.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) continue;
    if (!l.includes('[') && !l.includes('{')) continue;
    let stripped = '';
    let q = null;
    for (let k = 0; k < l.length; k++) {
      const c = l[k];
      if (q) { if (c === q && l[k - 1] !== BACKSLASH) q = null; continue; }
      if (QUOTES.includes(c)) { q = c; continue; }
      stripped += c;
    }
    const nums = (stripped.match(/[0-9]+\.?[0-9]*/g) || []).filter((n) => Number(n) > 1);
    if (nums.length >= 2) { target = i; break; }
  }

  if (target < 0) {
    results.push({ file, verdict: 'no data row found' });
    continue;
  }

  // The generator has to be clean before a mutation means anything.
  const clean = await runGenerator(file, `clean-${Date.now()}-${file}`);
  if (clean.complained) {
    results.push({ file, verdict: 'ALREADY COMPLAINING', line: target + 1, detail: clean.threw?.message?.slice(0, 60) || 'exit code set' });
    continue;
  }

  const { line: mutatedLine, changed } = mutateOutsideStrings(lines[target]);
  if (!changed) {
    results.push({ file, verdict: 'nothing to mutate', line: target + 1 });
    continue;
  }

  const mutated = lines.slice();
  mutated[target] = mutatedLine;
  fs.writeFileSync(full, mutated.join(nl));
  let out;
  try {
    out = await runGenerator(file, `mut-${Date.now()}-${file}`);
  } finally {
    fs.writeFileSync(full, original);
  }

  results.push({
    file,
    verdict: out.complained ? 'caught' : 'SURVIVED',
    line: target + 1,
    detail: `${changed} → ${Math.round(Number(changed) * 1.1 * 100) / 100}`,
  });
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nMutated one data number outside every string, in each of ${files.length} generators\n`);
const survived = [];
for (const r of results) {
  const mark = r.verdict === 'caught' ? '✓' : r.verdict === 'SURVIVED' ? '✗' : '·';
  if (r.verdict === 'SURVIVED') survived.push(r);
  console.log(`${mark} ${pad(r.file, 26)} ${pad(r.verdict, 20)} ${r.line ? `line ${r.line}` : ''} ${r.detail || ''}`);
}

console.log(`\ncaught ${results.filter((r) => r.verdict === 'caught').length} · survived ${survived.length} · not applicable ${results.length - survived.length - results.filter((r) => r.verdict === 'caught').length}`);
console.log('A survivor is a generator that builds cleanly from data that changed. Some of');
console.log('those numbers have no invariant to violate; the ones that do are holes.\n');
