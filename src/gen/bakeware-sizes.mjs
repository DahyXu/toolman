import { esc, faq } from '../layout.mjs';

// Baking tins are the everyday reference with the most useful arithmetic behind
// it. A recipe is written for a tin *area*, not a tin name: the same batter in a
// wider tin is shallower, bakes faster and browns more. So the question people
// actually have — "I have a 23 cm tin and the recipe says 20, what do I do" — is
// answered by a ratio, and the ratio is computable.
//
// A 23 cm round has 1.32 times the area of a 20 cm one, so the batter sits about
// three quarters as deep and comes out earlier. That number is the point of the
// section, and it differs for every pair.

const IN = 25.4;
const areaRound = (d) => Math.PI * Math.pow(d / 2, 2);
const areaRect = (w, l) => w * l;

// [name, id, shape, dims in mm, typical depth mm, note]
const TINS = [
  ['15 cm / 6 in round', 'round-15cm', 'round', [150], 50, 'A small round, used for a single tall layer or a cake for four. It is the size most often meant by "a small cake tin" and holds about a third of what a 23 cm tin does.'],
  ['18 cm / 7 in round', 'round-18cm', 'round', [180], 50, 'The middle small round, common in European recipes and for two-layer cakes meant to serve six.'],
  ['20 cm / 8 in round', 'round-20cm', 'round', [200], 50, 'One of the two sizes almost every cake recipe is written for. If a recipe says "an 8-inch tin" without qualification, this is it.'],
  ['23 cm / 9 in round', 'round-23cm', 'round', [230], 50, 'The other default. It has a third more area than a 20 cm tin, so the same mixture bakes shallower and finishes earlier — the single most common unintended substitution in home baking.'],
  ['25 cm / 10 in round', 'round-25cm', 'round', [250], 50, 'A large round for celebration cakes and cheesecakes. Recipes at this size usually specify it, because scaling a 20 cm recipe up to it needs about 1.6 times the mixture.'],
  ['28 cm / 11 in round', 'round-28cm', 'round', [280], 50, 'Large enough that most domestic ovens will brown the edges before the middle sets, so it suits shallow bakes rather than deep ones.'],
  ['30 cm / 12 in round', 'round-30cm', 'round', [300], 50, 'A catering-scale round, and about the largest that fits a standard 60 cm oven with room for air to circulate.'],
  ['18 cm / 7 in square', 'square-18cm', 'rect', [180, 180], 50, 'A small square, used for traybakes and brownies in smaller quantities.'],
  ['20 cm / 8 in square', 'square-20cm', 'rect', [200, 200], 50, 'The standard brownie and traybake tin. Its area is close to a 23 cm round, which is why recipes often offer both.'],
  ['23 cm / 9 in square', 'square-23cm', 'rect', [230, 230], 50, 'A larger square for traybakes and slab cakes. It holds about a third more than a 20 cm square.'],
  ['23 × 33 cm / 9 × 13 in', 'rect-9x13', 'rect', [228.6, 330.2], 50, 'The American 9 × 13, and the most-specified tin in the English-speaking world — sheet cakes, lasagne, roasted vegetables. Note the metric figures: 9 × 13 inches is 23 × 33 cm, not the 20 × 30 cm tin sold across Europe, which is nearly a quarter smaller.'],
  ['20 × 30 cm traybake', 'rect-20x30', 'rect', [200, 300], 45, 'The European traybake tin, and the one people reach for when a recipe says 9 × 13. It is not the same: 20 × 30 cm is 600 cm² against 755 for a true 9 × 13, so the mixture sits a quarter deeper and needs longer.'],
  ['Loaf 21.5 × 11.5 cm / 8½ × 4½ in', 'loaf-small', 'rect', [215, 115], 65, 'The smaller of the two standard loaf tins, holding about 1.5 litres — a 1 lb loaf. Bread recipes written for the larger tin overflow it.'],
  ['Loaf 23 × 13 cm / 9 × 5 in', 'loaf-large', 'rect', [230, 130], 70, 'The larger standard loaf tin, about 2 litres, the 2 lb loaf. This is what most bread and banana bread recipes assume.'],
  ['Springform 18 cm / 7 in', 'springform-18cm', 'round', [180], 65, 'A small springform, used for cheesecakes for four to six. The releasing base is what makes it worth owning; the size is otherwise the same as any 18 cm round.'],
  ['Springform 20 cm / 8 in', 'springform-20cm', 'round', [200], 65, 'The common cheesecake size in European recipes, and deep enough for the crust and filling most of them specify.'],
  ['Springform 23 cm / 9 in', 'springform-23cm', 'round', [230], 65, 'The default American cheesecake tin. A cheesecake recipe with no size given almost always means this one.'],
  ['Springform 26 cm', 'springform-26cm', 'round', [260], 65, 'A large springform for tall cheesecakes and layered desserts. Filling meant for a 23 cm tin comes out noticeably shallower here.'],
  ['Bundt 25 cm / 10 in', 'bundt-25cm', 'round', [250], 95, 'The standard bundt, usually quoted by volume as a 12-cup tin rather than by diameter. The central funnel is the point: it conducts heat into the middle of a deep cake that would otherwise stay raw.'],
  ['Tart 23 cm / 9 in', 'tart-23cm', 'round', [230], 25, 'A shallow fluted tin with a loose base. The depth is what distinguishes it — a quarter of a cake tin, so a filling recipe cannot be transferred between the two without recalculating.'],
  ['Swiss roll 25 × 38 cm', 'swissroll', 'rect', [250, 380], 20, 'A shallow rectangular tin for sponge that will be rolled. The 2 cm depth is deliberate: a thicker sponge cracks when rolled.'],
  ['Half sheet 33 × 46 cm / 13 × 18 in', 'half-sheet', 'rect', [330, 460], 25, 'The American half sheet pan, and the largest tray that fits most domestic ovens. It is the standard for sheet-pan dinners and for baking several trays of biscuits at once.'],
];


