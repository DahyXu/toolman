// Shoe sizing is the one reference on this site where the honest answer starts
// with "measure your foot". The scales are real and computable, but brands vary
// by up to a full size and no chart can fix that — so every page leads with the
// foot length in centimetres, which is the only number that means the same thing
// everywhere, and gives the scale conversions after it.
//
// The three relationships that make the arithmetic work:
//   one US/UK size step = 1/3 inch = 0.847 cm of foot
//   UK men's  = US men's − 0.5        UK women's = US women's − 2
//   US men's  = US women's − 1.5
//   EU (Paris point) ≈ (foot cm + 1.5) × 1.5 — it measures the *last*, not the foot
//
// Checked against six published rows from US 7 to 12; foot lengths agree within
// 0.15 cm and EU sizes within 0.6.

const CM_PER_SIZE = 0.84667; // one third of an inch
const footCm = (usMen) => 27.0 + (usMen - 9) * CM_PER_SIZE;
const euFrom = (cm) => (cm + 1.5) * 1.5;
const roundHalf = (v) => Math.round(v * 2) / 2;

// Published anchors. The formulas are convenient and the table is the authority,
// so a drift in either is a build failure rather than a quiet inaccuracy.
const PUBLISHED = [[7, 25.4, 40], [8, 26.0, 41], [9, 27.0, 42.5], [10, 27.9, 44], [11, 28.6, 45], [12, 29.4, 46]];
{
  const bad = [];
  for (const [us, cm, eu] of PUBLISHED) {
    const gotCm = footCm(us), gotEu = euFrom(gotCm);
    if (Math.abs(gotCm - cm) > 0.35) bad.push(`US men's ${us}: computed ${gotCm.toFixed(1)} cm, published ${cm}`);
    if (Math.abs(gotEu - eu) > 0.8) bad.push(`US men's ${us}: computed EU ${gotEu.toFixed(1)}, published ${eu}`);
  }
  if (bad.length) {
    console.error('\n✗ shoe size formulas no longer match the published charts:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const MEN = [];
for (let s = 6; s <= 14; s += 0.5) MEN.push(s);
const WOMEN = [];
for (let s = 5; s <= 12; s += 0.5) WOMEN.push(s);

const lbl = (v) => (Number.isInteger(v) ? String(v) : `${Math.floor(v)}.5`);
const slg = (v) => (Number.isInteger(v) ? String(v) : `${Math.floor(v)}-5`);
const f1 = (v) => v.toFixed(1);

export default async function () {
  const pages = [];

  const rows = [];
  for (const us of MEN) {
    const cm = footCm(us);
    rows.push({ kind: 'men', us, cm, uk: us - 0.5, eu: roundHalf(euFrom(cm)), id: `mens-${slg(us)}` });
  }
  for (const us of WOMEN) {
    const cm = footCm(us - 1.5);
    rows.push({ kind: 'women', us, cm, uk: us - 2, eu: roundHalf(euFrom(cm)), id: `womens-${slg(us)}` });
  }

  const men = rows.filter((r) => r.kind === 'men');
  const women = rows.filter((r) => r.kind === 'women');

  pages.push({
    path: '/shoe-size/',
    title: 'Shoe Size Chart — US, UK and EU Conversion with Foot Length | Toolman',
    desc: 'US, UK and EU shoe sizes with the foot length each one fits. EU sizes measure the last rather than the foot, and US men\'s and women\'s are offset by 1.5 — here is the whole chart in centimetres.',
    h1: 'Shoe sizes',
    crumbs: [{ name: 'Shoe sizes', path: '/shoe-size/' }],
    body: `<p class="muted">Men's and women's sizes in US, UK and EU, with the foot length each one is built for.</p>

<h2>Start with the centimetres</h2>
<p>Every scale on this page is a convention. <strong>Foot length is a measurement</strong>, and it is the only figure that survives crossing a border or changing a brand. Stand on paper with your heel to a wall, mark your longest toe, measure — at the end of the day, and both feet, because one is usually larger and the shoe has to fit that one.</p>
<p>One size step is a third of an inch, or ${CM_PER_SIZE.toFixed(2)} cm. <strong>Half a size is about four millimetres</strong>, which is less than a foot swells over a day. That is the scale of precision the whole system is working at, and it is why the same person can honestly be two different sizes.</p>

<h2>Three things the charts do not say</h2>
<p><strong>EU sizes measure the shoe, not the foot.</strong> A Paris point is two thirds of a centimetre and the size is the length of the last the shoe is built on, which includes room for the toes. That is why EU ${roundHalf(euFrom(27))} corresponds to a 27 cm foot rather than a 27 cm shoe — the number will never match anything you can measure on yourself.</p>
<p><strong>US men's and women's are offset by 1.5.</strong> A women's 8 and a men's 8 are not the same shoe; the women's is a men's 6.5. Where a listing says only "size 8", it is worth finding out which range it means before ordering.</p>
<p><strong>UK differs from US by a different amount in each range</strong> — half a size in men's and two sizes in women's. There is no single offset to remember.</p>

<h2>Men's</h2>
<table><thead><tr><th>US</th><th>UK</th><th>EU</th><th>Foot length</th></tr></thead><tbody>
${men.map((r) => `<tr><td><strong>${lbl(r.us)}</strong></td><td>${lbl(r.uk)}</td><td>${r.eu}</td><td>${f1(r.cm)} cm · ${f1(r.cm / 2.54)} in</td></tr>`).join('')}
</tbody></table>

<h2>Women's</h2>
<table><thead><tr><th>US</th><th>UK</th><th>EU</th><th>Foot length</th></tr></thead><tbody>
${women.map((r) => `<tr><td><strong>${lbl(r.us)}</strong></td><td>${lbl(r.uk)}</td><td>${r.eu}</td><td>${f1(r.cm)} cm · ${f1(r.cm / 2.54)} in</td></tr>`).join('')}
</tbody></table>

<h2>Why a chart can only get you close</h2>
<p>A shoe size describes the last — the wooden or plastic form the shoe is built around — and every maker has its own lasts. Two brands can differ by a full size at the same nominal number, and the same brand can differ between a running shoe and a boot. Width is a separate dimension that most sizing ignores entirely.</p>
<p>So: use the centimetre figure to find the right row, then check the maker's own chart, and treat any single number with suspicion. This page will get you to within half a size, which is as far as any conversion honestly goes.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/ring-size/">Ring sizes</a> · <a href="/bed-size/">Bed sizes</a></p>`,
  });

  return pages;
}
