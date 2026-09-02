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

## `site:` counts are approximate and lag

`site:toolman.top` reported 8 results one morning and about 448 that evening.
Both were real, but the listing itself only ever shows ten or so URLs regardless
of the count, and the count is an estimate. For whether one specific page is
indexed, use URL Inspection instead — it reads live index status and disagreed
with `site:` more than once here.

## Four child sitemaps show 无法抓取, and that is stale

`sitemap-1.xml` through `sitemap-4.xml` were submitted on 1 September before
they existed — the sitemap was split into chunks at 23:32 that night, after the
site first deployed. Google fetched them, got a 404, and recorded the failure.
Their **last-read time is blank**, not old, which is the tell: no read ever
completed, so this is not a fetch that failed recently.

Nothing is wrong now. All five return HTTP 200 with `Content-Type:
application/xml`, robots.txt lists them all, and the index at `sitemap.xml`
reads 成功 and lists all four children. Google reaches them through the index.
The current Search Console UI has no delete option for a submitted sitemap and
resubmitting an existing one is accepted silently without creating a new record,
so those four red lines will clear on Google's own retry schedule or not at all.
They block nothing.

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

The audits fail the build on missing or duplicate metadata, broken internal
links, pages unreachable from the home page, invalid structured data, missing
accessible names, dead top-level declarations, and pages that contradict
themselves.

They will not catch a sentence that is grammatical, unique, correctly sized and
still wrong. Six defects this session were found only by reading the output at
the edges of its ranges — the first and last value in a generated series is
where a template says something no person would write.
