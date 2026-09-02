## 2026-09-02 (later) — the real reason /convert/ is not indexed

I was wrong this morning to conclude there was no technical defect left. There
was, and it was the biggest one on the site.

Comparing hubs against what Google has actually indexed:

| section    | pages | hub outlinks | coverage | indexed |
|------------|-------|--------------|----------|---------|
| /color/    |   682 |          683 |     100% | yes     |
| /port/     |    49 |           49 |     100% | yes     |
| /file/     |    34 |           34 |     100% | yes     |
| /convert/  |  4200 |           49 |     1.2% | no      |
| /cooking/  |   991 |           34 |     3.4% | no      |

The indexed sections are exactly the ones whose hub links to every child.

A BFS of the link graph from the home page then gave the real number:
**2,192 pages (34% of the site) were unreachable by following links at all.**
`/convert/` had an average click depth of 5.8 and a maximum of 9.

Cause: `/convert/kilograms-to-pounds/` linked to **zero** of its 36 value
pages. The parent never linked to its children, so the 2,191 value pages formed
a closed island — they linked to each other through "Nearby values" and nothing
reachable from the home page linked in. 2,191 of them had inbound links from
*within the island*, which is why my own audit reported zero orphans.

Fix: `common-values.mjs` now exports `valueIndex` and `tempIndex` (temperature
slugs render negatives as `minus-`, so those need their own map), and
`units.mjs` renders a "Common values" block on each pair page. Result:

- unreachable 2,192 → **1** (`/404.html`, which is noindex and correct)
- `/convert/` average click depth 5.8 → **3.1**

`scripts/audit.mjs` now walks the graph from `/` rather than only asking
whether anything links to a page. The old check was structurally incapable of
seeing an island. This is the second time an audit script of mine has had a bug
that hid the thing it was written to find.

Also strengthened the `/convert/` hub from 515 to 844 words with an exact
conversion-factor table and a mental-arithmetic section. I checked every
numeric claim in it with a script before shipping and two were wrong: the
litres-to-gallons rule of thumb gave 9.5 against a true 10.57 (should be divide
by 4 then *add* 5%), and I claimed the double-and-add-30 Celsius rule was within
3° when it is within 4° over ordinary weather and out by 18° at 100°C.

Deployed; 6,478 URLs pushed to IndexNow.

## 2026-09-02 — actual indexing state, measured

Checked rather than assumed. `site:toolman.top` on Google returns **8 pages**:
`/`, `/color/`, `/color/228b22/`, `/dev/`, `/file/`, `/markdown-to-html/`,
`/port/`, `/tools/`. Two of those are deep pages, so depth is not the barrier.

**`/convert/` is "已抓取 - 尚未编入索引" (crawled, not yet indexed).** Fetch
succeeded, crawling allowed, no technical block — Google fetched it and chose
not to index. That gates 4,200 pages. Last crawl was 2026-09-01 23:15:19, which
is *before* the collision fix that took the hub from 186 to 549 words, so
Google's decision was made on the thin version.

**URL inspection reports "未检测到任何引荐站点地图" for `/convert/`.** Googlebot
found it through internal links from `/url-encode-decode/` and `/jwt-decoder/`,
not the sitemap. Consistent with the four child sitemaps still showing
无法抓取 / 0 discovered while the index itself reads 成功 (read 9/2).

Verified server-side: all five sitemaps return HTTP 200, `application/xml`,
TTFB under 0.4s to a Googlebot user agent; the index lists exactly the four
children; child 1 holds 2,000 URLs and child 4 holds 478. Nothing is wrong at
the origin. This is the same stale-bookkeeping pattern the index itself showed
before flipping to 成功 with no site change. Resubmitting the children is a
no-op in the UI.

Request-indexing quota still exhausted (rolling 24h, not a calendar reset).

Bing has indexed nothing despite IndexNow returning 200 — submission is not
indexing.

Performance report now runs through 8/30 and still shows 1 impression, which is
correct: the site launched 9/1 and that data has not entered the window yet.

**Conclusion: there is no remaining technical defect to fix.** Both engines have
the site and are treating it as a one-day-old zero-authority domain. The
bottleneck is authority, and the one lever that moves it — a real inbound link
from a community thread — needs an account I am not permitted to create.

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
