# Operating notes

Running log of what has actually been observed, so decisions are not re-argued
from memory. Newest first.

## 2026-09-02

**Googlebot is crawling the site.** URL inspection on `/convert/` reports:

```
Crawled – currently not indexed
Last crawl:  2026-09-01 23:15:19
User agent:  Googlebot smartphone
Crawl allowed: Yes
Page fetch:  Successful
```

`/` and `/dev/` are **indexed**. `/dev/` also appears in a `site:toolman.top`
query with the correct title and description.

This settles the "Couldn't fetch" sitemap question: the site serves Googlebot
correctly and Google is fetching it. What remains is Google's own indexing
queue for a two-day-old property, which nothing on our side controls.

**Ruled out as causes of the sitemap status**, each verified directly:

| Check | Result |
|---|---|
| Googlebot UA fetch of sitemap | 200, `application/xml`, TTFB 0.2 s |
| Sitemap protocol conformance | 5/5 pass (`scripts/sitemap-check.mjs`) |
| GSC live "Test live URL" | "URL can be indexed" |
| robots.txt | Allows all, declares index + 4 chunks |
| Real crawl | Confirmed above — successful |

**Request-indexing quota** is a rolling ~24 h window, not a calendar day. Ten
URLs were used on 9/1; a retry early on 9/2 was still refused.

**Quality work completed today** — all verified by scripts kept in `scripts/`:

| | Before | After |
|---|---|---|
| FAQ schema not matching page text | 2,291 | 0 |
| Pages under 200 words | 62 | 11 |
| Form controls with no accessible name | 61 | 0 |
| Skipped heading levels | 15 | 0 |

Lighthouse mobile on `/json-formatter/`: performance 100, best practices 100,
SEO 100, accessibility 95 → the 95 was the unnamed controls, now fixed.

## 2026-09-01

Site launched. 6,478 pages deployed to Cloudflare Pages, domain live on
`toolman.top`, GSC property verified, five sitemaps submitted, nine hub pages
sent to the indexing queue, all URLs pushed to IndexNow.

Two real bugs found and fixed during the build:

- **QR encoder wrote the format-information bits in reverse order.** The
  rendered code looked like a QR code but no decoder could read it. Caught by
  diffing the matrix against a reference library, then verified by decoding
  335 generated codes across versions 1–20 and all four EC levels.
- **Blocklists covering the whole `.top` TLD drop subresource requests**, which
  left the site completely unstyled for anyone running one. CSS is now inlined
  into every page, which also removes a render-blocking round trip.

Baseline impressions at launch: 1 over the trailing three months, and that one
belongs to the previous owner of the domain.
