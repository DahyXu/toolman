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

A full reading pass over the pages written this week found eight faults and the
assertions had caught none of them:

    a FAQ answering a question the page did not ask
    `nc -zv` recommended for a UDP-only service
    eighteen escape sequences carrying a spare backslash
    two pages of one generator contradicting each other on CSS history
    no British spellings for any of the greys
    contrast described as asymmetric when the ratio is one number
    a Quartz expression called invalid when cron accepts and misreads it
    301 and 302 described as specifying what they in fact forbade

Four now have checks that fail. The other four could not have: a question that
does not match its answer, a missing spelling, a muddled explanation and a
wrong history are all things where nothing is malformed. Something is simply
not what it should be, and only a reader notices that.

## The escape trap, inside the tool written to fix the escape trap

The ASCII bell page rendered `printf "\a"`. Copied, that prints a backslash
and an "a" rather than ringing anything. Eighteen pages carried the same fault
across every escape a reader might take from them.

The script written to halve those backslashes used:

    new RegExp(fourBackslashes + '([abfnrtv0])', 'g')

Four backslashes in a *regex pattern* mean "match two literal backslashes". So
it matched two, replaced them with two, and reported nine successful
replacements — a no-op that counted itself as a fix, run twice before the
source was checked and found unchanged.

`split(from).join(to)` takes its argument as a literal string. There is no
pattern layer for a backslash to be consumed by, and the fix worked first time.

This is the fifth escape failure in this project and the second to survive its
own success message. The rule stands and now has a corollary: **when the thing
being fixed is escaping, use an API that has no escaping of its own.**

`scripts/escaped-backslash.mjs` is in the audit. Planting `\n` in a page fails
it.

## A backslash in a plain template literal is an escape, and the check went blind

The paper consistency check reads inch figures out of prose and compares them
with the table. Envelope sizes are written in eighths, so the number parser had
to learn vulgar fractions. The pattern was assembled like this:

    const NUM = `[\d.]+[${GLYPHS}]?|[${GLYPHS}]`;
    const DIMS = new RegExp(`(${NUM})\s*×\s*(${NUM})\s*(mm|inch)`, 'g');

That reads correctly and is wrong. Inside a template literal `\d` is just `d`
and `\s` is just `s`, so the pattern actually built was:

    ([d.]+[⅛¼⅜½⅝¾⅞]?|…)s*×s*(…)s*(mm|inch)

It matches nothing. The check had been failing on a real error one command
earlier; after this edit it printed a clean site. **It went from finding the
fault to finding nothing, with the data unchanged, and that was read as the
fault being fixed.**

`String.raw` is the form that keeps the backslash, and the file now uses it.

Two rules come out of this, both sharpening ones already here:

- **A check that starts passing without the data changing has not been fixed.
  It has stopped looking.** The passing run needs the same suspicion as a
  failing one whenever the check itself was touched.
- The escape trap now has a third layer. Regex patterns eat backslashes,
  heredocs eat backslashes, and template literals eat backslashes. In this
  session the shell heredoc silently turned `[\s\S]` into `[sS]` and `\\d` into
  `d` on two separate occasions, in scripts written to avoid exactly that. The
  only writes that survived unaltered were the ones that built the character
  from `String.fromCharCode(92)` and read the file back to confirm it.

## An empty heading is well-formed HTML

`seriesMaths()` returned `''` for any size outside the A, B, C and US series and
the page printed the heading regardless. Forty-four paper pages shipped with

    <h2>How JIS B5 relates to the rest of the series</h2>
    <h2>About JIS B5</h2>

Eleven of them were the JIS B pages added the day before, by me. Nothing caught
it across two full audits: the pages have titles, descriptions, an h1, inbound
links, valid JSON-LD and no accessibility faults. Every existing check passed
because **nothing is malformed — the section is simply not there.**

