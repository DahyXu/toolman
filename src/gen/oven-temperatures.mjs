import { faq } from '../layout.mjs';

// Temperature is the highest-earning query family on the site, and this is the
// finite reference namespace sitting next to it: an oven dial has perhaps twenty
// useful settings, three incompatible ways of naming them, and a fan adjustment
// that recipe writers assume you know about.
//
// Gas marks are exact: mark N is 250 + 25N degrees Fahrenheit, by definition.
// The Celsius figures printed in cookbooks are not the arithmetic conversion —
// gas mark 4 is 350 °F, which is 176.7 °C, and every British recipe calls it
// 180 °C — so both are given, and the difference is stated rather than hidden.

const GAS = [
  { mark: '1/4', slug: 'gas-mark-1-4', n: -1, f: 225, c: 110, desc: 'Very cool', use: 'meringues, slow-drying fruit, keeping food warm' },
  { mark: '1/2', slug: 'gas-mark-1-2', n: -0.5, f: 250, c: 130, desc: 'Very cool', use: 'very slow braises, overnight cooking' },
  { mark: '1', slug: 'gas-mark-1', n: 1, f: 275, c: 140, desc: 'Cool', use: 'slow-cooked casseroles, rich fruit cake' },
  { mark: '2', slug: 'gas-mark-2', n: 2, f: 300, c: 150, desc: 'Cool', use: 'stews, slow roasts, custards' },
  { mark: '3', slug: 'gas-mark-3', n: 3, f: 325, c: 170, desc: 'Warm', use: 'rich fruit cakes, milk puddings' },
  { mark: '4', slug: 'gas-mark-4', n: 4, f: 350, c: 180, desc: 'Moderate', use: 'the default for cakes, biscuits and most baking' },
  { mark: '5', slug: 'gas-mark-5', n: 5, f: 375, c: 190, desc: 'Moderately hot', use: 'sponge cakes, roast chicken' },
  { mark: '6', slug: 'gas-mark-6', n: 6, f: 400, c: 200, desc: 'Moderately hot', use: 'roast potatoes, pastry, most roasting' },
  { mark: '7', slug: 'gas-mark-7', n: 7, f: 425, c: 220, desc: 'Hot', use: 'browning, puff pastry, scones' },
  { mark: '8', slug: 'gas-mark-8', n: 8, f: 450, c: 230, desc: 'Very hot', use: 'searing a roast at the start, bread' },
  { mark: '9', slug: 'gas-mark-9', n: 9, f: 475, c: 240, desc: 'Very hot', use: 'pizza, the hottest most domestic ovens reach' },
];

// Oven dials people actually set, in each scale.
const C_VALUES = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250];
const F_VALUES = [225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500];

const c2f = (c) => (c * 9) / 5 + 32;
const f2c = (f) => ((f - 32) * 5) / 9;
const r = (n) => Math.round(n);

// The conventional pairing a recipe uses, which is the nearest gas mark rather
// than the exact arithmetic.
const nearestGas = (f) => GAS.reduce((best, g) => (Math.abs(g.f - f) < Math.abs(best.f - f) ? g : best), GAS[0]);
// A Celsius dial setting pairs with a gas mark by the Celsius column, not by
// converting to Fahrenheit and searching there. Converting made 170 °C come out
// as gas mark 4, when the table on the same page lists mark 3 as 170 °C and so
// does every British recipe. Ties go to the hotter mark, which is the
// convention — 160 °C sits between marks 2 and 3 and is always called 3.
const gasForC = (c) => GAS.reduce((best, g) => (Math.abs(g.c - c) <= Math.abs(best.c - c) ? g : best), GAS[0]);

// A fan oven moves air, so the same food cooks as though the oven were about
// 20 °C hotter. Every UK recipe that gives two numbers is applying this.
const FAN_DROP_C = 20;

function conversionTable(highlight, window) {
  const i = GAS.findIndex((g) => g.slug === highlight);
  const rows = window && i >= 0
    ? GAS.slice(Math.max(0, i - 1), Math.min(GAS.length, i + 2))
    : GAS;
  return `<table><thead><tr><th>Gas mark</th><th>Fahrenheit</th><th>Celsius</th><th>Fan / convection</th><th></th></tr></thead><tbody>
${rows.map((g) => `<tr${highlight === g.slug ? ' style="font-weight:600"' : ''}><td><a href="/oven/${g.slug}/">${g.mark}</a></td><td>${g.f}°F</td><td>${g.c}°C</td><td>${g.c - FAN_DROP_C}°C fan</td><td class="muted">${g.desc}</td></tr>`).join('')}
</tbody></table>`;
}

