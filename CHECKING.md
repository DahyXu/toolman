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

## Shared prose on item pages makes duplicate content worse, not better

Three times in one session I wrote an explanatory paragraph into a generated
item page — the ARCH sheets, the oven settings, the lumber boards — and each
time it pushed the section over the 90% duplicate threshold. The instinct is
that a thin page needs more words. It does not: it needs more *different* words.

The metric is a Jaccard overlap, so text identical on two pages grows the
intersection and the union together and the ratio goes **up**. Adding 200 shared
words to a 400-word page makes two siblings more alike, not less.

| section | with shared prose | after |
|---|---|---|
| paper (ARCH) | 91% | 85% |
| oven | 96% | 79% |
| lumber | 92% | 83% |

The rule, written down because knowing it three times was not enough:

- **Explanation that is the same for every item goes on the hub**, with a link
  from each item page.
- **An item page carries only what is true of that item** — its numbers, and one
  paragraph about what it is actually for.
- When a section will not differentiate, **cut pages rather than pad them**. The
  oven section went from 40 pages to 28 because the twelve Fahrenheit ones were
  restating the Celsius ones, and that was the fix, not more prose.

The per-item paragraph in a data file has now worked five times — ports, paper,
time zones, lumber, and the resolution notes. It is the only technique here that
has never made things worse.

## Crawl stats: what Google is actually doing

Settings → 抓取统计信息 gives the numbers no other report does. On 3 September,
with the site three days old:

| | |
|---|---|
| Crawl requests, 90 days | 3,510 |
| Average response time | **194 ms** |
| Success (200) | 98% |
| robots.txt unavailable | 2% |
| Purpose | 54% discovery, 46% refresh |
| File type | 97% HTML |

Two things to read carefully here.

**The window is 90 days and the site is three days old.** So "3,510 requests" is
not three days of crawling — most of that window predates the site. Do not read
the total as a rate.

**"robots.txt 不可用 2%" and a host marked 过去有问题 look alarming and are
historical.** Googlebot stops crawling a site entirely when it cannot fetch
robots.txt, so this is worth checking rather than assuming — twenty consecutive
requests all returned 200, served from the Cloudflare edge with a cache hit. The
failures date from before the domain served this site, like the sitemap 404s.

194 ms and 98% success is a healthy profile. **Crawl rate here is not being
throttled by anything on the server side**, which closes the third
infrastructure hypothesis after click depth and page weight. What is left is
time and external signal.

## A check that has never failed is not a check

Every consistency check in this repo was written after a real error got through,
and every one of them passed on its first run. That proves nothing. Three of them
passed because they were broken:

- **bakeware name check** — a heredoc turned `` into a literal backspace
  (0x08), so the regex required a control character and matched nothing. Found
  with `cat -A`, which prints it as `^H`.
- **paper consistency check** — compared the first dimension in each paragraph
  against that sheet, so it flagged four correct comparisons and no errors.
- **contradiction self-test** — the planted string did not match because the
  real HTML had `<strong>` tags inside it.

So: **plant the exact error the check exists to catch, watch it fail, then
restore.** Two lines of work, and it is the difference between a gate and a
decoration. The ones that have earned their place this way found, between them,
a wrong resistivity constant, two mislabelled tins, a gas mark mapped by the
wrong column, and 152 unreachable pages.

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
