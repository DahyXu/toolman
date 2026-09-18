import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, CATEGORIES } from './src/site.mjs';
import { page, esc, LOCK, SAFE } from './src/layout.mjs';
import { Z as TZ_ZONES } from './src/gen/timezones.mjs';
import { toolIcon, checkIcons } from './src/icons.mjs';
import { wishPage } from './src/wishes/index.mjs';

// A card that sends people from the tool lists to the wish wall.
const WISH_CTA = `<a class="wishcta" href="/wishes/"><span class="wc-tags" aria-hidden="true"><i></i><i></i><i></i></span><span class="wc-t"><b>Missing a tool?</b><span>Hang a wish on the wall</span></span><span class="wc-go" aria-hidden="true">→</span></a>`;

// The card for the time-zone section quoted 848 conversions, written when
// there were 848. There are now 1,686. A count typed into prose drifts away
// from the thing it counts, so it is derived from the same table the pages
// are generated from — pairs of zones whose offsets differ, which is exactly
// the rule the generator uses.
const ZONE_PAIR_COUNT = TZ_ZONES.reduce((n, a) =>
  n + TZ_ZONES.filter((b) => b !== a && b.off !== a.off).length, 0);

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const written = [];
const pageMeta = [];
const collisions = [];
function write(urlPath, html) {
  // Two generators writing the same URL silently loses one of them, and the
  // built output looks fine — the only symptom is a page that is thinner than
  // the code says it should be. Surface it instead.
  if (written.includes(urlPath)) collisions.push(urlPath);
  const t = /<title>([^<]*)<\/title>/.exec(html);
  if (t) pageMeta.push({ title: t[1], path: urlPath });
  const rel = urlPath === '/' ? 'index.html' : path.join(urlPath.replace(/^\/|\/$/g, ''), 'index.html');
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  written.push(urlPath);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// ---------- load tools ----------
const toolsDir = path.join(root, 'src/tools');
const tools = [];
for (const f of fs.readdirSync(toolsDir).filter((f) => f.endsWith('.mjs')).sort()) {
  const mod = await import(pathToFileURL(path.join(toolsDir, f)).href);
  const t = mod.default;
  t.file = f;
  tools.push(t);
}
tools.sort((a, b) => (b.weight || 0) - (a.weight || 0) || a.title.localeCompare(b.title));
checkIcons(tools);

const bySlug = new Map(tools.map((t) => [t.slug, t]));

// ---------- shared render helpers ----------
export function faqBlock(faq) {
  if (!faq || !faq.length) return '';
  return `<h2>Frequently asked questions</h2><div class="faq">${faq
    .map((q) => `<h3>${esc(q.q)}</h3><p>${q.a}</p>`)
    .join('')}</div>`;
}
function faqLd(faq) {
  if (!faq || !faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a.replace(/<[^>]+>/g, '') },
    })),
  };
}
function relatedBlock(slugs) {
  const list = (slugs || []).map((s) => bySlug.get(s)).filter(Boolean);
  if (!list.length) return '';
  return `<h2>Related tools</h2><ul class="cards">${list
    .map((t) => `<li><a href="/${t.slug}/">${toolIcon(t.slug, t.cat)}<b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
    .join('')}</ul>`;
}

// ---------- tool pages ----------
for (const t of tools) {
  const cat = CATEGORIES[t.cat];
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: t.title,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      description: t.desc,
      url: `${SITE.origin}/${t.slug}/`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ];
  const f = faqLd(t.faq);
  if (f) ld.push(f);

  write(`/${t.slug}/`, page({
    title: t.metaTitle || `${t.title} — Free Online Tool | ${SITE.name}`,
    desc: t.desc,
    path: `/${t.slug}/`,
    h1: t.h1 || t.title,
    crumbs: [{ name: cat.name, path: `/${cat.slug}/` }, { name: t.title, path: `/${t.slug}/` }],
    jsonld: ld,
    head: t.head || '',
    body: `<p class="lead">${t.short || t.intro || t.desc}</p>
${t.body}
${t.about || ''}
${faqBlock(t.faq)}
${relatedBlock(t.related)}`,
    script: t.script,
  }));
}

// Extra sections appended to specific category hubs.
const IMG_PAIRS = ['png-to-jpg','png-to-webp','jpg-to-png','jpg-to-webp','webp-to-png','webp-to-jpg',
  'svg-to-png','svg-to-jpg','svg-to-webp','gif-to-png','gif-to-jpg','gif-to-webp',
  'bmp-to-png','bmp-to-jpg','bmp-to-webp','avif-to-png','avif-to-jpg','avif-to-webp',
  'ico-to-png','ico-to-jpg','ico-to-webp','jpeg-to-png','jpeg-to-webp'];
const CATEGORY_BODY = {
  dev: `<h2>What these tools have in common</h2>
<p>Every tool here runs as plain JavaScript inside your browser. That matters more for developer tools than for most software, because the things you paste into them are rarely harmless: production API responses, JWTs from a staging environment, config files with connection strings, log excerpts containing customer data. None of it is transmitted, because there is no server to transmit it to. You can load any of these pages, disconnect from the network, and keep working.</p>

<h2>Choosing between similar tools</h2>
<table>
<thead><tr><th>If you need to</th><th>Use</th></tr></thead>
<tbody>
<tr><td>Read a minified API response</td><td><a href="/json-formatter/">JSON formatter</a> — it also reports the line and column of a syntax error</td></tr>
<tr><td>Compare two config files or responses</td><td><a href="/text-diff-checker/">Diff checker</a>, ideally after sorting keys in the JSON formatter first</td></tr>
<tr><td>See what is inside a token</td><td><a href="/jwt-decoder/">JWT decoder</a> — it decodes only, and deliberately never asks for your signing key</td></tr>
<tr><td>Verify a downloaded file</td><td><a href="/hash-generator/">Hash generator</a> — SHA-256 in the browser, no upload</td></tr>
<tr><td>Work out a cron schedule</td><td><a href="/cron-expression-generator/">Cron generator</a> for a custom one, or <a href="/cron/">the schedule library</a> for a ready-made expression</td></tr>
<tr><td>Debug a regular expression</td><td><a href="/regex-tester/">Regex tester</a> with live match highlighting and capture groups</td></tr>
</tbody>
</table>

<h2>A note on what these tools will not do</h2>
<p>Some things genuinely cannot be done well in a browser, and we would rather say so than ship something that half works. The JWT decoder does not verify signatures, because that would mean asking you to paste a secret into a web page. There is no HEIC converter, because Chrome and Firefox cannot decode HEIC and the alternatives are either uploading your photo or shipping a megabyte of WebAssembly. Where a tool is missing, the reference pages usually explain the platform-native way to do it instead.</p>`,
  text: `<h2>Working with text in the browser</h2>
<p>Text tools get used on drafts, contracts, transcripts and anything else that has not been published yet — which is exactly the material you would rather not paste into a server you do not control. Everything here is computed locally, so the document never leaves your machine.</p>

<h2>Which tool for which job</h2>
<table>
<thead><tr><th>Task</th><th>Tool</th></tr></thead>
<tbody>
<tr><td>Check a draft against a length limit</td><td><a href="/word-counter/">Word counter</a> — it shows the remaining budget for title tags, meta descriptions, posts and SMS</td></tr>
<tr><td>See what changed between two versions</td><td><a href="/text-diff-checker/">Diff checker</a>, with word-level highlighting inside changed lines</td></tr>
<tr><td>Convert naming conventions</td><td><a href="/case-converter/">Case converter</a> — it detects word boundaries from case changes, so <code>userAccountId</code> converts cleanly</td></tr>
<tr><td>Turn Markdown into HTML</td><td><a href="/markdown-to-html/">Markdown converter</a> with a live preview</td></tr>
<tr><td>Fill a layout with placeholder copy</td><td><a href="/lorem-ipsum-generator/">Lorem ipsum generator</a></td></tr>
</tbody>
</table>

