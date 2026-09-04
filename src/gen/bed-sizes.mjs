import { esc, faq } from '../layout.mjs';

// The names collide across countries and the collision runs the wrong way, which
// is the whole reason this section is worth having: a UK King is 150 cm wide and
// a US King is 193, so someone importing a mattress, buying sheets abroad, or
// reading an American guide in Britain gets a bed 43 cm narrower than they
// expected — and nothing in the name warns them.
//
// Sizes are stored in the units the standard is written in — inches for North
// America, centimetres for the UK and Europe — and converted, rather than stored
// converted and rounded twice.

const IN = 25.4;
const inches = (mm) => mm / IN;

// [name, id, width, height, unit, region, note]
const BEDS = [
  ['Crib / Cot', 'crib', 28, 52, 'in', 'US', 'The US crib standard, fixed by federal regulation so that any mattress fits any crib frame — the gap between mattress and frame must be under 3 cm, which is a safety rule rather than a comfort one.'],
  ['Twin', 'twin', 38, 75, 'in', 'US', 'The smallest adult bed in North America and the default for children, bunk beds and spare rooms. At 75 inches it is short: anyone over about 6 feet hangs off the end, which is what Twin XL exists to fix.'],
  ['Twin XL', 'twin-xl', 38, 80, 'in', 'US', 'A Twin with five extra inches of length, matching the 80 inches of a Queen or King. It is the standard bed in American university dormitories, which is why it is easy to find in that one context and awkward to find in any other.'],
  ['Full / Double', 'full', 54, 75, 'in', 'US', 'Called Full in North America and Double almost everywhere else. Sold as a two-person bed, it gives each sleeper 27 inches — narrower than a Twin each. It is really a generous single, and its 75-inch length is the same problem the Twin has.'],
  ['Full XL', 'full-xl', 54, 80, 'in', 'US', 'A Full with the 80-inch length of a Queen. Uncommon enough that bedding for it is difficult to find, which is usually the reason people who measure carefully still end up buying a Queen.'],
  ['Queen', 'queen', 60, 80, 'in', 'US', 'The most common bed size sold in North America. Six inches wider than a Full and five inches longer, and the smallest size that gives two adults 30 inches each — about the width of a Twin per person, which is the usual threshold for sleeping well next to someone.'],
  ['King', 'king', 76, 80, 'in', 'US', 'Also called an Eastern King. Two Twin XL mattresses side by side are exactly a King, which is why split-King adjustable bases exist. At 193 cm wide it is <strong>wider than a UK Super King</strong>, the largest bed sold in Britain — the naming across the Atlantic does not line up at any size.'],
  ['California King', 'california-king', 72, 84, 'in', 'US', 'Four inches narrower than a standard King and four inches longer. It is the size to buy for height rather than for space: two people get less width than a King gives them, and the extra length is the only advantage. Bedding is sold separately from King bedding and the two are not interchangeable.'],
  ['Small Single', 'small-single-uk', 75, 190, 'cm', 'UK', 'The UK 2′6" bed, used for children and for rooms that cannot take a full Single. It is 15 cm narrower than a Single and the narrowest bed sold as a standard size in Britain.'],
  ['Single', 'single-uk', 90, 190, 'cm', 'UK', 'The UK 3′0" bed and the British equivalent of a Twin, though not the same size: it is 6 cm narrower and 3 cm longer than a US Twin. Bedding from one country will fit the other badly rather than not at all, which is worse.'],
  ['Small Double', 'small-double-uk', 120, 190, 'cm', 'UK', 'Also called a Three-Quarter bed. It sits between a Single and a Double and is the size that fits a room where a Double will not — 15 cm narrower, which is often exactly the amount needed to open a wardrobe door.'],
  ['Double', 'double-uk', 135, 190, 'cm', 'UK', 'The UK 4′6" bed and the standard two-person bed in Britain. A US Full is 137.2 × 190.5 cm against this 135 × 190, so the two are 2.2 cm apart in width and 0.5 cm in length — near enough that bedding usually works across them, and the only pair in this list where the transatlantic names describe roughly the same bed.'],
  ['King', 'king-uk', 150, 200, 'cm', 'UK', 'The UK 5′0" bed, and the source of the most expensive confusion in bedding. A <strong>UK King is 43 cm narrower than a US King</strong> and 3 cm shorter. American sheets bought for a British King will be far too big; British sheets on an American King will not reach.'],
  ['Super King', 'super-king-uk', 180, 200, 'cm', 'UK', 'The UK 6′0" bed and the largest standard size sold in Britain — and still 13 cm narrower than a US King. If an American guide recommends a King and you are shopping in the UK, Super King is the size it means.'],
  ['Emperor', 'emperor-uk', 200, 200, 'cm', 'UK', 'A non-standard British size, sold by specialists rather than by every retailer. It is square, which means the bedding has no long edge and can be turned either way. Expect to buy sheets from the same supplier as the bed.'],
  ['EU Single', 'eu-single', 90, 200, 'cm', 'EU', 'The continental single: the same width as a UK Single and 10 cm longer. That 10 cm is the difference that catches people moving between Britain and the continent, because the width matches and the length does not, so a fitted sheet appears to fit until it is on.'],
  ['EU Double', 'eu-double', 140, 200, 'cm', 'EU', 'The standard European two-person bed, 5 cm wider and 10 cm longer than a UK Double. In much of northern Europe it is made up as two 70 cm single mattresses on one base, with two separate duvets — which is a better answer to the problem than any mattress size is.'],
  ['EU Queen', 'eu-queen', 160, 200, 'cm', 'EU', 'A common continental size with no British equivalent: 10 cm wider than a UK King and 40 cm narrower than a US King. It is the size most European hotel doubles are.'],
  ['EU King', 'eu-king', 180, 200, 'cm', 'EU', 'Identical to a UK Super King at 180 × 200 cm, and the largest size most continental retailers stock as standard. Bedding is interchangeable with a UK Super King, which is unusual enough to be worth knowing.'],
];

