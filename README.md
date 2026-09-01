# Toolman — toolman.top

A static site of fast, privacy-first web tools. Every tool runs entirely in the
visitor's browser: there is no backend, nothing is uploaded, and the whole site
is plain HTML with inline JavaScript served from Cloudflare's edge.

## What's in it

| | |
|---|---|
| Interactive tools | 24 |
| Generated reference pages | 2,552 |
| Total pages | 2,585 |
| Runtime dependencies | none |
| Build dependencies | none (plain Node) |

**Tools** — JSON formatter, JSON↔CSV, Base64, URL encoder, hash generator,
JWT decoder, UUID generator, password generator, cron expression generator,
regex tester, timestamp converter, number base converter, AI token counter,
QR code generator, favicon generator, image compressor, color converter,
text diff checker, word counter, case converter, markdown converter,
lorem ipsum generator, percentage calculator, age calculator.

**Generated matrices** — these carry the long-tail search traffic:

| Matrix | Pages | Example |
|---|---|---|
| Unit conversions (12 categories) | 864 | `/convert/meters-to-feet/` |
| Time zone conversions | 848 | `/convert/pst-to-est/` |
| Color reference | 682 | `/color/ff0000/` |
| CSS unit conversions | 72 | `/convert/px-to-rem/` |
| Temperature | 12 | `/convert/celsius-to-fahrenheit/` |

Every generated page carries a working converter, the exact formula, a full
conversion table, unit definitions and a FAQ with `FAQPage` structured data —
not a thin template.

## Layout

```
build.mjs            static site generator (no framework, no deps)
src/site.mjs         global config
src/layout.mjs       HTML shell, SEO meta, JSON-LD
src/tools/*.mjs      one file per tool: metadata + body HTML + inline JS + copy
src/gen/*.mjs        programmatic page generators
src/data/units.mjs   unit conversion data
public/              static assets copied verbatim into dist/
scripts/cf.mjs       Cloudflare API helper (project, domains, DNS)
scripts/indexnow.mjs push URLs to Bing/Yandex/Seznam
```

Adding a tool means dropping one file into `src/tools/`. The build picks it up,
generates the page, adds it to the category index, the tool list, the home page,
the search index and the sitemap.

## Commands

```bash
npm run build     # generate dist/
npm run dev       # build and serve on :4173
npm run deploy    # build and push to Cloudflare Pages
npm run setup     # create the Pages project, attach domains, write DNS
npm run cf whoami # verify credentials
```

Deployment and DNS need two environment variables:

```bash
export CLOUDFLARE_API_TOKEN=...   # Pages:Edit, DNS:Edit, Zone:Read
export CLOUDFLARE_ACCOUNT_ID=...
```

## SEO notes

- Canonical URL, Open Graph and Twitter card on every page.
- `WebSite` + `BreadcrumbList` JSON-LD everywhere; `SoftwareApplication` on
  tool pages; `FAQPage` wherever there is a FAQ.
- `sitemap.xml` regenerated on every build, split automatically above 40k URLs.
- Client-side search at `/search/` backed by `search-index.json`.
- IndexNow key committed at the site root; `scripts/indexnow.mjs` submits the
  whole sitemap to Bing, Yandex, Seznam and Naver after a deploy.
- Dense internal linking: every generated page links to 14+ siblings, its
  category hub and the master hub.

## Performance

Pages are 10–20 KB of HTML with one shared stylesheet and no external requests.
There is no JavaScript framework, no font loading, no analytics script and no
third-party embed, so Largest Contentful Paint is essentially first-byte time.