<h2>Counting is less obvious than it looks</h2>
<p>A "word" has no single definition. Word processors, editors and academic style guides all count slightly differently — hyphenated compounds, numbers, and standalone symbols are handled inconsistently between them. Characters are worse: an emoji is one character to a reader, one code point to a linguist, and two UTF-16 units to naive JavaScript. Our counters iterate over code points, so an emoji or a Chinese character counts as one, which is what social platforms do too.</p>`,
  convert: `<h2>Converters that show their working</h2>
<p>A conversion result on its own is easy to mistrust. Every converter here shows the exact factor it used, the formula in both directions, and a table of nearby values — so you can check the answer rather than take it on faith.</p>

<h2>What is covered</h2>
<ul>
<li><strong><a href="/convert/">Units</a></strong> — length, weight, temperature, volume, area, speed, data, time, pressure, energy, power, angle and frequency, with every pair of units in each category.</li>
<li><strong><a href="/convert/time-zones/">Time zones</a></strong> — conversions between fixed-offset abbreviations, each with a 24-hour table and the working-hours overlap between the two zones.</li>
<li><strong><a href="/convert/css-units/">CSS units</a></strong> — px, rem, em, pt and the rest, with a root font size you can set to match your project.</li>
<li><strong><a href="/cooking/">Cooking</a></strong> — cups to grams per ingredient, because a cup of flour is 125 g and a cup of honey is 340 g.</li>
<li><strong><a href="/color/">Colors</a></strong> — HEX, RGB, HSL and CMYK with WCAG contrast ratios.</li>
<li><strong><a href="/paper/">Paper sizes</a></strong> — A4, Letter and the rest in millimetres, inches and pixels at any DPI.</li>
<li><strong><a href="/resolution/">Screen resolutions</a></strong> — 1080p to 8K with aspect ratios, megapixels and pixel density at any screen size.</li>
<li><strong><a href="/screen-size/">Screen sizes</a></strong> — how wide a 55-inch television actually is, in inches and centimetres, at every aspect ratio.</li>
</ul>

<h2>Where conversions get subtle</h2>
<p>Most unit conversions are a single fixed factor and cannot go wrong. A few genuinely can:</p>
<ul>
<li><strong>Temperature</strong> needs an offset as well as a factor, because the scales have different zero points.</li>
<li><strong>Digital storage</strong> has two competing definitions — a manufacturer's "1 TB" is 10¹² bytes, while your operating system displays 2⁴⁰, which is why a new drive shows as 931 GB.</li>
<li><strong>US and imperial volumes differ.</strong> A US gallon is 3.785 L; an imperial gallon is 4.546 L. Recipes and fuel figures cross this boundary constantly.</li>
<li><strong>Cooking measures are not a unit conversion at all</strong> — they depend on the density of the ingredient, which is why those live on their own pages.</li>
</ul>

<h2>The factors worth knowing by heart</h2>
<p>Most day-to-day conversions come down to a dozen numbers. These are exact unless marked otherwise — an inch has been defined as exactly 25.4 mm since 1959, and a pound as exactly 0.45359237 kg, so those are definitions rather than measurements.</p>
<table>
<thead><tr><th>From</th><th>To</th><th>Multiply by</th><th></th></tr></thead>
<tbody>
<tr><td>Inches</td><td>Centimetres</td><td>2.54</td><td>exact</td></tr>
<tr><td>Feet</td><td>Metres</td><td>0.3048</td><td>exact</td></tr>
<tr><td>Miles</td><td>Kilometres</td><td>1.609344</td><td>exact</td></tr>
<tr><td>Pounds</td><td>Kilograms</td><td>0.45359237</td><td>exact</td></tr>
<tr><td>Ounces</td><td>Grams</td><td>28.349523125</td><td>exact</td></tr>
<tr><td>US gallons</td><td>Litres</td><td>3.785411784</td><td>exact</td></tr>
<tr><td>Imperial gallons</td><td>Litres</td><td>4.54609</td><td>exact</td></tr>
<tr><td>Acres</td><td>Hectares</td><td>0.40468564224</td><td>exact</td></tr>
<tr><td>psi</td><td>Bar</td><td>0.0689475729</td><td>approx.</td></tr>
<tr><td>Kilocalories</td><td>Kilojoules</td><td>4.184</td><td>exact, thermochemical</td></tr>
<tr><td>Nautical miles</td><td>Kilometres</td><td>1.852</td><td>exact</td></tr>
<tr><td>Degrees</td><td>Radians</td><td>π/180</td><td>exact</td></tr>
</tbody>
</table>
<p>Two of these are worth a second look. The <strong>calorie</strong> has several competing definitions; the 4.184 above is the thermochemical calorie, which is the one food labelling uses. And the <strong>gallon</strong> entry is the single most common source of wrong answers on this list — a US gallon is about 17% smaller than an imperial one, so a fuel-economy figure quoted in mpg means two different things either side of the Atlantic.</p>

<h2>Doing it in your head</h2>
<p>Approximations that are close enough to be useful and easy to remember:</p>
<ul>
<li><strong>Kilometres to miles: multiply by 0.6</strong> — a slight underestimate, about 3% low. More precisely, consecutive Fibonacci numbers are near-perfect km/mile pairs — 5 km ≈ 3 miles, 8 km ≈ 5 miles, 13 km ≈ 8 miles. The ratio converges on the golden ratio, 1.618, which happens to sit within 0.6% of the true factor 1.609.</li>
<li><strong>Celsius to Fahrenheit: double it and add 30.</strong> Exact at 10°C and within 4° anywhere between −10°C and 30°C, which covers most weather. It drifts further at the extremes — at 100°C it is out by 18°.</li>
<li><strong>Kilograms to pounds: double it and add 10%.</strong> 80 kg → 160 + 16 = 176 lb, against a true 176.4.</li>
<li><strong>Litres to US gallons: divide by 4, then add 5%.</strong> 40 L → 10 + 0.5 = 10.5, against a true 10.57.</li>
</ul>`,
  image: `<h2>Image processing without the upload</h2>
<p>Most online image tools work by uploading your file to a server, processing it there and giving you a link back. That means your photo sits on someone else's disk, for an unspecified period, under a privacy policy you did not read. These tools use a canvas in your own browser instead — the file never travels, there is no queue, no size cap beyond your device's memory, and no watermark.</p>

<h2>What to reach for</h2>
<table>
<thead><tr><th>Task</th><th>Tool</th></tr></thead>
<tbody>
<tr><td>Make a photo smaller for the web</td><td><a href="/image-compressor/">Image compressor</a> — resize first, then compress; the dimensional saving is usually far larger</td></tr>
<tr><td>Change format</td><td>The <a href="/png-to-jpg/">format converters</a> — WebP for the web, JPEG for compatibility, PNG for transparency</td></tr>
<tr><td>Build a site icon</td><td><a href="/favicon-generator/">Favicon generator</a>, from an image or just a letter</td></tr>
<tr><td>Make a QR code</td><td><a href="/qr-code-generator/">QR generator</a> — static codes that never expire and track nothing</td></tr>
</tbody>
</table>

<h2>Two things worth knowing</h2>
<p><strong>Re-encoding strips metadata.</strong> Running a photo through any of these tools discards its EXIF data, including GPS coordinates, camera model and timestamp. That is usually what you want before sharing an image publicly.</p>
<p><strong>Lossy compression is one-way.</strong> Re-saving an already-compressed JPEG at high quality does not restore lost detail; it adds a second generation of artefacts on top. Always work from the original when you have it.</p>`,
  ai: `<h2>Tools for working with language models</h2>