// The name repeats the dimensions in words and the array gives them in
// millimetres, and nothing joined the two: the first draft of this file labelled
// a 228.6 × 330.2 mm tin "20 × 30 cm / 9 × 13 in", which is right in inches and
// wrong in centimetres. Every figure written into a name is now checked.
{
  const bad = [];
  for (const [name, id, shape, dims] of TINS) {
    for (const m of name.matchAll(/(\d+(?:\.\d+)?)\s*(?:×\s*(\d+(?:\.\d+)?)\s*)?(cm|in)\b/g)) {
      const a = +m[1], b = m[2] ? +m[2] : null, unit = m[3];
      const scale = unit === 'cm' ? 10 : IN;
      const want = b === null ? [dims[0]] : [dims[0], dims[1]];
      const got = b === null ? [a * scale] : [a * scale, b * scale];
      // 1.5 mm of slack, which covers the rounding in a name like "23 × 33 cm"
      // for a 228.6 × 330.2 mm tin but not a name that is simply a different tin.
      const off = want.map((w, i) => Math.abs(w - got[i]));
      if (off.some((o) => o > 5)) {
        bad.push(`${id}: name says ${m[0]} (${got.map((g) => g.toFixed(1)).join(' × ')} mm), tin is ${want.map((w) => w.toFixed(1)).join(' × ')} mm`);
      }
    }
  }
  if (bad.length) {
    console.error('\n✗ a baking tin name does not match its dimensions:');
    for (const b of bad) console.error('    ' + b);
    process.exitCode = 1;
  }
}

const f0 = (v) => Math.round(v).toLocaleString('en-US');
const f1 = (v) => v.toFixed(1);
const f2 = (v) => v.toFixed(2);