const REGION = { US: 'North America', UK: 'United Kingdom', EU: 'Continental Europe' };
// Short form for headings, where "North America King bed size" reads badly.
const SHORT = { US: 'US', UK: 'UK', EU: 'European' };

// Everything is held in one unit per row; normalise to millimetres once.
const mmOf = (v, unit) => (unit === 'in' ? v * IN : v * 10);
const rows = BEDS.map(([name, id, w, h, unit, region, note]) => ({
  name, id, region, note, unit,
  wmm: mmOf(w, unit), hmm: mmOf(h, unit),
}));

// bed-compare.mjs pairs these up; exporting the normalised rows means the two
// files cannot disagree about a mattress dimension.
export const BED_ROWS = rows;
export const BED_SHORT = SHORT;

const cm = (mm) => (mm / 10).toFixed(mm % 10 === 0 ? 0 : 1);
const inch = (mm) => {
  const v = inches(mm);
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
};
const areaM2 = (r) => ((r.wmm * r.hmm) / 1e6).toFixed(2);

// A bed needs walking room. The usual guidance is 60 cm clear on each side you
// get in from, plus the same at the foot.
const roomFor = (r) => `${cm(r.wmm + 1200)} × ${cm(r.hmm + 600)} cm`;

export default async function () {
  const pages = [];

  // "King" is both a US and a UK size, so two pages were headed "King bed size"
  // and competed with each other for the query that most needs disambiguating.
  // Qualify the heading wherever a name is used by more than one region.
  const nameCount = {};
  for (const x of rows) {
    const base = x.name.replace(/ \/ .*/, '').toLowerCase();
    nameCount[base] = (nameCount[base] || 0) + 1;
  }

  for (const r of rows) {
    const others = rows.filter((x) => x.id !== r.id);
    const shared = nameCount[r.name.replace(/ \/ .*/, '').toLowerCase()] > 1;
    const qualified = shared ? `${SHORT[r.region]} ${r.name}` : r.name;
    // Same-named beds in other regions — the whole point of the section.
    const nameClash = others.filter((x) => x.name.replace(/ \/ .*/, '').toLowerCase() === r.name.replace(/ \/ .*/, '').toLowerCase());
    // Closest by area, wherever it comes from.
    const nearest = others
      .map((x) => ({ x, d: Math.abs(x.wmm * x.hmm - r.wmm * r.hmm) }))
      .sort((a, b) => a.d - b.d).slice(0, 6).map((o) => o.x);

    const FAQ = faq([
      { q: `What are the dimensions of a ${r.name} bed?`,
        a: `<strong>${inch(r.wmm)} × ${inch(r.hmm)} inches</strong>, or ${cm(r.wmm)} × ${cm(r.hmm)} cm. ${REGION[r.region]} standard.` },
      { q: `What size room does a ${r.name} bed need?`,
        a: `At least <strong>${roomFor(r)}</strong> to leave 60 cm of walking space on both sides and at the foot. Less than that and the bed fits but the room does not work.` },
      nameClash.length
        ? { q: `Is a ${r.name.replace(/ \/ .*/, '')} the same size everywhere?`,
            a: `No. ${nameClash.map((x) => `The ${REGION[x.region]} ${x.name} is ${cm(x.wmm)} × ${cm(x.hmm)} cm`).join('; ')}, against ${cm(r.wmm)} × ${cm(r.hmm)} cm here. The name is the same and the bed is not, which is why bedding bought abroad so often does not fit.` }
        : { q: `How much space does each person get in a ${r.name}?`,
            a: `${inch(r.wmm / 2)} inches (${cm(r.wmm / 2)} cm) each if two people share it. For reference, a US Twin — a single bed — is 38 inches wide.` },
      { q: `What is the area of a ${r.name} bed?`, a: `${areaM2(r)} square metres.` },
    ]);

    pages.push({
      path: `/bed-size/${r.id}/`,
      title: `${qualified} Bed Size — ${inch(r.wmm)} × ${inch(r.hmm)} in, ${cm(r.wmm)} × ${cm(r.hmm)} cm | Toolman`,
      desc: `A ${r.name} bed is ${inch(r.wmm)} × ${inch(r.hmm)} inches (${cm(r.wmm)} × ${cm(r.hmm)} cm), the ${REGION[r.region]} standard. Room size needed, area, and how it compares with every other bed size.`,
      h1: `${qualified} bed size`,
      crumbs: [{ name: 'Bed sizes', path: '/bed-size/' }, { name: r.name, path: `/bed-size/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${inch(r.wmm)} × ${inch(r.hmm)} inches</strong></p>
<p class="muted">${cm(r.wmm)} × ${cm(r.hmm)} cm · ${Math.round(r.wmm)} × ${Math.round(r.hmm)} mm · ${areaM2(r)} m² · ${REGION[r.region]} standard</p>

<h2>About the ${r.name}</h2>
<p>${r.note}</p>

<h2>The numbers</h2>
<table><tbody>
<tr><td>Width</td><td>${inch(r.wmm)} in · ${cm(r.wmm)} cm</td></tr>
<tr><td>Length</td><td>${inch(r.hmm)} in · ${cm(r.hmm)} cm</td></tr>
<tr><td>Area</td><td>${areaM2(r)} m²</td></tr>
<tr><td>Width per person, shared</td><td>${inch(r.wmm / 2)} in · ${cm(r.wmm / 2)} cm</td></tr>
<tr><td>Minimum room size</td><td>${roomFor(r)} <span class="muted">— 60 cm clear each side and at the foot</span></td></tr>
<tr><td>Standard</td><td>${REGION[r.region]}</td></tr>
</tbody></table>

${nameClash.length ? `<h2>The same name, a different bed</h2>
<p>${nameClash.map((x) => `A ${REGION[x.region]} <a href="/bed-size/${x.id}/">${x.name}</a> is ${cm(x.wmm)} × ${cm(x.hmm)} cm — ${Math.abs(Math.round((x.wmm - r.wmm) / 10))} cm ${x.wmm > r.wmm ? 'wider' : 'narrower'} and ${Math.abs(Math.round((x.hmm - r.hmm) / 10))} cm ${x.hmm > r.hmm ? 'longer' : 'shorter'} than this one.`).join(' ')} Bedding is not interchangeable between them.</p>` : ''}

<h2>Closest sizes</h2>
<table><thead><tr><th>Bed</th><th>Region</th><th>Size</th><th>vs ${r.name}</th></tr></thead><tbody>
${nearest.map((x) => {
        const dw = Math.round((x.wmm - r.wmm) / 10), dh = Math.round((x.hmm - r.hmm) / 10);
        const d = [dw ? `${Math.abs(dw)} cm ${dw > 0 ? 'wider' : 'narrower'}` : null, dh ? `${Math.abs(dh)} cm ${dh > 0 ? 'longer' : 'shorter'}` : null].filter(Boolean).join(', ') || 'the same size';
        return `<tr><td><a href="/bed-size/${x.id}/">${esc(x.name)}</a></td><td>${REGION[x.region]}</td><td>${cm(x.wmm)} × ${cm(x.hmm)} cm</td><td>${d}</td></tr>`;
      }).join('')}
</tbody></table>

${FAQ.html}

<p><a href="/bed-size/">All bed sizes</a> · <a href="/convert/">Unit converters</a></p>`,
    });
  }

  const byRegion = {};
  for (const r of rows) (byRegion[r.region] ||= []).push(r);

  const usKing = rows.find((r) => r.id === 'king');
  const ukKing = rows.find((r) => r.id === 'king-uk');
  const ukSuper = rows.find((r) => r.id === 'super-king-uk');

  pages.push({
    path: '/bed-size/',
    title: 'Bed Size Chart — US, UK and European Mattress Dimensions | Toolman',
    desc: `Every standard mattress size in inches and centimetres. A UK King is ${Math.round((usKing.wmm - ukKing.wmm) / 10)} cm narrower than a US King — the names do not mean the same bed, and here is the full comparison.`,
    h1: 'Bed and mattress sizes',
    crumbs: [{ name: 'Bed sizes', path: '/bed-size/' }],
    body: `<p class="muted">${rows.length} standard mattress sizes across North America, the UK and continental Europe, in inches and centimetres, with the room each one needs.</p>
<p><a href="/bed-size/compare/">Choosing between two sizes?</a> Every pair worth comparing, with the width each sleeper gets and whether the same bedding fits both.</p>

<h2>The names do not travel</h2>
<p>This is the thing worth knowing before anything else. <strong>A UK King is ${cm(ukKing.wmm)} cm wide and a US King is ${cm(usKing.wmm)} cm</strong> — a difference of ${Math.round((usKing.wmm - ukKing.wmm) / 10)} cm, which is more than the gap between a UK Single and a UK Small Double. The largest bed sold as standard in Britain, the Super King at ${cm(ukSuper.wmm)} cm, is <em>still</em> ${Math.round((usKing.wmm - ukSuper.wmm) / 10)} cm narrower than an ordinary American King.</p>
<p>The one pair that nearly lines up is the US Full and the UK Double: 137.2 × 190.5 cm against 135 × 190, so 2.2 cm apart in width and half a centimetre in length. Everything else with a shared name is a different bed, and bedding bought on the wrong side of the Atlantic will be visibly wrong rather than slightly wrong.</p>

${Object.entries(byRegion).map(([region, list]) => `<h2>${REGION[region]}</h2>
<table><thead><tr><th>Name</th><th>Inches</th><th>Centimetres</th><th>Area</th><th>Room needed</th></tr></thead><tbody>
${list.map((r) => `<tr><td><a href="/bed-size/${r.id}/">${esc(r.name)}</a></td><td>${inch(r.wmm)} × ${inch(r.hmm)}</td><td>${cm(r.wmm)} × ${cm(r.hmm)}</td><td>${areaM2(r)} m²</td><td>${roomFor(r)}</td></tr>`).join('')}
</tbody></table>`).join('')}

<h2>Every size by width</h2>
<table><thead><tr><th>Name</th><th>Region</th><th>Width</th><th>Length</th></tr></thead><tbody>
${[...rows].sort((a, b) => a.wmm - b.wmm).map((r) => `<tr><td><a href="/bed-size/${r.id}/">${esc(r.name)}</a></td><td>${REGION[r.region]}</td><td>${cm(r.wmm)} cm</td><td>${cm(r.hmm)} cm</td></tr>`).join('')}
</tbody></table>

<h2>How much room a bed actually needs</h2>
<p>The figures above allow 60 cm of clear floor on each side and at the foot, which is roughly the width of a person walking sideways past a bed frame. Less than that and the bed fits the room on paper while making it unusable in practice — the usual symptom is a wardrobe door that will not open, since a hinged door needs its own depth of clearance again.</p>

<p><a href="/convert/">Unit converters</a> · <a href="/paper/">Paper sizes</a> · <a href="/screen-size/">Screen sizes</a></p>`,
  });

  return pages;
}