<p>Building anything on top of an LLM means dealing in tokens: they determine the cost of every API call, whether a prompt fits the context window, and how long a response takes to start. But tokens are invisible — you cannot count them by looking at text, and the relationship to characters shifts with the language and content type.</p>

<h2>What the token counter is for</h2>
<p>The <a href="/ai-token-counter/">AI token counter</a> estimates how many tokens a piece of text costs across GPT, Claude, Gemini and Llama, and what that works out to per API call. It is useful when you are:</p>
<ul>
<li><strong>Trimming a system prompt.</strong> A prompt that runs on every single request is where cost savings compound fastest.</li>
<li><strong>Debugging a context-length error.</strong> The number in the error message means nothing until you can measure your own input against it.</li>
<li><strong>Sizing chunks for retrieval.</strong> Knowing the character-to-token ratio for your actual content lets you pick a chunk size that fits.</li>
<li><strong>Estimating a bill before you run a batch.</strong> Multiplying one document's token count by the batch size is a five-second sanity check that has saved a lot of surprises.</li>
</ul>

<h2>Rules of thumb</h2>
<table>
<thead><tr><th>Content</th><th>Approximate ratio</th></tr></thead>
<tbody>
<tr><td>English prose</td><td>~4 characters per token</td></tr>
<tr><td>Source code</td><td>~3–3.5 characters per token</td></tr>
<tr><td>Chinese, Japanese, Korean</td><td>~1–1.5 characters per token</td></tr>
<tr><td>Base64 or random strings</td><td>close to 1 token per 2 characters</td></tr>
</tbody>
</table>
<p>Output tokens usually cost several times more than input tokens, which is why capping response length is often the fastest way to cut a bill. Note that images and audio count too — a vision model converts an image into a block of tokens based on its resolution.</p>

<h2>Related</h2>
<p>For counting plain words and characters rather than tokens, use the <a href="/word-counter/">word counter</a>. To inspect the JSON going in and out of an API, the <a href="/json-formatter/">JSON formatter</a> reports the exact position of a syntax error.</p>`,
};

const CATEGORY_EXTRA = {
  dev: `<h2>Developer reference</h2>
<ul class="cards">
<li><a href="/http/"><b>HTTP status codes</b><span>Every status code, what triggers it and how to fix it.</span></a></li>
<li><a href="/cron/"><b>Cron schedule examples</b><span>Ready-made cron expressions for every common schedule.</span></a></li>
<li><a href="/port/"><b>Port number reference</b><span>What runs on each port and how to check what is listening.</span></a></li>
<li><a href="/convert/css-units/"><b>CSS unit converters</b><span>px, rem, em, pt and more, with an adjustable root font size.</span></a></li>
<li><a href="/convert/data/"><b>Data size converters</b><span>Bytes, KB, MB, GB, TB and their binary counterparts.</span></a></li>
</ul>`,
  image: `<h2>Image format converters</h2>
<p class="muted">Convert between image formats in your browser — no upload, no watermark, no file-size limit.</p>
<ul class="linklist">${IMG_PAIRS.map((s) => {
    const [a, b] = s.split('-to-');
    return `<li><a href="/${s}/">${a.toUpperCase()} to ${b.toUpperCase()}</a></li>`;
  }).join('')}</ul>`,
};

// ---------- category pages ----------
// `/convert/` is also the unit-converter hub produced by src/gen/units.mjs.
// Rather than have one silently overwrite the other, the category half is
// handed to that generator, which splices it into the page it builds.
const categorySection = {};

for (const c of Object.values(CATEGORIES)) {
  const list = tools.filter((t) => t.cat === c.slug);
  if (!list.length) continue;
  const section = `<p class="lead">${esc(c.desc)}</p>
<ul class="cards">${list
    .map((t) => `<li><a href="/${t.slug}/">${toolIcon(t.slug, t.cat)}<b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
    .join('')}</ul>${CATEGORY_BODY[c.slug] || ''}${CATEGORY_EXTRA[c.slug] || ''}`;

  if (c.slug === 'convert') {
    categorySection.convert = section;
    continue;
  }

  write(`/${c.slug}/`, page({
    title: `${c.name} — ${c.tail ? c.tail : `${list.length} Free Online Tools`} | ${SITE.name}`,
    desc: `${c.desc} ${list.length} free ${list.length === 1 ? 'tool that runs' : 'tools that run'} in your browser — no upload, no sign-up.`,
    path: `/${c.slug}/`,
    h1: c.name,
    crumbs: [{ name: c.name, path: `/${c.slug}/` }],
    body: section,
  }));
}

// ---------- generated (programmatic SEO) pages ----------
const genDir = path.join(root, 'src/gen');
let genPages = [];
if (fs.existsSync(genDir)) {
  for (const f of fs.readdirSync(genDir).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(path.join(genDir, f)).href);
    const out = await mod.default({ categorySection, tools });
    genPages = genPages.concat(out);
  }
}
for (const p of genPages) write(p.path, page(p));

