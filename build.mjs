import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, CATEGORIES } from './src/site.mjs';
import { page, esc } from './src/layout.mjs';

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
    .map((t) => `<li><a href="/${t.slug}/"><b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
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
    body: `<p class="muted intro">${t.intro || t.desc}</p>
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
  const section = `<p class="muted">${esc(c.desc)} All tools run locally in your browser.</p>
<ul class="cards">${list
    .map((t) => `<li><a href="/${t.slug}/"><b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
    .join('')}</ul>${CATEGORY_BODY[c.slug] || ''}${CATEGORY_EXTRA[c.slug] || ''}`;

  if (c.slug === 'convert') {
    categorySection.convert = section;
    continue;
  }

  write(`/${c.slug}/`, page({
    title: `${c.name} — Free Online ${c.name} | ${SITE.name}`,
    desc: `${c.desc} ${list.length} free tools that run in your browser — no upload, no sign-up.`,
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
      .map((t) => `<li><a href="/${t.slug}/"><b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
      .join('')}</ul>`;
  })
  .join('');

write('/tools/', page({
  title: `All Free Online Tools (${tools.length}+) | ${SITE.name}`,
  desc: `Browse all ${tools.length} free online tools on ${SITE.name}. Developer utilities, converters, text and image tools — all running privately in your browser.`,
  path: '/tools/',
  h1: 'All tools',
  crumbs: [{ name: 'All tools', path: '/tools/' }],
  body: `<p class="muted">Every tool here runs entirely in your browser. Nothing is uploaded to a server.</p>${allToolsBody}`,
}));

// ---------- home ----------
const featured = tools.filter((t) => t.weight >= 8);
write('/', page({
  title: `${SITE.name} — ${tools.length}+ Free Online Tools That Run in Your Browser`,
  desc: SITE.description,
  path: '/',
  body: `<div class="hero">
<h1>Free online tools that respect your data</h1>
<p>${tools.length}+ developer, text, image and conversion tools. Everything runs locally in your browser — nothing is uploaded, nothing is stored, no sign-up needed.</p>
</div>
<h2>Popular tools</h2>
<ul class="cards">${featured
    .map((t) => `<li><a href="/${t.slug}/"><b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
    .join('')}</ul>
${allToolsBody}
<h2>Popular lookups</h2>
<p class="muted">The specific answers people search for most often.</p>
<ul class="linklist">
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
</ul>
<h2>Reference libraries</h2>
<ul class="cards">
<li><a href="/convert/"><b>Unit converter</b><span>1,000+ conversions across length, weight, temperature, volume, data, speed and more.</span></a></li>
<li><a href="/color/"><b>Color codes</b><span>600+ HEX colors with RGB, HSL, CMYK, contrast ratios and matching palettes.</span></a></li>
<li><a href="/convert/css-units/"><b>CSS units</b><span>px, rem, em, pt and more — with an adjustable root font size.</span></a></li>
<li><a href="/convert/time-zones/"><b>Time zones</b><span>848 conversions between EST, PST, UTC, CET, IST, JST and more.</span></a></li>
<li><a href="/image/"><b>Image converters</b><span>PNG, JPG, WebP, SVG, AVIF and HEIC-adjacent formats, converted locally.</span></a></li>
<li><a href="/http/"><b>HTTP status codes</b><span>Every code explained — what triggers it and how to actually fix it.</span></a></li>
<li><a href="/cron/"><b>Cron schedules</b><span>Ready-made expressions for every common schedule, with next run times.</span></a></li>
<li><a href="/port/"><b>Port numbers</b><span>What runs on each port, why it matters, and how to see what is listening.</span></a></li>
<li><a href="/file/"><b>File formats</b><span>What each extension is, what opens it, and what catches people out.</span></a></li>
<li><a href="/chmod/"><b>File permissions</b><span>What every chmod value grants, and which one is actually right.</span></a></li>
<li><a href="/cidr/"><b>CIDR prefixes</b><span>Every subnet size from /0 to /32 with masks and host counts.</span></a></li>
<li><a href="/cooking/"><b>Cooking conversions</b><span>Cups to grams per ingredient — a cup of flour and a cup of honey are not the same weight.</span></a></li>
<li><a href="/roman/"><b>Roman numerals</b><span>Every number broken down symbol by symbol, plus the rules that govern them.</span></a></li>
<li><a href="/paper/"><b>Paper sizes</b><span>A4, Letter, Legal and the rest — in mm, inches and pixels at any DPI.</span></a></li>
</ul>

<h2>Why ${SITE.name}?</h2>
<ul>
<li><strong>Private by design.</strong> Every tool is pure client-side JavaScript. Your text, code and images never leave your device.</li>
<li><strong>Fast.</strong> Static pages, no frameworks, no trackers. Most tools are usable in under a second.</li>
<li><strong>Free, forever.</strong> No accounts, no paywalls, no watermarks, no daily limits.</li>
</ul>`,
}));

