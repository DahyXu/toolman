import fs from 'node:fs';
import path from 'node:path';

/**
 * A heading with nothing under it.
 *
 * `seriesMaths()` returned '' for every size that is not A, B, C or US, and the
 * page printed the heading anyway. Forty-four paper pages shipped with
 * "How JIS B5 relates to the rest of the series" above the next heading — the
 * eleven JIS B pages among them added a day earlier, by me, without noticing.
 *
 * Nothing caught it. The HTML is well-formed, the page has a title, a
 * description, an h1, internal links and valid JSON-LD; every existing check
 * passed. An empty section is invisible to all of them and obvious to anyone
 * reading the page, which is the gap this closes.
 *
 * The first version of this check looked at the text between a heading and the
 * *next heading of any level*, and reported 9,432 pages — every FAQ section on
 * the site, because an h2 whose content is a run of h3s has nothing of its own
 * in between. A section ends at the next heading of the same or higher level,
 * not at the next heading.
 */

const DIST = 'dist';

// Sections these pages fill from JavaScript once the tool runs. Named
// individually rather than skipped by pattern, so a genuinely empty section
// appearing on one of them still has to be added here on purpose.
const FILLED_AT_RUNTIME = new Map([
  ['/age-calculator/', ['Next birthday', 'Milestones']],
  ['/color-converter/', ['Tints and shades', 'Contrast check (WCAG)']],
  ['/cron-expression-generator/', ['Next 10 runs (your local time zone)']],
  ['/number-base-converter/', ['Bit breakdown']],
  ['/roman-numeral-converter/', ['How it breaks down']],
  ['/subnet-calculator/', ['Binary view']],
  ['/url-encode-decode/', ['URL parser']],
  ['/word-counter/', ['Length limits']],
]);

// Naming the section is not enough on its own. Four of the ten names above were
// wrong on the first pass — written from what the section looked like it should
// be called rather than from the page — so an exemption also has to show its
// mechanism: an element inside the empty section whose id the page's own script
// writes to. A tool section that stops being filled loses its exemption without
// anyone having to remember to remove it.
function scriptFills(html, section) {
  const ids = [...section.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  return ids.some((id) => html.includes("'" + id + "'") || html.includes('"' + id + '"'));
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return e.name === 'index.html' ? [full] : [];
  });
}

const HEADING = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g;
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const empty = [];
const files = walk(DIST);

for (const file of files) {
  const url = '/' + path.relative(DIST, file).split(path.sep).slice(0, -1).join('/');
  const route = url === '/' ? '/' : url + '/';
  const html = fs.readFileSync(file, 'utf8');
  const body = (html.split('<main')[1] || html).split('</main>')[0];
  const heads = [...body.matchAll(HEADING)];

  for (let i = 0; i < heads.length; i++) {
    const level = +heads[i][1];
    const start = heads[i].index + heads[i][0].length;
    let end = body.length;
    for (let j = i + 1; j < heads.length; j++) {
      if (+heads[j][1] <= level) { end = heads[j].index; break; }
    }
    if (strip(body.slice(start, end))) continue;

    const title = strip(heads[i][2]);
    const allowed = FILLED_AT_RUNTIME.get(route);
    if (allowed && allowed.includes(title) && scriptFills(html, body.slice(start, end))) continue;
    empty.push(`${route} — "${title}"`);
  }
}

console.log(`\nRead ${files.length.toLocaleString()} pages\n`);
console.log(`${empty.length ? '✗' : '✓'} headings with nothing under them   ${empty.length}`);
for (const e of empty.slice(0, 25)) console.log(`    ${e}`);
if (empty.length > 25) console.log(`    … and ${empty.length - 25} more`);

const exempt = [...FILLED_AT_RUNTIME.values()].reduce((n, v) => n + v.length, 0);
console.log(`\n${exempt} sections on tool pages are filled by JavaScript and are named in this script.`);
console.log(empty.length ? '\n✗ a heading is a promise the section under it has to keep\n' : '\n✓ every heading has something under it\n');
process.exit(empty.length === 0 ? 0 : 1);
