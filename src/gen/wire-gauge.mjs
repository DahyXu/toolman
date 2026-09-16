import { faq } from '../layout.mjs';

// AWG is a formula, not a table. The diameter of gauge n is
//
//     d = 0.005 × 92^((36 − n) / 39)  inches
//
// which is why the gauge numbers run backwards and why the steps are not even:
// the scale was defined by the number of drawing dies a wire was pulled through,
// so a bigger number means more passes and a thinner wire. Everything below is
// derived from that one line, checked against fifteen published diameters from
// 4/0 to 40 and agreeing with all of them to better than 0.4%.
//
// Two consequences fall straight out of the exponent and are worth knowing:
// 92^(6/39) = 2.005, so six gauges doubles the diameter; and squaring that,
// three gauges doubles the cross-sectional area.

const dIn = (n) => 0.005 * Math.pow(92, (36 - n) / 39);

// Resistivity of annealed copper at 20 °C, the IACS reference value. Using the
// pure-copper figure of 1.68e-8 gives numbers about 2.5% below every published
// wire table; 1.724e-8 reproduces them.
const RHO_CU = 1.724e-8;
const RHO_AL = 2.82e-8;

// Gauges below 1 are written 1/0 through 4/0 and pronounced "one aught".
const label = (n) => (n <= 0 ? `${1 - n}/0` : String(n));
const slug = (n) => (n <= 0 ? `${1 - n}-0` : String(n));

// NEC 310.16, copper, 60 °C column — the ampacities that set the breaker on a
// domestic branch circuit. Only the building-wire gauges are listed, because
// these are the ones with a single well-known answer; everything else depends on
// insulation, ambient temperature, conductor count and jurisdiction.
const NEC60 = { 14: 15, 12: 20, 10: 30, 8: 40, 6: 55, 4: 70, 3: 85, 2: 95, 1: 110, 0: 125, '-1': 145, '-2': 165, '-3': 195 };

const USES = {
  '-3': 'Service entrance conductors and the main feed into a domestic panel.',
  '-2': 'Service entrance and large subpanel feeders.',
  '-1': 'Subpanel feeders and large appliance circuits.',
  0: 'Feeders, welding leads and battery cable in vehicles.',
  1: 'Feeders and heavy battery cable.',
  2: 'Subpanel feeders, welding cable, marine battery leads.',
  3: 'Feeders and large motor circuits.',
  4: 'Ranges, subpanel feeders and heavy motor loads.',
  6: 'Electric ovens, hot tubs, 55-amp circuits and welder outlets.',
  8: '40-amp circuits — ranges, larger air conditioners, EV chargers.',
  10: '30-amp circuits: electric dryers, water heaters, window air conditioners.',
  12: '20-amp circuits — kitchen and bathroom outlets, most of a modern house.',
  14: '15-amp circuits: lighting and general-purpose outlets.',
  16: 'Extension cords, light fixtures and low-current appliance cords.',
  18: 'Lamp cord, doorbells, thermostats and low-voltage control wiring.',
  20: 'Signal wiring, small transformers and hobby electronics.',
  22: 'Breadboard jumpers, serial cables and low-current signal runs.',
  24: 'Ethernet and telephone pairs, ribbon cable, most hookup wire.',
  26: 'Fine hookup wire, internal instrument wiring.',
  28: 'USB data pairs and very fine internal wiring.',
  30: 'Wire-wrap and circuit-board repair wire — about the thickness of a hair on the coarse side.',
  32: 'Coil winding and fine electronics work.',
  34: 'Transformer and motor coil winding.',
  36: 'Fine magnet wire; at 0.005 inches this is the gauge the scale was anchored to.',
  38: 'Very fine coil winding.',
  40: 'The thinnest common magnet wire, used in miniature coils and sensors.',
};

