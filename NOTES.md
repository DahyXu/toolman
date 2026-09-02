## 2026-09-02 — duplicate-content risk, 404 indexability, title truncation

`scripts/similarity.mjs` found the weakest pages on the site: two 352-word
sibling conversion pages that differed by only 27 words, nearly all of them
numbers and unit names. Added a sentence tied to the physical quantity rather
than the unit it is expressed in, so pages in a clone group say something
different rather than the same thing with a different unit name. Largest clone
group went 34 → 32 pages; distinct skeletons 3,839 → 4,045.

Two of my first reference points were simply wrong — 180 lb read as "roughly a
grand piano" (a grand piano is 300–500 kg) and 10 kg as the airline checked
limit (it is 23 kg). Rewrote both scales with more bands and checked eight
values by hand before shipping.

**The 404 page was serving `index,follow`.** Cloudflare Pages returns it for
every unmatched URL, so Google was free to index an unbounded set of URLs that
all render the same page. `layout.mjs` now takes a `noindex` flag and the 404
sets it; verified live at an arbitrary bad URL. `scripts/audit.mjs` now skips
noindex pages when checking title and description length, since those cannot
appear in a search result.

12 titles exceeded 65 characters and were being truncated in results.
`fitTitle()` now drops a trailing parenthetical (the abbreviation, which
repeats the spelled-out name) and then the boilerplate tail after the dash.
All 6,478 titles are now within range; audit reports zero problems in every
category.

Deployed and pushed 6,478 URLs to IndexNow (HTTP 200).

# Operating notes

Running log of what has actually been observed, so decisions are not re-argued
from memory. Newest first.

## 2026-09-02 (backlink)

Repo made public: **github.com/DahyXu/toolman**, homepage field set to the
site, README opens with six links into it. Verified clean before publishing —
the only hits from a credential scan were the substring `sk-` inside time zone
URLs like `/convert/msk-to-utc/`, and `.env` is untracked.

**Caveat, verified not assumed:** every outbound link on a GitHub repo page
carries `rel="nofollow"`, including the homepage field. So this is a
*discovery* channel, not a source of link equity — Google has treated nofollow
as a hint rather than a directive since 2019 and will still follow it, and
GitHub is crawled constantly, but it does not pass authority.

Attempted the community route first. Hacker News, Reddit and V2EX are all
logged out in this browser, and creating accounts is off-limits, so posting
there is blocked at the first step regardless of intent.

## 2026-09-02 (sitemap resolved)

`sitemap.xml` now reads **Success**, type "Sitemap index", last read 2026-09-02.
It sat on "Couldn't fetch" for roughly 24 hours after submission while Google
worked through the queue for a new property — exactly as the evidence
suggested, and nothing on the site needed changing. The four chunks still show
the older 9/1 status; Google follows the index to reach them.

Worth keeping in mind next time: for a new property, "Couldn't fetch" on a
freshly submitted sitemap is not diagnostic. Verify the file directly
(Googlebot UA fetch, protocol validation, live URL test) and then wait.

## 2026-09-02 (later)

Walked the hub pages through URL inspection. Real state:

| URL | Status |
|---|---|
| `/` | **Indexed** |
| `/dev/` | **Indexed** — also appears in `site:toolman.top` |
| `/tools/` | **Indexed** — breadcrumb structured data detected |
| `/color/` | **Indexed** |
| `/convert/` | Crawled, not yet indexed — 9/1 23:15 |
| `/http/` | Crawled, not yet indexed — 9/1 23:19 |
| `/cron/` | Crawled, not yet indexed — 9/1 23:19 |

Four indexed, three crawled and queued, within roughly 24 hours of launch.

`/cron/` reports **referring page: https://toolman.top/** — Googlebot reached
it by following an internal link from the home page, not through the sitemap.
The link structure is doing its job independently of the sitemap status.

Request-indexing quota is still exhausted; it is a rolling 24-hour window from
when each request was made, not a calendar-day reset.

Fixed in this session: category hubs were the thinnest pages on the site
despite being the crawler's entry point (`/ai/` 68 words, `/text/` 122,
`/image/` 185, `/dev/` 271 → 339–559). Writing that surfaced a genuine bug:
`/convert/` was generated twice — once as the category page, once as the unit
hub — and the second silently overwrote the first, which is why it had 186
words. `write()` now fails the build on any repeated URL.

`lastmod` is now derived from a content hash rather than the build date, so a
deploy no longer tells Google that all 6,478 pages changed.

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
