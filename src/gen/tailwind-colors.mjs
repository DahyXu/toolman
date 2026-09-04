import { esc, faq } from '../layout.mjs';
import { contrast } from './colors.mjs';
import PALETTE from '../data/tailwind-palette.mjs';

// The site's own Search Console data is four colour queries and one password
// query. All four colours are Tailwind values — #14b8a6 is teal-500, #f43f5e is
// rose-500, #2563eb is blue-600 — and they arrive as bare hex codes, which is
// the shape Google answers itself: searching "#14b8a6" puts its own colour
// picker above every web result.
//
// "tailwind teal-500 hex" has no such widget. Same colour, different question,
// and the question has an answer a picker cannot give: where the shade sits in
// a scale, and which end of that scale can carry text.
//
// One page per hue rather than per shade. A page per shade would restate what
// /color/<hex>/ already says; a scale is a different subject from a colour.

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };
const AA = 4.5; // WCAG 2.1 AA, normal text
const AA_LARGE = 3;

const rgbOf = (hex) => ({
  r: parseInt(hex.slice(0, 2), 16),
  g: parseInt(hex.slice(2, 4), 16),
  b: parseInt(hex.slice(4, 6), 16),
});
const r2 = (n) => Math.round(n * 100) / 100;

export default function tailwindColors() {
  // PALETTE is hex → name, because the colour pages look up by hex. Here the
  // question runs the other way.
  // Each hex maps to a list, not a name: #fafafa is both neutral-50 and
  // zinc-50. A single-element list stringifies to the name it holds, so
  // treating the value as a string appears to work everywhere except the one
  // place it matters - and neutral-50 and zinc-50 quietly vanish.
  const families = new Map();
  for (const [hex, names] of Object.entries(PALETTE)) {
    for (const name of [].concat(names)) {
      const m = /^([a-z]+)-(\d+)$/.exec(name);
      if (!m) continue;
      const [, family, shade] = m;
      if (!families.has(family)) families.set(family, new Map());
      families.get(family).set(Number(shade), hex);
    }
  }

  // The scale is the subject of these pages. A hue missing a step would make
  // every statement about "the light end" and "the dark end" unreliable.
  for (const [family, shades] of families) {
    const missing = SHADES.filter((s) => !shades.has(s));
    if (missing.length) {
      console.error(`\n✗ tailwind ${family}: palette has no ${missing.join(', ')}`);
      process.exitCode = 1;
    }
  }
  if (r2(contrast(WHITE, BLACK)) !== 21) {
    console.error(`\n✗ tailwind: white on black computes as ${r2(contrast(WHITE, BLACK))}:1, not the defined 21:1`);
    process.exitCode = 1;
  }

  const pages = [];
  const names = [...families.keys()].sort();

  for (const family of names) {
    const shades = families.get(family);
    const rows = SHADES.filter((s) => shades.has(s)).map((shade) => {
      const hex = shades.get(shade);
      const rgb = rgbOf(hex);
      const onWhite = contrast(rgb, WHITE);
      const onBlack = contrast(rgb, BLACK);
      // Which text colour a background of this shade needs.
      const textIsWhite = onWhite > onBlack;
      return {
        shade, hex, rgb,
        onWhite: r2(onWhite),
        onBlack: r2(onBlack),
        textIsWhite,
        textAsInk: onWhite >= AA,          // usable as text on a white page
        textAsInkLarge: onWhite >= AA_LARGE,
        bestText: r2(Math.max(onWhite, onBlack)),
      };
    });

    // The crossover: the lightest shade dark enough to carry white text at AA.
    // It is the number a developer actually needs and no palette page prints.
    const crossover = rows.find((r) => r.onWhite >= AA);
    const inkSafe = rows.filter((r) => r.textAsInk);
    const bgLight = rows.filter((r) => !r.textIsWhite);

    // Assert what the page claims.
    for (const r of rows) {
      const named = [].concat(PALETTE[r.hex] || []);
      if (!named.includes(`${family}-${r.shade}`)) {
        console.error(`\n✗ tailwind ${family}-${r.shade}: hex ${r.hex} maps back to ${named.join(', ') || 'nothing'}`);
        process.exitCode = 1;
      }
      if (r.textIsWhite && r.onBlack > r.onWhite) {
        console.error(`\n✗ tailwind ${family}-${r.shade}: says white text, but black scores ${r.onBlack} against white's ${r.onWhite}`);
        process.exitCode = 1;
      }
      if (r.textAsInk !== r.onWhite >= AA) {
        console.error(`\n✗ tailwind ${family}-${r.shade}: AA verdict disagrees with its own ${r.onWhite}:1`);
        process.exitCode = 1;
      }
    }
    if (crossover && rows.some((r) => r.shade < crossover.shade && r.onWhite >= AA)) {
      console.error(`\n✗ tailwind ${family}: names ${crossover.shade} as the first shade to reach AA when a lighter one already does`);
      process.exitCode = 1;
    }

    const Title = family[0].toUpperCase() + family.slice(1);
    const swatch = (hex) => `<span style="display:inline-block;width:1em;height:1em;vertical-align:-.15em;border-radius:3px;border:1px solid var(--line);background:#${hex}"></span>`;

    const table = rows.map((r) => `<tr><td>${swatch(r.hex)} <code>${family}-${r.shade}</code></td><td><a href="/color/${r.hex}/">#${r.hex.toUpperCase()}</a></td><td>${r.rgb.r}, ${r.rgb.g}, ${r.rgb.b}</td><td>${r.onWhite}:1</td><td>${r.textIsWhite ? 'white' : 'black'}</td><td>${r.textAsInk ? 'AA' : r.textAsInkLarge ? 'large only' : '—'}</td></tr>`).join('\n');

    // Two thresholds sit close enough to look like one. AA is 4.5:1 against
    // white; the point where a background wants white text rather than black is
    // where the ratios against white and black meet, at the square root of 21,
    // which is 4.58:1. They usually land on the same shade and are not the same
    // rule, so the sentence only equates them when the shades agree.
    const flip = rows.find((r) => r.textIsWhite);
    const sameShade = crossover && flip && crossover.shade === flip.shade;
    const crossLine = crossover
      ? sameShade
        ? `<strong>${family}-${crossover.shade}</strong> is the lightest shade that reaches ${AA}:1 against white, so it is the first one usable for body text on a white page. It is also where a background of this hue stops taking black text and starts needing white — the two thresholds are 4.5:1 and 4.58:1, and on this scale they fall on the same step.`
        : `<strong>${family}-${crossover.shade}</strong> is the lightest shade that reaches ${AA}:1 against white, so it is the first one usable for body text on a white page. A background of this hue switches from black text to white one step ${flip && flip.shade > crossover.shade ? 'later' : 'earlier'}, at <strong>${family}-${(flip || rows[rows.length - 1]).shade}</strong>: the two thresholds are 4.5:1 and 4.58:1, close enough to usually coincide and not the same rule.`
      : `No shade of ${family} reaches ${AA}:1 against white, so none of them can carry body text on a white page. This hue is for backgrounds, borders and large headings only.`;
    if (sameShade === false && crossover && flip && Math.abs(SHADES.indexOf(crossover.shade) - SHADES.indexOf(flip.shade)) > 1) {
      console.error(`
✗ tailwind ${family}: AA at ${crossover.shade} but the text flip at ${flip.shade} — 4.5:1 and 4.58:1 cannot be more than one step apart`);
      process.exitCode = 1;
    }

    const FAQ = faq([
      {
        q: `What is the hex code for Tailwind ${family}-500?`,
        a: `<strong>#${shades.get(500).toUpperCase()}</strong> — RGB ${rgbOf(shades.get(500)).r}, ${rgbOf(shades.get(500)).g}, ${rgbOf(shades.get(500)).b}. <a href="/color/${shades.get(500)}/">Full values and contrast for #${shades.get(500).toUpperCase()}</a>.`,
      },
      {
        q: `Which Tailwind ${family} shades can I use for text?`,
        a: inkSafe.length
          ? `${inkSafe.map((r) => `<code>${family}-${r.shade}</code>`).join(', ')} reach ${AA}:1 against white and pass AA for normal text. Anything lighter fails, whatever it looks like on your monitor.`
          : `None. The darkest, <code>${family}-950</code>, reaches only ${rows[rows.length - 1].onWhite}:1 against white, short of the ${AA}:1 that AA requires.`,
      },
      {
        q: `Should text on a ${family} background be black or white?`,
        a: `Black up to <code>${family}-${(bgLight[bgLight.length - 1] || rows[0]).shade}</code>, white from <code>${family}-${(rows.find((r) => r.textIsWhite) || rows[rows.length - 1]).shade}</code> down. The two are never both comfortable: at the crossover neither reaches ${AA}:1.`,
      },
    ]);

    pages.push({
      path: `/color/tailwind/${family}/`,
      title: `Tailwind ${Title} — All 11 Shades, Hex and Contrast`,
      desc: `Every Tailwind CSS ${family} shade from ${family}-50 to ${family}-950 with its hex code, RGB, contrast ratio against white, and whether it passes WCAG AA for text. ${family}-500 is #${shades.get(500).toUpperCase()}.`,
      h1: `Tailwind ${family} colours`,
      crumbs: [
        { name: 'Colours', path: '/color/' },
        { name: 'Tailwind', path: '/color/tailwind/' },
        { name: Title, path: `/color/tailwind/${family}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p>The eleven ${family} shades in the default Tailwind CSS palette, with the contrast figures that decide which of them you can actually put text on.</p>

<h2>Every ${family} shade</h2>
<table><thead><tr><th>Class</th><th>Hex</th><th>RGB</th><th>On white</th><th>Text colour</th><th>As text</th></tr></thead><tbody>
${table}
</tbody></table>
<p class="muted">"On white" is the contrast ratio against a white page. "As text" is whether that ratio passes WCAG AA for normal text, which needs ${AA}:1; large text needs only ${AA_LARGE}:1.</p>

<h2>Where the scale turns over</h2>
<p>${crossLine}</p>

<h2>Using ${family} in Tailwind</h2>
<pre><code>&lt;div class="bg-${family}-500 text-${rows.find((r) => r.shade === 500).textIsWhite ? 'white' : 'black'}"&gt;
&lt;p class="text-${family}-${(inkSafe[0] || rows[rows.length - 1]).shade}"&gt;</code></pre>
<p>The text class above is the lightest ${family} that still passes AA on a white background${inkSafe.length ? '' : ' — and it does not pass, because no shade of this hue does'}.</p>

${FAQ.html}

<p><a href="/color/tailwind/">All Tailwind colours</a> · <a href="/color/">Colour reference</a></p>`,
    });
  }

  const grid = names.map((family) => {
    const shades = families.get(family);
    const strip = SHADES.filter((s) => shades.has(s))
      .map((s) => `<span style="display:inline-block;width:1.1em;height:1.4em;background:#${shades.get(s)}" title="${family}-${s}"></span>`)
      .join('');
    return `<li><a href="/color/tailwind/${family}/"><b>${family}</b><br>${strip}</a></li>`;
  }).join('\n');

  pages.push({
    path: '/color/tailwind/',
    title: 'Tailwind CSS Colours — Every Shade with Hex and Contrast',
    desc: `All ${names.length} hues of the default Tailwind CSS palette, eleven shades each, with hex codes, RGB and the WCAG contrast ratio that decides which shades can carry text.`,
    h1: 'Tailwind CSS colours',
    crumbs: [
      { name: 'Colours', path: '/color/' },
      { name: 'Tailwind', path: '/color/tailwind/' },
    ],
    body: `<p>The default Tailwind CSS palette: ${names.length} hues, eleven shades each, ${Object.keys(PALETTE).length} distinct values. Each hue's page gives the hex and RGB for every shade alongside its contrast ratio against white, which is the figure that decides whether a shade can be used for text or only for backgrounds.</p>
<ul class="cards">
${grid}
</ul>
<p class="muted">Values are read from <code>tailwindcss@3.4.17</code> rather than transcribed.</p>
<p><a href="/color/">Colour reference</a></p>`,
  });

  return pages;
}
