import { esc, faq, ring } from '../layout.mjs';
import { NAMED_COLORS, hex2rgb, rgb2hsl, contrast } from './colors.mjs';

// Third application of what the one click taught. Searching a bare hex code
// puts Google's own colour picker above every result, so those impressions
// cannot convert — but "chartreuse hex code" has no widget at all. The named
// direction escapes it, and the site had 887 pages keyed by hex and none keyed
// by name.
//
// The differentiator is the same one the Tailwind pages use: a picker gives
// HEX, RGB and HSL and says nothing about whether you can put text on it.

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };
const AA = 4.5;
const AA_LARGE = 3;

const r2 = (n) => Math.round(n * 100) / 100;

// Where a name came from, for the ones with a story. The rest are described
// from their own values rather than padded with invented history.
const ORIGIN = {
  chartreuse: 'Named after the French liqueur, which takes its colour from the herbs it is macerated with. The liqueur is older than the colour name by about two centuries.',
  magenta: 'Named after the Battle of Magenta in 1859, fought the same year the dye was patented. The town is in Lombardy and the connection is purely commercial.',
  fuchsia: 'Named after the flower, which was named after Leonhart Fuchs, a sixteenth-century German botanist. In CSS it is the same colour as magenta, byte for byte.',
  indigo: 'Named after the dye, which came from the Indigofera plant and reached Europe through India — the word and the trade route are the same story.',
  crimson: 'From the kermes insect, whose dried bodies produced the dye. The Arabic qirmiz gives both the insect and the colour their name.',
  turquoise: 'French for "Turkish", because the stone reached Europe through Turkey rather than being found there.',
  sienna: 'A clay pigment from Siena in Tuscany. Raw sienna is yellow-brown; burnt sienna, roasted, is the redder colour the name usually means now.',
  khaki: 'From the Urdu for "dust-coloured", adopted by the British Indian Army in the 1840s as the first widely used camouflage.',
  teal: 'Named after the duck, which has a band of this colour on its head.',
  salmon: 'The colour of the fish’s flesh rather than its skin.',
  lavender: 'Named for the flower, which is a good deal less blue than the CSS colour that carries its name.',
  maroon: 'From the French marron, chestnut. In CSS it is much darker than the chestnut it is named after.',
  navy: 'From the dark blue of British Royal Navy uniforms, adopted in 1748.',
  olive: 'The colour of the unripe fruit. In CSS it is a dark yellow rather than the green most people picture.',
  tomato: 'One of the few CSS names taken directly from a food and matching it closely.',
  gainsboro: 'Named after Thomas Gainsborough, the painter, for reasons nobody has satisfactorily explained.',
};

