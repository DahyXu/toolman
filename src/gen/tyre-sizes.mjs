import { faq } from '../layout.mjs';

// A tyre marking is three measurements and people read it as a part number.
// 205/55R16 is 205 mm across the tread, a sidewall 55% of that (112.75 mm), on a
// 16-inch rim — so the overall diameter is 16 × 25.4 + 2 × 112.75 = 631.9 mm.
// Everything on these pages comes out of that one line.
//
// The reason it is worth a page each rather than a calculator: the aspect ratio
// is a *percentage of the width*, so a wider tyre with the same aspect number is
// also taller, and two markings that look nothing alike can be the same size.
// 205/55R16, 225/45R17 and 195/65R15 are all within half a percent of each
// other, which is exactly why a manufacturer offers all three on one car.

const SIZES = [
  '155/70R13', '165/65R14', '175/65R14', '175/70R14', '185/60R14',
  '185/55R15', '185/65R15', '195/60R15', '195/65R15',
  '195/55R16', '205/55R16', '205/60R16', '205/65R16', '215/55R16', '215/60R16', '215/65R16', '245/70R16', '265/70R16',
  '205/50R17', '215/45R17', '215/55R17', '215/60R17', '225/45R17', '225/50R17', '225/55R17', '225/60R17', '225/65R17',
  '235/45R17', '235/55R17', '235/65R17', '265/65R17', '265/70R17',
  '225/40R18', '235/40R18', '235/60R18', '245/40R18', '245/45R18', '255/45R18', '255/55R18', '265/60R18',
  '245/35R19', '255/35R19', '255/40R19', '275/35R19',
  '245/40R20', '275/40R20', '275/45R20', '275/55R20', '285/35R20', '305/30R20', '315/35R20',
  '295/35R21', '285/45R22',
];

const parse = (s) => {
  const m = /^(\d+)\/(\d+)R(\d+)$/.exec(s);
  const w = +m[1], a = +m[2], r = +m[3];
  const sidewall = (w * a) / 100;
  const dia = r * 25.4 + 2 * sidewall;
  return { s, w, a, r, sidewall, dia, circ: Math.PI * dia };
};

const rows = SIZES.map(parse).sort((x, y) => x.r - y.r || x.w - y.w || x.a - y.a);
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

