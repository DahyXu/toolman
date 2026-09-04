import { esc, faq, ring } from '../layout.mjs';

// The best fact in this section is that "80 lb paper" names two papers that
// differ by 83%. American basis weight is the weight of 500 sheets *at that
// grade's basis size*, and the basis sizes differ — bond is 17 × 22 inches, text
// is 25 × 38, cover is 20 × 26 — so 80 lb text is 118 gsm and 80 lb cover is
// 216. The numbers are not comparable across grades and nothing on the packet
// says so.
//
// GSM has no such problem: it is grams per square metre, one number, no grade.
// Which is the argument the section makes.
//
//   gsm = (lb × 453.59237) / (500 × basisW × basisH × 0.00064516)

const LB_G = 453.59237;
const IN2_M2 = 0.00064516;

const GRADES = [
  { id: 'bond', name: 'Bond / Writing', w: 17, h: 22, use: 'Office copier paper, letterheads and business stationery.' },
  { id: 'text', name: 'Text / Book', w: 25, h: 38, use: 'Book pages, brochures, magazine interiors and flyers.' },
  { id: 'cover', name: 'Cover', w: 20, h: 26, use: 'Business cards, book covers, postcards and folders.' },
  { id: 'index', name: 'Index', w: 25.5, h: 30.5, use: 'Index cards, tabbed dividers and stiff record cards.' },
  { id: 'tag', name: 'Tag', w: 24, h: 36, use: 'Tags, tickets and hanging labels.' },
  { id: 'bristol', name: 'Bristol', w: 22.5, h: 28.5, use: 'Drawing board, presentation card and heavy stock.' },
];

const toGsm = (lb, g) => (lb * LB_G) / (500 * g.w * g.h * IN2_M2);
const toLb = (gsm, g) => (gsm * 500 * g.w * g.h * IN2_M2) / LB_G;