const INTRO = `<h2>The three scales, and why they disagree</h2>
<p>An oven dial is marked in one of three ways and recipes are written in all of them. Gas marks are exactly defined — <strong>mark N is 250 + 25N degrees Fahrenheit</strong>, so mark 4 is exactly 350°F — but the Celsius figures printed alongside them are not the arithmetic conversion. 350°F is 176.7°C, and every recipe in the world calls it 180°C. The rounding is deliberate and universal: oven thermostats are not accurate to a degree, dials are marked in tens, and a rounded number that everyone agrees on is more useful than an exact one nobody can set.</p>
<p>The fourth number is the fan. <strong>A fan or convection oven cooks as though it were about 20°C hotter</strong>, because moving air carries heat to the food faster than still air does. A recipe written for a conventional oven at 180°C means 160°C in a fan oven — and a recipe that gives only one number, without saying which, is the single most common reason a cake comes out overdone.</p>`;

export default async function () {
  const pages = [];

  for (const g of GAS) {
    const fan = g.c - FAN_DROP_C;
    const exactC = f2c(g.f);
    const FAQ = faq([
      { q: `What is gas mark ${g.mark} in Celsius?`, a: `<strong>${g.c}°C</strong> in a conventional oven, or <strong>${fan}°C</strong> in a fan oven.` },
      { q: `What is gas mark ${g.mark} in Fahrenheit?`, a: `<strong>${g.f}°F</strong>, exactly — gas mark ${g.mark} is defined as ${g.f}°F.` },
      { q: `Why is gas mark ${g.mark} called ${g.c}°C when ${g.f}°F is ${exactC.toFixed(1)}°C?`,
        a: `Because ${exactC.toFixed(1)}°C is not a number an oven dial can be set to. Recipes round to the nearest ten, and the rounded figure is the convention everywhere — the ${(g.c - exactC).toFixed(1)} degree difference is well inside the accuracy of a domestic thermostat.` },
      { q: `What is gas mark ${g.mark} used for?`, a: `${g.desc} — ${g.use}.` },
    ]);

    pages.push({
      path: `/oven/${g.slug}/`,
      title: `Gas Mark ${g.mark} — ${g.c}°C, ${g.f}°F, ${fan}°C Fan | Toolman`,
      desc: `Gas mark ${g.mark} is ${g.c}°C conventional, ${fan}°C fan, and exactly ${g.f}°F. ${g.desc} — ${g.use}. Full oven temperature conversion chart.`,
      h1: `Gas mark ${g.mark}`,
      crumbs: [{ name: 'Oven temperatures', path: '/oven/' }, { name: `Gas mark ${g.mark}`, path: `/oven/${g.slug}/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${g.c}°C · ${g.f}°F · ${fan}°C fan</strong></p>
<p class="muted">${g.desc} oven — ${g.use}.</p>

<h2>Gas mark ${g.mark} in every scale</h2>
<table><tbody>
<tr><td>Gas mark</td><td><strong>${g.mark}</strong></td></tr>
<tr><td>Fahrenheit</td><td>${g.f}°F <span class="muted">(exact — gas mark ${g.mark} is defined as this)</span></td></tr>
<tr><td>Celsius, conventional oven</td><td>${g.c}°C <span class="muted">(the arithmetic conversion is ${exactC.toFixed(1)}°C; recipes round it)</span></td></tr>
<tr><td>Celsius, fan oven</td><td>${fan}°C</td></tr>
<tr><td>Fahrenheit, fan oven</td><td>${r(c2f(fan))}°F</td></tr>
<tr><td>Description</td><td>${g.desc}</td></tr>
</tbody></table>

${FAQ.html}

<h2>The settings either side</h2>
${conversionTable(g.slug, true)}
<p><a href="/oven/">The full chart, and why the three scales disagree →</a></p>

<p><a href="/oven/">All oven temperatures</a> · <a href="/convert/${g.c}-celsius-to-fahrenheit/">${g.c}°C to °F precisely</a> · <a href="/cooking/">Cooking measurements</a></p>`,
    });
  }

  for (const c of C_VALUES) {
    const g = gasForC(c);
    const fan = c - FAN_DROP_C;
    const exactF = c2f(c);
    // A gas oven has no dial between marks, so a Celsius figure that is not one
    // of the eleven mark temperatures cannot be set on one at all — you pick the
    // nearest mark and accept the offset. Saying which, and by how much, is the
    // one fact that genuinely differs between 160 °C and 170 °C.
    const offset = c - g.c;
    const onMark = offset === 0;
    const gasNote = onMark
      ? `${c}°C is exactly gas mark ${g.mark}, so a gas oven can be set to it directly.`
      : `${c}°C is not a gas mark. The nearest is mark ${g.mark} at ${g.c}°C, so on a gas oven you would set mark ${g.mark} and cook ${Math.abs(offset)}°C ${offset < 0 ? 'hotter' : 'cooler'} than the recipe asks — usually worth a few minutes off the time${offset < 0 ? '' : ' or a few minutes more'}.`;

    const FAQ = faq([
      { q: `What is ${c}°C in a fan oven?`, a: `<strong>${fan}°C</strong>. Subtract 20°C from a conventional-oven temperature to get the fan equivalent.` },
      { q: `Can a gas oven be set to ${c}°C?`, a: gasNote },
      { q: `What gas mark is ${c}°C?`, a: `<strong>Gas mark ${g.mark}</strong>, which is ${g.f}°F and conventionally written as ${g.c}°C.` },
      { q: `What is ${c}°C in Fahrenheit?`, a: `${exactF.toFixed(0)}°F exactly. Recipes usually write it as ${g.f}°F, the gas mark step it sits closest to.` },
    ]);
    pages.push({
      path: `/oven/${c}c/`,
      title: `${c}°C Oven — ${fan}°C Fan, Gas Mark ${g.mark}, ${r(exactF)}°F | Toolman`,
      desc: `${c}°C in a conventional oven is ${fan}°C in a fan oven, gas mark ${g.mark}, and ${r(exactF)}°F. Why the fan setting is 20 degrees lower, with the full oven chart.`,
      h1: `${c}°C oven temperature`,
      crumbs: [{ name: 'Oven temperatures', path: '/oven/' }, { name: `${c}°C`, path: `/oven/${c}c/` }],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0"><strong>${c}°C = ${fan}°C fan = gas mark ${g.mark} = ${r(exactF)}°F</strong></p>
<p class="muted">${g.desc} oven — ${g.use}.</p>

<h2>Setting ${c}°C on a gas oven</h2>
<p>${gasNote}</p>

<h2>${c}°C in every setting</h2>
<table><tbody>
<tr><td>Conventional oven</td><td><strong>${c}°C</strong></td></tr>
<tr><td>Fan / convection oven</td><td>${fan}°C</td></tr>
<tr><td>Gas mark</td><td><a href="/oven/${g.slug}/">${g.mark}</a></td></tr>
<tr><td>Fahrenheit</td><td>${r(exactF)}°F <span class="muted">(exactly ${exactF.toFixed(1)}°F)</span></td></tr>
<tr><td>Fahrenheit, fan</td><td>${r(c2f(fan))}°F</td></tr>
</tbody></table>

${FAQ.html}

<h2>The settings either side</h2>
${conversionTable(g.slug, true)}
<p><a href="/oven/">The full chart, and why the three scales disagree →</a></p>

<p><a href="/oven/">All oven temperatures</a> · <a href="/convert/${c}-celsius-to-fahrenheit/">${c}°C to °F precisely</a> · <a href="/cooking/">Cooking measurements</a></p>`,
    });
  }

  pages.push({
    path: '/oven/',
    title: 'Oven Temperature Conversion — Gas Mark, °C, °F and Fan | Toolman',
    desc: 'Gas mark to Celsius to Fahrenheit, with the fan oven equivalent for every setting. Gas mark 4 is 180°C, 350°F and 160°C fan — and here is why the Celsius number is rounded.',
    h1: 'Oven temperatures',
    crumbs: [{ name: 'Oven temperatures', path: '/oven/' }],
    body: `<p class="muted">Every oven setting in gas marks, Celsius, Fahrenheit and the fan equivalent, plus what each one is for.</p>

<h2>The chart</h2>
${conversionTable(null)}

${INTRO}

<h2>Celsius settings</h2>
<ul class="linklist">${C_VALUES.map((c) => `<li><a href="/oven/${c}c/">${c}°C</a> — ${c - FAN_DROP_C}°C fan, gas mark ${gasForC(c).mark}</li>`).join('')}</ul>

<h2>Fahrenheit settings</h2>
<ul class="linklist">${F_VALUES.map((f) => `<li><a href="/convert/${f}-fahrenheit-to-celsius/">${f}°F</a> — gas mark ${nearestGas(f).mark}, ${f2c(f).toFixed(0)}°C exactly</li>`).join('')}</ul>

<h2>Gas marks</h2>
<ul class="linklist">${GAS.map((g) => `<li><a href="/oven/${g.slug}/">Gas mark ${g.mark}</a> — ${g.c}°C, ${g.f}°F</li>`).join('')}</ul>

<p><a href="/cooking/">Cooking measurements</a> · <a href="/convert/">Unit converters</a></p>`,
  });

  return pages;
}
