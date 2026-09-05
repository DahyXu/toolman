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

## A dashboard number is not checked until you open the report that defines it

The goal was stated in GSC impressions. I reported 1,760 of them for days. The
GSC performance report said 13. The number I had been quoting came from
`site:toolman.top` result counts — an estimate Google explicitly disclaims,
measuring a different thing, never the metric anyone had agreed on.

This is the same failure as `audit.mjs` ending in `process.exit(0)`: a figure
repeated often enough that it stopped being questioned, while the authoritative
source sat one click away and unopened.

The rule that would have caught it: **before reporting progress against a goal,
open the specific report the goal is defined in, and read the number off it.**
Not a proxy, not an estimate, not last week's screenshot. If the goal says GSC
clicks, the evidence is the GSC performance report, on screen, this session.

A corollary for `site:` in particular: it is fine for asking *whether* a section
is indexed at all, and useless as a count.

## Nothing on a page helps a URL that has not been fetched

The sitemap report showed 6,884 URLs submitted, every child map "success", and
"discovered: 0" on every row — Google had read the maps and crawled nothing from
them. Work on titles, prose and duplicate scores is invisible until that column
moves. Check crawl state before spending a session on on-page work.

## A backslash written in a Python string is not a backslash in the file

Third occurrence this project, and the rule against it was already written
above. `"\b"` in a Python string is a backspace byte, not the two characters a
JavaScript regex needs. The pattern reached the file as

    /^(That|This|These|Those|It|They|Them)<0x08>/

which requires a control character after "Them" and therefore matches nothing,
ever. The check reported a clean site across 30,439 answers.

It was caught only by planting an error the check should have found and
watching it not fire — the same discipline that caught the bakeware version.
`cat -A` names the byte once you suspect it.

The rule, restated because writing it once has not been enough: **anything
containing a backslash goes through the Edit tool or a Python raw string, never
a heredoc and never an ordinary Python string.** The heredoc eats `\/` and `\s`
in JavaScript the same way; that cost two more rounds in the same session.

## Measure the defect, not something adjacent to it

Two versions of the standalone-answer check measured the wrong thing before the
third measured the right one:

  1. "answer shares no significant word with its question" — flagged 7,291,
     mostly complete answers that simply did not repeat the question's nouns.
  2. "first sentence shares no word" — flagged 14,179, worse, because a direct
     opening is *good* FAQ writing. "Yes." and "About 240 g." both fail it.
  3. "opens with a bare pronoun" — flagged 1,195, every one a real defect.

A check that fires on half the site is not strict, it is miscalibrated, and
shipping it would have meant either ignoring it or rewriting good prose to
satisfy it. The test for a new check is not whether it finds a lot. It is
whether every hit, read individually, is something you would want to fix.

## A discarded number is still in reach an hour later

I wrote down that the 1,760-impression figure came from `site:` estimates and
was not what the goal was measured in. Within the hour I wrote a commit message
asserting that "the A2 family is the site's largest source of impressions — 78
across five phrasings", which comes from the same discarded reading. The
verified Search Console query list is five rows and none of them is about paper.

Knowing a source is bad does not remove the numbers it produced from memory,
and they surface as ordinary recollection rather than as something to check.
The habit that catches it: **before writing a figure into a commit, a note or a
message, name where it came from.** If the answer is "I remember it", it is a
recollection and needs the report opened again.

## Test the instrument before trusting what it says about the subject

I wrote up an exact-phrase Google search as a definitive indexing test — "a
phrase on one page either returns that page or returns nothing" — and used it
to conclude that `/paper/a2/` was not indexed and that only hub pages were.

Both wrong, for two different reasons:

  - The phrase I searched was from a data field the page does not render. The
    test was fine; I fed it a sentence that exists nowhere.
  - A second phrase that *is* on the page also returned nothing, while Search
    Console's URL Inspection reported the page indexed. So the test has false
    negatives even when used correctly.

The instrument was never calibrated. A working version would have been checked
against a page known to be indexed — `/cooking/`, which I already had evidence
for — before being pointed at an unknown one. That takes one search.

**Before a new measurement is allowed to overturn a belief, run it on a case
whose answer is already known.** This is the same discipline as planting an
error to see a check fail, applied to reading rather than to building, and I
skipped it because the test felt obviously correct.

## Planting test content in dist tells Google the page changed

To verify a check fires, I write the error into a built page and re-run the
check. That works, and it has a side effect I did not think about: `lastmod` in
the sitemap is a hash of each page's body, so a build that runs while the
planted text is present stamps that page as modified — and the build that
restores it stamps it modified again.

`/about/` now carries a lastmod of today with content identical to yesterday's.
One page out of 8,803 is noise, but `lastmod` is the signal Google uses to
decide what is worth recrawling, and a habit that corrupts it would spend the
site's crawl budget on pages that did not change.

**Plant the error in the generator and rebuild, or plant it in a copy outside
`dist/`.** Both prove the same thing without writing a false timestamp into the
sitemap. Where planting into `dist/` is genuinely easier — checking a check that
reads built HTML — rebuild afterwards and accept that one stamp is wrong, rather
than doing it to a page that matters.

## `${#var}` in bash counts bytes, not characters

Checking the new paper titles, `${#t}` reported Letter at 66 characters — over
the 65 the length guard enforces — and I was one step from investigating a guard
that was working correctly. The title is 61 characters. It contains three `×`
and one `—`, which are two and three bytes in UTF-8, and bash was counting
those.

