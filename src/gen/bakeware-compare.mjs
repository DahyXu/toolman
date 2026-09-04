import { esc, faq } from '../layout.mjs';
import { TIN_ROWS as ROWS } from './bakeware-sizes.mjs';

// "8 inch vs 9 inch cake pan" has no Google answer widget, and the result
// ranking first is a two-year-old Reddit thread. What people are asking is
// whether the swap works, and that has an arithmetic answer nobody prints: a
// recipe is written for a tin *area*, so the same batter in a wider tin is
// shallower, and shallower bakes sooner.
//
// A pair only earns a page when the swap is one someone would really consider.
// Past double the area it is not a substitution, it is a different recipe.
const MAX_AREA_RATIO = 2;

const f0 = (v) => Math.round(v).toLocaleString('en-US');
const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const pct = (n) => `${Math.round(n * 100)}%`;

export default function bakewareCompare() {
  const pages = [];

  for (let i = 0; i < ROWS.length; i++) {
    for (let j = i + 1; j < ROWS.length; j++) {
      const A = ROWS[i];
      const B = ROWS[j];
      const ratio = Math.max(A.areaCm2, B.areaCm2) / Math.min(A.areaCm2, B.areaCm2);
      if (ratio > MAX_AREA_RATIO) continue;

      // Area alone produced pairs nobody asks about - an 18 cm springform
      // against a 23 cm tart tin - and 159 pages of them read as near
      // duplicates of each other because only the numbers moved. A pair is a
      // real question when it is two tins of the same kind at different sizes,
      // or two different kinds close enough in both area and depth to stand in
      // for one another. A 2.5 cm tart tin is not a substitute for a 6.5 cm
      // springform at any diameter.
      const family = (t) => t.id.replace(/-.*$/, '');
      const depthRatio = Math.max(A.depth, B.depth) / Math.min(A.depth, B.depth);
      const sameKind = family(A) === family(B);
      // A springform is a round tin with a releasing base. What separates it
      // from a plain round of the same size is the mechanism, not the size,
      // so the pair does not belong in a section about sizes.
      const roundish = (t) => /^(round|springform)/.test(t.id);
      if (roundish(A) && roundish(B) && !sameKind) continue;
      if (!sameKind && !(ratio <= 1.25 && depthRatio <= 1.5)) continue;
      if (depthRatio > 2.2) continue;

      const slug = `${A.id}-vs-${B.id}`;
      // Batter written for A, poured into B: it spreads over more or less area,
      // so its depth changes by the inverse of the area change.
      const aToB = B.areaCm2 / A.areaCm2;   // multiply the recipe by this
      const bToA = A.areaCm2 / B.areaCm2;
      const depthAinB = A.areaCm2 / B.areaCm2; // fraction of the original depth
      const depthBinA = B.areaCm2 / A.areaCm2;
      const bigger = A.areaCm2 > B.areaCm2 ? A : B;
      const smaller = A.areaCm2 > B.areaCm2 ? B : A;
      const diffPct = r1((ratio - 1) * 100);

      // Assert what the page claims.
      {
        const recomputed = A.shape === 'round'
          ? Math.PI * Math.pow(A.dims[0] / 2, 2) / 100
          : (A.dims[0] * A.dims[1]) / 100;
        if (Math.abs(recomputed - A.areaCm2) > 0.01) {
          console.error(`\n✗ bakeware ${slug}: ${A.name} area ${r1(A.areaCm2)} cm² does not follow from its dimensions`);
          process.exitCode = 1;
        }
      }
      if (Math.abs(aToB * A.areaCm2 - B.areaCm2) > 0.01) {
        console.error(`\n✗ bakeware ${slug}: scaling a ${A.name} recipe by ${r2(aToB)} does not fill ${B.name}`);
        process.exitCode = 1;
      }
      if (Math.abs(depthAinB * aToB - 1) > 1e-9) {
        console.error(`\n✗ bakeware ${slug}: depth ratio ${r2(depthAinB)} is not the inverse of the scale ${r2(aToB)}`);
        process.exitCode = 1;
      }
      // Square centimetres times centimetres of depth gives millilitres, so
      // the divisor is 10,000 and not 1,000 - the first version of this line
      // was out by the factor of ten between millimetres and centimetres.
      if (Math.abs((A.areaCm2 * (A.depth / 10)) / 1000 - A.volL) > 0.01) {
        console.error(`\n✗ bakeware ${slug}: ${A.name} holds ${r2(A.volL)} L, which is not its area times its depth`);
        process.exitCode = 1;
      }
      if (bigger === smaller) {
        console.error(`\n✗ bakeware ${slug}: the larger and smaller tin resolved to the same one`);
        process.exitCode = 1;
      }

      // Within a few percent the swap is invisible; past a fifth the cake is a
      // different shape and needs the mixture adjusted.
      const verdict = ratio <= 1.05 ? 'same' : ratio <= 1.2 ? 'close' : 'scale';

      const verdictLine = {
        same: `<strong>Swap them freely.</strong> The areas are within ${diffPct}% of each other, which is less than the variation between two tins of the same nominal size from different manufacturers. Use the recipe as written.`,
        close: `<strong>Swap without changing the recipe, but watch the oven.</strong> ${bigger.name} has ${diffPct}% more area, so a mixture written for ${smaller.name} sits about ${pct(smaller.areaCm2 / bigger.areaCm2)} as deep in it and browns sooner.`,
        // The first version said the batter would be "half-lost in the tin or
        // over the top of it", which at a 32% area difference is not what the
        // arithmetic says: it comes out at 76% of the depth. Describe the
        // number rather than dramatising it.
        scale: `<strong>Scale the mixture, or accept a flatter cake.</strong> ${bigger.name} has ${diffPct}% more area, so a ${smaller.name} mixture poured straight in sits <strong>${pct(smaller.areaCm2 / bigger.areaCm2)}</strong> as deep. It still bakes, and it browns more at the edges for being shallower. Multiplying by ${r2(bigger.areaCm2 / smaller.areaCm2)} restores the depth the recipe was written for.`,
      }[verdict];

      const FAQ = faq([
        {
          q: `Can I use a ${B.name} instead of a ${A.name}?`,
          a: `Yes, with the mixture multiplied by <strong>${r2(aToB)}</strong>. ${B.name} has ${r1(B.areaCm2)} cm² of base against ${r1(A.areaCm2)} cm², so an unscaled ${A.name} recipe sits ${pct(depthAinB)} as deep and bakes faster.`,
        },
        {
          q: `What is the difference between a ${A.name} and a ${B.name}?`,
          a: `${A.name} has a base area of ${r1(A.areaCm2)} cm² and ${B.name} has ${r1(B.areaCm2)} cm² — ${bigger.name} is <strong>${diffPct}% larger</strong>. At their usual depths they hold ${r2(A.volL)} L and ${r2(B.volL)} L.`,
        },
        {
          q: `Do I need to change the baking time between a ${A.name} and a ${B.name}?`,
          a: verdict === 'same'
            ? `No. The two areas are within ${diffPct}%, so the batter sits at effectively the same depth and bakes in the same time.`
            : `Yes. Moving a ${smaller.name} mixture into ${bigger.name} makes it ${pct(smaller.areaCm2 / bigger.areaCm2)} as deep, so start checking at about <strong>${pct(Math.max(0.6, smaller.areaCm2 / bigger.areaCm2))}</strong> of the stated time. Depth drives baking time far more than tin diameter does.`,
        },
      ]);

      const base = `${A.name} vs ${B.name}`;
      const title = (() => {
        const full = `${base} — Area, Capacity and How to Scale`;
        const mid = `${base} — How to Scale the Recipe`;
        return full.length <= 65 ? full : mid.length <= 65 ? mid : base.slice(0, 65);
      })();

      pages.push({
        path: `/bakeware/compare/${slug}/`,
        title,
        desc: `${A.name} is ${r1(A.areaCm2)} cm² and ${B.name} is ${r1(B.areaCm2)} cm². ${bigger.name} is ${diffPct}% larger, so a recipe moved between them needs multiplying by ${r2(aToB)} — and the baking time changes with the depth, not the diameter.`,
        h1: base,
        crumbs: [
          { name: 'Baking tins', path: '/bakeware/' },
          { name: base, path: `/bakeware/compare/${slug}/` },
        ],
        jsonld: [FAQ.schema],
        body: `<table><thead><tr><th></th><th>${esc(A.name)}</th><th>${esc(B.name)}</th></tr></thead><tbody>
<tr><td>Size</td><td>${esc(A.label)}</td><td>${esc(B.label)}</td></tr>
<tr><td>Base area</td><td>${r1(A.areaCm2)} cm²</td><td>${r1(B.areaCm2)} cm²</td></tr>
<tr><td>Usual depth</td><td>${f0(A.depth / 10)} cm</td><td>${f0(B.depth / 10)} cm</td></tr>
<tr><td>Holds</td><td>${r2(A.volL)} L</td><td>${r2(B.volL)} L</td></tr>
</tbody></table>

<h2>Can you swap them?</h2>
<p>${verdictLine}</p>

<h2>Scaling the recipe</h2>
<table><thead><tr><th>Recipe written for</th><th>Baked in</th><th>Multiply by</th><th>Or leave it and get</th></tr></thead><tbody>
<tr><td>${esc(A.name)}</td><td>${esc(B.name)}</td><td><strong>${r2(aToB)}</strong></td><td>${pct(depthAinB)} of the depth</td></tr>
<tr><td>${esc(B.name)}</td><td>${esc(A.name)}</td><td><strong>${r2(bToA)}</strong></td><td>${pct(depthBinA)} of the depth</td></tr>
</tbody></table>
<p class="muted">Multiply every ingredient, including the eggs — round to the nearest half egg and adjust the liquid rather than rounding a whole one up.</p>

<h2>Baking time</h2>
<p>${verdict === 'same'
  ? `The depths work out the same here, so use the time as written.`
  : `A mixture ${pct(smaller.areaCm2 / bigger.areaCm2)} as deep is done earlier, not cooler. Leave the temperature alone, start testing at about ${pct(Math.max(0.6, smaller.areaCm2 / bigger.areaCm2))} of the stated time, and let the skewer decide.`}
<a href="/bakeware/compare/">Why depth sets the time and diameter barely does →</a></p>

${FAQ.html}

<p><a href="/bakeware/${A.id}/">${esc(A.name)} in full</a> · <a href="/bakeware/${B.id}/">${esc(B.name)} in full</a> · <a href="/bakeware/compare/">All tin comparisons</a> · <a href="/bakeware/">All baking tin sizes</a></p>`,
      });
    }
  }

  const links = pages.map((p) => `<li><a href="${p.path}">${esc(p.h1)}</a></li>`).join('\n');

  pages.push({
    path: '/bakeware/compare/',
    title: 'Baking Tin Comparisons — Which Sizes Substitute for Which',
    desc: `${pages.length} pairs of baking tins compared by base area: how much to multiply a recipe by when you move it between them, how deep the batter sits if you do not, and what that does to the baking time.`,
    h1: 'Baking tin comparisons',
    crumbs: [
      { name: 'Baking tins', path: '/bakeware/' },
      { name: 'Comparisons', path: '/bakeware/compare/' },
    ],
    body: `<p>A recipe is written for a tin's <strong>area</strong>, not its name. Move the same mixture into a wider tin and it sits shallower, bakes faster and browns more — which is why "I only have a 23 cm tin and the recipe says 20" has a number for an answer rather than a shrug.</p>
<p>Each page gives that number both ways, along with how deep the batter ends up if you pour it straight across. Pairs more than double each other in area are left out: that is not a substitution.</p>
<h2>Why depth sets the baking time and diameter barely does</h2>
<p>Heat reaches the middle of a cake from the outside in, so what decides when it is done is how far it has to travel — the depth of the batter, not the width of the tin. Two tins of very different diameters at the same depth bake in close to the same time; the same mixture spread thinner is done sooner and browns more at the edges while it waits.</p>
<p>That is why the useful number when swapping tins is the area ratio rather than the diameter ratio, and why the answer is to change the time rather than the temperature. A lower oven does not fix a cake that is too shallow; it only takes longer to reach the same place.</p>
<h2>All ${pages.length} comparisons</h2>
<ul class="cols">
${links}
</ul>
<p><a href="/bakeware/">All baking tin sizes</a></p>`,
  });

  return pages;
}