export default async function () {
  const pages = [];

  for (const t of rows) {
    const id = t.s.replace('/', '-').toLowerCase();

    // Alternatives within 3% of this diameter, which is the band inside which a
    // tyre is a candidate replacement. Under 1% is where fitments are treated as
    // interchangeable; over 3% and the speedometer error stops being ignorable.
    const alts = rows
      .filter((x) => x.s !== t.s && Math.abs(x.dia / t.dia - 1) <= 0.03)
      .sort((a, b) => Math.abs(a.dia - t.dia) - Math.abs(b.dia - t.dia))
      .slice(0, 10);
    const equivalent = alts.filter((x) => Math.abs(x.dia / t.dia - 1) <= 0.01);
    const sameRim = rows.filter((x) => x.r === t.r && x.s !== t.s).slice(0, 8);

    const FAQ = faq([
      { q: `What does ${t.s} mean?`,
        a: `<strong>${t.w}</strong> is the tread width in millimetres, <strong>${t.a}</strong> is the sidewall height as a percentage of that width — so ${t.w} × ${t.a}% = ${f1(t.sidewall)} mm of sidewall — and <strong>R${t.r}</strong> is a radial tyre on a ${t.r}-inch rim. Overall diameter is ${t.r} × 25.4 + 2 × ${f1(t.sidewall)} = <strong>${f1(t.dia)} mm</strong>.` },
      { q: `What is the overall diameter of a ${t.s}?`,
        a: `<strong>${f1(t.dia)} mm</strong> (${f2(t.dia / 25.4)} inches), with a rolling circumference of ${f2(t.circ / 1000)} m — about ${Math.round(1e6 / t.circ)} revolutions per kilometre.` },
      equivalent.length
        ? { q: `What size is equivalent to a ${t.s}?`,
            a: `${equivalent.slice(0, 3).map((x) => `<strong>${x.s}</strong> (${((x.dia / t.dia - 1) * 100 >= 0 ? '+' : '') + f2((x.dia / t.dia - 1) * 100)}%)`).join(', ')} — all within 1% of this diameter, which is the band inside which a manufacturer will list alternatives for the same car. Width and rim differ; rolling diameter does not.` }
        : { q: `Is ${t.s} an unusual size?`,
            a: `Nothing else in this list is within 1% of its diameter, so replacements need checking against the vehicle's placard rather than picked by eye.` },
      { q: `How much does changing tyre size affect the speedometer?`,
        a: `A speedometer counts wheel revolutions, so it reads in proportion to the rolling diameter it was calibrated for. Fitting a tyre <strong>1% larger makes the speedometer read 1% low</strong> — at an indicated 100 km/h you are doing 101. Most jurisdictions expect a speedometer to never under-read, which is why replacements are kept within about 3% and why the factory tyre usually reads a little high to begin with.` },
    ]);

    pages.push({
      path: `/tyre/${id}/`,
      title: `${t.s} Tyre — ${f1(t.dia)} mm Diameter, ${f1(t.sidewall)} mm Sidewall | Toolman`,
      desc: `A ${t.s} tyre is ${f1(t.dia)} mm (${f2(t.dia / 25.4)} in) in overall diameter with a ${f1(t.sidewall)} mm sidewall. What the numbers mean, equivalent sizes, and the speedometer effect of changing.`,
      h1: `${t.s} tyre size`,
      crumbs: [{ name: 'Tyre sizes', path: '/tyre/' }, { name: t.s, path: `/tyre/${id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f1(t.dia)} mm diameter</strong></p>
<p class="muted">${f2(t.dia / 25.4)} in · ${f1(t.sidewall)} mm sidewall · ${f2(t.circ / 1000)} m rolling circumference · ${Math.round(1e6 / t.circ)} rev/km</p>

<h2>Reading ${t.s}</h2>
<table><tbody>
<tr><td><strong>${t.w}</strong></td><td>Tread width in millimetres</td></tr>
<tr><td><strong>${t.a}</strong></td><td>Aspect ratio — sidewall height as a percentage of the width, so ${t.w} × ${t.a}% = ${f1(t.sidewall)} mm</td></tr>
<tr><td><strong>R</strong></td><td>Radial construction, which is almost every road tyre made since the 1970s</td></tr>
<tr><td><strong>${t.r}</strong></td><td>Rim diameter in inches — ${f1(t.r * 25.4)} mm</td></tr>
</tbody></table>
<p>The aspect ratio is the part that catches people: it is a <strong>percentage of the width, not a fixed height</strong>. Widen the tread and keep the same aspect number and the tyre also gets taller. That is why ${t.s} and a size with a smaller aspect number on a larger rim can be the same overall diameter.</p>

<h2>The numbers</h2>
<table><tbody>
<tr><td>Tread width</td><td>${t.w} mm · ${f2(t.w / 25.4)} in</td></tr>
<tr><td>Sidewall height</td><td>${f1(t.sidewall)} mm · ${f2(t.sidewall / 25.4)} in</td></tr>
<tr><td>Rim diameter</td><td>${t.r} in · ${f1(t.r * 25.4)} mm</td></tr>
<tr><td>Overall diameter</td><td><strong>${f1(t.dia)} mm</strong> · ${f2(t.dia / 25.4)} in</td></tr>
<tr><td>Rolling circumference</td><td>${f1(t.circ)} mm · ${f2(t.circ / 1000)} m</td></tr>
<tr><td>Revolutions per kilometre</td><td>${Math.round(1e6 / t.circ)}</td></tr>
<tr><td>Revolutions per mile</td><td>${Math.round(1609344 / t.circ)}</td></tr>
</tbody></table>

${alts.length ? `<h2>Sizes that fit in place of ${t.s}</h2>
<p>A replacement is judged on rolling diameter, because that is what the speedometer, the ABS and the gearing all depend on. Anything within about 1% is treated as interchangeable; beyond 3% the speedometer error stops being ignorable.</p>
<table><thead><tr><th>Size</th><th>Diameter</th><th>Difference</th><th>Speedometer at an indicated 100</th></tr></thead><tbody>
${alts.map((x) => {
        const pct = (x.dia / t.dia - 1) * 100;
        const trueSpeed = 100 * (x.dia / t.dia);
        return `<tr><td><a href="/tyre/${x.s.replace('/', '-').toLowerCase()}/">${x.s}</a></td><td>${f1(x.dia)} mm</td><td>${pct >= 0 ? '+' : ''}${f2(pct)}%</td><td>${f1(trueSpeed)} km/h actual</td></tr>`;
      }).join('')}
</tbody></table>
<p class="muted">Diameter is only half the question — the replacement also has to suit the rim width and the vehicle's load and speed ratings. Check the placard in the door frame before buying.</p>` : ''}

${sameRim.length ? `<h2>Other ${t.r}-inch sizes</h2>
<table><thead><tr><th>Size</th><th>Sidewall</th><th>Diameter</th></tr></thead><tbody>
${sameRim.map((x) => `<tr><td><a href="/tyre/${x.s.replace('/', '-').toLowerCase()}/">${x.s}</a></td><td>${f1(x.sidewall)} mm</td><td>${f1(x.dia)} mm</td></tr>`).join('')}
</tbody></table>` : ''}

${FAQ.html}

<p><a href="/tyre/">All tyre sizes</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const a = rows.find((x) => x.s === '205/55R16');
  const b = rows.find((x) => x.s === '225/45R17');
  const c = rows.find((x) => x.s === '195/65R15');
  const byRim = {};
  for (const t of rows) (byRim[t.r] ||= []).push(t);

  pages.push({
    path: '/tyre/',
    title: 'Tyre Size Chart — Diameter, Sidewall and Equivalent Sizes | Toolman',
    desc: 'What a tyre marking means and what each size actually measures. 205/55R16 is 631.9 mm across — and 225/45R17 is within half a percent of it, which is why cars are offered with both.',
    h1: 'Tyre sizes',
    crumbs: [{ name: 'Tyre sizes', path: '/tyre/' }],
    body: `<p class="muted">${rows.length} common tyre sizes with their real diameter, sidewall height and rolling circumference.</p>

<h2>A tyre marking is three measurements</h2>
<p>Take <strong>205/55R16</strong>. The tread is 205 mm wide. The sidewall is <strong>55% of that</strong> — ${f1(a.sidewall)} mm — and there is one at the top and one at the bottom. The rim is 16 inches, or ${f1(16 * 25.4)} mm. So:</p>
<pre><code>diameter = 16 × 25.4 + 2 × (205 × 0.55)
         = ${f1(16 * 25.4)} + ${f1(2 * a.sidewall)}
         = ${f1(a.dia)} mm</code></pre>
<p>The aspect ratio being a <em>percentage</em> is the part that surprises people. A 225 tyre at 55 is taller than a 205 at 55, because 55% of a bigger number is bigger. It also means two markings that look unrelated can describe almost the same tyre.</p>

<h2>Why one car is offered three different sizes</h2>
<p>${a.s}, ${b.s} and ${c.s} come out at ${f1(a.dia)}, ${f1(b.dia)} and ${f1(c.dia)} mm — <strong>a spread of ${f2((Math.max(a.dia, b.dia, c.dia) / Math.min(a.dia, b.dia, c.dia) - 1) * 100)}%</strong>. That is why a manufacturer can list all three against the same model: the wheel gets bigger, the sidewall gets shorter, and the rolling diameter stays where the speedometer, the gearing and the ABS expect it.</p>
<p>The rule this produces is worth carrying: <strong>go up an inch of rim, drop about 10 points of aspect ratio, and add 10 mm of width</strong>, and the diameter comes out close.</p>

<h2>What changing the diameter does</h2>
<p>A speedometer counts wheel revolutions and multiplies by a fixed factor, so it reads in proportion to the diameter it was calibrated for. Fit a tyre <strong>1% larger and the speedometer reads 1% low</strong>: at an indicated 100 km/h you are doing 101. Odometer, trip computer and fuel consumption all shift by the same proportion. Most jurisdictions require a speedometer never to under-read, which is why factory tyres usually read slightly high and why replacements are kept inside about 3%.</p>

${Object.entries(byRim).sort((x, y) => +x[0] - +y[0]).map(([rim, list]) => `<h2>${rim}-inch</h2>
<table><thead><tr><th>Size</th><th>Sidewall</th><th>Diameter</th><th>Circumference</th><th>Rev/km</th></tr></thead><tbody>
${list.map((t) => `<tr><td><a href="/tyre/${t.s.replace('/', '-').toLowerCase()}/">${t.s}</a></td><td>${f1(t.sidewall)} mm</td><td>${f1(t.dia)} mm</td><td>${f2(t.circ / 1000)} m</td><td>${Math.round(1e6 / t.circ)}</td></tr>`).join('')}
</tbody></table>`).join('')}

<p class="muted">Diameter is not the whole decision. A replacement also has to suit the rim width and carry the vehicle's load and speed ratings, which are the letters and numbers after the size on the sidewall. The placard in the driver's door frame is the authority for what a particular car takes.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/thread/">Metric threads</a> · <a href="/awg/">Wire gauge</a></p>`,
  });

  return pages;
}
