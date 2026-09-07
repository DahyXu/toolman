import fs from 'node:fs';

/**
 * Re-derive the figures on a page from the page itself.
 *
 * Every generated section already asserts its own arithmetic. That is the
 * weaker of the two available checks, for two reasons: an assertion tests what
 * its author thought to test, and it tests the numbers *before* they are
 * rendered. This reads the built HTML back and recomputes the figures from
 * first principles, sharing no code with the generator that produced them.
 *
 * It earned its place on the first run. The capacitor pages asserted that the
 * picofarad, nanofarad and microfarad figures were one quantity — and they were,
 * as numbers. What went out was "Microfarads: 0 µF" for a 0.39 pF part, because
 * `toFixed(6)` cannot hold a sub-picofarad value in microfarads. The generator
 * compared the quantities and was satisfied; the renderer lost what the
 * arithmetic had right. Only reading the page back could see it.
 *
 * The first version of this script also produced 24 false alarms on the
 * fastener pages, by matching the Pitch and Across-flats columns as though they
 * were Across-flats and Across-corners. A check that reads HTML has to be
 * anchored on the headers, not on the shape of the row.
 */

const fail = [];
let pages = 0;
let figures = 0;

const read = (p) => fs.readFileSync(p, 'utf8');
const strip = (html) => {
  const body = (html.split('<main')[1] || html).split('</main>')[0];
  return body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/&minus;/g, '−').replace(/&times;/g, '×').replace(/\s+/g, ' ');
};

// A spread of pages rather than the first N, which would all be one prefix.
const spread = (dir, n) => {
  if (!fs.existsSync(dir)) return [];
  const all = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const out = new Set();
  for (let i = 0; i < n && all.length; i++) out.add(all[Math.floor((i * all.length) / n)]);
  return [...out];
};

const note = (where, msg) => fail.push(`${where} — ${msg}`);

// ── Resistors. Read the bands off the page and decode them here.
{
  const DIGIT = { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, grey: 8, white: 9 };
  const MULT = { silver: 0.01, gold: 0.1, black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4, green: 1e5, blue: 1e6 };
  for (const id of spread('dist/resistor', 20)) {
    const t = strip(read(`dist/resistor/${id}/index.html`));
    pages++;
    const m = /Band 1 — first digit (\w+) = (\d).*?Band 2 — second digit (\w+) = (\d).*?Band 3 — multiplier (\w+).*?Value ([\d.]+) (Ω|kΩ|MΩ)/.exec(t);
    if (!m) { note(`/resistor/${id}/`, 'the band table could not be read'); continue; }
    const [, b1, d1, b2, d2, mult, val, unit] = m;
    if (DIGIT[b1] !== +d1) note(`/resistor/${id}/`, `${b1} is digit ${DIGIT[b1]}, the page says ${d1}`);
    if (DIGIT[b2] !== +d2) note(`/resistor/${id}/`, `${b2} is digit ${DIGIT[b2]}, the page says ${d2}`);
    const stated = +val * (unit === 'kΩ' ? 1e3 : unit === 'MΩ' ? 1e6 : 1);
    const computed = (DIGIT[b1] * 10 + DIGIT[b2]) * MULT[mult];
    figures++;
    if (Math.abs(computed - stated) > stated * 1e-6) {
      note(`/resistor/${id}/`, `${b1}-${b2}-${mult} decodes to ${computed} Ω, the page states ${stated} Ω`);
    }
  }
}

// ── Capacitors. Decode the code in the URL and check every unit rendered,
//    including that none of them rendered as zero.
{
  const MULT = { 0: 1, 1: 10, 2: 100, 3: 1e3, 4: 1e4, 5: 1e5, 6: 1e6, 8: 0.01, 9: 0.1 };
  const num = (s) => Number(String(s).replace(/,/g, ''));
  for (const code of spread('dist/capacitor', 20)) {
    if (!/^\d{3}$/.test(code)) continue;
    const t = strip(read(`dist/capacitor/${code}/index.html`));
    pages++;
    const pf = +code.slice(0, 2) * MULT[+code.slice(2)];
    const m = /Picofarads ([\d,.e+-]+) pF Nanofarads ([\d,.e+-]+) nF Microfarads ([\d,.e+-]+) µF/.exec(t);
    if (!m) { note(`/capacitor/${code}/`, 'the unit table could not be read'); continue; }
    const [, p, n, u] = m;
    figures += 3;
    // Four significant figures is what the pages render to, so compare there.
    const close = (a, b) => b === 0 ? a === 0 : Math.abs(a - b) <= Math.abs(b) * 2e-3;
    if (!close(num(p), pf)) note(`/capacitor/${code}/`, `code ${code} is ${pf} pF, the page says ${p}`);
    if (!close(num(n), pf / 1e3)) note(`/capacitor/${code}/`, `${p} pF is ${pf / 1e3} nF, the page says ${n}`);
    if (!close(num(u), pf / 1e6)) note(`/capacitor/${code}/`, `${p} pF is ${pf / 1e6} µF, the page says ${u}`);
    for (const [unit, shown] of [['nF', n], ['µF', u]]) {
      if (num(shown) === 0) note(`/capacitor/${code}/`, `renders as 0 ${unit}, which is not a capacitance`);
    }
  }
}

