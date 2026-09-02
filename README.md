# Toolman

**[toolman.top](https://toolman.top)** — 6,674 pages of fast, privacy-first web
tools and reference material. Every tool runs entirely in the visitor's
browser: there is no backend, nothing is uploaded, and the whole site is plain
HTML with inline JavaScript served from Cloudflare's edge.

Try it: [JSON formatter](https://toolman.top/json-formatter/) ·
[QR code generator](https://toolman.top/qr-code-generator/) ·
[AI token counter](https://toolman.top/ai-token-counter/) ·
[cron expressions](https://toolman.top/cron-expression-generator/) ·
[regex tester](https://toolman.top/regex-tester/) ·
[all 28 tools](https://toolman.top/tools/)

## What's in it

| | |
|---|---|
| Interactive tools | 28 |
| Generated reference pages | 6,646 |
| Total pages | 6,674 |
| Runtime dependencies | none |
| Build dependencies | none (plain Node) |

**Tools** — JSON formatter, JSON↔CSV, Base64, URL encoder, hash generator,
JWT decoder, UUID generator, password generator, cron expression generator,
regex tester, timestamp converter, number base converter, AI token counter,
QR code generator, favicon generator, image compressor, color converter,
text diff checker, word counter, case converter, markdown converter,
lorem ipsum generator, percentage calculator, age calculator.

**Generated matrices** — these carry the long-tail search traffic:

| Section | Pages | Example |
|---|---|---|
| Unit and time-zone conversions | 4,199 | `/convert/meters-to-feet/` |
| Cooking measures, by ingredient | 990 | `/cooking/1-cups-all-purpose-flour-to-grams/` |
| Colour reference | 681 | `/color/ff0000/` |
| Roman numerals | 327 | `/roman/2026/` |
| ASCII codes | 128 | `/ascii/65/` |
| Cron schedules | 58 | `/cron/every-5-minutes/` |
| Port numbers | 48 | `/port/3306/` |
| HTTP status codes | 38 | `/http/404/` |
| Paper sizes | 38 | `/paper/a4/` |
| CIDR prefixes | 33 | `/cidr/24/` |
| File formats | 33 | `/file/webp/` |
| File permissions | 29 | `/chmod/755/` |

Every generated page carries the working numbers, the formula behind them, a
full table and a FAQ with `FAQPage` structured data. The arithmetic is computed
at build time and checked against an independent source rather than
transcribed — every CIDR mask against a separately written table, every chmod
value against its canonical symbolic form, every ASCII code's hex, octal and
binary.

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

## Reading the numbers

Search Console, `site:` counts and the sitemap report all have traps that look
like faults and are not. [CHECKING.md](CHECKING.md) records the ones this
project hit, with the tell for each.

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

## Notable implementation details

A few things in here were more interesting than expected.

**The QR encoder writes its own format-information bits.** An early version
produced codes that looked correct and that no decoder could read — the 15
format bits were being written LSB-first instead of MSB-first, and the second
copy skipped the dark module. Diffing the matrix against a reference library
localised it; correctness is now verified by decoding 335 generated codes
across versions 1–20 and all four error-correction levels.

**CSS is inlined into every page, deliberately.** Blocklists that cover the
whole `.top` TLD drop subresource requests, which left the site completely
unstyled for anyone running one. Inlining also removes a render-blocking round
trip — mobile Lighthouse performance is 100.

**`lastmod` comes from a content hash, not the build date.** Stamping every
page with the build date tells Google the whole site changed on every deploy,
which spends crawl budget re-fetching pages it already has.

**Five audit scripts run against the built output** (`scripts/`): indexing
blockers, JSON-LD validity, content depth, accessibility, and sitemap protocol
conformance. They have caught real problems — 2,291 FAQ answers whose
structured data did not match the visible page, 61 form controls with no
accessible name, and a URL that two generators were both writing, where one
silently overwrote the other.

## Licence

MIT.
