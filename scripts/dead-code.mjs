#!/usr/bin/env node
/**
 * Find top-level declarations that are computed and never read.
 *
 * Written after discovering that `lastmodOf()` in build.mjs was defined and
 * called nowhere: the whole content-hashing mechanism, added specifically to
 * stop lastmod churn, had never had any effect on the sitemap it was meant to
 * fix. A fix that silently does nothing is worse than no fix, because the
 * problem stays solved on paper.
 *
 * Deliberately conservative: only module-level declarations, and a name is
 * counted as used if it appears anywhere outside its own declaration line.
 * That will miss some genuinely dead code, but it will not cry wolf.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

const files = [
  'build.mjs',
  'src/layout.mjs',
  'src/site.mjs',
  ...fs.readdirSync(path.join(root, 'src/gen')).map((f) => 'src/gen/' + f),
  ...fs.readdirSync(path.join(root, 'scripts')).map((f) => 'scripts/' + f),
].filter((f) => fs.existsSync(path.join(root, f)));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let found = 0;
for (const rel of files) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const lines = src.split('\n');

  // Module-level only: the declaration must start at column zero.
  const decls = [];
  lines.forEach((line, i) => {
    const m = /^(?:export\s+)?(?:const|let|var|function|async function)\s+([A-Za-z_$][\w$]*)/.exec(line);
    if (m) decls.push({ name: m[1], line: i, exported: line.startsWith('export') });
  });

  for (const d of decls) {
    // An exported binding may be used by another module; not dead here.
    if (d.exported) continue;
    // \b is useless for a name like `$`, which is not a word character — it
    // would never match and the symbol would look dead. Bound on the identifier
    // character class instead.
    const re = new RegExp('(?<![\\w$])' + escapeRe(d.name) + '(?![\\w$])');
    const usedOn = lines.filter((line, i) => i !== d.line && re.test(line));
    if (usedOn.length === 0) {
      console.log(`  ${rel}:${d.line + 1}  ${d.name}`);
      found++;
    }
  }
}

console.log(found ? `\n✗ ${found} top-level declaration(s) computed and never read` : '\n✓ no dead top-level declarations');
process.exitCode = found ? 1 : 0;