// ---------- all tools index ----------
const allToolsBody = Object.values(CATEGORIES)
  .map((c) => {
    const list = tools.filter((t) => t.cat === c.slug);
    if (!list.length) return '';
    return `<h2 id="${c.slug}">${esc(c.name)}</h2><ul class="cards">${list
      .map((t) => `<li><a href="/${t.slug}/">${toolIcon(t.slug, t.cat)}<b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
      .join('')}</ul>`;
  })
  .join('');

write('/tools/', page({
  title: `All ${tools.length} Free Online Tools | ${SITE.name}`,
  desc: `Browse all ${tools.length} free online tools on ${SITE.name}. Developer utilities, converters, text and image tools — all running privately in your browser.`,
  path: '/tools/',
  h1: 'All tools',
  crumbs: [{ name: 'All tools', path: '/tools/' }],
  body: `<p class="muted">Every tool here runs entirely in your browser. Nothing is uploaded to a server.</p>${allToolsBody}${WISH_CTA}`,
}));

// ---------- home ----------
write('/', page({
  title: `${SITE.name} — ${tools.length} Free Online Tools That Run in Your Browser`,
  desc: SITE.description,
  path: '/',
  body: `<div class="hero">
<p class="badge">${LOCK}100% in your browser</p>
<h1>Online tools that never upload your data</h1>
<p>Files, text and keys are processed on your own device. No server ever sees them.</p>
<form class="bigsearch" action="/search/" role="search"><input type="search" name="q" placeholder="json, compress image, px to rem…" aria-label="Search tools and reference pages" autocomplete="off"><button class="primary" type="submit">Search</button></form>
<ul class="pledge">
<li><svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="10" rx="1.5"/><path d="M7 17h6M10 13.5V17"/></svg><b>Processed locally</b><span>Your browser does the work</span></li>
<li><svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 13v2.5h12V13"/><path d="M3 3l14 14"/></svg><b>Zero uploads</b><span>No server receives your files</span></li>
<li><svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7.5a11 11 0 0 1 15 0M5 10.5a7 7 0 0 1 10 0M7.7 13.3a3 3 0 0 1 4.6 0"/><circle cx="10" cy="16" r=".8" fill="currentColor"/><path d="M3 3l14 14"/></svg><b>Works offline</b><span>Load once, then cut the network</span></li>
<li><svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="7" r="3"/><path d="M4 17c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5"/><path d="M3 3l14 14"/></svg><b>No sign-up</b><span>No account, no tracking cookies</span></li>
</ul>
</div>
${allToolsBody}
${WISH_CTA}
<h2>Popular lookups</h2>
<ul class="chips">
<li><a href="/convert/5-feet-to-centimeters/">5 feet in cm</a></li>
<li><a href="/convert/180-pounds-to-kilograms/">180 lbs in kg</a></li>
<li><a href="/convert/1-kilograms-to-pounds/">1 kg in lbs</a></li>
<li><a href="/convert/inches-to-centimeters/">Inches to cm</a></li>
<li><a href="/convert/kilometers-to-miles/">Kilometres to miles</a></li>
<li><a href="/convert/celsius-to-fahrenheit/">Celsius to Fahrenheit</a></li>
<li><a href="/convert/100-celsius-to-fahrenheit/">100°C in °F</a></li>
<li><a href="/convert/gigabytes-to-megabytes/">GB to MB</a></li>
<li><a href="/convert/minutes-to-hours/">Minutes to hours</a></li>
<li><a href="/convert/px-to-rem/">px to rem</a></li>
<li><a href="/convert/pst-to-est/">PST to EST</a></li>
<li><a href="/convert/utc-to-est/">UTC to EST</a></li>
<li><a href="/cooking/1-cups-all-purpose-flour-to-grams/">1 cup flour in grams</a></li>
<li><a href="/cooking/1-cups-granulated-sugar-to-grams/">1 cup sugar in grams</a></li>
<li><a href="/color/ff0000/">#FF0000</a></li>
<li><a href="/color/000000/">#000000</a></li>
<li><a href="/http/404/">HTTP 404</a></li>
<li><a href="/http/301/">HTTP 301</a></li>
<li><a href="/http/500/">HTTP 500</a></li>
<li><a href="/port/3306/">Port 3306</a></li>
<li><a href="/port/8080/">Port 8080</a></li>
<li><a href="/port/443/">Port 443</a></li>
<li><a href="/roman/2026/">2026 in Roman numerals</a></li>
<li><a href="/roman/4/">4 in Roman numerals</a></li>
<li><a href="/paper/a4/">A4 paper size</a></li>
<li><a href="/paper/letter/">Letter paper size</a></li>
<li><a href="/file/heic/">.heic files</a></li>
<li><a href="/file/webp/">.webp files</a></li>
<li><a href="/png-to-jpg/">PNG to JPG</a></li>
<li><a href="/webp-to-png/">WebP to PNG</a></li>
<li><a href="/cron/every-5-minutes/">Cron: every 5 minutes</a></li>
<li><a href="/chmod/755/">chmod 755</a></li>
<li><a href="/chmod/644/">chmod 644</a></li>
<li><a href="/chmod/777/">chmod 777</a></li>
<li><a href="/cidr/24/">/24 subnet</a></li>
<li><a href="/cidr/16/">/16 subnet</a></li>
<li><a href="/cidr/30/">/30 subnet</a></li>
<li><a href="/ascii/65/">ASCII 65 (A)</a></li>
<li><a href="/ascii/10/">ASCII 10 (LF)</a></li>
<li><a href="/ascii/0/">ASCII 0 (NUL)</a></li>
</ul>
<h2>Reference libraries</h2>
<ul class="cards compact">
<li><a href="/convert/"><b>Unit converter</b><span>1,000+ conversions across length, weight, temperature, volume, data, speed and more.</span></a></li>
<li><a href="/color/"><b>Color codes</b><span>600+ HEX colors with RGB, HSL, CMYK, contrast ratios and matching palettes.</span></a></li>
<li><a href="/convert/css-units/"><b>CSS units</b><span>px, rem, em, pt and more — with an adjustable root font size.</span></a></li>
<li><a href="/convert/time-zones/"><b>Time zones</b><span>${ZONE_PAIR_COUNT.toLocaleString()} conversions between EST, PST, UTC, CET, IST, JST and more.</span></a></li>
<li><a href="/image/"><b>Image converters</b><span>PNG, JPG, WebP, SVG, AVIF and HEIC-adjacent formats, converted locally.</span></a></li>
<li><a href="/http/"><b>HTTP status codes</b><span>Every code explained — what triggers it and how to actually fix it.</span></a></li>
<li><a href="/cron/"><b>Cron schedules</b><span>Ready-made expressions for every common schedule, with next run times.</span></a></li>
<li><a href="/port/"><b>Port numbers</b><span>What runs on each port, why it matters, and how to see what is listening.</span></a></li>
<li><a href="/file/"><b>File formats</b><span>What each extension is, what opens it, and what catches people out.</span></a></li>
<li><a href="/chmod/"><b>File permissions</b><span>What every chmod value grants, and which one is actually right.</span></a></li>
<li><a href="/cidr/"><b>CIDR prefixes</b><span>Every subnet size from /0 to /32 with masks and host counts.</span></a></li>
<li><a href="/ascii/"><b>ASCII table</b><span>All 128 codes, with the control characters explained rather than blank.</span></a></li>
<li><a href="/cooking/"><b>Cooking conversions</b><span>Cups to grams per ingredient — a cup of flour and a cup of honey are not the same weight.</span></a></li>
<li><a href="/roman/"><b>Roman numerals</b><span>Every number broken down symbol by symbol, plus the rules that govern them.</span></a></li>
<li><a href="/paper/"><b>Paper sizes</b><span>A4, Letter, Legal and the rest — in mm, inches and pixels at any DPI.</span></a></li>
<li><a href="/resolution/"><b>Screen resolutions</b><span>1080p, 1440p, 4K and the rest — aspect ratio, megapixels and PPI.</span></a></li>
<li><a href="/screen-size/"><b>Screen sizes</b><span>TV and monitor dimensions in inches and cm, and what a step up really adds.</span></a></li>
<li><a href="/oven/"><b>Oven temperatures</b><span>Gas mark, °C, °F and the fan equivalent — and why the numbers are rounded.</span></a></li>
<li><a href="/bed-size/"><b>Bed sizes</b><span>US, UK and European mattress dimensions — and why the names do not travel.</span></a></li>
<li><a href="/lumber/"><b>Lumber sizes</b><span>Nominal against actual — a 2x4 is 1½ × 3½ inches, and here is every other board.</span></a></li>
<li><a href="/battery/"><b>Battery sizes</b><span>Dimensions, voltage and equivalents — and why a CR2032 is called that.</span></a></li>
<li><a href="/awg/"><b>Wire gauge</b><span>AWG in mm, area and resistance — and the formula the whole scale comes from.</span></a></li>
<li><a href="/thread/"><b>Metric threads</b><span>Tapping drill, clearance hole and spanner size for M2 to M24.</span></a></li>
<li><a href="/time-difference/"><b>Time differences</b><span>City to city, with the weeks each gap is not what every converter says it is.</span></a></li>
<li><a href="/resistor/"><b>Resistor colour codes</b><span>Every E24 value both ways — bands to value, value to bands, and the SMD marking.</span></a></li>
<li><a href="/capacitor/"><b>Capacitor codes</b><span>104 is 100 nF. Every three-digit code in pF, nF and µF, with the reactance.</span></a></li>
<li><a href="/tap-drill/"><b>Tap drill sizes</b><span>The drill for every unified thread, and the arithmetic the chart figure comes from.</span></a></li>
<li><a href="/drill-size/"><b>Drill sizes</b><span>Number, letter and fractional drills in inches and mm, and what each one taps.</span></a></li>
<li><a href="/fastener/"><b>Fastener standards</b><span>DIN to ISO, and the three sizes where the same thread takes a different spanner.</span></a></li>
<li><a href="/tyre/"><b>Tyre sizes</b><span>What 205/55R16 measures, which sizes replace it, and the speedometer effect.</span></a></li>
<li><a href="/ring-size/"><b>Ring sizes</b><span>US, UK and EU conversion — and why the European size is just the measurement.</span></a></li>
<li><a href="/bakeware/"><b>Baking tin sizes</b><span>Area, volume and which tin substitutes for which — and what it does to the time.</span></a></li>
<li><a href="/paper-weight/"><b>Paper weight</b><span>GSM to lb — and why 80 lb text and 80 lb cover are different papers.</span></a></li>
<li><a href="/bedding/"><b>Bedding sizes</b><span>Duvet and comforter dimensions, and how far each hangs over the bed.</span></a></li>
<li><a href="/shoe-size/"><b>Shoe sizes</b><span>US, UK and EU with the foot length each fits — measure first, convert second.</span></a></li>
<li><a href="/door-size/"><b>Door sizes</b><span>Leaf, rough opening and clear width — three numbers, only one of them the door.</span></a></li>
<li><a href="/sandpaper/"><b>Sandpaper grit</b><span>P grades against CAMI grit — P400 is about 320, and here is the whole chart.</span></a></li>
<li><a href="/spanner/"><b>Spanner sizes</b><span>Metric against imperial — which pairs swap, and which round a bolt head.</span></a></li>
<li><a href="/pipe/"><b>Pipe sizes</b><span>NPS, DN and the real outside diameter — a half-inch pipe is 0.84 inches.</span></a></li>
<li><a href="/screw/"><b>Screw sizes</b><span>Gauge to millimetres, and the two different holes a joint needs.</span></a></li>
<li><a href="/brick/"><b>Brick sizes</b><span>Format, coursing and bricks per square metre — where "sixty" comes from.</span></a></li>
<li><a href="/password-length/"><b>Password length</b><span>What each length is worth in bits and in time, and where the useful range ends.</span></a></li>
<li><a href="/knitting-needle/"><b>Knitting needles</b><span>US, UK and mm — two scales that run in opposite directions and meet once.</span></a></li>
</ul>`,
}));

// ---------- wish wall ----------
write('/wishes/', page({
  title: `Wish Wall — Tell Us Which Tool to Build Next | ${SITE.name}`,
  desc: `Which free browser tool should ${SITE.name} build next? Hang your wish on the wall, heart the ideas you want too, and see which ones have already been built.`,
  path: '/wishes/',
  h1: 'Wish wall',
  crumbs: [{ name: 'Wish wall', path: '/wishes/' }],
  fold: false,
  head: wishPage.head,
  body: wishPage.body,
  script: wishPage.script,
}));

// ---------- static content pages ----------
write('/about/', page({
  title: `About ${SITE.name}`,
  desc: `${SITE.name} is a free collection of privacy-first online tools that run entirely in your web browser.`,
  path: '/about/',
  h1: `About ${SITE.name}`,
  crumbs: [{ name: 'About', path: '/about/' }],
  body: `<p>${SITE.name} is a collection of small, focused web tools and reference material. Every tool runs entirely in your browser as plain JavaScript. There is no backend, no account, and no upload step — you can load a page, disconnect from the network, and keep working.</p>

<h2>Why it works this way</h2>
<p>Most online utilities send your input to a server to be processed. For a colour picker that hardly matters. For an API response, a JWT, a config file or a private key it matters a great deal: the data lands on someone else's disk, for an unstated period, under a privacy policy nobody reads. Doing the work in the browser removes the question entirely rather than asking you to trust an answer to it.</p>
<p>That constraint shapes everything else. There is no framework and no runtime dependency, so a page is HTML with its JavaScript inline and nothing to fetch. Pages are 10–20&nbsp;KB and the stylesheet is inlined rather than linked — partly for speed, and partly because ad-blocking lists that cover the whole <code>.top</code> domain were silently dropping the external stylesheet and leaving the site unstyled.</p>

<h2>What is here</h2>
<ul>
<li><strong><a href="/tools/">Interactive tools</a></strong> — formatters, encoders, hash and QR generators, image compression, regex and cron builders. Each is one self-contained page.</li>
<li><strong>Reference material</strong> — the things worth looking up rather than computing: <a href="/convert/">unit conversions</a>, <a href="/color/">colour values with contrast ratios</a>, <a href="/color/tailwind/">Tailwind colours</a>, <a href="/color/name/">CSS colour names</a>, <a href="/http/">HTTP status codes</a>, <a href="/port/">port numbers</a>, <a href="/port/service/">ports by service</a>, <a href="/chmod/">file permissions</a>, <a href="/cidr/">CIDR prefixes</a>, <a href="/cidr/mask/">subnet masks</a>, <a href="/cooking/">cooking measures</a>, <a href="/oven/">oven temperatures</a>, <a href="/bed-size/">bed sizes</a>, <a href="/bed-size/compare/">mattress size comparisons</a>, <a href="/lumber/">lumber sizes</a>, <a href="/battery/">battery sizes</a>, <a href="/awg/">wire gauges</a>, <a href="/awg/compare/">gauge comparisons</a>, <a href="/thread/">metric threads</a>, <a href="/tyre/">tyre sizes</a>, <a href="/ring-size/">ring sizes</a>, <a href="/bakeware/">baking tin sizes</a>, <a href="/bakeware/compare/">tin substitutions</a>, <a href="/paper-weight/">paper weights</a>, <a href="/bedding/">bedding sizes</a>, <a href="/shoe-size/">shoe sizes</a>, <a href="/door-size/">door sizes</a>, <a href="/sandpaper/">sandpaper grits</a>, <a href="/spanner/">spanner sizes</a>, <a href="/pipe/">pipe sizes</a>, <a href="/screw/">screw sizes</a>, <a href="/brick/">brick sizes</a>, <a href="/password-length/">password lengths</a>, <a href="/knitting-needle/">knitting needle sizes</a>, <a href="/paper/">paper sizes</a>, <a href="/paper/compare/">paper size comparisons</a>, <a href="/resolution/">screen resolutions</a> and <a href="/screen-size/">screen sizes</a>.</li>
</ul>

<h2>How correctness is checked</h2>
<p>Reference pages are only worth having if the numbers are right, so the arithmetic is computed at build time rather than transcribed, and then verified against an independent source. Every CIDR mask and host count is checked against a separately written table; every chmod value is checked against its canonical symbolic form, including the setuid, setgid and sticky cases. The QR encoder is verified by decoding 335 generated codes across versions 1–20 and all four error-correction levels — an earlier version produced codes that looked perfect and that no scanner could read.</p>
<p>A set of audit scripts runs against the built output and fails the build on missing metadata, duplicate titles, broken internal links, pages unreachable from the home page, invalid structured data, and accessibility problems such as form controls with no accessible name. They exist because each of those was a real defect here first.</p>

<h2>Cost and longevity</h2>
<p>The whole site is static files on Cloudflare's free tier, so it costs essentially nothing to run. That is the honest reason it can stay free without advertising, tracking or an upgrade path: there is nothing to recoup.</p>

<h2>Feedback</h2>
<p>Missing a tool, or found a wrong number? Corrections are genuinely welcome — the source is <a href="https://github.com/DahyXu/toolman" rel="noopener">on GitHub</a>, and a bug in a reference page is worth more to fix than a new feature is to add.</p>`,
}));

write('/privacy/', page({
  title: `Privacy Policy | ${SITE.name}`,
  desc: `${SITE.name} processes everything client-side. We do not upload, collect or sell your data.`,
  path: '/privacy/',
  h1: 'Privacy policy',
  crumbs: [{ name: 'Privacy', path: '/privacy/' }],
  body: `<p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>

<h2 id="verify">Check it yourself</h2>
<ol class="steps">
<li><span><b>Open a tool</b> and let the page finish loading.</span></li>
<li><span><b>Turn off Wi-Fi</b> or switch on airplane mode.</span></li>
<li><span><b>Use the tool.</b> It keeps working, because nothing it does needs a server.</span></li>
</ol>
<p class="muted">Prefer proof on screen? Open your browser's developer tools, go to the Network tab, and use a tool: no request carries your input.</p>

<h2>Short version</h2>
<p>Everything you type, paste or open in a tool on this site is processed by JavaScript running inside your own browser. None of it is sent anywhere, because there is no server-side processing and no backend to send it to. You can verify this: load any tool, disconnect from the network, and it will keep working.</p>

<h2>What happens to what you put into a tool</h2>
<p>Text, images, documents and files you load into a tool stay in your browser's memory for as long as the page is open, and are discarded when you close or reload it. Nothing is written to disk, transmitted, queued or logged. This is a property of how the site is built rather than a promise about how we behave: the code that handles your input is the JavaScript on the page you are looking at, and you can read it with View Source.</p>
<p>The practical consequence is that pasting a production API response, a JWT, a config file or a private key into a tool here carries the same exposure as opening it in a text editor on your own machine. That is the entire reason the site is built this way.</p>

<h2>Data stored on your device</h2>
<p>Some tools save small preferences in your browser's <code>localStorage</code> — the light or dark theme setting is the main one. This never leaves your device, is readable only by this site, and can be cleared at any time through your browser's site-data settings. We set no cookies of our own.</p>

<h2>Analytics</h2>
<p>Cloudflare Web Analytics is enabled on this site. It is served by Cloudflare and injected at the edge rather than being part of the page source. It counts page views and referrers in aggregate, sets no cookies, uses no fingerprinting, and does not track visitors across other websites. There is no advertising network, no tag manager, no session recording and no third-party embed anywhere on the site.</p>

<h2>Hosting</h2>
<p>The site is static files served from Cloudflare's network. As with any web host, Cloudflare processes request metadata such as your IP address, user agent and the URL requested, in order to deliver the page and to protect the service from abuse. That processing is governed by Cloudflare's own privacy documentation, and we do not receive or store those logs.</p>

<h2 id="wishes">The wish wall</h2>
<p>The <a href="/wishes/">wish wall</a> is the one part of the site that sends anything you type to a server, and it is marked as public where you write. A wish you hang there is stored in a Cloudflare D1 database and shown to every visitor. Please keep personal details out of it.</p>
<p>To stop spam and to count one heart per person, the wall stores a salted, one-way hash of your IP address alongside the hearts you give. The address itself is not stored, and the rate-limit records are deleted after a day. Which wishes you have hearted is also remembered in your browser's <code>localStorage</code>. Wishes that are abusive, off-topic or contain personal data may be removed.</p>

<h2>What we do not do</h2>
<ul>
<li>No accounts, sign-ups, or email collection. There is nothing to register for.</li>
<li>No file uploads. No tool has an upload endpoint; the wish wall accepts only the short text you choose to post there.</li>
<li>No selling or sharing of data.</li>
<li>No advertising, and therefore no advertising identifiers.</li>
<li>No paid tier, so no payment processing and no billing records.</li>
</ul>

<h2>Children</h2>
<p>The site collects no personal information from anyone, of any age. Nothing here is directed at children specifically, and nothing about using it requires disclosing anything about yourself.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes, the date at the top will change with it. The site's source is public, so any change to what the pages actually do is visible in its commit history as well.</p>

<h2>Contact</h2>
<p>Questions about this policy, or reports of anything on the site behaving differently from what is described here, can be raised as an issue on <a href="https://github.com/DahyXu/toolman" rel="noopener">the project's GitHub repository</a>.</p>`,
}));

