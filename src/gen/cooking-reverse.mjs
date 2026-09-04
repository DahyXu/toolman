import { INGREDIENTS } from '../data/ingredients.mjs';
import { esc, faq } from '../layout.mjs';

// The site has 990 pages answering "1 cup of flour in grams" and none
// answering "200g of flour in cups", which is the direction people are far
// more often stuck in: the recipe gives a weight and the kitchen has cups.
//
// Checked before building. "200g flour in cups" has no Google answer widget —
// ingredient density is not something it can compute — and the result ranking
// first is an eight-year-old Quora thread. Google has nothing better to show.
//
// What it has nothing better to show is also the thing worth getting right:
// 200 g of flour is 1.6 cups, and 1.6 cups cannot be measured. The useful
// answer is the one you can act on with the cups and spoons in the drawer.

const GRAMS = [25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 500, 750, 1000];

const TBSP_PER_CUP = 16;
const TSP_PER_TBSP = 3;

// Measuring cups come in these. Anything between them has to be made up of
// spoons, so the breakdown floors to one of these rather than to a decimal.
const CUP_STEPS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
const CUP_LABEL = ['', '¼', '⅓', '½', '⅔', '¾'];
const TSP_STEPS = [0, 1 / 4, 1 / 2, 3 / 4];
const TSP_LABEL = ['', '¼', '½', '¾'];

