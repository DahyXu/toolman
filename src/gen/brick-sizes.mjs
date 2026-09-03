import { esc, faq } from '../layout.mjs';

// Masonry is the clearest case on this site of a size that only makes sense
// once you add the mortar. A British brick is 215 × 102.5 × 65 mm and none of
// those numbers is useful on its own — what matters is the **format size**,
// the brick plus one 10 mm joint: 225 × 75. Everything follows from that.
//
//   1,000,000 mm² ÷ (225 × 75) = 59.3 bricks per square metre
//
// which is where the trade figure of "sixty bricks to the metre" comes from,
// and it is computed here rather than quoted.
//
// The American equivalent is only half modular, which most charts do not say: a
// modular brick is 7⅝ long, so length plus a ⅜ joint is exactly 8 inches — but
// 2¼ plus ⅜ is 2⅝, so three courses come to 7⅞ and the bed joint makes up the rest.

const IN = 25.4;

// [name, id, region, length, height, width mm (actual), joint mm, note]
const UNITS = [
  ['UK standard brick', 'uk-standard', 'UK', 215, 65, 102.5, 10,
    'The British standard since metrication and the size almost every new UK brick is made to. On its own 215 × 65 tells you nothing useful — add the 10 mm joint and it becomes 225 × 75, which is the number every setting-out drawing is built on.'],
  ['UK imperial brick', 'uk-imperial', 'UK', 228, 68, 108, 10,
    'The pre-metric British brick, still manufactured for extensions and repairs to older housing. It is 13 mm longer and 3 mm taller than the modern one, which is enough that a metric brick in an imperial wall shows as a visible step within four courses.'],
  ['UK metric modular', 'uk-modular', 'UK', 200, 75, 100, 10,
    'A rarely used alternative sized so that the format is a round 210 × 85. It never displaced the 215 standard, and mixing the two in one wall does not course.'],
  ['UK concrete block', 'uk-block', 'UK', 440, 215, 100, 10,
    'The standard British block. Its format is 450 × 225 — and 225 is exactly three brick courses, which is the whole point: blockwork and brickwork rise together, so a cavity wall can be built with brick outside and block inside and meet at every third course.'],
  ['US modular brick', 'us-modular', 'US', 7.625 * IN, 2.25 * IN, 3.625 * IN, 0.375 * IN,
    'The American standard. Its length is exactly modular — 7⅝ inches plus a ⅜ inch joint is 8 — but the height is not: 2¼ plus ⅜ is 2⅝, so three courses come to 7⅞ rather than 8. Bricklayers close the eighth of an inch by running the bed joint slightly fuller than the perpend, which is why the height looks arbitrary on paper and works out on site.'],
  ['US queen brick', 'us-queen', 'US', 7.625 * IN, 2.75 * IN, 3.125 * IN, 0.375 * IN,
    'Taller and thinner than a modular, so fewer are needed for the same wall. Popular with builders for exactly that reason, and it does not course with modular brick.'],
  ['US king brick', 'us-king', 'US', 9.625 * IN, 2.75 * IN, 3 * IN, 0.375 * IN,
    'Longer again than a queen. The economics are the same argument — fewer units, less labour — and the coursing is again its own.'],
  ['US utility brick', 'us-utility', 'US', 11.625 * IN, 3.625 * IN, 3.625 * IN, 0.375 * IN,
    'A nominal 12 × 4 × 4 inch unit, used where the scale of a building suits a larger face. Three utility courses rise 12 inches.'],
  ['US concrete block', 'us-cmu', 'US', 15.625 * IN, 7.625 * IN, 7.625 * IN, 0.375 * IN,
    'The standard American CMU, nominally 8 × 8 × 16 inches once the joint is counted. Two block courses equal three modular brick courses at 16 inches, which is the same coursing trick the British block plays.'],
];

const REGION = { UK: 'United Kingdom', US: 'North America' };
const f0 = (v) => Math.round(v);
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const inch = (mm) => {
  const v = mm / IN;
  return Math.abs(v - Math.round(v * 8) / 8) < 0.005 ? fracIn(v) : v.toFixed(2);
};
function fracIn(v) {
  const whole = Math.floor(v);
  const eighths = Math.round((v - whole) * 8);
  if (!eighths) return String(whole);
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(eighths, 8);
  return `${whole ? whole + ' ' : ''}${eighths / d}/${8 / d}`;
}

