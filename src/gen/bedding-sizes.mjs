import { esc, faq } from '../layout.mjs';

// The bed size section already covers mattresses. This is the other half of the
// question, and it contains a fact people find genuinely surprising: a duvet is
// far wider than the bed it goes on. A UK double bed is 135 cm and a UK double
// duvet is 200 — it has to hang over both sides, and the overhang is the number
// that decides whether the cover looks right or looks mean.
//
// The naming collision from the bed sizes carries straight over and gets worse:
// a UK King duvet is 225 cm wide and a US King comforter is 264, so importing
// bedding fails in both directions.

const IN = 2.54;

// [name, id, region, duvet w cm, duvet l cm, matching bed width cm, bed id, note]
const SETS = [
  ['Single', 'single-uk', 'UK', 135, 200, 90, 'single-uk',
    'The UK single duvet. It gives 22 cm of overhang on each side of a 90 cm bed — the least generous proportion of any standard size, which is why a single duvet on a single bed can look skimpy while a double on a double does not.'],
  ['Double', 'double-uk', 'UK', 200, 200, 135, 'double-uk',
    'The UK double, and the size most British households own. It is square: 200 × 200 cm, so it can be turned either way, which no other UK size allows.'],
  ['King', 'king-uk', 'UK', 225, 220, 150, 'king-uk',
    'The UK king duvet. Note that it is narrower than an American king comforter by nearly 40 cm — the two names describe different bedding for different beds, and neither fits the other.'],
  ['Super King', 'super-king-uk', 'UK', 260, 220, 180, 'super-king-uk',
    'The largest standard British duvet. At 260 cm it is close to the American king comforter, which is the only place the two systems nearly meet.'],
  ['Emperor', 'emperor-uk', 'UK', 290, 235, 200, 'emperor-uk',
    'A specialist British size sold with the Emperor bed. Covers for it come from the same suppliers as the beds rather than from a general retailer.'],
  ['Twin', 'twin', 'US', 68 * IN, 88 * IN, 38 * IN, 'twin',
    'The American twin comforter, 68 × 88 inches. Comforters are quilted and sold as the finished article rather than as a cover for an insert, which is the main structural difference from the British approach.'],
  ['Twin XL', 'twin-xl', 'US', 68 * IN, 92 * IN, 38 * IN, 'twin-xl',
    'The dormitory size: the same width as a twin with four extra inches of length to cover the longer mattress.'],
  ['Full', 'full', 'US', 81 * IN, 88 * IN, 54 * IN, 'full',
    'The American full comforter, sometimes sold as full/queen — which is a compromise that hangs generously on a full and barely on a queen.'],
  ['Queen', 'queen', 'US', 88 * IN, 96 * IN, 60 * IN, 'queen',
    'The most common American size. At 88 inches wide over a 60-inch bed it gives 14 inches of overhang on each side, which is the proportion the rest of the range is judged against.'],
  ['King', 'king', 'US', 104 * IN, 96 * IN, 76 * IN, 'king',
    'The American king comforter at 104 × 96 inches — 264 cm wide, against 225 for a UK king duvet. A British king cover on an American king bed leaves the mattress showing on both sides.'],
  ['California King', 'california-king', 'US', 104 * IN, 100 * IN, 72 * IN, 'california-king',
    'Four inches longer than a standard king comforter and the same width, matching the longer, narrower California king mattress.'],
];

const REGION = { UK: 'United Kingdom', US: 'North America' };
const f0 = (v) => Math.round(v);
const f1 = (v) => v.toFixed(1);
const inch = (cm) => (cm / IN).toFixed(0);