// ---------- 404 ----------
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, '404.html'), page({
  title: `Page not found | ${SITE.name}`,
  desc: 'The page you are looking for does not exist.',
  path: '/404',
  noindex: true,
  h1: 'Page not found',
  body: `<p>That page does not exist. Try the <a href="/tools/">full tool list</a> or go back <a href="/">home</a>.</p>`,
}));

// ---------- search ----------
const searchIndex = pageMeta.map((m) => [m.title.replace(/\s*[—|]\s*Toolman.*$/, '').trim(), m.path]);
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'search-index.json'), JSON.stringify(searchIndex));

write('/search/', page({
  title: `Search — ${SITE.name}`,
  desc: `Search ${searchIndex.length} browser-based tools, unit converters, colour codes, HTTP status codes and other reference pages on ${SITE.name}. Results appear as you type.`,
  path: '/search/',
  h1: 'Search',
  crumbs: [{ name: 'Search', path: '/search/' }],
  noindex: true,
  body: `<p class="muted">Search across ${searchIndex.length.toLocaleString()} tools, converters and reference pages.</p>
<div class="tool">
  <label for="q">What are you looking for?</label>
  <input type="search" id="q" placeholder="json, px to rem, pst to est, #ff0000…" autofocus autocomplete="off">
  <p id="count" class="muted"></p>
  <ul class="linklist" id="res"></ul>
</div>
<script type="application/json" id="idx">${JSON.stringify(searchIndex).replace(/</g, '\u003c')}</script>
<h2>Popular starting points</h2>
<ul class="cards">
<li><a href="/tools/"><b>All tools</b><span>Every interactive tool on the site.</span></a></li>
<li><a href="/convert/"><b>Unit converters</b><span>Length, weight, temperature, data, time zones and CSS units.</span></a></li>
<li><a href="/color/"><b>Color codes</b><span>HEX, RGB, HSL and contrast for hundreds of colors.</span></a></li>
</ul>`,
  script: `
const $=s=>document.querySelector(s);
const IDX=JSON.parse(document.getElementById('idx').textContent);
function run(){
  const q=$('#q').value.trim().toLowerCase();
  if(!q){$('#res').innerHTML='';$('#count').textContent='';return}
  const terms=q.split(/\s+/);
  const hits=[];
  for(const [t,u] of IDX){
    const hay=(t+' '+u).toLowerCase();
    if(!terms.every(w=>hay.includes(w)))continue;
    let score=hay.indexOf(q)===0?0:hay.indexOf(q)>=0?1:2;
    if(u.split('/').filter(Boolean).length===1)score-=0.5;
    hits.push([score,t,u]);
    if(hits.length>4000)break;
  }
  hits.sort((a,b)=>a[0]-b[0]||a[1].length-b[1].length);
  $('#count').textContent=hits.length?hits.length.toLocaleString()+' result'+(hits.length===1?'':'s'):'No matches — try a shorter query.';
  $('#res').innerHTML=hits.slice(0,120).map(h=>'<li><a href="'+h[2]+'">'+h[1].replace(/</g,'&lt;')+'</a></li>').join('');
}
$('#q').addEventListener('input',run);
const p=new URLSearchParams(location.search).get('q');
if(p){$('#q').value=p}
run();
`,
}));

