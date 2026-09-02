import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, CATEGORIES } from './site.mjs';

// The stylesheet is inlined into every page rather than linked. It is small
// (~4 KB), it removes a render-blocking round trip, and — the reason it is not
// optional — aggressive blocklists that cover the whole .top TLD drop
// subresource requests, which would leave the site completely unstyled.
const CSS = (() => {
  const f = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'main.css');
  return fs.readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\n\s*/g, '')
    .trim();
})();

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Render a FAQ section and its structured data from one source.
 *
 * Google requires that every answer in FAQPage markup appear verbatim in the
 * visible page. Writing the prose twice — once for the HTML, once for the
 * JSON-LD — drifts immediately and silently costs the rich result, so both
 * come from the same array here.
 *
 * @param {{q: string, a: string}[]} faq  answers may contain inline HTML
 * @returns {{html: string, schema: object|null}}
 */
export function faq(list) {
  const items = (list || []).filter((x) => x && x.q && x.a);
  if (!items.length) return { html: '', schema: null };

  const html = `<h2>Frequently asked questions</h2><div class="faq">${items
    .map((x) => `<h3>${esc(x.q)}</h3><p>${x.a}</p>`)
    .join('')}</div>`;

  const text = (s) =>
    String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

  return {
    html,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((x) => ({
        '@type': 'Question',
        name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: text(x.a) },
      })),
    },
  };
}

const navHtml = () =>
  Object.values(CATEGORIES)
    .map((c) => `<a href="/${c.slug}/">${esc(c.name.replace(' Tools', '').replace('Converters', 'Convert'))}</a>`)
    .join('');

/**
 * Render a full HTML page.
 * @param {object} o
 * @param {string} o.title      - <title> and og:title
 * @param {string} o.desc       - meta description
 * @param {string} o.path       - canonical path, e.g. "/json-formatter/"
 * @param {string} o.body       - main content HTML
 * @param {string} [o.head]     - extra head HTML
 * @param {string} [o.script]   - inline JS appended before </body>
 * @param {object[]} [o.crumbs] - [{name, path}]
 * @param {object[]} [o.jsonld] - extra JSON-LD objects
 * @param {string} [o.h1]
 */
const SUFFIX = ` | ${SITE.name}`;

// Google truncates around 60 characters. When a title is over budget, drop the
// brand suffix rather than the descriptive part — Google appends the site name
// itself anyway.
function fitTitle(t) {
  if (t.length > 60 && t.endsWith(SUFFIX)) {
    const trimmed = t.slice(0, -SUFFIX.length);
    if (trimmed.length >= 20) t = trimmed;
  }
  // A trailing parenthetical is normally the abbreviation, which repeats what
  // the spelled-out name already said. It is the first thing worth losing when
  // the title would otherwise be truncated by the search result.
  if (t.length > 65) {
    const shorter = t.replace(/\s*\([^()]*\)\s*$/, '');
    if (shorter.length >= 20) t = shorter;
  }
  // Then the explanatory tail after the dash, which is boilerplate.
  if (t.length > 65) {
    const shorter = t.replace(/\s+[—-]\s+.*$/, '');
    if (shorter.length >= 25) t = shorter;
  }
  return t;
}

// Google shows roughly 155 characters of a description. Anything past that is
// truncated mid-sentence, so trim at a sentence boundary instead.
function fitDesc(d) {
  if (!d || d.length <= 160) return d;
  const cut = d.slice(0, 158);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return stop > 90 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

export function page(o) {
  const url = SITE.origin + o.path;
  const crumbs = o.crumbs || [];
  o = { ...o, title: fitTitle(o.title), desc: fitDesc(o.desc) };

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.origin + '/',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: SITE.origin + '/search/?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ];
  if (crumbs.length) {
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Home', path: '/' }, ...crumbs].map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: SITE.origin + c.path,
      })),
    });
  }
  for (const x of o.jsonld || []) ld.push(x);

  const crumbHtml = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${crumbs
        .map((c, i) =>
          i === crumbs.length - 1
            ? `<span aria-current="page">${esc(c.name)}</span>`
            : `<a href="${c.path}">${esc(c.name)}</a>`
        )
        .join('')}</nav>`
    : '';

  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${SITE.origin}/og.jpg">
<meta name="robots" content="${o.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1'}">
<meta name="theme-color" content="#0b0d10" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
<style>${CSS}</style>
<script>try{var t=localStorage.getItem('tm-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>
${o.head || ''}
</head>
<body>
<header class="site">
  <div class="wrap bar">
    <a class="brand" href="/"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.7 6.3a4 4 0 0 1-5.3 5.3l-5.6 5.6a2 2 0 1 0 2.8 2.8l5.6-5.6a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.1-2.1z"/></svg><span>${SITE.name}</span></a>
    <nav class="mainnav">${navHtml()}</nav>
    <button class="theme" type="button" aria-label="Toggle theme" data-theme-toggle>◐</button>
  </div>
</header>
<main class="wrap">
${crumbHtml}
${o.h1 ? `<h1>${esc(o.h1)}</h1>` : ''}
${o.body}
</main>
<footer class="site">
  <div class="wrap">
    <p><strong>${SITE.name}</strong> — ${SITE.tagline}. Everything runs locally in your browser; your data never leaves your device.</p>
    <p class="links"><a href="/">Home</a><a href="/tools/">All tools</a><a href="/search/">Search</a><a href="/convert/">Converters</a><a href="/color/">Colors</a><a href="/about/">About</a><a href="/privacy/">Privacy</a></p>
  </div>
</footer>
<script>(function(){var k='tm-theme';document.addEventListener('click',function(e){var b=e.target.closest('[data-theme-toggle]');if(!b)return;var d=document.documentElement,n=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem(k,n)}catch(_){}});})();</script>
${o.script ? `<script>${o.script}</script>` : ''}
</body>
</html>`;
}