export default async function () {
  const pages = [];

  const rows = TINS.map(([name, id, shape, dims, depth, note]) => {
    const areaMm2 = shape === 'round' ? areaRound(dims[0]) : areaRect(dims[0], dims[1]);
    return {
      name, id, shape, dims, depth, note,
      areaCm2: areaMm2 / 100,
      areaIn2: areaMm2 / (IN * IN),
      volL: (areaMm2 * depth) / 1e6,
      label: shape === 'round' ? `${f0(dims[0] / 10)} cm across` : `${f0(dims[0] / 10)} × ${f0(dims[1] / 10)} cm`,
    };
  });

  for (const r of rows) {
    const others = rows.filter((x) => x.id !== r.id);
    // Substitutes, ordered by how close the area is — because area is what a
    // recipe is really written for.
    const subs = others
      .map((x) => ({ x, ratio: x.areaCm2 / r.areaCm2 }))
      .filter((o) => o.ratio >= 0.75 && o.ratio <= 1.35)
      .sort((a, b) => Math.abs(a.ratio - 1) - Math.abs(b.ratio - 1))
      .slice(0, 8);
    const closest = subs[0];

    const FAQ = faq([
      { q: `What is the area of a ${r.name} tin?`,
        a: `<strong>${f0(r.areaCm2)} cm²</strong> (${f1(r.areaIn2)} in²), holding roughly ${f1(r.volL)} litres filled to ${r.depth} mm.` },
      closest
        ? { q: `Can I use a different tin instead of a ${r.name}?`,
            a: `The closest here is <strong>${closest.x.name}</strong> at ${f0(closest.x.areaCm2)} cm² — ${closest.ratio > 1 ? `${((closest.ratio - 1) * 100).toFixed(0)}% more area, so the mixture sits shallower and bakes faster` : `${((1 - closest.ratio) * 100).toFixed(0)}% less area, so it sits deeper and needs longer`}. As a rule, anything within about 10% needs no change; beyond that, adjust the time before the temperature.` }
        : { q: `What can I substitute for a ${r.name}?`,
            a: `Nothing in this list is within a third of its area, so a recipe written for it needs the quantity scaled rather than the tin swapped.` },
      { q: `How much does a ${r.name} tin hold?`,
        a: `About <strong>${f1(r.volL)} litres</strong> to a depth of ${r.depth} mm. Cake batter is normally filled to between half and two thirds, so ${f1(r.volL * 0.6)} litres of mixture is a working figure.` },
      { q: `Why does tin size change the baking time?`,
        a: `Because a recipe is written for a <strong>depth</strong>, not a name. Heat reaches the centre of a shallow cake sooner, so the same mixture in a wider tin is done earlier and browns more at the edges. The area ratio tells you how much shallower: ${closest ? `swapping a ${r.name} for a ${closest.x.name} changes the depth by a factor of ${f2(1 / closest.ratio)}.` : 'divide the two areas and the depth changes by the inverse.'}` },
    ]);

    pages.push({
      path: `/bakeware/${r.id}/`,
      title: `${r.name} Tin — ${f0(r.areaCm2)} cm², ${f1(r.volL)} L | Toolman`,
      desc: `A ${r.name} tin has ${f0(r.areaCm2)} cm² of base area and holds about ${f1(r.volL)} litres. Which tins substitute for it, and what that does to the baking time.`,
      h1: `${r.name} tin`,
      crumbs: [{ name: 'Baking tin sizes', path: '/bakeware/' }, { name: r.name, path: `/bakeware/${r.id}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${f0(r.areaCm2)} cm² · ${f1(r.volL)} litres</strong></p>
<p class="muted">${r.label} · ${f1(r.areaIn2)} in² · ${r.depth} mm deep · ${r.shape === 'round' ? 'round' : 'rectangular'}</p>

<h2>About this tin</h2>
<p>${r.note}</p>

<h2>The numbers</h2>
<table><tbody>
${r.shape === 'round'
        ? `<tr><td>Diameter</td><td>${f0(r.dims[0] / 10)} cm · ${f1(r.dims[0] / IN)} in</td></tr>`
        : `<tr><td>Dimensions</td><td>${f0(r.dims[0] / 10)} × ${f0(r.dims[1] / 10)} cm · ${f1(r.dims[0] / IN)} × ${f1(r.dims[1] / IN)} in</td></tr>`}
<tr><td>Depth</td><td>${r.depth} mm · ${f1(r.depth / IN)} in</td></tr>
<tr><td>Base area</td><td><strong>${f0(r.areaCm2)} cm²</strong> · ${f1(r.areaIn2)} in²</td></tr>
<tr><td>Volume to the rim</td><td>${f1(r.volL)} litres</td></tr>
<tr><td>Usable batter</td><td>about ${f1(r.volL * 0.6)} litres <span class="muted">— filled to roughly two thirds</span></td></tr>
</tbody></table>

${subs.length ? `<h2>What can replace a ${r.name}</h2>
<p>A recipe is written for an area, because area sets the depth and depth sets the baking time. Anything within about 10% needs no adjustment. Past that, change the time first and only then the temperature.</p>
<table><thead><tr><th>Tin</th><th>Area</th><th>vs this one</th><th>Effect</th></tr></thead><tbody>
${subs.map((o) => {
        const pct = (o.ratio - 1) * 100;
        const effect = Math.abs(pct) < 10 ? 'Interchangeable — no change needed'
          : pct > 0 ? `Batter ${f2(1 / o.ratio)}× as deep — check ${Math.round(Math.abs(pct) / 2)}–${Math.round(Math.abs(pct))} minutes early`
          : `Batter ${f2(1 / o.ratio)}× as deep — allow ${Math.round(Math.abs(pct) / 2)}–${Math.round(Math.abs(pct))} minutes longer`;
        return `<tr><td><a href="/bakeware/${o.x.id}/">${esc(o.x.name)}</a></td><td>${f0(o.x.areaCm2)} cm²</td><td>${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%</td><td class="muted">${effect}</td></tr>`;
      }).join('')}
</tbody></table>` : ''}

${FAQ.html}

<p><a href="/bakeware/">All baking tin sizes</a> · <a href="/cooking/">Cooking measurements</a> · <a href="/oven/">Oven temperatures</a></p>`,
    });
  }

  const r20 = rows.find((x) => x.id === 'round-20cm');
  const r23 = rows.find((x) => x.id === 'round-23cm');
  const rect = rows.find((x) => x.id === 'rect-9x13');

  pages.push({
    path: '/bakeware/',
    title: 'Baking Tin Sizes — Area, Volume and What Substitutes for What | Toolman',
    desc: 'Every common cake tin, loaf tin and sheet pan with its real base area and volume, and which tins can replace which. A 23 cm round has a third more area than a 20 cm — that is why the cake bakes faster.',
    h1: 'Baking tin sizes',
    crumbs: [{ name: 'Baking tin sizes', path: '/bakeware/' }],
    body: `<p class="muted">${rows.length} common tins with their real area and volume, and the substitution each one allows.</p>

<h2>A recipe is written for an area, not a name</h2>
<p>This is the whole thing. Batter poured into a wider tin is shallower; a shallower cake cooks through sooner and browns more at the edges. So the question is never "is my tin close enough in inches" but <strong>"how much does the area change"</strong>.</p>
<p>A <strong>20 cm round is ${f0(r20.areaCm2)} cm² and a 23 cm round is ${f0(r23.areaCm2)}</strong> — ${((r23.areaCm2 / r20.areaCm2 - 1) * 100).toFixed(0)}% more. Three centimetres of diameter sounds like nothing and is a third of the tin, because area goes with the square of the radius. The same batter comes out ${f2(r20.areaCm2 / r23.areaCm2)} times as deep and wants checking ten minutes early.</p>
<p>The familiar substitution works for the same reason: a <strong>9 × 13 inch tin is ${f0(rect.areaCm2)} cm²</strong> and two 23 cm rounds are ${f0(2 * r23.areaCm2)} — within ${Math.abs(100 - (rect.areaCm2 / (2 * r23.areaCm2)) * 100).toFixed(0)}%, which is why so many recipes offer both.</p>

<h2>The rule of thumb</h2>
<table><thead><tr><th>Area difference</th><th>What to do</th></tr></thead><tbody>
<tr><td>Within 10%</td><td>Nothing. Bake as written.</td></tr>
<tr><td>10–25% larger</td><td>Shallower and faster — start checking 10 minutes early.</td></tr>
<tr><td>10–25% smaller</td><td>Deeper and slower — add 10 to 15 minutes, and drop the temperature 10 °C if the top browns first.</td></tr>
<tr><td>More than 25% either way</td><td>Scale the recipe rather than the time.</td></tr>
</tbody></table>

<h2>Every tin</h2>
<table><thead><tr><th>Tin</th><th>Size</th><th>Area</th><th>Volume</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><a href="/bakeware/${r.id}/">${esc(r.name)}</a></td><td>${r.label}</td><td>${f0(r.areaCm2)} cm²</td><td>${f1(r.volL)} L</td></tr>`).join('')}
</tbody></table>

<h2>"20 cm" and "8 inch" are not the same tin</h2>
<p>Eight inches is 203 mm and 20 cm is 200. Tins are sold under both names, manufacturers build to whichever their market uses, and the two are <strong>3 mm apart in diameter and about 3% apart in area</strong>. The same goes for 25 cm against 10 inches (250 vs 254 mm) and 30 cm against 12 (300 vs 305).</p>
<p>Three per cent is inside the tolerance of any recipe, so it never matters on its own. It matters when it compounds — a European 20 cm tin used for an American recipe written for 8 inches, baked in an oven running 10 °C cool, with a fan the recipe did not account for. Each of those is small and the three together are not.</p>

<h2>Depth matters as much as width</h2>
<p>Two tins with the same area are not always interchangeable. A tart tin is 25 mm deep and a springform is 65 mm; the same filling in the shallower one is spread three times as thin and behaves completely differently. Where a recipe specifies a tart tin or a Swiss roll tin, the depth is the reason, and a cake tin of the same diameter will not do.</p>

<p><a href="/oven/">Oven temperatures</a> · <a href="/cooking/">Cooking measurements</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
