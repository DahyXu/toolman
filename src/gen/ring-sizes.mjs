import { faq } from '../layout.mjs';

// A ring size is a length pretending to be a code. The ISO standard *is* the
// inside circumference in millimetres, and the American scale is a straight line
// through it:
//
//     circumference = 36.537 + 2.5535 × US size   millimetres
//
// which reproduces every published US chart from 3 to 13 to within 0.15 mm.
// Diameter is that over π. So the whole cross-country comparison is arithmetic,
// and the only genuinely tabular part is the British letter scale.
//
// The British scale advances one letter per half American size — US 6 is L½,
// US 7 is N½, US 9 is R½ — which is the correspondence every chart prints. It is
// derived here rather than transcribed, and the derivation is stated on the page
// so a reader can check it against the ring they already own rather than trust it.

const circMm = (us) => 36.537 + 2.5535 * us;

// Published values, used to fail the build rather than to be trusted silently.
const PUBLISHED_CIRC = { 3: 44.2, 4: 46.8, 5: 49.3, 6: 51.9, 7: 54.4, 8: 57.0, 9: 59.5, 10: 62.1, 11: 64.6, 12: 67.2, 13: 69.7 };
{
  const bad = [];
  for (const [us, want] of Object.entries(PUBLISHED_CIRC)) {
    const got = circMm(+us);
    if (Math.abs(got - want) > 0.15) bad.push(`US ${us}: formula ${got.toFixed(2)} mm, published ${want}`);
  }
  if (bad.length) {
    console.error('\n✗ ring size formula no longer matches the published charts:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// US 6 is UK L½ and each half US size is one letter along.
function ukSize(us) {
  const idx = ALPHA.indexOf('L') + Math.round((us - 6) * 2);
  if (idx < 0 || idx >= ALPHA.length) return null;
  return `${ALPHA[idx]}½`;
}

const SIZES = [];
for (let us = 3; us <= 13; us += 0.5) SIZES.push(us);

const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);
const usLabel = (us) => (Number.isInteger(us) ? String(us) : `${Math.floor(us)}½`);
const usSlug = (us) => (Number.isInteger(us) ? String(us) : `${Math.floor(us)}-5`);

export default async function () {
  const pages = [];

  const rows = SIZES.map((us) => {
    const c = circMm(us);
    return {
      us, label: usLabel(us), slug: usSlug(us),
      circ: c, dia: c / Math.PI, iso: Math.round(c), uk: ukSize(us),
    };
  });

  pages.push({
    path: '/ring-size/',
    title: 'Ring Size Chart — US, UK and EU Conversion in mm | Toolman',
    desc: 'Every ring size from US 3 to 13 with the UK letter, the ISO number and the actual measurement in millimetres. The European size is the inside circumference — so any ring can be sized with a ruler.',
    h1: 'Ring sizes',
    crumbs: [{ name: 'Ring sizes', path: '/ring-size/' }],
    body: `<p class="muted">${rows.length} sizes from US 3 to 13, with the UK letter, the ISO number, and the measurement each of them actually is.</p>

<h2>The European size is the measurement</h2>
<p>This is the fact that makes every chart unnecessary. <strong>An ISO or European ring size is the inside circumference in millimetres.</strong> A size 54 ring is 54 mm around the inside. So if you have a ring that fits:</p>
<pre><code>measure the inside diameter in mm
× 3.1416
= the European size</code></pre>
<p>The American scale is a straight line through the same quantity — circumference = 36.537 + 2.5535 × size — and the British scale advances one letter per half American size, with US 6 at L½. Between them those two rules reproduce every conversion table in print.</p>

<h2>The full chart</h2>
<table><thead><tr><th>US / Canada</th><th>UK / Australia</th><th>ISO / EU</th><th>Circumference</th><th>Diameter</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><strong>${r.label}</strong></td><td>${r.uk || '—'}</td><td>${r.iso}</td><td>${f1(r.circ)} mm</td><td>${f2(r.dia)} mm</td></tr>`).join('')}
</tbody></table>

<h2>Measuring, and why it goes wrong</h2>
<p>Three things defeat a correctly taken measurement, and all of them are about the finger rather than the ring.</p>
<p><strong>Time of day.</strong> Fingers swell. The difference between a cold morning and a warm evening is often more than a full size — larger than the half-size steps the whole scale is built on. Measure at the end of the day, at normal room temperature, and never straight after exercise or a hot bath.</p>
<p><strong>The knuckle.</strong> A ring has to pass the knuckle and then sit on a narrower part of the finger. Where the knuckle is much larger, the ring that fits over it will spin once it is on, and the answer is a fitted bar inside the band rather than a smaller size.</p>
<p><strong>Band width.</strong> A wide band touches more of the finger and reads as tighter. Anything over about 6 mm is usually ordered a quarter to a half size up. This is the most common reason a ring measured correctly still does not fit.</p>

<h2>Sizing a ring you already own</h2>
<p>Lay it on a ruler and measure the inside diameter at its widest — the number you want is across the hole, not across the metal. Multiply by π for the circumference, which is the European size, then read the American and British equivalents off the chart above. This is more reliable than printable paper sizers, which depend on the printer scaling the page exactly.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/thread/">Metric threads</a> · <a href="/battery/">Battery sizes</a></p>`,
  });

  return pages;
}