// ── Drill sizes. Inches against millimetres, from the page alone.
{
  for (const id of spread('dist/drill-size', 20)) {
    const t = strip(read(`dist/drill-size/${id}/index.html`));
    pages++;
    const m = /Inches ([\d.]+) in Millimetres ([\d.]+) mm/.exec(t);
    if (!m) { note(`/drill-size/${id}/`, 'the size table could not be read'); continue; }
    figures++;
    if (Math.abs(+m[1] * 25.4 - +m[2]) > 0.01) {
      note(`/drill-size/${id}/`, `${m[1]} in is ${(+m[1] * 25.4).toFixed(3)} mm, the page says ${m[2]}`);
    }
  }
}

// ── Tap drills. The 75% formula, from the major diameter and TPI the page
//    prints, against the drill it recommends.
{
  for (const id of spread('dist/tap-drill', 20)) {
    const t = strip(read(`dist/tap-drill/${id}/index.html`));
    pages++;
    const m = /Major diameter ([\d.]+)" .*?Threads per inch (\d+)/.exec(t);
    const d = /Tap drill \(75% thread\) \S+ — ([\d.]+)"/.exec(t);
    if (!m || !d) { note(`/tap-drill/${id}/`, 'the table could not be read'); continue; }
    figures++;
    const theoretical = +m[1] - (1.299 * 0.75) / +m[2];
    // The drill is the nearest stocked size to the theoretical figure, so the
    // gap can be half the spacing of the drills around it. At the large end that
    // spacing is a 64th of an inch, so the bound is half of 0.0156 — calibrated
    // at 0.006 it reported 7/8-14 as wrong when 13/16 is genuinely the nearest.
    if (Math.abs(theoretical - +d[1]) > 0.008) {
      note(`/tap-drill/${id}/`, `${m[1]} − 0.974/${m[2]} is ${theoretical.toFixed(4)}", the page's drill is ${d[1]}"`);
    }
  }
}

// ── Time differences. The hour-by-hour table must be one constant shift.
{
  for (const id of spread('dist/time-difference', 24)) {
    if (id === 'country') continue;
    const html = read(`dist/time-difference/${id}/index.html`);
    if (!html.includes('hour by hour')) continue;
    pages++;
    const rows = [...html.matchAll(/<tr><td>(\d+:\d\d [AP]M)<\/td><td>(\d+:\d\d [AP]M)(?: \((?:next|previous) day\))?<\/td><\/tr>/g)];
    if (rows.length < 20) { note(`/time-difference/${id}/`, `only ${rows.length} rows in the hourly table`); continue; }
    const mins = (s) => {
      const [, h, m, ap] = /(\d+):(\d\d) ([AP]M)/.exec(s);
      return ((+h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + +m;
    };
    const shifts = new Set(rows.map((r) => (((mins(r[2]) - mins(r[1])) % 1440) + 1440) % 1440));
    figures += rows.length;
    if (shifts.size !== 1) {
      note(`/time-difference/${id}/`, `the hourly table is not one constant shift: ${[...shifts].join(', ')} minutes`);
    }
  }
}

// ── Fasteners. Across corners is across flats over cos 30°. Anchored on the
//    headers: the first version matched Pitch against Across flats and reported
//    24 faults that were its own.
{
  for (const id of spread('dist/fastener', 8)) {
    const html = read(`dist/fastener/${id}/index.html`);
    pages++;
    const headers = [...html.matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1]);
    const flats = headers.indexOf('Across flats');
    const corners = headers.indexOf('Across corners');
    if (flats < 0 || corners < 0) continue; // socket and nut standards have no such table
    for (const row of [...html.matchAll(/<tr><td>([\s\S]*?)<\/tr>/g)].slice(0, 8)) {
      const cells = row[1].split('</td>').map((c) => c.replace(/<[^>]+>/g, '').trim());
      const f = parseFloat(cells[flats]);
      const c = parseFloat(cells[corners]);
      if (!isFinite(f) || !isFinite(c)) continue;
      figures++;
      const want = f / Math.cos(Math.PI / 6);
      if (Math.abs(want - c) > 0.01) {
        note(`/fastener/${id}/`, `${f} mm across flats is ${want.toFixed(2)} mm across corners, the page says ${c}`);
      }
    }
  }
}

console.log(`\nRe-derived ${figures.toLocaleString()} figures across ${pages} pages, reading only the built HTML\n`);
console.log(`${fail.length ? '✗' : '✓'} pages disagreeing with their own arithmetic   ${fail.length}`);
for (const f of fail.slice(0, 20)) console.log(`    ${f}`);
if (fail.length > 20) console.log(`    … and ${fail.length - 20} more`);
console.log(fail.length
  ? '\n✗ a generated figure is not what the page it sits on implies\n'
  : '\n✓ every figure re-derived from a page matches what the page states\n');
process.exit(fail.length ? 1 : 0);