`scripts/empty-sections.mjs` is now in the audit. It compares a heading against
the text before the next heading *of the same or higher level*: the first
version stopped at the next heading of any level and reported 9,432 pages,
because an `<h2>` whose content is a run of `<h3>`s has nothing of its own in
between. That is the calibration failure this project keeps repeating — a first
draft that fires on the whole site is measuring the template, not the fault.

## An exemption list written from what a section ought to be called

Eight tool pages fill a section from JavaScript, so those headings are empty in
the static HTML on purpose. Writing them into an allowlist by name, from what
each section looked like it should be called, got **four of ten names wrong** —
"Breakdown" for "How it breaks down", "Results" for "Binary view". The check
rejected all four, which is the only reason they were noticed.

The exemption now needs two things: the name, and evidence — an element inside
the empty section whose id the page's own script writes to. The name records
that somebody decided this on purpose; the evidence means a tool section that
stops being filled loses its exemption without anyone having to remember.

## Reading the envelope pages, again

Every assertion passed and the pages still said four wrong things, all found by
reading them:

- "The largest standard sheet that goes in flat is **JIS B7**" — on a US
  invitation envelope. Arithmetically true, and useless to anyone holding one.
  The candidate pool now excludes standards nobody mails in that envelope.
- "Announcement envelopes are cut a quarter of an inch over their card, so the
  card is 4.13 × 5.5 inches." The real A2 card is 4¼ × 5½: an eighth over on
  width, a quarter over on height, and an A7 is a quarter over on both. There
  is no single margin, so a sentence computed from one had to go. **A rule
  invented to make a number computable is not a rule.**
- The No. 6¾ page called itself the small business envelope in one section and
  said it was "too small for a folded Letter sheet, which keeps it in the card
  and reply-slip range" three paragraphs later. The fold list was missing the
  quartered fold that actually fits.
- Two hand-written claims contradicted the geometry on their own page: a No. 14
  "takes a Letter folded once the short way" (that fold is 139.7 mm across and
  the envelope is 127), and a No. 9 is "a quarter inch shorter and an eighth
  narrower" than a No. 10 when it is a quarter narrower and five eighths
  shorter.

The last two were caught by printing the computed fit next to the hand-written
sentence for all thirteen envelopes at once. That is worth doing whenever prose
and data describe the same object: **put the two side by side and read the
column, rather than checking whether an assertion fires.**

## Appending with `\n` to a CRLF file splits the file in two

The envelope entries were appended to `paper-sizes-data.mjs` and
`paper-detail.mjs` with `'\n' + rows`. Both files are CRLF. Everything built and
every audit passed, because Node does not care. But the next script to process
the file line by line — splitting on `\r\n` — saw all eleven new entries glued
onto the end of the previous line, found two matches where it expected
thirteen, and did nothing. It reported zero replacements twice before the cause
was found.

The sibling failure is already recorded here: a `replace()` matching
`'];\n\nexport default SIZES;'` silently did nothing on the same file. Same
cause, opposite direction. **Detect the file's line ending, use it for what you
write, and normalise after appending.**

## A shell one-liner truncated a 33 KB generator to 49 bytes

Editing `time-difference.mjs` with `node -e "…"` from bash, mid-session, left
the file 49 bytes long. The build then failed with "Unexpected end of input",
which is at least loud; what made it recoverable was that the previous state was
committed.

This is the sixth escaping failure in this project and the first destructive
one. The pattern across all six is the same: **content containing backslashes,
template literals or multiple lines does not survive the trip through a shell
argument.** Twice a regex arrived as `/(d+)s*×s*(d+)/` and matched nothing while
the build passed. Once `[\s\S]` became `[sS]`. Once a check's pattern became
`[d.]+s*×s*` and reported a clean site it could not see.

The rule that has actually held: **write the edit to a file and run the file.**
No shell layer, no quoting, and the script can check its own work — every patch
script written after this now refuses to save if the file lost more than a tenth
of its size, because a 33 KB file becoming 49 bytes is not an edit.

