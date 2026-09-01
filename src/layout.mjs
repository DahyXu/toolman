import { SITE, CATEGORIES } from './site.mjs';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
export function page(o) {
  const url = SITE.origin + o.path;
  const crumbs = o.crumbs || [];

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
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#0b0d10" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/s.css">
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
    <p class="links"><a href="/">Home</a><a href="/tools/">All tools</a><a href="/convert/">Converters</a><a href="/color/">Colors</a><a href="/about/">About</a><a href="/privacy/">Privacy</a></p>
  </div>
</footer>
<script>(function(){var k='tm-theme';document.addEventListener('click',function(e){var b=e.target.closest('[data-theme-toggle]');if(!b)return;var d=document.documentElement,n=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=n;try{localStorage.setItem(k,n)}catch(_){}});})();</script>
${o.script ? `<script>${o.script}</script>` : ''}
</body>
</html>`;
}