// ---------- static content pages ----------
write('/about/', page({
  title: `About ${SITE.name}`,
  desc: `${SITE.name} is a free collection of privacy-first online tools that run entirely in your web browser.`,
  path: '/about/',
  h1: `About ${SITE.name}`,
  crumbs: [{ name: 'About', path: '/about/' }],
  body: `<p>${SITE.name} is a growing collection of small, focused web tools. Every one of them runs entirely in your browser using plain JavaScript.</p>
<h2>Principles</h2>
<ul>
<li><strong>Your data stays yours.</strong> No file is ever uploaded. There is no backend that could store it.</li>
<li><strong>No friction.</strong> No accounts, no email walls, no "upgrade to export".</li>
<li><strong>Small and fast.</strong> Pages are static HTML with inline JavaScript, served from Cloudflare's edge network.</li>
</ul>
<h2>Feedback</h2>
<p>Missing a tool or spotted a bug? Suggestions are welcome — this site is built in public and updated frequently.</p>`,
}));

write('/privacy/', page({
  title: `Privacy Policy | ${SITE.name}`,
  desc: `${SITE.name} processes everything client-side. We do not upload, collect or sell your data.`,
  path: '/privacy/',
  h1: 'Privacy policy',
  crumbs: [{ name: 'Privacy', path: '/privacy/' }],
  body: `<p><em>Last updated: ${new Date().toISOString().slice(0, 10)}</em></p>
<h2>Short version</h2>
<p>Everything you type, paste or open in a tool on this site is processed by JavaScript running inside your own browser. It is never sent to us, because there is no server-side processing at all.</p>
<h2>Files and text</h2>
<p>Images, documents and text you load into a tool stay in your browser's memory and are discarded when you close or reload the page.</p>
<h2>Local storage</h2>
<p>Some tools remember small preferences (such as light/dark theme) using your browser's local storage. This data stays on your device and can be cleared at any time through your browser settings.</p>
<h2>Analytics</h2>
<p>We may use privacy-friendly, cookie-less aggregate analytics to count page views. No personal information, fingerprinting or cross-site tracking is involved.</p>
<h2>Third parties</h2>
<p>The site is hosted on Cloudflare, which processes request metadata (such as IP address) for security and delivery purposes as described in Cloudflare's own privacy documentation.</p>
<h2>Contact</h2>
<p>Questions about this policy can be sent through the contact details listed on the <a href="/about/">about page</a>.</p>`,
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
  head: '<meta name="robots" content="noindex,follow">',
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
    const body = html.slice(html.indexOf('<body>'));
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
const HUBS = new Set(['/', '/tools/', '/convert/', '/color/', '/http/', '/cron/', '/port/',
  '/file/', '/cooking/', '/roman/', '/paper/', '/dev/', '/text/', '/image/', '/ai/',
  '/convert/time-zones/', '/convert/css-units/', '/convert/temperature/', '/about/', '/privacy/']);

function rank(u) {
  if (u === '/') return 0;                     // home
  if (toolSlugs.has(u)) return 1;              // interactive tools — the real product
  if (HUBS.has(u)) return 2;                   // section hubs
  const depth = u.split('/').filter(Boolean).length;
  if (depth === 2 && !/\d/.test(u)) return 3;  // category hubs like /convert/length/
  if (depth === 1) return 4;                   // top-level generated pages
  return 5;                                    // long-tail leaf pages
}
const PRIORITY = ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5'];

urls.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));

const prio = (u) => PRIORITY[rank(u)];
chunks.forEach((c, i) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${c.map((u) => `<url><loc>${SITE.origin}${u}</loc><lastmod>${now}</lastmod><priority>${prio(u)}</priority></url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(dist, chunks.length === 1 ? 'sitemap.xml' : `sitemap-${i + 1}.xml`), xml);
});
if (chunks.length > 1) {
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((_, i) => `<sitemap><loc>${SITE.origin}/sitemap-${i + 1}.xml</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);
}

// Declare the index and every chunk. A crawler only needs the index, but
// listing the chunks as well gives each one an independent discovery path if
// the index is slow to be processed.
const sitemapLines = [`Sitemap: ${SITE.origin}/sitemap.xml`];
if (chunks.length > 1) {
  for (let i = 0; i < chunks.length; i++) sitemapLines.push(`Sitemap: ${SITE.origin}/sitemap-${i + 1}.xml`);
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