// Published conversions, checked on every build. The first version of this file
// computed kilograms per square metre and printed it as gsm — every figure a
// thousand times too small, and every page would have looked internally
// consistent. Comparing against published values caught it immediately.
const PUBLISHED = [
  ['bond', 20, 75], ['bond', 24, 90], ['bond', 32, 120],
  ['text', 70, 104], ['text', 80, 118], ['text', 100, 148],
  ['cover', 65, 176], ['cover', 80, 216], ['cover', 100, 270],
  ['index', 110, 199],
];
{
  const bad = [];
  for (const [gid, lb, want] of PUBLISHED) {
    const g = GRADES.find((x) => x.id === gid);
    const got = toGsm(lb, g);
    if (Math.abs(got - want) / want > 0.02) bad.push(`${lb} lb ${gid}: computed ${got.toFixed(1)} gsm, published ${want}`);
  }
  if (bad.length) {
    console.error('\n✗ paper weight conversion no longer matches the published tables:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

// What a weight is actually for. This is the part no formula gives, and it is
// what makes a gsm page worth more than a row in a table.
const GSM_USE = {
  60: 'Thin book paper and economy copier stock. Print shows through from the reverse, which is why cheap paperbacks are printed on it and letters are not.',
  70: 'Budget office paper and mass-market paperback pages. It feels flimsy in the hand and costs noticeably less to post in bulk, which is the entire argument for it.',
  75: 'The North American office default, sold as 20 lb bond. It is a hair lighter than the 80 gsm used everywhere else, which is why imported stationery feels subtly different.',
  80: 'The world standard for office paper. Outside North America this is what a copier is loaded with and what "a sheet of paper" means with no further qualification.',
  90: 'A step up from copier paper, used for letterheads and documents meant to be handed over rather than filed. Heavy enough that it no longer curls in a laser printer.',
  100: 'Quality stationery and the inner pages of good brochures. This is the weight at which paper stops feeling disposable and starts feeling chosen.',
  120: 'Heavy letterhead and single-sheet flyers. It folds once cleanly and twice badly, so anything needing a third fold wants something lighter.',
  150: 'Poster and flyer weight. It holds its shape on a wall without curling and takes heavy ink coverage without cockling, which lighter stock does not.',
  170: 'Magazine covers and premium flyers. The point where paper begins to behave like card — it will stand up on its own edge if creased.',
  200: 'Light card for folders, presentation covers and the thinner end of postcards. Most office printers will still feed it; most will complain.',
  250: 'Postcard and invitation weight, and the minimum most printers accept for anything posted without an envelope.',
  300: 'The standard business card weight, and the usual choice for premium invitations. When a printer says "card" without a number, this is the number.',
  350: 'Heavy business cards, tags and light packaging. Beyond the feed capability of nearly every desktop printer, so it is a commercial-press stock.',
};
const FALLBACK_USE = 'Board rather than paper, needing a press with a straight paper path.';
const useFor = (gsm) => GSM_USE[gsm] || FALLBACK_USE;

const GSM_VALUES = [60, 70, 75, 80, 90, 100, 120, 150, 170, 200, 250, 300, 350];
const LB_VALUES = {
  bond: [16, 20, 24, 28, 32, 36],
  text: [50, 60, 70, 80, 100],
  cover: [65, 80, 100, 130],
  index: [90, 110, 140],
  tag: [100, 125, 150],
};

// The commercial range each grade is actually sold in, taken from the weights
// listed above. A conversion outside it is arithmetically correct and
// practically useless — 300 gsm is 203 lb text, and text paper stops near 100.
const RANGE = {};
for (const g of GRADES) {
  const vs = LB_VALUES[g.id];
  if (vs) RANGE[g.id] = [Math.min(...vs), Math.max(...vs)];
}
const inRange = (gid, lb) => !RANGE[gid] || (lb >= RANGE[gid][0] * 0.85 && lb <= RANGE[gid][1] * 1.15);

// The nearest gsm page that exists, rather than the nearest decade — 90 lb index
// is 163 gsm and there is no 160-gsm page.
const nearestGsm = (gsm) => GSM_VALUES.reduce((a, b) => (Math.abs(b - gsm) < Math.abs(a - gsm) ? b : a));

// Which lb+grade pages actually exist, so the cross-grade table links only to
// those. 100 lb text is a real paper and 100 lb bond is not.
const HAS_PAGE = new Set();
for (const g of GRADES) for (const lb of LB_VALUES[g.id] || []) HAS_PAGE.add(`${lb}-${g.id}`);

const r0 = (v) => Math.round(v);
const r1 = (v) => v.toFixed(1);

export default async function () {
  const pages = [];

  // --- one page per gsm value ---
  for (const gsm of GSM_VALUES) {
    const equivalents = GRADES.map((g) => ({ g, lb: toLb(gsm, g) }));
    const near = GSM_VALUES.filter((x) => x !== gsm && Math.abs(x - gsm) <= Math.max(30, gsm * 0.4));

    const FAQ = faq([
      { q: `What is ${gsm} gsm in lb?`,
        a: `The gsm equivalent depends which grade — that is the whole difficulty. ${equivalents.slice(0, 3).map((e) => `<strong>${r0(e.lb)} lb ${e.g.name.split(' / ')[0].toLowerCase()}</strong>`).join(', ')}. American basis weights are not comparable between grades, so a pound figure means nothing without the grade beside it.` },
      { q: `How thick is ${gsm} gsm paper?`,
        a: `Roughly <strong>${r0(gsm / 0.8) / 1000} mm</strong> for an uncoated sheet — about ${(gsm / 0.8 / 1000).toFixed(3)} mm — though thickness depends on how the paper was made as much as on its weight. A bulky uncoated stock and a compressed glossy one at the same gsm can differ by half again.` },
      { q: `What is ${gsm} gsm paper used for?`, a: useFor(gsm) },
    ]);

    pages.push({
      path: `/paper-weight/${gsm}-gsm/`,
      title: `${gsm} gsm Paper — ${r0(equivalents[0].lb)} lb Bond, ${r0(equivalents[1].lb)} lb Text | Toolman`,
      desc: `${gsm} gsm equals ${r0(equivalents[0].lb)} lb bond, ${r0(equivalents[1].lb)} lb text or ${r0(equivalents[2].lb)} lb cover. What the weight is used for and why the pound figures differ.`,
      h1: `${gsm} gsm paper`,
      crumbs: [{ name: 'Paper weight', path: '/paper-weight/' }, { name: `${gsm} gsm`, path: `/paper-weight/${gsm}-gsm/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${gsm} g/m²</strong></p>
<p class="muted">${equivalents.slice(0, 3).map((e) => `${r0(e.lb)} lb ${e.g.name.split(' / ')[0].toLowerCase()}`).join(' · ')}</p>

<h2>What ${gsm} gsm is for</h2>
<p>${useFor(gsm)}</p>

<h2>${gsm} gsm in American basis weights</h2>
<p>One metric weight becomes six different pound figures, because each American grade is weighed at a different sheet size. None of them is more correct than the others — but some are outside the range that grade is actually sold in, and those are marked.</p>
<table><thead><tr><th>Grade</th><th>Basis size</th><th>${gsm} gsm is</th><th>Used for</th></tr></thead><tbody>
${equivalents.map((e) => `<tr><td>${esc(e.g.name)}</td><td>${e.g.w} × ${e.g.h} in</td><td><strong>${r1(e.lb)} lb</strong>${inRange(e.g.id, e.lb) ? '' : ' <span class="muted">— not made at this weight</span>'}</td><td class="muted">${esc(e.g.use)}</td></tr>`).join('')}
</tbody></table>

${near.length ? `<h2>Nearby weights</h2>
<table><thead><tr><th>gsm</th><th>lb bond</th><th>lb text</th><th>lb cover</th><th></th></tr></thead><tbody>
${[...near, gsm].sort((a, b) => a - b).map((x) => `<tr${x === gsm ? ' style="font-weight:600"' : ''}><td>${x === gsm ? `${x}` : `<a href="/paper-weight/${x}-gsm/">${x}</a>`}</td><td>${r0(toLb(x, GRADES[0]))}</td><td>${r0(toLb(x, GRADES[1]))}</td><td>${r0(toLb(x, GRADES[2]))}</td><td class="muted">${useFor(x).split('.')[0]}</td></tr>`).join('')}
</tbody></table>` : ''}

${FAQ.html}

<h2>Nearby weights</h2>
<ul class="linklist">${ring(GSM_VALUES, gsm, 10).map((o) => `<li><a href="/paper-weight/${o}-gsm/">${o} gsm</a></li>`).join('')}</ul>

<p><a href="/paper-weight/">All paper weights, and why lb figures disagree</a> · <a href="/paper/">Paper sizes</a></p>`,
    });
  }

  // --- one page per lb + grade ---
  for (const grade of GRADES) {
    for (const lb of LB_VALUES[grade.id] || []) {
      const gsm = toGsm(lb, grade);
      const clashes = GRADES.filter((g) => g.id !== grade.id).map((g) => ({ g, gsm: toGsm(lb, g) }));
      const worst = clashes.reduce((a, b) => (Math.abs(b.gsm - gsm) > Math.abs(a.gsm - gsm) ? b : a));

      const FAQ = faq([
        { q: `What is ${lb} lb ${grade.name.split(' / ')[0].toLowerCase()} paper in gsm?`,
          a: `<strong>${r0(gsm)} gsm</strong>. ${lb} lb means 500 sheets at the ${grade.name.toLowerCase()} basis size of ${grade.w} × ${grade.h} inches weigh ${lb} pounds.` },
        { q: `Is ${lb} lb ${grade.name.split(' / ')[0].toLowerCase()} the same as ${lb} lb ${worst.g.name.split(' / ')[0].toLowerCase()}?`,
          a: `No, and the difference is large. ${lb} lb ${grade.name.split(' / ')[0].toLowerCase()} is ${r0(gsm)} gsm; ${lb} lb ${worst.g.name.split(' / ')[0].toLowerCase()} is <strong>${r0(worst.gsm)} gsm</strong> — ${(Math.max(gsm, worst.gsm) / Math.min(gsm, worst.gsm)).toFixed(2)} times as heavy. The pound number is the weight of 500 sheets at a size that differs by grade, so it cannot be compared across them.` },
        { q: `What is ${lb} lb ${grade.name.split(' / ')[0].toLowerCase()} used for?`, a: `${grade.use} At ${r0(gsm)} gsm: ${useFor(gsm).charAt(0).toLowerCase()}${useFor(gsm).slice(1)}` },
      ]);

      const short = grade.name.split(' / ')[0].toLowerCase();
      pages.push({
        path: `/paper-weight/${lb}-lb-${grade.id}/`,
        title: `${lb} lb ${grade.name.split(' / ')[0]} Paper — ${r0(gsm)} gsm | Toolman`,
        desc: `${lb} lb ${short} paper is ${r0(gsm)} gsm. Why ${lb} lb means something different in every grade, and what this weight is used for.`,
        h1: `${lb} lb ${grade.name.split(' / ')[0].toLowerCase()} paper`,
        crumbs: [{ name: 'Paper weight', path: '/paper-weight/' }, { name: `${lb} lb ${short}`, path: `/paper-weight/${lb}-lb-${grade.id}/` }],
        jsonld: [FAQ.schema],
        body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${r0(gsm)} g/m²</strong></p>
<p class="muted">${lb} lb ${short} · basis size ${grade.w} × ${grade.h} in · ${esc(grade.use)}</p>

<h2>Where ${r0(gsm)} gsm comes from</h2>
<p>An American basis weight is the weight of <strong>500 sheets at that grade's basis size</strong>. For ${grade.name.toLowerCase()} that size is ${grade.w} × ${grade.h} inches, so:</p>
<pre><code>500 sheets × ${grade.w} × ${grade.h} in = ${r0(500 * grade.w * grade.h).toLocaleString('en-US')} in² = ${r1(500 * grade.w * grade.h * IN2_M2)} m²
${lb} lb = ${r0(lb * LB_G).toLocaleString('en-US')} g
${r0(lb * LB_G).toLocaleString('en-US')} g ÷ ${r1(500 * grade.w * grade.h * IN2_M2)} m² = ${r0(gsm)} g/m²</code></pre>

<h2>The same number, a different paper</h2>
<p>${lb} lb is not one weight. Because every grade is weighed at its own sheet size, the same pound figure describes papers that are nothing alike:</p>
<table><thead><tr><th>Grade</th><th>Basis size</th><th>${lb} lb is</th><th>vs ${short}</th></tr></thead><tbody>
${[{ g: grade, gsm }, ...clashes].map((c) => `<tr${c.g.id === grade.id ? ' style="font-weight:600"' : ''}><td>${c.g.id !== grade.id && HAS_PAGE.has(`${lb}-${c.g.id}`) ? `<a href="/paper-weight/${lb}-lb-${c.g.id}/">${esc(c.g.name)}</a>` : esc(c.g.name)}</td><td>${c.g.w} × ${c.g.h} in</td><td>${r0(c.gsm)} gsm</td><td>${c.g.id === grade.id ? '—' : `${(c.gsm / gsm).toFixed(2)}×`}</td></tr>`).join('')}
</tbody></table>
<p><strong>This is the reason to ask for gsm.</strong> One number, no grade, no ambiguity — ${r0(gsm)} gsm is ${r0(gsm)} gsm whoever is printing it.</p>

${FAQ.html}

<h2>Nearby weights in ${short}</h2>
<ul class="linklist">${ring(LB_VALUES[grade.id] || [], lb, 10).map((o) => HAS_PAGE.has(`${o}-${grade.id}`) ? `<li><a href="/paper-weight/${o}-lb-${grade.id}/">${o} lb ${esc(short)}</a></li>` : '').join('')}</ul>

<p><a href="/paper-weight/${nearestGsm(gsm)}-gsm/">${nearestGsm(gsm)} gsm</a> · <a href="/paper-weight/">All paper weights</a> · <a href="/paper/">Paper sizes</a></p>`,
      });
    }
  }

  const t80 = toGsm(80, GRADES.find((g) => g.id === 'text'));
  const c80 = toGsm(80, GRADES.find((g) => g.id === 'cover'));

  pages.push({
    path: '/paper-weight/',
    title: 'Paper Weight Chart — GSM to lb, and Why 80 lb Means Two Things | Toolman',
    desc: `80 lb text is ${r0(t80)} gsm and 80 lb cover is ${r0(c80)} gsm. American basis weights are measured at different sheet sizes per grade, so they cannot be compared. Full gsm to lb conversion.`,
    h1: 'Paper weight',
    crumbs: [{ name: 'Paper weight', path: '/paper-weight/' }],
    body: `<p class="muted">Paper weight in gsm and in American basis weights, with the conversion and the trap it contains.</p>

<h2>80 lb paper is two different papers</h2>
<p><strong>80 lb text is ${r0(t80)} gsm. 80 lb cover is ${r0(c80)} gsm.</strong> One is a brochure page and the other is a business card, and they are ${(c80 / t80).toFixed(2)} times apart in weight while carrying the same number on the label.</p>
<p>The reason is that an American basis weight is <em>the weight of 500 sheets at that grade's basis size</em>, and the basis sizes are different: bond is measured at 17 × 22 inches, text at 25 × 38, cover at 20 × 26. Five hundred sheets of a bigger sheet weigh more for the same paper, so the number goes up without the paper changing. <strong>A pound figure means nothing without its grade.</strong></p>
<p>GSM has no such problem. It is grams per square metre — one number, no grade, no basis size, the same everywhere. If you are specifying paper and have the choice, specify gsm.</p>

<h2>GSM to pounds, every grade</h2>
<table><thead><tr><th>gsm</th>${GRADES.map((g) => `<th>${esc(g.name.split(' / ')[0])}</th>`).join('')}<th>Typical use</th></tr></thead><tbody>
${GSM_VALUES.map((gsm) => `<tr><td><a href="/paper-weight/${gsm}-gsm/"><strong>${gsm}</strong></a></td>${GRADES.map((g) => { const lb = toLb(gsm, g); return `<td${inRange(g.id, lb) ? '' : ' class="muted"'}>${r0(lb)} lb</td>`; }).join('')}<td class="muted">${useFor(gsm).split('.')[0]}</td></tr>`).join('')}
</tbody></table>

<p class="muted">Greyed figures are outside the range that grade is sold in — the arithmetic holds, but nobody makes 203 lb text paper.</p>

<h2>The basis sizes</h2>
<table><thead><tr><th>Grade</th><th>Basis size</th><th>500 sheets</th><th>What it is</th></tr></thead><tbody>
${GRADES.map((g) => `<tr><td>${esc(g.name)}</td><td>${g.w} × ${g.h} in</td><td>${r1(500 * g.w * g.h * IN2_M2)} m²</td><td class="muted">${esc(g.use)}</td></tr>`).join('')}
</tbody></table>

<h2>Common weights by grade</h2>
${GRADES.filter((g) => (LB_VALUES[g.id] || []).length).map((g) => `<p><strong>${esc(g.name)}</strong> — ${LB_VALUES[g.id].map((lb) => `<a href="/paper-weight/${lb}-lb-${g.id}/">${lb} lb (${r0(toGsm(lb, g))} gsm)</a>`).join(' · ')}</p>`).join('')}

<h2>Weight is not thickness</h2>
<p>Two sheets at the same gsm can differ noticeably in thickness, because gsm measures mass and thickness depends on how much air is in the sheet. An uncoated bulky stock is thicker than a compressed glossy one at the same weight — sometimes by half again. Printers quote thickness separately, in microns or in points, and a paper specified only by gsm can still arrive feeling wrong.</p>

<p><a href="/paper/">Paper sizes</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