That guard needs the right threshold. Written as "must not shrink at all" it
fired on a legitimate edit that replaced a long link footer with a shorter one.
A guard against catastrophe should not also be a guard against ordinary work.

## A day count of 365 cannot catch a rule that never fires

The time-difference pages walk the year to find which daylight-saving
combinations actually occur. The check on that walk was that the days add up to
365.

Planting a broken rule — `onDst` returning false always — **passed**. Every day
is still counted; they simply all land in one state. The count is 365 whether
the rule works or not, so the check was measuring the loop, not the thing the
loop was for.

The invariant that does catch it: a city with a summer-time rule spends between
120 and 245 days a year on it. Planting the same break now fails on every EU
city at once.

**A check on a total is usually a check on the iteration.** What is worth
asserting is a property of the values, not their number.

## Two entities with the same numbers produce the same page

This has now happened three times in this project and been fixed the same way
each time:

    GMT→JST vs GMT→KST                94%   Japan and Korea are both UTC+9
    anchorage-lisbon vs -london       95%   Lisbon and London are UTC+0, EU rule
    australia-spain vs -sweden        95%   Spain and Sweden are UTC+1, EU rule

Every computed thing — the offset, the table, the overlap window, the clock
dates — is identical, and only a name differs. No amount of restructuring the
computation helps, because the computation is genuinely the same.

The fix is a paragraph per entity that no formula produces: Portugal tried
Central European Time from 1992 to 1996 and gave up when children were walking
to school in the dark; Ireland's summer time is legally the standard and the
clocks go *back* to UTC in October. Each of the three fixes brought the worst
pair from the mid-nineties to the low eighties.

**When two pages share their arithmetic, the only thing left to differentiate
them is knowledge**, and a build check should fail if an entity has none —
without its note it is interchangeable with its twin, which is the condition
being removed.

## Generate what carries something, not what fills a grid

Three sections this week made the same decision and it is worth stating once:

- The resistor pages cover the E24 series, not all 10×10×9×6 band permutations,
  because the others are resistors nobody manufactures.
- The capacitor pages cover E12 significands, not all 100 two-digit codes.
- The country time pages exist only where one side spans more than one offset,
  because Japan to France is Tokyo to Paris with the country name substituted.

The first cut of the country pages generated all 1,332 and hit 97% overlap. The
restriction to 210 is not a compromise for the duplicate checker; it is the
recognition that the other 1,122 had nothing to say that another page did not
already say better.

**A grid is not a content plan.** The question for each cell is whether there is
something true of it specifically, and where the answer is no the cell should
not become a page.

## The most common value of a 50/50 split is a coin toss

Brisbane and Sydney share UTC+10 and are an hour apart from October to April, so
the gap is zero for 26 weeks and one hour for 26. Taking "the gap that holds for
the most days" as the headline produced

    Brisbane to Sydney Time Difference — no difference

which is true of half the year and useless. Where the largest span holds less
than about 60% of the time, the answer is the range and not the mode: *Same Time
or 1 hour*.

The related failure in the same code: selecting pairs on whether the standard
offsets differ threw away 28 pairs that genuinely differ for part of the year,
Brisbane and Sydney among them — one of the most-asked time questions in
Australia. **The filter has to test the thing the page is about**, which was
whether there is ever a difference, not whether the base offsets are unequal.

## A planted test proves a check fires, not that it sees everything

The sitemap ranking had a rule that could not tell `bst-to-brt` from
`mm-to-pt`, so 1,686 timezone pages were sorted last as pages Google answers
above the results. Fixing it needed a guard, and the guard read the built pages
back rather than trusting the URL pattern: a timezone page carries the
working-hours overlap table and a unit conversion does not.

Planting the old rule failed the build on 939 pages, which looked like proof.