const round = (n) => (n >= 100 ? Math.round(n) : n >= 10 ? +n.toFixed(1) : +n.toFixed(2));
const fmt = (n) => round(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

// Break a decimal number of cups into cups, tablespoons and teaspoons that a
// person can actually measure out, largest first.
function measureOut(cups) {
  const whole = Math.floor(cups);
  let rest = cups - whole;

  let stepIdx = 0;
  for (let i = CUP_STEPS.length - 1; i >= 0; i--) {
    if (rest >= CUP_STEPS[i] - 1e-9) { stepIdx = i; break; }
  }
  rest -= CUP_STEPS[stepIdx];

  const tbspExact = rest * TBSP_PER_CUP;
  const tbsp = Math.floor(tbspExact + 1e-9);
  let tspExact = (tbspExact - tbsp) * TSP_PER_TBSP;

  let tspIdx = 0;
  for (let i = TSP_STEPS.length - 1; i >= 0; i--) {
    if (tspExact >= TSP_STEPS[i] - 1e-9) { tspIdx = i; break; }
  }
  const tspWhole = Math.floor(tspExact + 1e-9);
  const tspFrac = tspExact - tspWhole;
  let fracIdx = 0;
  for (let i = TSP_STEPS.length - 1; i >= 0; i--) {
    if (tspFrac >= TSP_STEPS[i] - 1e-9) { fracIdx = i; break; }
  }
  void tspIdx;

  // What the breakdown actually adds up to, in cups.
  const total = whole + CUP_STEPS[stepIdx]
    + tbsp / TBSP_PER_CUP
    + (tspWhole + TSP_STEPS[fracIdx]) / (TBSP_PER_CUP * TSP_PER_TBSP);

  const parts = [];
  const cupText = whole > 0
    ? `${whole}${CUP_LABEL[stepIdx] ? CUP_LABEL[stepIdx] : ''} cup${whole > 1 || stepIdx > 0 ? 's' : ''}`
    : stepIdx > 0 ? `${CUP_LABEL[stepIdx]} cup` : '';
  if (cupText) parts.push(cupText);
  if (tbsp > 0) parts.push(`${tbsp} tablespoon${tbsp > 1 ? 's' : ''}`);
  const tspText = tspWhole > 0
    ? `${tspWhole}${TSP_LABEL[fracIdx] || ''} teaspoon${tspWhole > 1 || fracIdx > 0 ? 's' : ''}`
    : fracIdx > 0 ? `${TSP_LABEL[fracIdx]} teaspoon` : '';
  if (tspText) parts.push(tspText);

  return { text: parts.join(' + ') || 'less than a quarter teaspoon', total };
}

const converter = (gPerCup, ingName) => `<div class="tool">
  <div class="grid2">
    <div><label for="a">grams of ${esc(ingName)}</label><input type="text" id="a" inputmode="decimal" value="200"></div>
    <div><label for="b">cups</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <p class="big" id="eq"></p>
</div>
<script>
(function(){
 var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq'),k=${gPerCup};
 function f(n){if(!isFinite(n))return '';var r=n>=100?Math.round(n):n>=10?+n.toFixed(1):+n.toFixed(2);
  return r.toLocaleString(undefined,{maximumFractionDigits:2})}
 function eq(){var v=parseFloat(A.value);E.textContent=isFinite(v)?f(v)+' g = '+f(v/k)+' cups':''}
 A.addEventListener('input',function(){var v=parseFloat(A.value);B.value=isFinite(v)?f(v/k):'';eq()});
 B.addEventListener('input',function(){var v=parseFloat(B.value);A.value=isFinite(v)?f(v*k):'';eq()});
 B.value=f(200/k);eq();
})();
</script>`;

export default function cookingReverse() {
  const pages = [];

  for (const ing of INGREDIENTS) {
    const gPerCup = ing.g;
    const Name = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);

    for (const g of GRAMS) {
      const cups = g / gPerCup;
      // Past about six cups the answer stops being a measuring instruction and
      // starts being an argument for a scale.
      if (cups > 8) continue;
      const m = measureOut(cups);
      const tbspTotal = cups * TBSP_PER_CUP;

      // Assert what the page claims. The breakdown is the reason to read the
      // page, so it has to add up: a reader following it must land within a
      // teaspoon of the weight they were asked for.
      const backToGrams = m.total * gPerCup;
      const oneTspInGrams = gPerCup / (TBSP_PER_CUP * TSP_PER_TBSP);
      if (Math.abs(backToGrams - g) > oneTspInGrams + 1e-6) {
        console.error(`\n✗ cooking-reverse ${g}g ${ing.id}: "${m.text}" measures ${fmt(backToGrams)} g, off by more than a teaspoon`);
        process.exitCode = 1;
      }
      if (m.total > cups + 1e-9) {
        console.error(`\n✗ cooking-reverse ${g}g ${ing.id}: breakdown overshoots ${fmt(cups)} cups`);
        process.exitCode = 1;
      }
      // The forward pages say 1 cup of this weighs gPerCup grams. When the
      // amount is exactly that, this page has to say one cup and nothing else.
      if (g === gPerCup && m.text !== '1 cup') {
        console.error(`\n✗ cooking-reverse ${g}g ${ing.id}: one cup weighs ${gPerCup} g but this reads "${m.text}"`);
        process.exitCode = 1;
      }

      const FAQ = faq([
        {
          q: `How many cups is ${g} g of ${ing.name}?`,
          a: `<strong>${fmt(cups)} cups</strong>, which in measuring cups and spoons is ${m.text}. One US cup of ${ing.name} weighs about ${gPerCup} g.`,
        },
        {
          q: `How do I measure ${g} g of ${ing.name} without scales?`,
          a: `${m.text}. Spoon it in and level the top rather than scooping — scooping compacts ${ing.name} and can add a fifth to the weight.`,
        },
        {
          q: `Is this the same in the UK?`,
          a: `The gram figure is, the cup is not. A US cup is 236.6 ml and the metric cup used in Australia and much of Europe is 250 ml, so a European cup of ${ing.name} weighs about ${Math.round(gPerCup * (250 / 236.588))} g. These pages use the US cup.`,
        },
      ]);

      const base = `${g}g of ${ing.name} in cups`;
      const title = (() => {
        const withAns = `${base} — ${fmt(cups)} cups`;
        const full = `${withAns} | Grams to Cups`;
        return full.length <= 65 ? full : withAns.length <= 65 ? withAns : base;
      })();

      pages.push({
        path: `/cooking/${g}-grams-${ing.id}-to-cups/`,
        title,
        desc: `${g} grams of ${ing.name} is ${fmt(cups)} cups — in measuring cups and spoons, ${m.text}. Why the number moves, and a converter for any weight.`,
        h1: `${g} g of ${ing.name} in cups`,
        crumbs: [
          { name: 'Cooking', path: '/cooking/' },
          { name: ing.name, path: `/cooking/${ing.id}/` },
          { name: `${g} g in cups`, path: `/cooking/${g}-grams-${ing.id}-to-cups/` },
        ],
        jsonld: [FAQ.schema],
        body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${g} g ≈ ${fmt(cups)} cups</strong></p>
<p class="muted">That is also ${fmt(tbspTotal)} tablespoons, at ${gPerCup} g per US cup.</p>

<h2>How to measure it</h2>
<p style="font-size:1.15rem"><strong>${m.text}</strong></p>
<p>${fmt(cups)} cups is a number, not an instruction — there is no ${fmt(cups)} cup in the drawer. The line above is the same quantity in the sizes you actually own, and following it lands within a teaspoon of ${g} g.</p>
<p class="muted">Spoon the ${ing.name} into the cup and level it off. Scooping straight from the bag packs it down; on flour that alone is worth about 20%, which is more than the difference this page is measuring.</p>

<h2>Converter</h2>
${converter(gPerCup, ing.name)}

<h2>Why this number moves</h2>
<p>${ing.note || `A cup is a volume and ${ing.name} is sold by weight, so the conversion depends on how densely it settles. Published figures for ${ing.name} differ by a few grams per cup for exactly that reason.`}</p>
<p>This page uses <strong>${gPerCup} g per US cup</strong>. If your recipe came with its own figure, use theirs — internal consistency matters more than which table is right.</p>

<h2>Other weights of ${ing.name}</h2>
<ul class="linklist">
${GRAMS.filter((x) => x !== g && x / gPerCup <= 8).map((x) => `<li><a href="/cooking/${x}-grams-${ing.id}-to-cups/">${x} g in cups</a></li>`).join('\n')}
</ul>

${FAQ.html}

<p><a href="/cooking/${ing.id}/">All ${esc(ing.name)} conversions</a> · <a href="/cooking/">Cooking measures</a></p>`,
      });
    }
  }

  return pages;
}
