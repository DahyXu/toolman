# How to read the numbers

Written down because two of these cost me an hour each to work out, and both
look like something is wrong when nothing is.

## Search Console impressions: use the 24-hour view

The Performance report opens on **3 months**, and that view's data window lags
two to three days behind. On 2 September it ended at 31 August — the day before
this site launched — so it read **2 impressions** while the site was actually
earning them.

Click **24 小时 / 24 hours**. That view is near real time. On the same day it
read **14 impressions** with the seven queries behind them.

So: the headline number on the default view is not wrong, it is just describing
a period before the site existed. Until roughly 4 September the 3-month view
cannot show launch traffic at all.

## The index coverage report is staler than the performance report

On 3 September, 网页索引编制 reported the whole property as **4 URLs — 1 indexed,
3 not** — with its chart ending 21 August. The one indexed URL was
`https://www.toolman.top/`, which is a different service on the www subdomain,
not this site. That is the state of the domain *before this site existed*.

Meanwhile the 24-hour performance view showed 82 impressions across 36 queries
touching ten different tool families, which is impossible for a property with
one indexed page. So the index report is not describing anything current and
cannot be used to judge coverage.

Use instead, in descending order of trust:

1. **URL Inspection** on a specific page — live, and the only authoritative
   answer for one URL.
2. **The 24-hour performance view**, read by *query family*. Thirty-six queries
   spread across colours, temperature, time zones, roman numerals, password
   length and ports means pages in all six families are indexed and serving.
3. `site:` — an estimate, and it lags.

The pattern across all three GSC reports is the same and worth stating once:
**every aggregate view in Search Console lags, and each one lags by a different
amount.** Only URL Inspection and the 24-hour view describe the present.

## `site:` counts are approximate and lag

`site:toolman.top` reported 8 results one morning and about 448 that evening.
Both were real, but the listing itself only ever shows ten or so URLs regardless
of the count, and the count is an estimate. For whether one specific page is
indexed, use URL Inspection instead — it reads live index status and disagreed
with `site:` more than once here.

## The child sitemaps had never been read at all — fixed 3 September

`sitemap-1.xml` … `sitemap-4.xml` were submitted on 1 September before they
existed and returned 404. The tell was not the red status but the two columns
next to it: **上次读取时间 blank** (no read ever completed, so this is not a
recent failure) and **已发现的网页 0 on every row, index included**. Nothing had
ever reached Google through a sitemap.

Search Console has no delete for a submitted sitemap — the row's ⋮ menu holds
only two greyed-out "view indexing" links — and resubmitting the same URL is
accepted silently without a fetch. The fix is a URL it has never failed on. The
children now live at `/sitemaps/pages-N.xml`; all four were read within seconds
and reported 2,000 / 2,000 / 2,000 / 884 pages discovered. The old paths still
serve the same bytes so a retry gets a 200.

The four original red rows cannot be removed and will stay in the list forever.
They now point at files nothing references.

**Never submit a sitemap to Search Console before it is deployed.** The 404 is
recorded against that URL and there is no way to clear it.

## Reddit

The account is a day old. Gates found by hitting them:

| subreddit | gate |
|---|---|
| r/ccna | account age — blocks plain comments too, not just links |
| r/sysadmin | 24 hours, stated in its submit text |
| r/webdev | self-promotion prohibited |
| r/SEO | AutoModerator removes low-CQS accounts |
| r/homelab | none — a comment posted and stayed up |

CQS is built from comments that earn upvotes. Casting votes does nothing for it,
and doing that systematically is vote manipulation.

Timing matters more than volume: the r/homelab comment was useful and sat at
score 1 because the thread was already twelve hours old when it went up. Aim for
threads under about three hours.

## Running the checks

```bash
npm run check       # build, then every audit
npm run audit       # audits only, against the current dist/
npm run audit:full  # adds content depth and duplicate-content analysis
```

The audits exit non-zero on missing or duplicate metadata, broken internal
links, pages unreachable from the home page, invalid structured data, missing
accessible names, dead top-level declarations, and pages that contradict
themselves. `depth` and `similarity` are advisory and always exit 0 — read
their output, do not gate on it.

This paragraph described behaviour the code did not have until 3 September:
`audit.mjs` ended in an unconditional `process.exit(0)`, so `npm run check`
passed with 152 unreachable pages printed on screen. **An exit code is only
evidence once you have seen it fail.**

They will not catch a sentence that is grammatical, unique, correctly sized and
still wrong. Six defects this session were found only by reading the output at
the edges of its ranges — the first and last value in a generated series is
where a template says something no person would write.