// The two coursing facts the section exists for, asserted rather than left in
// prose only: British blockwork courses with brickwork at exactly three to one,
// and an American modular brick is modular in length and not in height.
{
  const bad = [];
  const brickFmt = 65 + 10;
  const blockFmt = 215 + 10;
  if (Math.abs(blockFmt / brickFmt - 3) > 0.001) bad.push(`UK block format ${blockFmt} mm is not three brick courses of ${brickFmt} mm`);
  // Length is exactly modular: 7⅝ + ⅜ = 8 inches. Assert that, because it is
  // the part that is actually true.
  if (Math.abs((7.625 + 0.375) - 8) > 0.001) bad.push('US modular length plus joint is not exactly 8 inches');
  // And assert that the height is NOT, so that nobody "fixes" the prose back to
  // the folklore version: 2¼ + ⅜ gives 7⅞ over three courses.
  if (Math.abs(3 * (2.25 + 0.375) - 8) < 0.01) bad.push('three modular courses now come to 8 in — the height note needs revisiting');
  if (bad.length) {
    console.error('\n✗ masonry coursing no longer works out:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

export default async function () {
  const pages = [];

  const rows = UNITS.map(([name, id, region, l, h, w, joint, note]) => ({
    name, id, region, l, h, w, joint, note,
    fmtL: l + joint,
    fmtH: h + joint,
    perM2: 1e6 / ((l + joint) * (h + joint)),
    coursesPerM: 1000 / (h + joint),
    perMLength: 1000 / (l + joint),
  }));

  for (const r of rows) {
    const near = rows.filter((x) => x.id !== r.id && x.region === r.region);
    const isBrick = !r.name.includes('block') && !r.name.includes('CMU');

    const FAQ = faq([
      { q: `What size is a ${r.name.toLowerCase()}?`,
        a: `<strong>${f1(r.l)} × ${f1(r.h)} × ${f1(r.w)} mm</strong> (${inch(r.l)} × ${inch(r.h)} × ${inch(r.w)} in). Add the ${f1(r.joint)} mm joint and the working size — the format — is ${f1(r.fmtL)} × ${f1(r.fmtH)} mm.` },
      { q: `How many ${isBrick ? 'bricks' : 'blocks'} per square metre?`,
        a: `<strong>${f1(r.perM2)}</strong> for a single skin — ${Math.ceil(r.perM2)} in practice, before allowing for breakage. That comes straight from the format: 1,000,000 mm² ÷ (${f1(r.fmtL)} × ${f1(r.fmtH)}) = ${f2(r.perM2)}.` },
      { q: `How many courses per metre of height?`,
        a: `<strong>${f2(r.coursesPerM)}</strong> courses, at ${f1(r.fmtH)} mm each. Setting out from a fixed course height is why a window head or a damp course lands where it does rather than where a drawing might prefer.` },
      { q: `Why does the joint matter so much?`,
        a: `Because the ${isBrick ? 'brick' : 'block'} on its own is never the unit of construction. Masonry is set out on the <strong>format size</strong> — one unit plus one joint — and every dimension in a wall is a multiple of it. A ${f1(r.h)} mm ${isBrick ? 'brick' : 'block'} with a ${f1(r.joint)} mm bed rises ${f1(r.fmtH)} mm per course, and that ${f1(r.fmtH)} is the number the wall is actually built from.` },
    ]);

    pages.push({
      path: `/brick/${r.id}/`,
      title: `${r.name} — ${f0(r.l)} × ${f0(r.h)} × ${f0(r.w)} mm, ${Math.ceil(r.perM2)}/m² | Toolman`,
      desc: `A ${r.name.toLowerCase()} is ${f1(r.l)} × ${f1(r.h)} × ${f1(r.w)} mm. With a ${f1(r.joint)} mm joint the format is ${f1(r.fmtL)} × ${f1(r.fmtH)}, giving ${f1(r.perM2)} per square metre.`,
      h1: r.name,
      crumbs: [{ name: 'Brick sizes', path: '/brick/' }, { name: r.name, path: `/brick/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(r.l)} × ${f1(r.h)} × ${f1(r.w)} mm</strong></p>
<p class="muted">${inch(r.l)} × ${inch(r.h)} × ${inch(r.w)} in · format ${f1(r.fmtL)} × ${f1(r.fmtH)} mm · ${Math.ceil(r.perM2)} per m² · ${REGION[r.region]}</p>

<h2>About this unit</h2>
<p>${r.note}</p>

<h2>The size that matters is the format</h2>
<p>A ${isBrick ? 'brick' : 'block'} is never laid on its own. Add one ${f1(r.joint)} mm joint and the working unit becomes <strong>${f1(r.fmtL)} × ${f1(r.fmtH)} mm</strong>, and every dimension in the wall is a multiple of that rather than of the ${isBrick ? 'brick' : 'block'}.</p>
<table><tbody>
<tr><td>Actual size</td><td>${f1(r.l)} × ${f1(r.h)} × ${f1(r.w)} mm</td></tr>
<tr><td>Mortar joint</td><td>${f1(r.joint)} mm</td></tr>
<tr><td><strong>Format size</strong></td><td><strong>${f1(r.fmtL)} × ${f1(r.fmtH)} mm</strong></td></tr>
<tr><td>Per square metre, single skin</td><td>${f2(r.perM2)} — order ${Math.ceil(r.perM2 * 1.05)} with 5% waste</td></tr>
<tr><td>Courses per metre of height</td><td>${f2(r.coursesPerM)}</td></tr>
<tr><td>Units per metre of length</td><td>${f2(r.perMLength)}</td></tr>
</tbody></table>

<h2>Setting out</h2>
<p>Ten courses rise <strong>${f0(r.fmtH * 10)} mm</strong> and ten units run <strong>${f0(r.fmtL * 10)} mm</strong>. Openings, sills and damp courses are placed on those multiples wherever possible, because a wall that has to be cut to reach a dimension costs labour and shows.</p>

${near.length ? `<h2>Other ${REGION[r.region]} units</h2>
<table><thead><tr><th>Unit</th><th>Actual</th><th>Format</th><th>Per m²</th></tr></thead><tbody>
${near.map((x) => `<tr><td><a href="/brick/${x.id}/">${esc(x.name)}</a></td><td>${f0(x.l)} × ${f0(x.h)} × ${f0(x.w)} mm</td><td>${f1(x.fmtL)} × ${f1(x.fmtH)}</td><td>${f1(x.perM2)}</td></tr>`).join('')}
</tbody></table>` : ''}

${FAQ.html}

<p><a href="/brick/">All masonry sizes</a> · <a href="/lumber/">Lumber sizes</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const ukBrick = rows.find((r) => r.id === 'uk-standard');
  const ukBlock = rows.find((r) => r.id === 'uk-block');
  const usMod = rows.find((r) => r.id === 'us-modular');

  pages.push({
    path: '/brick/',
    title: 'Brick and Block Sizes — Format, Coursing and Bricks per m² | Toolman',
    desc: `A UK brick is 215 × 65 mm and none of that is the working size. Add a 10 mm joint and it is 225 × 75 — which is where "sixty bricks to the square metre" comes from.`,
    h1: 'Brick and block sizes',
    crumbs: [{ name: 'Brick sizes', path: '/brick/' }],
    body: `<p class="muted">${rows.length} masonry units with their actual size, their working format, and how many of each a square metre takes.</p>

<h2>Sixty bricks to the metre, and where that comes from</h2>
<p>A British brick is <strong>${f0(ukBrick.l)} × ${f0(ukBrick.h)} mm</strong> on the face, and that pair of numbers is not what a wall is built from. Add one ${f0(ukBrick.joint)} mm joint and the working unit — the <strong>format size</strong> — is ${f0(ukBrick.fmtL)} × ${f0(ukBrick.fmtH)}. From there:</p>
<pre><code>1,000,000 mm² ÷ (${f0(ukBrick.fmtL)} × ${f0(ukBrick.fmtH)}) = ${f2(ukBrick.perM2)} bricks per m²</code></pre>
<p>That is the trade figure of sixty, and it is arithmetic rather than folklore. Ten courses rise exactly ${f0(ukBrick.fmtH * 10)} mm, which is why brick buildings have so many dimensions that are multiples of 75.</p>

<h2>Why a block is three brick courses</h2>
<p>A British block is ${f0(ukBlock.l)} × ${f0(ukBlock.h)} mm, so its format is ${f0(ukBlock.fmtL)} × <strong>${f0(ukBlock.fmtH)}</strong> — and ${f0(ukBlock.fmtH)} is exactly three brick courses of ${f0(ukBrick.fmtH)}. That is deliberate. A cavity wall has brick on the outside and block on the inside, and they have to arrive level at every tie: <strong>one block course, three brick courses.</strong></p>

<h2>What "modular" means in an American brick</h2>
<p>Modular is a relationship rather than a size: the unit plus its joint is meant to land on an eight-inch grid so a whole building can be set out on one. <strong>In length it does exactly that</strong> — ${inch(usMod.l)} inches plus a ⅜ inch joint is 8, to the thousandth.</p>
<p>In height it does not, and most charts skip this. ${inch(usMod.h)} plus ⅜ is 2⅝, so three courses come to <strong>7⅞ inches, not 8</strong>. The missing eighth is made up on site by running the bed joint a little fuller than the perpend — about 7/16 rather than ⅜. So the eight-inch module is real, and half of it is achieved by the bricklayer rather than by the brick.</p>
<p>Queen and king bricks are taller and thinner, which means fewer units and less labour for the same wall. They also do not course with modular brick, so the choice is made once for a building rather than per delivery.</p>

<h2>Every unit</h2>
<table><thead><tr><th>Unit</th><th>Region</th><th>Actual (mm)</th><th>Format</th><th>Per m²</th><th>Courses/m</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/brick/${r.id}/">${esc(r.name)}</a></td><td>${REGION[r.region]}</td><td>${f0(r.l)} × ${f0(r.h)} × ${f0(r.w)}</td><td>${f1(r.fmtL)} × ${f1(r.fmtH)}</td><td>${f1(r.perM2)}</td><td>${f1(r.coursesPerM)}</td></tr>`).join('')}
</tbody></table>

<h2>Ordering</h2>
<p>The per-square-metre figures above are for a single skin and assume no waste. Add five per cent for breakage and cutting on a plain wall, and ten on anything with a lot of openings or angles — corners and reveals generate cut bricks that cannot be reused elsewhere.</p>
<p>A double-skin wall is two of these figures, not one, and a cavity wall of brick and block is one of each. The commonest ordering mistake is counting the wall once.</p>

<p><a href="/lumber/">Lumber sizes</a> · <a href="/door-size/">Door sizes</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