// ---------- sitemap + robots ----------
const now = new Date().toISOString().slice(0, 10);
const urls = [...new Set(written)];

// `lastmod` must reflect when a page's content actually changed. Stamping
// every page with the build date tells Google the whole site changed on every
// deploy, which makes it re-crawl pages it already has — spending crawl budget
// that a new site needs for the pages it has *not* seen yet. Hash the rendered
// body and keep the date from the last build whose hash matched.
const STAMP_FILE = path.join(root, '.lastmod.json');
const prevStamps = fs.existsSync(STAMP_FILE)
  ? JSON.parse(fs.readFileSync(STAMP_FILE, 'utf8'))
  : {};
const stamps = {};
let unchanged = 0;
for (const u of urls) {
  const file = path.join(dist, u === '/' ? 'index.html' : u.replace(/^\/|\/$/g, '') + '/index.html');
  let hash = '';
  try {
    // Hash the body only: the <head> carries the shared inline stylesheet, so
    // a CSS tweak would otherwise mark all 6,000 pages as modified.
    const html = fs.readFileSync(file, 'utf8');
    const body = html
      .slice(html.indexOf('<body>'))
      .replace(/<header[\s\S]*?<\/header>/g, '')
      .replace(/<nav[\s\S]*?<\/nav>/g, '')
      .replace(/<footer[\s\S]*?<\/footer>/g, '')
      // The scroll box around every table is presentation, the same way the
      // stylesheet in the head is. Adding it changed the markup of 12,608
      // pages without changing a word on any of them, and hashing it stamped
      // the whole site as modified on one build — which is the exact thing the
      // paragraph above exists to prevent, arriving through the body instead of
      // the head. Unwrap it before hashing so the shell is invisible here.
      .replace(/<div class="tw">(<table[\s\S]*?<\/table>)<\/div>/g, '$1')
      // The same goes for folding the long-form sections under a tool into a
      // collapsible panel and the FAQ into an accordion: the words did not move.
      .replace(/<details><summary>(<h3>[\s\S]*?<\/h3>)<\/summary><div class="ans">([\s\S]*?)<\/div><\/details>/g, '$1$2')
      .replace(/<details class="more"><summary>[\s\S]*?<\/summary><div class="more-b">([\s\S]*?)<\/div><\/details>(?=[\s\S]*<\/main>)/, '$1')
      // And the one-line "runs on your device" strip every widget now opens with.
      .replace(SAFE, '');
    hash = crypto.createHash('sha1').update(body).digest('hex').slice(0, 16);
  } catch { /* page written outside dist, fall through to today's date */ }
  const prev = prevStamps[u];
  if (prev && prev.hash === hash) {
    stamps[u] = prev;
    unchanged++;
  } else {
    stamps[u] = { hash, date: now };
  }
}
fs.writeFileSync(STAMP_FILE, JSON.stringify(stamps, null, 0));
const lastmodOf = (u) => (stamps[u] ? stamps[u].date : now);
console.log(`lastmod: ${urls.length - unchanged} changed, ${unchanged} unchanged`);
// The spec allows 50,000 URLs per sitemap, but smaller files are processed
// more reliably and make it obvious in Search Console which section of the
// site is being indexed. sitemap.xml becomes the index once there is more
// than one chunk, so the submitted URL never changes.
const CHUNK = 2000;