Any title on this site carrying `×`, `—`, `²` or a fraction glyph measures
several bytes longer than it is. `node -e` and `scripts/title-audit.mjs` both
use JavaScript's `.length`, which counts characters, and they were right the
whole time.

The rule: **measure text length with the same runtime that enforces the limit.**
A second opinion from a different tool is only useful when both tools are
counting the same thing.

## The query list and the page list say different things

Search Console's two breakdowns answer different questions, and the intersection
answers a third that neither does alone.

By query, `password generator 8 characters` at position 68 looked like the
biggest gap. By page, paper item pages turned out to carry three times as many
impressions. And filtering to one page and reading its own queries showed the
thing worth acting on: `/paper/a4/` sits at position 80 across 43 queries, and
**seven of its top ten are about pixels** — a question that has its own page,
`/paper/a4/pixels/`, which the impressions were not reaching.

The same shape appeared in cooking: `/cooking/butter/` at position 76, catching
`1 cup butter in grams` and `1 1/4 cups butter in grams`, both of which have
their own pages.

A mid-level page ranking badly across many queries is not one problem. It is a
page standing in for children that are not indexed yet — and while it stands in,
its title should answer what is arriving rather than describe the section.
"Butter — Cups to Grams Conversion" used 33 of 65 characters and contained
neither the phrase people type nor the answer they want.

**Read one page's own query list before deciding what is wrong with it.** The
site-wide query table cannot tell you that a page is answering the wrong
question, because it does not know which page answered.

## One inbound link is not zero, and the orphan check does not care

Search Console said "未检测到引荐来源网页" for /paper/a4/pixels/ and the site
agreed: exactly one page linked to it. The orphan check in the audit passed the
whole time, because one is not zero, and the sitemap listed it, and nothing
looked wrong. Its status was "discovered, never crawled".

Counting inbound internal links found 1,033 pages in that state, and two causes
that both look like working code:

  **A fixed slice.** `list.filter(...).slice(0, 18)` hands every page the same
  eighteen siblings, so everything past position eighteen is reachable only from
  the section hub. `ring()` in layout.mjs takes the n entries *after* this one,
  wrapping, which gives every entry exactly n inbound links.

  **A list scoped by an attribute.** `others.filter(x => x.t === r.t)` starves
  the singletons of that attribute: 6x6 is the only 6-inch nominal board and 9V
  the only rectangular cell, so neither appeared in anybody's list. The fix is a
  ring over the whole set alongside the scoped one, not a fallback on the
  singleton's own page — that lets it link out, which was never the problem.

Both are invisible in review. The lists render, the links work, and the page
that is missing from them is somewhere else.

## A comparison section floors at about 90% overlap, and that is not a defect

Every pair of comparison pages that shares one side carries that item's name,
dimensions, area and the same verdict vocabulary twice. Paper sits at 89%, bed
at 90%, AWG at 87% and bakeware at 92% — the smallest set with the most
templated verdicts.

I spent five attempts pushing bakeware under the 90% line: rotating the related
list, adding a sentence about what sits between the two tins, and cutting pairs
with several standard sizes between them. The first two moved nothing, which is
the same result as every previous time content was added to siblings. The third
removed ten genuinely redundant pages and left the number where it was, because
the next-worst pair simply took over.

The cut was worth keeping on its own merits — 23-vs-30 with a 25 and a 28
between them is a page nobody needs. Chasing the number past that point was
not, and the threshold does not mean in a comparison section what it means in a
section of independent pages.

**Where a metric is structurally floored, say so and stop.** Continuing to cut
real pages to satisfy it is how a heuristic starts making the decisions.

## A check evaluated at the point where both answers agree

The pixel conversions needed a table of other resolutions, and the assertion I
wrote for it was:

    if (Math.abs(atDpi(96) - out) > 1e-9) { … }

`atDpi(96)` is `out × (96/96)` whichever way round the scaling is written, so
the check returns the same number for the correct formula and for its inverse.
Planting the inversion changed every row of the published table and the build
stayed green.

It is a subtler version of the never-fails check than the ones before it: the
code is reached, the comparison runs, the arithmetic is real. It is evaluated at
the one input where the two candidate implementations cannot disagree.

**Check a case where a wrong implementation would give a different answer.** The
fix here was direction — more dots per inch means a pixel covers less of one —
which is false under the inverse and true under the correct form at every
resolution except 96.

## Reading one page caught what four assertions did not

The named-colour pages passed every check I wrote for them — valid hex, contrast
inside 1:1 to 21:1, no slug collisions — and reading one end to end found two
things none of them could see.

The page said the CSS colour list "has not changed since CSS 2.1, and it will
not". The index page of the same section says `rebeccapurple` was added in 2014.
Two pages of one generator contradicting each other, and both statements were
prose I wrote in the same hour.

It also had no British spellings. `grey`, `darkgrey` and `lightgrey` are real
CSS keywords and real search terms, and 141 pages of American spellings answer
none of them. That is not a defect a checker finds, because nothing is wrong
with what is there — something is missing, and absence has no signature.

Both are now tied to the data: the build fails if `rebeccapurple` leaves the
list while the sentence about it stays, and if an alias names a colour that is
not there.

**Assertions check that what is written is true. Reading checks whether it is
the right thing to have written.** They do not substitute for each other.
