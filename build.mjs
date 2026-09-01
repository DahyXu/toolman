import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE, CATEGORIES } from './src/site.mjs';
import { page, esc } from './src/layout.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const written = [];
function write(urlPath, html) {
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

// ---------- category pages ----------
for (const c of Object.values(CATEGORIES)) {
  const list = tools.filter((t) => t.cat === c.slug);
  if (!list.length) continue;
  write(`/${c.slug}/`, page({
    title: `${c.name} — Free Online ${c.name} | ${SITE.name}`,
    desc: `${c.desc} ${list.length} free tools that run in your browser — no upload, no sign-up.`,
    path: `/${c.slug}/`,
    h1: c.name,
    crumbs: [{ name: c.name, path: `/${c.slug}/` }],
    body: `<p class="muted">${esc(c.desc)} All tools run locally in your browser.</p>
<ul class="cards">${list
      .map((t) => `<li><a href="/${t.slug}/"><b>${esc(t.title)}</b><span>${esc(t.short || t.desc)}</span></a></li>`)
      .join('')}</ul>`,
  }));
}

// ---------- generated (programmatic SEO) pages ----------
const genDir = path.join(root, 'src/gen');
let genPages = [];
if (fs.existsSync(genDir)) {
  for (const f of fs.readdirSync(genDir).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(path.join(genDir, f)).href);
    const out = await mod.default();
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
<h2>Reference libraries</h2>
<ul class="cards">
<li><a href="/convert/"><b>Unit converter</b><span>1,000+ conversions across length, weight, temperature, volume, data, speed and more.</span></a></li>
<li><a href="/color/"><b>Color codes</b><span>600+ HEX colors with RGB, HSL, CMYK, contrast ratios and matching palettes.</span></a></li>
<li><a href="/convert/css-units/"><b>CSS units</b><span>px, rem, em, pt and more — with an adjustable root font size.</span></a></li>
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
  h1: 'Page not found',
  body: `<p>That page does not exist. Try the <a href="/tools/">full tool list</a> or go back <a href="/">home</a>.</p>`,
}));

// ---------- sitemap + robots ----------
const now = new Date().toISOString().slice(0, 10);
const urls = [...new Set(written)];
const CHUNK = 40000;
const chunks = [];
for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));

const prio = (u) => (u === '/' ? '1.0' : u.split('/').filter(Boolean).length === 1 ? '0.8' : '0.6');
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

fs.writeFileSync(path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

copyDir(path.join(root, 'public'), dist);

console.log(`built ${urls.length} pages (${tools.length} tools, ${genPages.length} generated)`);