// A new site gets a limited crawl budget, so the order pages appear in matters:
// Googlebot works through sitemaps roughly in order, and the first chunk should
// be the pages worth ranking rather than whichever ones sort first
// alphabetically. Rank by editorial value, then chunk.
const toolSlugs = new Set(tools.map((t) => `/${t.slug}/`));

// A hub is any page that has pages beneath it. Deriving that from the URLs
// rather than listing it by hand is not tidiness: the hand-written list was
// last edited before /chmod/, /cidr/ and /ascii/ existed, so those three landed
// in the second sitemap chunk at priority 0.6 while gating 192 pages between
// them. A list maintained separately from the thing it describes drifts.
// Seeded with the pages that are hubs without their children nesting under
// them: the time-zone pairs live at /convert/pst-to-est/, not beneath
// /convert/time-zones/, so no prefix rule will find them.
const HUBS = new Set(['/', '/about/', '/privacy/', '/tools/',
  '/convert/time-zones/', '/convert/css-units/', '/convert/temperature/']);
for (const u of new Set(written)) {
  const depth = u.split('/').filter(Boolean).length;
  if (depth === 0 || depth > 2) continue;
  if (toolSlugs.has(u)) continue;
  if (written.some((v) => v !== u && v.startsWith(u))) HUBS.add(u);
}

// Not every leaf page has the same prospects, and until now they all sorted
// together at the bottom. Checking the live SERP for the queries this site
// actually receives separates them:
//
//   "450k to c"      Google prints its own converter above every web result
//   "#14b8a6"        Google prints its own colour picker
//   "a4 vs letter"   no widget; the answer needs two dimensions and a scale
//   "twin bed size"  no widget, and no reference site among the competitors
//
// A page whose question Google answers in the results itself can rank first and
// earn nothing. Ordering by that is the point: sitemap priority is a hint
// Google says it largely disregards, but the sort decides which URLs land in
// pages-1.xml, and that is the chunk it reads first.
// `[a-z]{2,5}-to-[a-z]{2,5}` cannot tell bst-to-brt from mm-to-pt, and it was
// filing both as pages Google answers above the results. It does not: the SERPs
// for `bst to brt` and `ict to pdt` carry no time widget, and those two are the
// best non-widget positions this site holds — 10.2 and 13.3. So 939 timezone
// pair pages were being sorted into the last sitemap chunk as if they were
// unwinnable, on a site whose crawl budget has reached 4,200 requests against
// 13,033 pages.
//
// The zone list is the authority on which codes are zones, so it is imported
// rather than pattern-matched.
// Sections whose results pages were checked before the section was built, and
// found to carry no answer widget. Each line records the query that was looked
// at, because "no widget" is a claim about somebody else's search results and
// six weeks from now nobody will remember which ones were actually opened.
//
// The evidence is not all the same strength. The zone pairs and /compare/ are
// backed by measured position — `bst to brt` at 10.2 in Search Console. The
// rest rest on the results page alone: no widget, and incumbents who are
// suppliers, calculators and forum threads rather than Adobe or LastPass.
// That is weaker, and it is still the best available for a page nothing has
// ranked for yet.
const VERIFIED_NO_WIDGET = [
  ['/tap-drill/', 'tap drill size for 1/4-20 — suppliers, a tool maker, Reddit'],
  ['/drill-size/', 'number 7 drill size — the same field, turned round'],
  ['/fastener/', 'din 933 dimensions — eight suppliers and a Scribd scan'],
  ['/resistor/', 'brown black red gold resistor value — calculators, no per-value page'],
  ['/capacitor/', '104 capacitor value — small vendors, Reddit, Facebook'],
  ['/time-difference/', 'london to new york time difference — mid-tier converters and a blog'],
];
const VERIFIED_PREFIXES = VERIFIED_NO_WIDGET.map(([p]) => p);

const ZONE_IDS = new Set(TZ_ZONES.map((z) => z.id));
const isZonePair = (u) => {
  const m = /^\/convert\/([a-z]{2,5})-to-([a-z]{2,5})\/$/.exec(u);
  return !!m && ZONE_IDS.has(m[1]) && ZONE_IDS.has(m[2]);
};
const WIDGET_ANSWERED = (u) =>
  /^\/convert\/(\d|[a-z]{2,5}-to-[a-z]{2,5}\/$)/.test(u) && !isZonePair(u);
const CLICK_WINNABLE = (u) =>
  u.includes('/compare/') || u.startsWith('/color/tailwind/') || isZonePair(u)
  || VERIFIED_PREFIXES.some((prefix) => u.startsWith(prefix));

// A URL pattern deciding which pages Google answers for itself is a guess about
// other people's search results, and the last one was wrong about 939 pages.
  // This checks the guess against what the pages actually are. The first marker
  // used was the working-hours overlap table, which appears on 939 of the 1,686
  // zone pages — the other 747 say "do not overlap at all" instead. The check
  // could therefore see only 56% of what it claimed to check, and still passed
  // the planted test, because 939 failures is plenty to fail a build. The
  // breadcrumb is on every zone page and no unit page, and does not depend on
  // prose that changes with the answer.
{
  const wrong = [];
  for (const u of urls) {
    if (!WIDGET_ANSWERED(u)) continue;
    let html;
    try { html = fs.readFileSync(path.join(dist, u.slice(1), 'index.html'), 'utf8'); }
    catch { continue; }
    if (html.includes('/convert/time-zones/')) wrong.push(u);
  }
  if (wrong.length) {
    console.error(`\n✗ sitemap: ${wrong.length} page(s) sorted last as widget-answered are timezone pairs, whose results pages carry no widget:`);
    for (const w of wrong.slice(0, 5)) console.error('    ' + w);
    process.exitCode = 1;
  }
}