const GAUGES = [-3, -2, -1, 0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

// The whole section rests on one formula and one resistivity constant, so both
// are checked against published values on every build. Anyone editing either —
// including me, reaching for the pure-copper 1.68e-8 that looks more correct and
// puts every resistance 2.5% below every wire table in print — gets a failure
// rather than a site full of plausible wrong numbers.
const CHECK_DIAMETER_IN = { '-3': 0.46, '-2': 0.4096, '-1': 0.3648, 0: 0.3249, 4: 0.2043, 8: 0.1285, 10: 0.1019, 12: 0.0808, 14: 0.0641, 16: 0.0508, 18: 0.0403, 20: 0.032, 24: 0.0201, 30: 0.01, 36: 0.005 };
const CHECK_OHM_KM_CU = { 6: 1.296, 10: 3.277, 12: 5.211, 14: 8.286, 18: 20.95, 24: 84.22 };
{
  const bad = [];
  for (const [n, want] of Object.entries(CHECK_DIAMETER_IN)) {
    const got = dIn(+n);
    if (Math.abs(got - want) / want > 0.004) bad.push(`AWG ${n} diameter: formula ${got.toFixed(5)} in, published ${want}`);
  }
  for (const [n, want] of Object.entries(CHECK_OHM_KM_CU)) {
    const dmm = dIn(+n) * 25.4;
    const got = (RHO_CU / (Math.PI * Math.pow(dmm / 2, 2) / 1e6)) * 1000;
    if (Math.abs(got - want) / want > 0.015) bad.push(`AWG ${n} resistance: computed ${got.toFixed(3)} Ω/km, published ${want}`);
  }
  if (bad.length) {
    console.error('\n✗ AWG formula no longer reproduces the published wire tables:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const f = (v, d = 3) => v.toFixed(d).replace(/\.?0+$/, '');

// awg-compare.mjs pairs these up. One computation of diameter, area and
// resistance, so the two files cannot disagree about a wire.
export const AWG_ROWS = GAUGES.map((n) => {
  const din = dIn(n);
  const dmm = din * 25.4;
  const areaMm2 = Math.PI * Math.pow(dmm / 2, 2);
  const areaM2 = areaMm2 / 1e6;
  return {
    n, label: label(n), slug: slug(n),
    din, dmm, areaMm2,
    ohmKmCu: RHO_CU / areaM2 * 1000,
    ohmKftCu: (RHO_CU / areaM2 * 1000) * 0.3048,
    ohmKmAl: RHO_AL / areaM2 * 1000,
    amps: NEC60[String(n)] || null,
    use: USES[String(n)] || '',
  };
});

export default async function () {
  const pages = [];
  const rows = AWG_ROWS;
  const byN = new Map(rows.map((r) => [r.n, r]));

  for (const r of rows) {
    const half = byN.get(r.n + 3);   // three gauges thinner ≈ half the area
    const twice = byN.get(r.n - 3);  // three gauges thicker ≈ twice the area
    const dbl = byN.get(r.n - 6);    // six gauges thicker ≈ twice the diameter
    const near = rows.filter((x) => x.n !== r.n && Math.abs(x.n - r.n) <= 6).slice(0, 8);

    const FAQ = faq([
      { q: `What is ${r.label} AWG in mm?`,
        a: `<strong>${f(r.dmm, 3)} mm</strong> in diameter (${f(r.din, 4)} inches), with a cross-sectional area of ${f(r.areaMm2, 3)} mm².` },
      r.amps
        ? { q: `How many amps can ${r.label} AWG copper carry?`,
            a: `<strong>${r.amps} A</strong> under the NEC 60 °C copper column, which is the figure that sets the breaker on an ordinary branch circuit. This is a starting point and not a permission: the real limit depends on insulation rating, ambient temperature, how many conductors share the run, and your local code.` }
        : { q: `Is ${r.label} AWG used for power wiring?`,
            a: `Not for building circuits. ${r.n > 14 ? 'It is a signal and low-current gauge — thinner than anything a domestic branch circuit uses.' : 'It sits outside the common building-wire range; ampacity for it depends entirely on the installation.'}` },
      { q: `What is the resistance of ${r.label} AWG copper?`,
        a: `<strong>${f(r.ohmKmCu, 3)} Ω per kilometre</strong>, or ${f(r.ohmKftCu, 3)} Ω per 1,000 feet, for annealed copper at 20 °C. The same gauge in aluminium is about ${f(r.ohmKmAl, 2)} Ω/km — ${f(RHO_AL / RHO_CU, 2)} times higher, which is why aluminium wiring is sized larger for the same load.` },
      twice
        ? { q: `How much thicker is ${twice.label} AWG than ${r.label}?`,
            a: `Three gauges lower is <strong>twice the cross-sectional area</strong> — ${f(twice.areaMm2, 3)} mm² against ${f(r.areaMm2, 3)}, a ratio of ${f(twice.areaMm2 / r.areaMm2, 3)}. That is not a coincidence: the AWG formula raises 92 to the power of (36−n)/39, and 92^(6/39) is 2.005.` }
        : { q: `Why do smaller AWG numbers mean thicker wire?`,
            a: `The number counts drawing operations. Wire is pulled through progressively smaller dies, and the gauge records how many passes it took — so more passes means a higher number and a thinner wire.` },
    ]);

    pages.push({
      path: `/awg/${r.slug}/`,
      title: (() => {
        // "14 awg amps" is as common a query as "14 awg diameter", and the
        // ampacity was nowhere in the title.
        const base = `${r.label} AWG Wire — ${f(r.dmm, 3)} mm, ${f(r.din, 4)} in`;
        const withArea = `${base}, ${f(r.areaMm2, 2)} mm²`;
        const full = r.amps ? `${withArea}, ${r.amps}A` : withArea;
        return full.length <= 65 ? full : withArea.length <= 65 ? withArea : base;
      })(),
      desc: `${r.label} AWG is ${f(r.dmm, 3)} mm in diameter (${f(r.din, 4)} in) with an area of ${f(r.areaMm2, 3)} mm² and ${f(r.ohmKmCu, 2)} Ω/km in copper.${r.amps ? ` Rated ${r.amps} A under the NEC 60 °C copper column.` : ''}`,
      h1: `${r.label} AWG wire size`,
      crumbs: [{ name: 'Wire gauge', path: '/awg/' }, { name: `${r.label} AWG`, path: `/awg/${r.slug}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f(r.dmm, 3)} mm · ${f(r.areaMm2, 3)} mm²</strong></p>
<p class="muted">${f(r.din, 4)} in diameter · ${f(r.ohmKmCu, 3)} Ω/km in copper${r.amps ? ` · ${r.amps} A (NEC 60 °C copper)` : ''}</p>

${r.use ? `<h2>What ${r.label} AWG is used for</h2>\n<p>${r.use}</p>` : ''}

<h2>The numbers</h2>
<table><tbody>
<tr><td>Diameter</td><td>${f(r.dmm, 3)} mm · ${f(r.din, 4)} in</td></tr>
<tr><td>Cross-sectional area</td><td>${f(r.areaMm2, 4)} mm²</td></tr>
<tr><td>Resistance, copper</td><td>${f(r.ohmKmCu, 3)} Ω/km · ${f(r.ohmKftCu, 3)} Ω per 1,000 ft</td></tr>
<tr><td>Resistance, aluminium</td><td>${f(r.ohmKmAl, 3)} Ω/km</td></tr>
<tr><td>NEC 60 °C copper ampacity</td><td>${r.amps ? `${r.amps} A` : '— <span class="muted">outside the common building-wire range</span>'}</td></tr>
</tbody></table>

<h2>How ${r.label} compares</h2>
<p>The gauge scale is geometric, so the useful comparisons are ratios rather than differences.${twice ? ` <strong>${twice.label} AWG has twice the copper</strong> of ${r.label} — ${f(twice.areaMm2, 3)} mm² against ${f(r.areaMm2, 3)} — and therefore half the resistance per metre.` : ''}${half ? ` Going the other way, ${half.label} AWG has half the area and twice the resistance.` : ''}${dbl ? ` ${dbl.label} AWG is twice the <em>diameter</em>, which is four times the area.` : ''}</p>
<table><thead><tr><th>Gauge</th><th>Diameter</th><th>Area</th><th>Ω/km copper</th><th>vs ${r.label}</th></tr></thead><tbody>
${near.map((x) => `<tr${x.n === r.n ? ' style="font-weight:600"' : ''}><td><a href="/awg/${x.slug}/">${x.label}</a></td><td>${f(x.dmm, 3)} mm</td><td>${f(x.areaMm2, 3)} mm²</td><td>${f(x.ohmKmCu, 2)}</td><td>${f(x.areaMm2 / r.areaMm2, 2)}× the area</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/awg/">The full AWG chart</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const g12 = byN.get(12), g6 = byN.get(6), g9 = rows.find((x) => x.n === 10);

    // The hub states the two facts it says are the only ones worth memorising.
  // Both come out of the AWG exponent, so both are computed and checked rather
  // than quoted from the comment at the top of this file.
  {
    const sixGauges = Math.pow(92, 6 / 39);
    const threeGaugesArea = Math.pow(Math.pow(92, 3 / 39), 2);
    if (Math.abs(sixGauges - 2) > 0.01) {
      console.error(`\n\u2717 awg hub: says six gauges doubles the diameter and the exponent gives ${sixGauges.toFixed(4)}`);
      process.exitCode = 1;
    }
    if (Math.abs(threeGaugesArea - 2) > 0.01) {
      console.error(`\n\u2717 awg hub: says three gauges doubles the area and the exponent gives ${threeGaugesArea.toFixed(4)}`);
      process.exitCode = 1;
    }
  }

  pages.push({
    path: '/awg/',
    title: 'AWG Wire Gauge Chart — Diameter, Area, Resistance and Ampacity | Toolman',
    desc: 'Every AWG size from 4/0 to 40 in millimetres and inches, with cross-sectional area, resistance per kilometre in copper and aluminium, and the NEC ampacity for building-wire gauges.',
    h1: 'AWG wire gauge',
    crumbs: [{ name: 'Wire gauge', path: '/awg/' }],
    body: `<p class="muted">${rows.length} wire gauges from 4/0 to 40, in millimetres and inches, with area, resistance and — where there is a single well-known answer — ampacity.</p>
<p><a href="/awg/compare/">Choosing between two gauges?</a> The voltage each loses over a run, and how far it reaches before the drop passes 3%.</p>

<h2>AWG is a formula, not a table</h2>
<p>Every number on this page comes from one line:</p>
<pre><code>diameter = 0.005 × 92^((36 − n) / 39)  inches</code></pre>
<p>That is why the gauge numbers run backwards. The scale counts <strong>drawing operations</strong> — wire is pulled through progressively smaller dies, and the gauge records how many passes it took, so a higher number means more passes and a thinner wire. Gauge 36 is anchored at 0.005 inches and gauge 4/0 at 0.46, with 39 steps between them.</p>
<p>Two rules fall straight out of the exponent, and they are the reason electricians can size wire in their heads:</p>
<ul>
<li><strong>Six gauges lower doubles the diameter.</strong> 92^(6/39) = ${f(Math.pow(92, 6 / 39), 4)}.</li>
<li><strong>Three gauges lower doubles the cross-sectional area</strong>, and so halves the resistance. ${g12 && g6 ? `A 6 AWG conductor carries ${f(g6.areaMm2 / g12.areaMm2, 2)} times the copper of a 12.` : ''}</li>
<li><strong>Ten gauges lower is about ten times the area.</strong> The exact factor is ${f(Math.pow(Math.pow(92, 10 / 39), 2), 2)}, which is close enough to ten to be worth remembering.</li>
</ul>

<h2>The full chart</h2>
<table><thead><tr><th>AWG</th><th>mm</th><th>inches</th><th>mm²</th><th>Ω/km Cu</th><th>Ω/1000 ft Cu</th><th>NEC 60 °C</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/awg/${r.slug}/">${r.label}</a></td><td>${f(r.dmm, 3)}</td><td>${f(r.din, 4)}</td><td>${f(r.areaMm2, 3)}</td><td>${f(r.ohmKmCu, 2)}</td><td>${f(r.ohmKftCu, 2)}</td><td>${r.amps ? r.amps + ' A' : '—'}</td></tr>`).join('')}
</tbody></table>

<h2>About the ampacity column</h2>
<p>Those figures are the NEC 310.16 copper values in the 60 °C column, which is what sets the breaker on an ordinary branch circuit — 14 AWG on a 15-amp breaker, 12 on a 20, 10 on a 30. <strong>Treat them as orientation, not as permission.</strong> The real limit depends on the insulation temperature rating, the ambient temperature, how many current-carrying conductors share a raceway, and the code in force where you are. Aluminium is derated further: it has ${f(RHO_AL / RHO_CU, 2)} times the resistivity of copper, so the same load needs a larger conductor.</p>

<h2>Copper against aluminium</h2>
<p>Aluminium conductors appear in service entrances and feeders because they are cheaper and lighter, and the trade is resistance: ${f(RHO_AL / RHO_CU, 2)}× that of copper for the same cross-section. In practice that means going roughly two gauges larger in aluminium to match a copper conductor — which is exactly the "three gauges doubles the area" rule applied to a factor of ${f(RHO_AL / RHO_CU, 2)}.</p>

<h2>Stranded wire is not the gauge it says</h2>
<p>A gauge names a cross-sectional area of conductor, and stranded wire reaches that area as many small circles rather than one large one. Circles do not tile, so the bundle is wider than a solid conductor of the same gauge — typically ${f(1.13, 2)} to ${f(1.25, 2)} times the diameter depending on how many strands and how tightly they are laid.</p>
<p>That matters in three places and nowhere else: it fills a conduit faster than the solid-wire tables suggest, it needs a larger crimp or terminal than the number implies, and it will not seat in a screw terminal sized for solid wire without a ferrule. The electrical properties are the ones in the chart above — same area, same resistance, same ampacity.</p>
<p>What stranded buys is flexibility and fatigue life. Solid wire work-hardens and eventually snaps where it is repeatedly bent, which is why fixed building wiring is solid and anything that moves — appliance cords, automotive, robotics — is stranded.</p>

<h2>Why the gauge numbers run backwards</h2>
<p>The scale counts manufacturing steps rather than measuring the wire. Wire is drawn by pulling it through a die, then a smaller die, and so on; the gauge number is how many dies it passed through. More passes means thinner wire and a bigger number, which is the whole explanation for a system that otherwise looks perverse.</p>
<p>It also explains the sizes below 1. A wire that needed no reduction is 0, one thicker still is 00, then 000 and 0000 — written 1/0 through 4/0 and pronounced "one aught" to "four aught". There is no negative gauge because there was no way to count backwards through dies that were never used.</p>
<p>The exponent falls out of the same process: ${f(Math.pow(92, 6 / 39), 3)} is 92<sup>6/39</sup>, which is why six gauges doubles the diameter, and squaring it is why three gauges doubles the area. Those two facts are the only ones worth memorising, because everything else in the chart can be reconstructed from them.</p>

<p><a href="/nominal/">Nominal sizes that measure nothing</a> — gauge is the odd one, it counts rather than measures. <a href="/convert/">Unit converters</a> · <a href="/battery/">Battery sizes</a> · <a href="/lumber/">Lumber sizes</a></p>`,
  });

  return pages;
}
