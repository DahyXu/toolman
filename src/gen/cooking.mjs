import { INGREDIENTS, VOL, WT, AMOUNTS } from '../data/ingredients.mjs';
import { esc, faq, ring } from '../layout.mjs';

// A quantity under one takes the singular in English — 1/2 cup, 3/4 cup —
// exactly as one does. Only amounts above one are plural.
const unitFor = (v, vol) => (v <= 1 ? vol.name : vol.plural);

const round = (n) => (n >= 100 ? Math.round(n) : n >= 10 ? +n.toFixed(1) : +n.toFixed(2));
const fmt = (n) => round(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

const converter = (gramsPerUnit, unitLabel, wtLabel) => `<div class="tool">
  <div class="grid2">
    <div><label for="a">${esc(unitLabel)}</label><input type="text" id="a" inputmode="decimal" value="1"></div>
    <div><label for="b">${esc(wtLabel)}</label><input type="text" id="b" inputmode="decimal"></div>
  </div>
  <p class="big" id="eq"></p>
</div>
<script>
(function(){
 var A=document.getElementById('a'),B=document.getElementById('b'),E=document.getElementById('eq'),k=${gramsPerUnit};
 function f(n){if(!isFinite(n))return '';var r=n>=100?Math.round(n):n>=10?+n.toFixed(1):+n.toFixed(2);
  return r.toLocaleString(undefined,{maximumFractionDigits:2})}
 function eq(){var v=parseFloat(A.value);E.textContent=isFinite(v)?f(v)+' ${esc(unitLabel)} = '+f(v*k)+' ${esc(wtLabel)}':''}
 A.addEventListener('input',function(){var v=parseFloat(A.value);B.value=isFinite(v)?f(v*k):'';eq()});
 B.addEventListener('input',function(){var v=parseFloat(B.value);A.value=isFinite(v)?f(v/k):'';eq()});
 B.value=f(k);eq();
})();
</script>`;

export default async function () {
  const pages = [];
  // Read off the ingredient table so the hub cannot drift from it.
  const sorted = [...INGREDIENTS].sort((a, b) => a.g - b.g);
  const lightest = sorted[0];
  const heaviest = sorted[sorted.length - 1];
  const spreadX = Math.round((heaviest.g / lightest.g) * 10) / 10;
  const flour = INGREDIENTS.find((x) => x.id === 'all-purpose-flour');
  const flourG = flour ? flour.g : null;
  const gramsPages = 14; // the weights cooking-reverse.mjs generates
  const exampleCups = flourG ? Math.round((200 / flourG) * 10) / 10 : null;
  if (!flourG || heaviest.g <= lightest.g) {
    console.error('\n\u2717 cooking hub: cannot read the ingredient spread it describes');
    process.exitCode = 1;
  }
  if (spreadX < 2) {
    console.error(`\n\u2717 cooking hub: claims a ${spreadX}x spread, which is not a spread worth a section`);
    process.exitCode = 1;
  }


  for (const ing of INGREDIENTS) {
    const gPerCup = ing.g;

    // ---- per-amount pages: "1 cup flour in grams" ----
    const amountIndex = [];
    for (const vol of VOL.filter((v) => v.id !== 'milliliters')) {
      for (const a of AMOUNTS) {
        if (vol.id === 'teaspoons' && a.v > 3) continue;
        if (vol.id === 'tablespoons' && a.v > 4) continue;
        const slugAmt = a.label.replace(/[ /]/g, '-');
        amountIndex.push({
          path: `/cooking/${slugAmt}-${vol.id}-${ing.id}-to-grams/`,
          label: `${a.label} ${unitFor(a.v, vol)} of ${ing.name} to grams`,
          amount: a, vol,
        });
      }
    }

    for (const entry of amountIndex) {
      const { amount: a, vol } = entry;
      const grams = a.v * vol.c * gPerCup;
      const oz = grams / 28.3495;
      const unitWord = unitFor(a.v, vol);
      const label = `${a.label} ${unitWord} of ${ing.name}`;

      const siblings = ring(amountIndex, entry, 26);

      const FAQ = faq([
        { q: `How many grams is ${label}?`,
          a: `About <strong>${fmt(grams)} grams</strong>, or ${fmt(oz)} ounces.` },
        { q: `How many grams in a cup of ${ing.name}?`,
          a: `Roughly <strong>${gPerCup} grams</strong> per US cup.` },
        { q: 'Is a US cup the same as a metric cup?',
          a: `No. A US customary cup is 236.6 ml; a metric cup — used in Australia, New Zealand and much of Europe — is 250 ml, about 6% larger. An imperial cup, still seen in older British recipes, is 284 ml. For a cup of ${ing.name} that is a difference of roughly ${fmt(gPerCup * 0.0567)} g between US and metric.` },
        { q: 'Should I sift before or after measuring?',
          a: 'The order matters, and recipes are often ambiguous. "1 cup sifted flour" means sift first, then measure — which gives less flour than "1 cup flour, sifted", where you measure first. When in doubt, weigh.' },
      ]);

      pages.push({
        path: entry.path,
        // "1 cup of milk in grams - 240 g" is thirty characters in a result
        // that shows sixty. The unused half cannot match anything, and the
        // queries arriving here also ask for ounces and say "cup to gram".
        title: (() => {
          const base = `${a.label} ${unitWord} of ${ing.name} in grams — ${fmt(grams)} g`;
          const withOz = `${base}, ${fmt(oz)} oz`;
          // The suffix has to name the unit the page is about. Hard-coding
          // "Cup to Gram" put it on the tablespoon pages too.
          const measure = /tablespoon/.test(unitWord) ? 'Tbsp'
            : /teaspoon/.test(unitWord) ? 'Tsp'
            : /cup/.test(unitWord) ? 'Cup'
            : null;
          if (measure && !new RegExp(measure === 'Tbsp' ? 'tablespoon' : measure === 'Tsp' ? 'teaspoon' : 'cup').test(unitWord)) {
            console.error(`
✗ cooking ${entry.path}: titled "${measure} to Gram" for a page measured in ${unitWord}`);
            process.exitCode = 1;
          }
          const full = measure ? `${withOz} | ${measure} to Gram` : withOz;
          return full.length <= 65 ? full : withOz.length <= 65 ? withOz : base;
        })(),
        desc: `${label} weighs about ${fmt(grams)} grams (${fmt(oz)} oz). Conversion table, why the number varies, and a calculator for any amount.`,
        h1: `${label} in grams`,
        crumbs: [
          { name: 'Cooking', path: '/cooking/' },
          { name: ing.name, path: `/cooking/${ing.id}/` },
          { name: `${a.label} ${unitWord}`, path: entry.path },
        ],
        jsonld: [FAQ.schema],
        body: `<p class="big" style="font-size:1.5rem;margin:.4em 0">${label} ≈ <strong>${fmt(grams)} grams</strong></p>
<p class="muted">That is about ${fmt(oz)} ounces. ${ing.alt ? `Also sold as <strong>${esc(ing.alt)}</strong>. ` : ''}One US cup of ${ing.name} weighs ${gPerCup} g.</p>

${converter(vol.c * gPerCup, vol.plural, 'grams')}

<h2>Why this number is approximate</h2>
<p>${ing.note}</p>

<h2>${ing.name.charAt(0).toUpperCase() + ing.name.slice(1)} conversion table</h2>
<table><thead><tr><th>Cups</th><th>Grams</th><th>Ounces</th><th>Tablespoons</th></tr></thead><tbody>
${AMOUNTS.map((x) => `<tr${x.v === a.v && vol.id === 'cups' ? ' style="font-weight:600"' : ''}><td>${x.label}</td><td>${fmt(x.v * gPerCup)} g</td><td>${fmt(x.v * gPerCup / 28.3495)} oz</td><td>${fmt(x.v * 16)}</td></tr>`).join('')}
</tbody></table>

<h2>Weigh it if you can</h2>
<p>Volume measures are convenient but imprecise — the same cup can hold noticeably different amounts depending on how the ingredient is packed, how humid the room is, and whether it was sifted. A digital kitchen scale removes the variable entirely, which is why professional and European recipes give weights. If you bake regularly, a scale is the cheapest accuracy upgrade available.</p>

${FAQ.html}

<h2>Other amounts</h2>
<ul class="linklist">${siblings.map((s) => `<li><a href="${s.path}">${esc(s.label)}</a></li>`).join('')}</ul>
<p><a href="/cooking/${ing.id}/">All ${esc(ing.name)} conversions</a> · <a href="/cooking/">All cooking conversions</a></p>`,
      });
    }

    // ---- ingredient hub ----
    pages.push({
      path: `/cooking/${ing.id}/`,
      title: (() => {
        // This is the page Google shows for "1 cup butter in grams", and the
        // title was "Butter - Cups to Grams Conversion": neither the phrase
        // people type nor the answer they want, in 33 of 65 characters.
        const Name = ing.name.charAt(0).toUpperCase() + ing.name.slice(1);
        const answer = `${Name} in Grams — 1 Cup Is ${gPerCup} g`;
        const full = `${answer} | Cups to Grams Chart`;
        return full.length <= 65 ? full : answer.length <= 65 ? answer : `${Name} — Cups to Grams`;
      })(),
      desc: `One US cup of ${ing.name} weighs about ${gPerCup} grams. Full conversion table for cups, tablespoons, teaspoons, grams and ounces, plus why the figure varies.`,
      h1: `${ing.name.charAt(0).toUpperCase() + ing.name.slice(1)} conversions`,
      crumbs: [{ name: 'Cooking', path: '/cooking/' }, { name: ing.name, path: `/cooking/${ing.id}/` }],
      body: `<p class="muted">One US cup of ${ing.name} weighs approximately <strong>${gPerCup} grams</strong> (${fmt(gPerCup / 28.3495)} oz).${ing.alt ? ` Also known as <strong>${esc(ing.alt)}</strong>.` : ''}</p>
<p><a href="/cooking/200-grams-${ing.id}-to-cups/">Going the other way?</a> Weights of ${ing.name} converted to cups, with the cups and spoons to measure each one out.</p>
${converter(gPerCup, 'cups', 'grams')}
<h2>Why this varies</h2>
<p>${ing.note}</p>
<h2>Cups to grams</h2>
<table><thead><tr><th>Cups</th><th>Grams</th><th>Ounces</th></tr></thead><tbody>
${AMOUNTS.map((x) => `<tr><td>${x.label}</td><td>${fmt(x.v * gPerCup)} g</td><td>${fmt(x.v * gPerCup / 28.3495)} oz</td></tr>`).join('')}
</tbody></table>
<h2>Spoons to grams</h2>
<table><thead><tr><th>Measure</th><th>Grams</th></tr></thead><tbody>
${[['1 tablespoon', gPerCup / 16], ['2 tablespoons', gPerCup / 8], ['1 teaspoon', gPerCup / 48], ['1/2 teaspoon', gPerCup / 96]]
  .map(([l, g]) => `<tr><td>${l}</td><td>${fmt(g)} g</td></tr>`).join('')}
</tbody></table>
<h2>All ${esc(ing.name)} amounts</h2>
<ul class="linklist">${amountIndex.map((s) => `<li><a href="${s.path}">${esc(s.label)}</a></li>`).join('')}</ul>
<p><a href="/cooking/">All cooking conversions</a></p>`,
    });
  }

  // ---- master hub ----
  const cats = [...new Set(INGREDIENTS.map((i) => i.cat))];
  pages.push({
    path: '/cooking/',
    title: 'Cooking Conversions — Cups to Grams by Ingredient',
    desc: `How much a cup weighs depends entirely on what is in it. Cups-to-grams conversions for ${INGREDIENTS.length} common ingredients, with tables and a calculator for any amount.`,
    h1: 'Cooking conversions',
    crumbs: [{ name: 'Cooking', path: '/cooking/' }],
    body: `<p class="muted">A cup of flour and a cup of honey weigh nothing like the same — 125 g against 340 g. That is why a single "cups to grams" number does not exist, and why these conversions are per ingredient.</p>
${cats.map((c) => `<h2>${esc(c)}</h2>
<table><thead><tr><th>Ingredient</th><th>1 cup</th><th>1 tbsp</th></tr></thead><tbody>
${INGREDIENTS.filter((i) => i.cat === c).map((i) =>
      `<tr><td><a href="/cooking/${i.id}/">${esc(i.name.charAt(0).toUpperCase() + i.name.slice(1))}</a>${i.alt ? ` <span class="muted">(${esc(i.alt)})</span>` : ''}</td><td>${i.g} g</td><td>${fmt(i.g / 16)} g</td></tr>`).join('')}
</tbody></table>`).join('')}

<h2>Cup sizes are not universal</h2>
<table><thead><tr><th>Cup</th><th>Volume</th><th>Where</th></tr></thead><tbody>
<tr><td>US customary</td><td>236.6 ml</td><td>United States — the default in American recipes and on this site</td></tr>
<tr><td>US legal</td><td>240 ml</td><td>US nutrition labelling only</td></tr>
<tr><td>Metric</td><td>250 ml</td><td>Australia, New Zealand, Canada, much of Europe</td></tr>
<tr><td>Imperial</td><td>284 ml</td><td>Older British recipes</td></tr>
</tbody></table>
<p>A metric cup is about 6% larger than a US cup. For most cooking that is within tolerance; for baking it is enough to matter.</p>

<h2>The tablespoon trap</h2>
<p>A US tablespoon is 14.8 ml and an Australian one is 20 ml — 35% larger. If an Australian recipe calls for a tablespoon of baking powder and you use a US spoon, the result will be noticeably flat. Teaspoons, fortunately, are 5 ml almost everywhere.</p>

<h2>Which ingredients a cup measures worst</h2>
<p>The spread across this table is ${spreadX}× — ${lightest.name} weighs ${lightest.g} g a cup and ${heaviest.name} weighs ${heaviest.g} g. That range is why "1 cup = 200 g" is wrong for almost everything, but it is not the part that ruins a recipe. The part that ruins a recipe is that one ingredient can weigh two different amounts on two different days.</p>
<p>Flour is the worst of them. Scooping the cup straight into the bag compacts it and can give 150 g or more where spooning it in and levelling gives ${flourG} g — a fifth more flour than the recipe asked for, which is the difference between a tender crumb and a brick. Brown sugar has the same problem in reverse, because recipes assume it is packed and a loose cup holds noticeably less.</p>
<p>Liquids do not have this failure mode. Water, milk and oil settle to the same volume every time, so measuring them by cup is genuinely fine.</p>

<h2>Measuring without scales</h2>
<p>Spoon the ingredient into the cup and level the top with a straight edge. Do not scoop, do not tap the cup on the counter to settle it, and do not press it down unless the recipe says packed. Those three habits are the whole difference between a cup that matches the number in a recipe and one that does not.</p>
<p>If you have scales, use them for flour and leave the cups for liquids. A digital scale costs less than the ingredients in one failed cake.</p>

<h2>Going the other way</h2>
<p>Recipes give weights and kitchens have cups, which is the direction people are more often stuck in. <a href="/cooking/200-grams-all-purpose-flour-to-cups/">Weights converted to cups</a> covers ${gramsPages} common quantities across every ingredient here, each one broken into the cups and spoons to measure it out — because ${exampleCups} cups is a number and not an instruction.</p>

<h2>Related converters</h2>
<ul class="cards">
<li><a href="/convert/volume/"><b>Volume converters</b><span>Litres, gallons, cups, fluid ounces, tablespoons and more.</span></a></li>
<li><a href="/convert/weight/"><b>Weight converters</b><span>Grams, kilograms, ounces, pounds and stones.</span></a></li>
<li><a href="/convert/temperature/"><b>Oven temperatures</b><span>Celsius, Fahrenheit, Kelvin and gas mark equivalents.</span></a></li>
</ul>`,
  });

  return pages;
}