// Eleven sections were built in a week and not one of them was linked from the
// home page's body. They were in the site-wide nav, which is chrome — Google
// discounts it, and the inbound-link audit excludes it for the same reason. So
// the pages Googlebot reaches first from the entry point it trusts most were
// the sections built at launch, while 3,232 newer pages waited behind them on a
// crawl budget of 4,200 requests against 13,033 pages.
//
// Nothing said so. Adding a section to the menu felt like linking it.
{
  const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const body = (home.split('<main')[1] || home).split('</main>')[0];
  const linked = new Set([...body.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]));

  // A section worth the home page's attention: it has a hub of its own and
  // enough beneath it to be a library rather than a page.
  const counts = new Map();
  for (const u of urls) {
    const top = '/' + (u.split('/')[1] || '') + '/';
    if (top === '//') continue;
    counts.set(top, (counts.get(top) || 0) + 1);
  }
  const missing = [];
  for (const [hub, n] of counts) {
    if (n < 20) continue;
    if (!urls.includes(hub)) continue;
    if (linked.has(hub)) continue;
    missing.push(`${hub} — ${n.toLocaleString()} pages, in the menu but not on the home page`);
  }
  if (missing.length) {
    console.error(`\n✗ home page: ${missing.length} section(s) of 20+ pages that the home page body does not link to:`);
    for (const m of missing) console.error('    ' + m);
    process.exitCode = 1;
  }
}

function rank(u) {
  if (u === '/') return 0;                     // home
  if (toolSlugs.has(u)) return 1;              // interactive tools — the real product
  if (HUBS.has(u)) return 2;                   // section hubs
  const depth = u.split('/').filter(Boolean).length;
  // Ahead of the depth rules, because depth was giving /convert/aedt-to-aest/
  // the 0.7 of a category hub - it is two segments deep - while a comparison
  // page three deep sat at 0.5. Depth describes the URL, not the prospects.
  if (CLICK_WINNABLE(u)) return 3;             // leaves whose SERP has no answer widget
  if (WIDGET_ANSWERED(u)) return 7;            // leaves Google answers above the results
  if (depth === 2) return 4;                   // category hubs like /convert/length/
  if (depth === 1) return 5;                   // top-level generated pages
  return 6;                                    // everything else
}
const PRIORITY = ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3'];

urls.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

// Search Console, 2026-09-09: 1,240 pages indexed, 5,320 not, and 4,906 of
// those are "Discovered – currently not indexed" — found, queued, never
// fetched. Of the pages Googlebot did fetch, 75% were indexed, so the pages are
// fine; there are simply more of them than the crawler will get to.
//
// Google's own guidance for that state is to reduce the number of low-value
// URLs the site asks it to consider. 3,900 pages here are ones whose question
// Google answers above the results — unit conversions and hex colours, checked
// on the results pages themselves. They can rank and cannot be clicked: they
// carry about 2,900 impressions a month and have produced zero clicks.
//
// So they come out of the sitemap. **They are not deindexed and not deleted.**
// They stay live, stay internally linked, and stay in the index if they are
// already in it. What changes is only what this site asks Googlebot to spend
// its next 4,906 fetches on.
//
// Reversible by deleting this filter and rebuilding.
const inSitemap = (u) => !WIDGET_ANSWERED(u);
const trimmed = urls.filter(inSitemap);
{
  const dropped = urls.length - trimmed.length;
  // If this ever removes nothing, the predicate has stopped matching and the
  // comment above is describing something that no longer happens.
  if (dropped === 0) {
    console.error('\n✗ sitemap: the widget-answered filter removed no pages, so either the predicate broke or those pages are gone');
    process.exitCode = 1;
  }
  // And if it ever removes most of the site, something has gone wrong the other
  // way and the sitemap would stop declaring the pages that matter.
  if (dropped > urls.length / 2) {
    console.error(`\n✗ sitemap: the filter removed ${dropped} of ${urls.length} pages, which is more than half the site`);
    process.exitCode = 1;
  }
  console.log(`sitemap: ${trimmed.length.toLocaleString()} URLs declared, ${dropped.toLocaleString()} widget-answered pages left out (still live, still linked)`);
}

const chunks = [];
for (let i = 0; i < trimmed.length; i += CHUNK) chunks.push(trimmed.slice(i, i + CHUNK));

const prio = (u) => PRIORITY[rank(u)];
chunks.forEach((c, i) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${c.map((u) => `<url><loc>${SITE.origin}${u}</loc><lastmod>${lastmodOf(u)}</lastmod><priority>${prio(u)}</priority></url>`).join('\n')}
</urlset>`;
  if (chunks.length === 1) { fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml); return; }
  // The children live under /sitemaps/ because the original /sitemap-N.xml URLs
  // were submitted to Search Console on 1 September, hours before the split that
  // created them, and returned 404. Those records are stuck: their last-read
  // time is still blank, the status is still 无法抓取, and zero URLs have ever
  // been discovered through a sitemap — every page Google has found, it found by
  // following links. Search Console has no delete, and resubmitting the same URL
  // is accepted silently without triggering a fetch, so the only way to get a
  // clean record is a URL it has never failed on.
  fs.mkdirSync(path.join(dist, 'sitemaps'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'sitemaps', `pages-${i + 1}.xml`), xml);
  // The old paths keep serving the same content. Nothing references them now,
  // but if Google ever retries one of its failed records it will get a 200
  // instead of another 404.
  fs.writeFileSync(path.join(dist, `sitemap-${i + 1}.xml`), xml);
});
// The newest lastmod of the URLs a shard actually contains. Stamping every
// child with today's date told Google all seven shards changed every day,
// including the two that had not changed all week — which is the same as
// telling it nothing.
const newestIn = (chunk) => chunk.reduce((m, u) => {
  const d = lastmodOf(u);
  return d > m ? d : m;
}, chunk.length ? lastmodOf(chunk[0]) : now);

// A sitemap index whose children all carry the same date is either a site
// that genuinely changed everywhere at once or a bug. On a 13,000-page site
// with seven shards it is the bug, and it is invisible in the output.
const stampCheck = () => {
  if (chunks.length < 2) return;
  const dates = new Set(chunks.map(newestIn));
  if (dates.size === 1) {
    console.error(`\n✗ sitemap: all ${chunks.length} shards report the same lastmod (${[...dates][0]}), which is what stamping the build date looked like`);
    process.exitCode = 1;
  }
};
const CHILD = (i) => `${SITE.origin}/sitemaps/pages-${i + 1}.xml`;
stampCheck();
if (chunks.length > 1) {
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((c, i) => `<sitemap><loc>${CHILD(i)}</loc><lastmod>${newestIn(c)}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);
}

// Declare the index and every chunk. A crawler only needs the index, but
// listing the chunks as well gives each one an independent discovery path if
// the index is slow to be processed.
const sitemapLines = [`Sitemap: ${SITE.origin}/sitemap.xml`];
if (chunks.length > 1) {
  for (let i = 0; i < chunks.length; i++) sitemapLines.push(`Sitemap: ${CHILD(i)}`);
}
fs.writeFileSync(path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\n${sitemapLines.join('\n')}\n`);

copyDir(path.join(root, 'public'), dist);

if (collisions.length) {
  console.error('\n✗ URL written more than once — one generator is overwriting another:');
  for (const c of [...new Set(collisions)]) console.error('    ' + c);
  process.exitCode = 1;
}
console.log(`built ${urls.length} pages (${tools.length} tools, ${genPages.length} generated)`);