export default async function () {
  const pages = [];

  const rows = SETS.map(([name, id, region, w, l, bedW, bedId, note]) => ({
    name, id, region, w, l, bedW, bedId, note,
    overhang: (w - bedW) / 2,
    area: (w * l) / 10000,
  }));

  for (const r of rows) {
    const sameName = rows.filter((x) => x.id !== r.id && x.name.toLowerCase() === r.name.toLowerCase());
    const near = rows
      .filter((x) => x.id !== r.id)
      .map((x) => ({ x, d: Math.abs(x.w - r.w) }))
      .sort((a, b) => a.d - b.d).slice(0, 6).map((o) => o.x);
    const short = r.region === 'UK' ? 'duvet' : 'comforter';
    const qualified = sameName.length ? `${r.region === 'UK' ? 'UK' : 'US'} ${r.name}` : r.name;

    const FAQ = faq([
      { q: `What size is a ${qualified} ${short}?`,
        a: `<strong>${f0(r.w)} × ${f0(r.l)} cm</strong>, or ${inch(r.w)} × ${inch(r.l)} inches.` },
      { q: `Why is a ${r.name} ${short} wider than a ${r.name} bed?`,
        a: `Because it has to hang over the sides. The bed is ${f0(r.bedW)} cm wide and the ${short} is ${f0(r.w)}, which leaves <strong>${f1(r.overhang)} cm on each side</strong>. Less than about 25 cm and the cover rides up and exposes the mattress whenever anyone turns over.` },
      sameName.length
        ? { q: `Is a ${r.name} ${short} the same everywhere?`,
            a: `No. ${sameName.map((x) => `A ${REGION[x.region]} ${x.name} is ${f0(x.w)} × ${f0(x.l)} cm`).join('; ')}, against ${f0(r.w)} × ${f0(r.l)} here — a difference of ${f0(Math.abs(sameName[0].w - r.w))} cm in width. Bedding bought under the same name in the other country will not fit.` }
        : { q: `What bed does a ${r.name} ${short} fit?`,
            a: `A ${r.name} bed, ${f0(r.bedW)} cm wide. <a href="/bed-size/${r.bedId}/">Its full dimensions are here</a>.` },
      { q: `What size duvet cover do I need?`,
        a: `The same as the duvet: ${f0(r.w)} × ${f0(r.l)} cm. Covers are sold to match the insert, not the bed — buying a cover by bed size is the usual reason one arrives too small.` },
    ]);

    pages.push({
      path: `/bedding/${r.id}/`,
      title: `${qualified} ${short === 'duvet' ? 'Duvet' : 'Comforter'} Size — ${f0(r.w)} × ${f0(r.l)} cm | Toolman`,
      desc: `A ${qualified} ${short} is ${f0(r.w)} × ${f0(r.l)} cm (${inch(r.w)} × ${inch(r.l)} in), giving ${f1(r.overhang)} cm of overhang on each side of a ${f0(r.bedW)} cm bed.`,
      h1: `${qualified} ${short} size`,
      crumbs: [{ name: 'Bedding sizes', path: '/bedding/' }, { name: qualified, path: `/bedding/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f0(r.w)} × ${f0(r.l)} cm</strong></p>
<p class="muted">${inch(r.w)} × ${inch(r.l)} in · ${REGION[r.region]} · fits a <a href="/bed-size/${r.bedId}/">${f0(r.bedW)} cm ${r.name} bed</a></p>

<h2>About this size</h2>
<p>${r.note}</p>

<h2>How much it hangs over</h2>
<p>A ${short} is not the size of the bed and is not meant to be. This one is <strong>${f0(r.w - r.bedW)} cm wider than the mattress</strong>, so it drops ${f1(r.overhang)} cm on each side.</p>
<table><tbody>
<tr><td>${short === 'duvet' ? 'Duvet' : 'Comforter'} width</td><td>${f0(r.w)} cm · ${inch(r.w)} in</td></tr>
<tr><td>Length</td><td>${f0(r.l)} cm · ${inch(r.l)} in</td></tr>
<tr><td>Mattress width</td><td>${f0(r.bedW)} cm</td></tr>
<tr><td>Overhang per side</td><td><strong>${f1(r.overhang)} cm</strong></td></tr>
<tr><td>Area</td><td>${f1(r.area)} m²</td></tr>
</tbody></table>
<p>Under about 25 cm of overhang the cover rides up as soon as anyone turns over, which is the real complaint behind "the duvet is too small" — usually it is the right size for the bed and the wrong size for two people.</p>

${sameName.length ? `<h2>The same name, different bedding</h2>
<p>${sameName.map((x) => `A ${REGION[x.region]} <a href="/bedding/${x.id}/">${x.name}</a> is ${f0(x.w)} × ${f0(x.l)} cm — ${f0(Math.abs(x.w - r.w))} cm ${x.w > r.w ? 'wider' : 'narrower'} than this one.`).join(' ')} The names match and the bedding does not, which is the same collision the <a href="/bed-size/">mattress sizes</a> have.</p>` : ''}

<h2>Nearest sizes</h2>
<table><thead><tr><th>Size</th><th>Region</th><th>Dimensions</th><th>vs this</th></tr></thead><tbody>
${near.map((x) => `<tr><td><a href="/bedding/${x.id}/">${esc(x.name)}</a></td><td>${REGION[x.region]}</td><td>${f0(x.w)} × ${f0(x.l)} cm</td><td>${x.w > r.w ? '+' : ''}${f0(x.w - r.w)} cm wide</td></tr>`).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/bedding/">All bedding sizes</a> · <a href="/bed-size/${r.bedId}/">The ${r.name} mattress</a> · <a href="/bed-size/">All bed sizes</a></p>`,
    });
  }

  const ukKing = rows.find((r) => r.id === 'king-uk');
  const usKing = rows.find((r) => r.id === 'king');
  const ukDouble = rows.find((r) => r.id === 'double-uk');
  const byRegion = {};
  for (const r of rows) (byRegion[r.region] ||= []).push(r);

  pages.push({
    path: '/bedding/',
    title: 'Duvet and Comforter Sizes — UK and US Bedding Dimensions | Toolman',
    desc: `A UK king duvet is ${f0(ukKing.w)} cm wide and a US king comforter is ${f0(usKing.w)}. Every standard size in cm and inches, with how far each hangs over the mattress.`,
    h1: 'Duvet and comforter sizes',
    crumbs: [{ name: 'Bedding sizes', path: '/bedding/' }],
    body: `<p class="muted">${rows.length} standard bedding sizes with their real dimensions and how far each one hangs over the bed.</p>

<h2>A duvet is much wider than the bed</h2>
<p>This is the part that surprises people measuring for the first time. A <strong>UK double bed is ${f0(ukDouble.bedW)} cm wide and a UK double duvet is ${f0(ukDouble.w)}</strong> — ${f0(ukDouble.w - ukDouble.bedW)} cm wider, dropping ${f1(ukDouble.overhang)} cm down each side. Buying bedding to match the mattress is the most common way to end up with a duvet that is too small.</p>
<p>Every standard size lands between 22 and 40 cm of overhang per side. Below about 25 the cover rides up whenever someone turns over, which is what "the duvet is too small" almost always means in practice: right for the bed, wrong for two people.</p>

<h2>The names do not cross the Atlantic</h2>
<p><strong>A UK king duvet is ${f0(ukKing.w)} cm wide. A US king comforter is ${f0(usKing.w)}.</strong> That is ${f0(usKing.w - ukKing.w)} cm — more than a foot — under one word. The <a href="/bed-size/">mattresses have the same problem</a>, and it compounds: a British king bed with an American king comforter is swamped, and the reverse leaves the mattress bare on both sides.</p>

${Object.entries(byRegion).map(([region, list]) => `<h2>${REGION[region]}</h2>
<table><thead><tr><th>Size</th><th>Centimetres</th><th>Inches</th><th>Bed width</th><th>Overhang each side</th></tr></thead><tbody>
${list.map((r) => `<tr><td><a href="/bedding/${r.id}/">${esc(r.name)}</a></td><td>${f0(r.w)} × ${f0(r.l)}</td><td>${inch(r.w)} × ${inch(r.l)}</td><td>${f0(r.bedW)} cm</td><td>${f1(r.overhang)} cm</td></tr>`).join('')}
</tbody></table>`).join('')}

<h2>Duvet, cover, comforter</h2>
<p>The words describe different objects. A <strong>duvet</strong> is the insert — the filled quilt — and goes inside a <strong>duvet cover</strong>, which is washed separately; this is the British and continental arrangement. A <strong>comforter</strong> is the American equivalent sold as one finished quilted piece, usually used with a flat sheet underneath rather than a cover over it. A cover is bought to match the duvet it goes on, never the bed, which is the other common sizing mistake.</p>

<p><a href="/bed-size/">Bed and mattress sizes</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