It was not. The overlap table is on 939 of the 1,686 zone pages — the other 747
say "Standard 9-5 working hours do not overlap at all", because those two zones
have no overlap to tabulate. **The check could see 56% of what it was written
to see, and the planted test passed anyway, because 939 failures is far more
than enough to fail a build.**

A planted error confirms the check is wired up and reachable. It says nothing
about coverage, and the louder the failure the less it says: one deliberately
broken case proves one case.

Two things would have caught it:

- **Count what the check looked at, not just what it found.** The guard reported
  939 failures against a population it never stated. Had it said "939 of 1,770
  candidates examined" the gap would have been visible in the output.
- **Choose a marker that cannot vary with the answer.** The overlap table is
  prose that changes when the arithmetic changes. The breadcrumb to
  `/convert/time-zones/` is structural, present on all 1,686 and on no unit
  page, and does not move when the content does.

The same shape has now appeared twice in this file. The `atDpi(96)` assertion
could not fail because it was evaluated where both answers agree; this one
could fail, but only on the half of the population that happened to carry the
string. **Ask what a check cannot see, not only whether it can fail.**

## Adding a section to the menu is not linking to it

Eleven sections were built in a week. Every one was added to the site-wide
navigation in `layout.mjs`, and not one was linked from the home page's body.

That felt like linking them, and it is not the same thing. This repository's own
inbound-link audit excludes header, nav and footer — `scripts/inbound-links.mjs`
was written on the premise that chrome links do not count — and then eleven
sections were shipped relying on exactly those links.

It mattered more than it usually would. Crawl stats show 4,200 fetches against
13,033 pages, so what Googlebot reaches early from the home page is most of what
it reaches at all, and 3,232 pages added in two days were queued behind the
sections that shipped at launch.

`build.mjs` now fails when a section with its own hub and twenty or more pages
is missing from the home page body. It caught one on its first run: the card
written to fix the problem pointed at `/drill/` and the hub is `/drill-size/`.
## Two checks in the audit chain could not fail it

Four days of adding checks, and no check had ever been run against the fault it
exists to find except by hand, one at a time, at the moment it was written.
This project has already produced three that reported a clean site because they
could not look — a regex whose backslashes were eaten into `[d.]+s*×s*`, a
comparison evaluated where both the right and wrong formula agree, and a day
count that stayed at 365 whether or not the rule fired. Each was found by
accident.

`scripts/check-the-checks.mjs` plants, for every check, the specific fault it
claims to detect, runs it, and puts the file back. It found two things.

**`standalone-answers.mjs` and `title-audit.mjs` have no `process.exit` at
all.** They print rows marked ✗ and return 0. Both sit in the audit chain
looking like checks. The 774 FAQ answers opening "They do not overlap at all"
were found two days ago by reading the output — the build was green throughout,
and anything that brought them back would have passed just as quietly.
standalone-answers now exits 1 when it finds any. title-audit stays a report:
its "20+ characters unused" rows are advisory and three sections trip them
permanently, while the faults it looks like it would catch — missing titles,
duplicates — are in audit.mjs, which does fail.

### And a lesson about the harness itself

The first run reported four checks broken. Three of those were the plant, not
the check:

- the JSON-LD is minified, so a plant matching `"@type": "FAQPage"` with a space
  changed nothing;
- `standalone-answers` reads the FAQPage JSON-LD rather than the rendered
  `<div class="faq">`, so a planted div never reached it — and it only flags an
  answer that shares *no* vocabulary with its question, so "They are 210 × 297
  mm" is not the fault, it is the check working;
- `rederive` samples twenty resistor pages spread across the section rather than
  reading all 169, and the plant landed on one it never opens.

**An edit that changes the file is not an edit that creates the fault.** The
harness reports "PLANT FAILED" when the file comes back unchanged, which caught
the first of those, and could not distinguish the other two from a blind check.
Writing a plant requires knowing exactly what the check reads and what it
considers a fault — which is most of the value of writing one at all.