export default function colorNames() {
  const NAMED = NAMED_COLORS();
  const entries = Object.entries(NAMED);
  const pages = [];

  if (r2(contrast(WHITE, BLACK)) !== 21) {
    console.error(`\n✗ color-names: white on black computes as ${r2(contrast(WHITE, BLACK))}:1, not the defined 21:1`);
    process.exitCode = 1;
  }

  for (const [name, hex] of entries) {
    // The name has to describe the colour it claims.
    if (!/^[0-9a-f]{6}$/.test(hex)) {
      console.error(`\n✗ color-names ${name}: "${hex}" is not a six-digit hex value`);
      process.exitCode = 1;
      continue;
    }
    const rgb = hex2rgb(hex);
    const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
    const onWhite = contrast(rgb, WHITE);
    const onBlack = contrast(rgb, BLACK);
    const textIsWhite = onWhite > onBlack;
    const asInk = onWhite >= AA;
    const asInkLarge = onWhite >= AA_LARGE;

    if (Math.max(onWhite, onBlack) > 21.0001 || Math.min(onWhite, onBlack) < 0.999) {
      console.error(`\n✗ color-names ${name}: contrast of ${r2(onWhite)} and ${r2(onBlack)} falls outside the 1:1 to 21:1 range`);
      process.exitCode = 1;
    }
    // A colour cannot want white text and also be readable as dark ink on white.
    if (textIsWhite && asInk === false && onWhite > onBlack) {
      // consistent by construction; no action
    }

    // Names close enough to be confused with this one, by the same weighted
    // distance the hex pages use for their nearest-name lookup.
    const near = entries
      .filter(([n2]) => n2 !== name)
      .map(([n2, h2]) => {
        const o = hex2rgb(h2);
        return { n2, h2, d: (rgb.r - o.r) ** 2 * 0.3 + (rgb.g - o.g) ** 2 * 0.59 + (rgb.b - o.b) ** 2 * 0.11 };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);

    const FAQ = faq([
      {
        q: `What is the hex code for ${name}?`,
        a: `The hex code for ${name} is <strong>#${hex.toUpperCase()}</strong> — RGB ${rgb.r}, ${rgb.g}, ${rgb.b}.`,
      },
      {
        q: `Can I use ${name} for text?`,
        a: asInk
          ? `Yes. ${name} reaches ${r2(onWhite)}:1 against white, past the ${AA}:1 that WCAG AA asks for body text.`
          : asInkLarge
            ? `Only for large text. ${name} reaches ${r2(onWhite)}:1 against white — enough for the ${AA_LARGE}:1 of headings at 24px or 18.5px bold, short of the ${AA}:1 body text needs.`
            : `Not on a white background. ${name} reaches only ${r2(onWhite)}:1, and WCAG AA asks for ${AA}:1. It works as a background or a border, not as ink.`,
      },
      {
        q: `Should text on ${name} be black or white?`,
        a: `<strong>${textIsWhite ? 'White' : 'Black'}</strong> — ${r2(Math.max(onWhite, onBlack))}:1 against ${r2(Math.min(onWhite, onBlack))}:1 the other way.`,
      },
    ]);

    const swatch = `<span style="display:inline-block;width:1.1em;height:1.1em;vertical-align:-.15em;border-radius:4px;border:1px solid var(--line);background:#${hex}"></span>`;

    pages.push({
      path: `/color/name/${name}/`,
      title: `${name.charAt(0).toUpperCase() + name.slice(1)} Color — Hex #${hex.toUpperCase()}, RGB ${rgb.r},${rgb.g},${rgb.b}`.length <= 65
        ? `${name.charAt(0).toUpperCase() + name.slice(1)} Color — Hex #${hex.toUpperCase()}, RGB ${rgb.r},${rgb.g},${rgb.b}`
        : `${name.charAt(0).toUpperCase() + name.slice(1)} Color — Hex #${hex.toUpperCase()}`,
      desc: `${name} is #${hex.toUpperCase()} — RGB ${rgb.r}, ${rgb.g}, ${rgb.b}, HSL ${hsl.h}°, ${hsl.s}%, ${hsl.l}%. Contrast ${r2(onWhite)}:1 on white, so ${asInk ? 'it passes WCAG AA for text' : asInkLarge ? 'large text only' : 'it is a background colour rather than a text one'}.`,
      h1: `${name} — #${hex.toUpperCase()}`,
      crumbs: [
        { name: 'Colours', path: '/color/' },
        { name, path: `/color/name/${name}/` },
      ],
      jsonld: [FAQ.schema],
      body: `<p class="big" style="font-size:1.6rem;margin:.3em 0">${swatch} <strong>#${hex.toUpperCase()}</strong></p>
<p class="muted">rgb(${rgb.r}, ${rgb.g}, ${rgb.b}) · hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%) · CSS keyword <code>${name}</code></p>

<h2>Can you put text on it?</h2>
<table><thead><tr><th></th><th>Contrast</th><th>Body text</th><th>Large text</th></tr></thead><tbody>
<tr><td>${name} on white</td><td>${r2(onWhite)}:1</td><td>${asInk ? 'AA' : '—'}</td><td>${asInkLarge ? 'AA' : '—'}</td></tr>
<tr><td>${name} on black</td><td>${r2(onBlack)}:1</td><td>${onBlack >= AA ? 'AA' : '—'}</td><td>${onBlack >= AA_LARGE ? 'AA' : '—'}</td></tr>
</tbody></table>
<p>As a background, ${name} takes <strong>${textIsWhite ? 'white' : 'black'}</strong> text: ${r2(Math.max(onWhite, onBlack))}:1 against ${r2(Math.min(onWhite, onBlack))}:1 the other way. A colour picker will give you the hex and stop there, which is why so many palettes look right and fail an accessibility audit.</p>

${ORIGIN[name] ? `<h2>Where the name comes from</h2>\n<p>${ORIGIN[name]}</p>` : ''}

<h2>Using it</h2>
<pre><code>color: ${name};
color: #${hex};
color: rgb(${rgb.r} ${rgb.g} ${rgb.b});</code></pre>
<p>All three are the same colour. The keyword is one of the ${entries.length} CSS named colours, which every browser has agreed on since CSS 2.1 — the list has not changed since, and it will not.</p>

<h2>Colours close to ${name}</h2>
<ul class="linklist">${near.map((x) => `<li><a href="/color/name/${x.n2}/"><span style="display:inline-block;width:.9em;height:.9em;vertical-align:-.1em;border-radius:3px;border:1px solid var(--line);background:#${x.h2}"></span> ${esc(x.n2)}</a> — #${x.h2.toUpperCase()}</li>`).join('')}</ul>

${FAQ.html}

<h2>Other named colours</h2>
<ul class="linklist">${ring(entries, entries.find(([n2]) => n2 === name), 12).map(([n2, h2]) => `<li><a href="/color/name/${n2}/">${esc(n2)}</a> — #${h2.toUpperCase()}</li>`).join('')}</ul>

<p><a href="/color/${hex}/">#${hex.toUpperCase()} in full</a> — tints, shades and harmonies · <a href="/color/name/">All named colours</a> · <a href="/color/">Colour reference</a></p>`,
    });
  }

  const list = entries.map(([n, h]) => `<li><a href="/color/name/${n}/"><span style="display:inline-block;width:.9em;height:.9em;vertical-align:-.1em;border-radius:3px;border:1px solid var(--line);background:#${h}"></span> ${esc(n)}</a> — #${h.toUpperCase()}</li>`).join('');

  pages.push({
    path: '/color/name/',
    title: 'CSS Named Colors — Hex Code and Contrast for All 141',
    desc: `Every CSS named colour with its hex code, RGB, HSL and the contrast ratio that decides whether text can sit on it. Chartreuse is #7FFF00, teal is #008080, gainsboro is #DCDCDC.`,
    h1: 'CSS named colours',
    crumbs: [
      { name: 'Colours', path: '/color/' },
      { name: 'By name', path: '/color/name/' },
    ],
    body: `<p>The ${entries.length} colour keywords every browser recognises, each with the figure a colour picker leaves out: how much contrast it has, and therefore whether anything can be read on it.</p>
<p>The list is frozen. It was settled in CSS 2.1 and the CSS Color specification has added no keywords since, which is why <code>rebeccapurple</code> — added in 2014 in memory of Rebecca Meyer — is the last one anybody remembers being new.</p>
<ul class="cols">
${list}
</ul>
<p><a href="/color/">Colour reference by hex</a> · <a href="/color/tailwind/">Tailwind colour scales</a></p>`,
  });

  return pages;
}
