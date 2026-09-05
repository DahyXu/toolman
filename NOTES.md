## The pipeline delivered: 13 → 755 → 3,320 impressions

Verified in the Search Console performance report, 28-day window, no filters:

    clicks         3      (was 1)
    impressions    3,320  (was 755, and 13 four days ago)
    queries        1,000  (the report's cap; was 498)
    position       54

Impressions multiplied by 4.4 in a day. That is the crawl-to-index pipeline
arriving, not anything done in the last few hours — the pages behind it were
published days ago and are only now being shown.

The query mix changed with it. Paper is a major family for the first time:

    a2 size          31
    a2 paper size    22
    a2 dimensions    21
    a8 size          19

Worth noting against the record: I cited A2 figures once before, from the
discarded `site:` reading, and corrected myself for it. These are from the
report and they are real. The earlier correction was still right — the numbers
I used then were not evidence, whatever they later turned out to resemble.

## What the shape says to do next

Three groups, and only one of them is worth work:

    password generator ×3   104 impressions, position ~65, competing with
                            LastPass and Norton
    colour hex, time,       ~60 impressions, answered above the results by
    temperature             Google itself
    paper A2/A8             93 impressions, no widget, competitors are Adobe
                            and papersizes.io

Paper is the winnable one and it is the one the title work already targeted.
The three clicks are still too few to say anything about which page earns them;
`ms sql ports` accounts for one and the report's table would not sort by clicks
to show the other two.

## The one click named a thing; every reference here was keyed by its value

Search Console now holds 755 impressions across 498 queries, and the single
click this site has ever had came from:

    ms sql ports        1 click, 1 impression

That query names the service and wants the number. The section had 49 pages
keyed by number and none keyed by name — the direction that converted was the
one direction not served. Checking the rest found the same shape four times:

    ports      1433 → SQL Server        query: "ms sql ports"
    ASCII        32 → space             query: "ascii code for space"
    colours #7FFF00 → chartreuse        query: "chartreuse hex code"
    CIDR        /24 → 255.255.255.0     query: "255.255.255.0 cidr"

All four verified on the live SERP before building. Two of the checks were the
useful kind — the kind that changes the decision:

**Colour is asymmetric.** Searching `#14b8a6` puts Google's own colour picker
above every result, which is why that query has 22 impressions and no clicks.
Searching `chartreuse hex code` returns no widget at all. Same colour, and the
named form escapes the thing that makes the hex form worthless.

**A PDF was winning.** The first result for `255.255.255.0 cidr` is a chart PDF
from RIPE. When a PDF outranks every web page, Google has nothing better, which
is the same signal as the Reddit and Quora threads that topped the tin and
grams-to-cups queries.

## Where the reverse direction does *not* need its own page

Paper, wire gauge and batteries look like the same gap and are not. "210x297
paper size" and "what gauge is 2mm wire" are real queries, but the answer
already sits in the title of the page that holds it:

    A4 Size — 210 × 297 mm, 8.27 × 11.69 in
    14 AWG Wire — 1.628 mm, 0.0641 in, 2.08 mm², 15A
    CR2032 Battery — 20 × 3.2 mm, 3V, BR2032

The four that needed pages needed them because a service name, a character
name, a colour name and a dotted mask cannot be carried in the title of the
page keyed by the other thing. A dimension can. **Build the reverse direction
when it needs a URL of its own, not whenever it exists.**

## The crawl burst is over, and it fetched about a third of the site

Crawl stats to 2026-09-03:

    total crawl requests   4,110   (3,800 on 09-02)
    downloaded             25.7 MB
    average response       193 ms
    toolman.top            3,945 requests, no problems found
    www.toolman.top          165 requests, no problems found

The graph matters more than the total. A tall spike around 29 August to 1
September, then back to near zero. So Googlebot came once, fetched perhaps a
third of 8,803 pages counting sitemaps and robots.txt, and stopped.

That reconciles the two statuses seen in URL Inspection. The hubs say "已抓取 -
尚未编入索引" because the burst reached them and Google declined; everything
deeper says "已发现 - 尚未编入索引" with no crawl time at all, because the burst
ended before it got there.

Which means the two problems are sequenced rather than parallel. Deepening the
hubs addresses the pages Google has already judged. The inbound-link work
addresses the pages it has not reached — a page linked from one place is last
in a queue that is currently not moving.

Neither makes Googlebot come back. What does is the site being worth returning
to, measured over weeks, and links from elsewhere, which the site has none of.
The honest position is that the on-site work is done and the timescale is not
mine to set.

## The indexing quota is a rolling window, not a daily allowance

I assumed it reset at midnight and planned a list of eight URLs for today. Two
went through — `/paper/a4/pixels/` and `/paper/a2/pixels/` — and the third
returned 超出了配额.

So the limit releases gradually as yesterday's requests age past twenty-four
hours, rather than refilling at once. Planning a batch is the wrong shape;
the right one is to keep a short ordered list and spend whatever is available,
highest value first.

Both of today's confirmed the diagnosis from the page-level analysis:

    /paper/a4/pixels/
    网页未编入索引：已发现 - 尚未编入索引
    站点地图      sitemaps/pages-4.xml
    上次抓取时间  不适用

Found through the sitemap, queued, never fetched — while `/paper/a4/` stands in
for it on seven of its top ten queries. Same for the butter amount page, which
is next in the queue when the window opens.

## The biggest page's queries are about a subtopic that has its own page

Breaking the 756 impressions down by page rather than by query changes the
picture again:

    /paper/a4/                  0 clicks   51 impressions   position 80.2
    /paper/a2/                  0          50
    /password-generator/        0          40
    /paper/a5/                  0          33
    /port/                      1           4              position 1.0

183 pages are receiving impressions, so the indexed surface is real and much
wider than the hub layer I was describing this morning. Paper item pages are the
site's largest source of impressions — a4, a2 and a5 alone are 134, more than
three times the password family.

Then the query list for `/paper/a4/` on its own:

    a4 dimensions                    3
    a4 pixel size                    2
    a4 paper dimensions in pixels    2
    a4 dimensions pixels             2
    a4 size in pixels                2
    a4 size paper dimensions         2
    a4 paper ratio                   2
    a4 sheet in pixels               1
    a4 size in px                    1
    size of an a4 paper in pixels    1

**Seven of the top ten are about pixels**, and there is a page for exactly that
question — `/paper/a4/pixels/` — which the impressions are not reaching. Its
title was "A4 in Pixels — 2480 × 3508 at 300 DPI | Toolman": no "size", which
four of those seven queries contain, and ten characters spent on the brand.

Now "A4 Size in Pixels — 2480 × 3508 at 300 DPI, 595 × 842 at 72". Two
resolutions rather than one, because the page's whole value is that there is no
single answer — which is also why Google has no widget for the question.

The general lesson is about the report rather than about paper: the query list
and the page list say different things, and the intersection says something
neither does alone. A page averaging position 80 across 43 queries is not one
problem, it is a page competing for a question its neighbour answers better.

## The first click, and what it proves

Search Console, updated four and a half hours ago:

    total clicks        1      (was 0)
    total impressions 756      (was 13)
    queries           498      (was 5)
    average position 49.6      (was 8.5)

The click came from **`ms sql ports`, at position 1.0** — one impression, one
click, 100% CTR. A developer reference query with no Google answer widget, our
page ranked first, and the click followed. That is the whole thesis of the last
two days demonstrated on a sample of one.

The average position falling from 8.5 to 49.6 is not a decline. Five queries at
position 8 became 498 queries across the whole range; the mean moved because
the population did.

The rest of the table settles two arguments:

    query                            imp   position   clicks
    password generator 8 characters   19       68.0        0
    #14b8a6                           16        9.4        0
    1440 seconds to minutes           13       10.7        0
    password generator 15 characters  10       75.9        0
    #f43f5e                            7        9.6        0
    a2 size                            5       25.6        0
    a8 size                            4       10.2        0

**The widget diagnosis is confirmed with direct evidence.** The colour queries
rank 7.8 to 10.2 — first page — across 33 impressions, and produce nothing.
Ranking was never the problem there; Google's own colour picker sits above the
results and answers the question. Same for `1440 seconds to minutes` at 10.7.

**The password queries are a ranking problem, not a widget one.** 68 to 76 is
page seven. 37 impressions across three phrasings and no clicks, because nobody
reaches page seven. That is the largest genuinely winnable gap on the site.

`a8 size` at 10.2 and `a2 size` at 25.6 are the paper queries, and 25.6 is up
from the 35.3 recorded before the titles were rewritten to carry the units.

## Google crawled the hubs and decided against them

The status on `/cron/` and `/http/` is not the one I expected:

    网页未编入索引: 已抓取 - 尚未编入索引
    上次抓取时间: 2026年9月1日 23:19:20
    当时所用的用户代理: Googlebot 智能手机版

Both carry the same timestamp to the second, so they were one batch. **Crawled**,
not merely discovered — Googlebot fetched these pages, read them, and did not
index them. That is a different failure from the one on the deeper pages, where
the status is "已发现 - 尚未编入索引" and the last-crawl time is 不适用.

So there are three populations, and they need three different things:

    已抓取 - 尚未编入索引     Google read it and passed. The page is the problem.
    已发现 - 尚未编入索引     Queued, never fetched. Crawl budget is the problem.
    网址不明                  Published since the last sitemap fetch.

The hubs are in the first group. On 1 September, when Googlebot read them,
`/cron/` was 185 words of prose around a table and `/http/` was 215. Those are
the two thinnest numbers in the measurement I took today, and Google's verdict
on them arrived before I measured anything.

That is the most useful thing this project has learned about its own traffic.
It is not "Google has not got to us yet" — for the hub layer it already did, and
said no. Deepening those pages was the right work for a reason I did not have
at the time, and re-requesting indexing after deepening is what closes it:
the page Google rejected is not the page that is there now.

`/cron/` and `/http/` are requested. `/cooking/` and `/paper/a2/` are indexed
already, which fits — they were among the more substantial hubs to begin with.

## The quota is real and the toast eats it

Roughly a dozen indexing requests a day per property. Several of mine went to
URLs already submitted, because the success toast covers the search box and the
typing lands nowhere while it is up. Confirm the URL bar changed before clicking
Request, every time.

## What is actually happening, from the one tool that answers it

Search Console's URL Inspection works, and it is the authoritative answer for a
single URL. Driving it settled three things I had got wrong.

**`/paper/a2/` is indexed.** I had concluded it was not, from an exact-phrase
search that returned nothing. Two separate faults in that:

  - The first phrase I tested was the `note` field from the size table, and the
    page renders `DETAIL[id] || note`. Every size has a DETAIL entry — the
    consistency check enforces it — so the note never appears on any page. I
    searched for a sentence that does not exist.
  - The second phrase does appear on the page, and Google still returned
    nothing for it while URL Inspection reported the page indexed. So the
    exact-phrase test produces false negatives on indexed pages and is not the
    reliable instrument I wrote it up as two entries ago.

**The sitemaps are working.** Inspecting `/cooking/1-cups-milk-to-grams/`:

    网页未编入索引: 已发现 - 尚未编入索引
    站点地图      https://toolman.top/sitemap.xml
                  https://toolman.top/sitemaps/pages-3.xml
    上次抓取时间  不适用

Google found that URL through the sitemap and named which one. The "已发现的
网页: 0" column in the sitemap report, which I read as discovery having
delivered nothing, does not mean what I took it to mean.

**The status is "Discovered — currently not indexed", not "unknown".** Google
has the URLs, has queued them, and has not crawled them. That is the ordinary
state of a new domain with a small crawl budget and 8,800 pages, and it is a
different problem from the one I have been describing: not "Google cannot find
the pages" but "Google has not got to them yet".

The newest pages — the comparison hubs published in the last two days — are a
third case: unknown to Google entirely, because the sitemap Google last fetched
predates them.

## Requesting indexing works, and it is the only lever

URL Inspection has a Request Indexing button that puts a URL in a priority
crawl queue. Requested today, in the order they are worth having:

    /paper/compare/       /bakeware/compare/    /bed-size/compare/
    /awg/compare/         /color/tailwind/

Google limits this to roughly a dozen a day per property, so it is not a way to
index 8,800 pages. It is a way to get the handful of pages that matter in front
of the crawler now rather than in some weeks.

Two of my requests were wasted on a URL already submitted, because the success
toast covers the search box and typing goes nowhere. The sequence that works is
close the toast, click the box by coordinate, type, Enter, confirm the URL bar
changed, then click Request.

## The impressions come from the hubs, and the item pages are not indexed

`/paper/a2/` is not in Google's index. The test that settles it is not a
`site:` count, which Google disclaims and which I have already been wrong to
trust once:

    "Half of A1. Used for medium posters, art prints and larger calendars"
    → No results found

That sentence exists on exactly one page on the internet. If Google had the
page, the phrase would return it. It returns nothing.

The claim I first wrote here was that this explains where the A2 impressions
come from. It does not, because there are no A2 impressions. The verified
Search Console query list is five rows and none of them is about paper:

    14b8a6                          1
    #2563eb                         1
    #f43f5e                         1
    #4da6ff                         1
    8 character password generator  1

The A2 figures I reached for — 21, 19, 16, 11, 11 — are from the same discarded
reading as the 1,760 impressions, and I used them again within an hour of
writing down that they were wrong. The correction is cheap; reaching for a
number because it is familiar is the part to watch.

What the phrase test does establish, on its own, is that the page about A2 is
not in the index, and the same test returns the paper hub and the cooking hub
when run against sentences from them.

So the shape of what is indexed is: the top of the hierarchy and almost nothing
below it. That is normal for a domain a few weeks old — Google works down from
the hubs as it decides the site is worth the crawl budget — but it changes what
today's work is worth.

**The 8,803 pages are not in play yet. Roughly 35 hub pages are.** Every
comparison page, every retitled item page and every new section is banked
against a future in which Google has indexed them. Nothing on an unindexed page
can rank, and no amount of it adds up to a click.

What follows from that, and is worth doing now: the hub pages are the only ones
Google can currently show, so they should answer the queries that could arrive
at them. The paper hub's table gave millimetres, inches and pixels and no
centimetres; it gives centimetres now. That is a reasonable thing to do for a
paper-size table on its own merits, and it is not evidence-backed the way the
title work was, because there is no paper query in the verified data to back
it.

What does not follow: building more item pages faster. That is not the
constraint.

## The exact-phrase test

Worth keeping as a tool. Take a sentence that appears on one page and nowhere
else, search it in quotes, and Google either returns that page or says it has
nothing. Unlike `site:` it is a yes-or-no fact rather than an estimate, and
unlike Search Console it is not three days to two weeks stale.

Use it sparingly — a run of automated Google searches gets a bot check, and a
bot check is not something to work around.

## Reddit removed the post before anyone saw it

Posted to r/SideProject, which explicitly invites project links and specifies
the format. The post went live, showed on the subreddit front page, and one
minute later:

    removed_by_category: "reddit"

Not the moderators — Reddit's own site-wide spam filter. Nobody but the author
can see it. The account is the reason:

    u/DahyCC   created 2026-09-02 (2 days old)
    link karma     1
    comment karma  0

Two days old, no comment history, first post carries an external link. That is
the exact shape the filter exists to catch, and no amount of care in the writing
changes it.

Also worth recording: old.reddit's submit form put a reCAPTCHA in front of this
account. New Reddit's submit flow did not, which is how the post went up at all.

What this rules out: promotion cannot start with a link. Comment karma has to
come first, and it has to come from comments worth having. The subreddits where
this site's content is actually relevant do not cooperate with that either —
r/tailwindcss is almost entirely self-promotion with no questions to answer, and
the live question in r/AskElectricians was about water-damaged wiring, which
needs a licensed electrician and has nothing to do with a reference table.

So Reddit is a slow lane measured in days of genuine participation, not a lever
that can be pulled this week. The crawl-to-index pipeline is still the thing
that decides whether any of the 8,323 pages get seen.

## The impression numbers I had been reporting were not GSC's numbers

I told the user we had reached 1,760 impressions, 875 queries and ~1,090 indexed
pages, and that the goal of 1,000 impressions was met. The GSC performance
report, three-month window, no filters, says:

    total clicks        0
    total impressions  13
    average position  8.5
    queries             5

Not a rendering artifact — confirmed on a screenshot after the text extraction
said the same thing. The graph is flat until 2026/8/31 and then rises to 12.

Where the wrong number came from: I had been reading `site:toolman.top` result
counts as "indexed pages" and building an impressions story on top of them.
A `site:` count is an estimate Google itself disclaims, and it was never the
metric the goal was stated in. The performance report was always one click away.

**The lesson is the one already in CHECKING.md, applied to a dashboard instead
of a build script: I quoted a number for days without opening the report that
defines it.** Every "impressions are up" line in this log above this entry
should be read as "the site: estimate moved", which is not the same claim.

What is true: `site:toolman.top` does return real pages — /screw, /file, /text,
/about and others are indexed. So indexing is not zero. But the traffic those
pages receive is 13 impressions in three months, and no clicks at all.

## Why the site is barely in the index yet

The sitemap report explains it. The child sitemaps were served at
`/sitemap-1.xml` … `/sitemap-4.xml` and every one of them read **无法抓取**.
The working paths, `/sitemaps/pages-N.xml`, were first read successfully on
**2026-09-03 and 2026-09-04** — yesterday and today.

    /sitemaps/pages-1.xml   2,000 URLs   success   discovered: 0
    /sitemaps/pages-2.xml   2,000 URLs   success   discovered: 0
    /sitemaps/pages-3.xml   2,000 URLs   success   discovered: 0
    /sitemaps/pages-4.xml     884 URLs   success   discovered: 0
    /sitemap.xml            6,884 URLs   success

"已发现的网页" is 0 on every row: Google has read the maps and has not yet
crawled what is in them. So the site is at day one of being discoverable, not
at week five of being ignored.

That reorders the whole plan. Titles, comparison pages and duplicate-content
scores all matter *after* a page is crawled. Nothing on the page can help a URL
Google has not fetched. The inputs that move crawling are working sitemaps
(fixed, effect pending) and links from other sites (we have none).

## Impressions doubled without a single new page being indexed

192 → **373 impressions**, 115 → **259 queries**, in a few hours. I assumed the
sections built today had started to land. They have not:

    site:toolman.top              ~1,090
    site:toolman.top/resolution/       0
    site:toolman.top/battery/          0

Nothing built today is in the index yet. **The doubling came entirely from the
same ~1,090 pages matching more queries** — impressions per indexed page went
from 0.18 to 0.34.

That is a different mechanism from the one I had been reasoning about, and it
matters for the forecast: I had been modelling growth as *pages indexed × a
fixed yield*, and the yield is not fixed. It rises as Google works out what an
established page is about. So there are two curves running, and everything built
today is still entirely ahead of us.

## Shoe sizes: the ring-size lesson, applied without the detour

Built 33 pages, one per half size. The report came back at **96% worst, 91%
average** — the same as the ring sizes, for the same reason. A shoe size is a
point on a linear scale.

The comparison worth holding onto is *paper*, which has the identical page
structure and scores 65%. The difference is not the template: it is that a sheet
of paper has a use of its own to describe and a shoe size does not. Structure
is not what makes a section duplicate — **having nothing per-item to say is**.

So the per-size pages are gone and the section is one 761-word hub. This time I
cut on the first measurement rather than trying to rescue it first, which is
what the rule is for.

The hub keeps the parts worth having, all verified against six published rows
before shipping: **EU sizes measure the last, not the foot**, which is why EU
42.5 goes with a 27 cm foot; **US men's and women's are offset by 1.5**, so a
"size 8" is two different shoes; and **UK differs from US by half a size in
men's and two sizes in women's** — no single offset to remember. One size step
is 0.85 cm, so half a size is four millimetres, which is less than a foot swells
over a day. That last figure is the honest limit of the whole exercise and the
page says so.

## Paper weight, where "80 lb" names two papers 83% apart

An American basis weight is the weight of 500 sheets **at that grade's basis
size**, and the basis sizes differ: bond is measured at 17 × 22 inches, text at
25 × 38, cover at 20 × 26. So **80 lb text is 118 gsm and 80 lb cover is 216** —
a brochure page and a business card, carrying the same number on the label.
Nothing on the packet says the figures are not comparable.

That is the section's whole argument for gsm, which is grams per square metre:
one number, no grade, no basis size.

The conversion is computed and checked against ten published values on every
build, which caught my own error immediately: the first version divided grams by
square metres and printed **kilograms** per square metre, so every figure was a
thousand times too small — 20 lb bond came out at 0.1 gsm. Every page would have
been internally consistent and uniformly wrong.

Three problems the gates caught after that, in order:

**87 broken links.** The cross-grade table linked every grade at the same pound
figure, but a page exists only where that grade is *sold* at that weight — 100 lb
text is a real paper and 100 lb bond is not. The links are now conditional on
the page existing.

**93% sibling overlap between 75 gsm and 80 gsm.** The use note came from a band
lookup, so both fell in the same band and got the same paragraph — the shared
prose problem for the fifth time today. One sentence per weight instead of one
per band took it to 86%.

**A conversion that is right and useless.** 300 gsm is arithmetically 203 lb
text, and text paper stops around 100 lb. Printed plainly that invites someone
to order something that does not exist, so figures outside the range a grade is
actually sold in are now marked "not made at this weight".

And a note on my own testing. I planted a 10× unit error to check the conversion
guard, saw no failure, and concluded the guard was broken. It was not — the
`python3 -c` I used to plant the error had not run, so the file was never
modified and I was testing the clean version. **Third variety today of the tool
that produced the evidence being the thing at fault**: first a mislabelled
metric, then a grep that missed two matches, now a plant that never landed. The
check itself fires correctly and I have now seen it do so.

## A check that could not fail, and what it found once it could

The baking tin section names every tin twice — "23 × 33 cm / 9 × 13 in" in the
label and 228.6 × 330.2 in the data — and nothing joined the two. The very first
row I wrote was **"20 × 30 cm / 9 × 13 in" over a 23 × 33 cm tin**: correct in
inches, wrong in centimetres, and it would have shipped as an authoritative
figure on the page whose entire job is that figure.

So I wrote a check that every dimension in a name must match the tin. It passed.

It passed because the heredoc had turned `` into an **actual backspace
character**, 0x08, so the regex demanded a control byte after "cm" and matched
nothing in the file. `cat -A` was what found it — `(cm|in)^H/g`. The check ran on
every build, examined 22 tins, found zero problems by construction, and reported
success.

This is the escaping trap again, and it is the worst version of it I have hit.
The earlier ones produced visibly wrong output — a literal `s` in a regex, a
sentence that read oddly. This one produced *silence*, which is indistinguishable
from working. **I would have shipped it and trusted it**, and the only reason I
did not is the rule from this morning: a clean run means nothing until a planted
failure has been seen.

Once fixed, it found things immediately:

- `loaf-small` labelled "21 × 11 cm" over a 215 × 115 mm tin — my error.
- `springform-26cm` labelled "26 cm / 10 in" — 10 inches is 25.4 cm, so that
  imperial name was simply wrong and is now gone.
- Six rows where "20 cm" and "8 in" name the same tin. **Those are not errors**,
  and the check was right to raise them: 8 inches is 203.2 mm and 20 cm is 200,
  so a tin sold under both names differs by 3 mm and about 3% in area depending
  on where it was made. That is now a section on the hub, because it is exactly
  the kind of small discrepancy that ruins a bake when it compounds with an oven
  running cool and a fan the recipe did not account for.

The check handed me two corrections and one genuinely interesting fact, all in
its first working run — after being completely inert for its first three.

## 109 queries, and paper is now the biggest family on the site

Impressions 119 → 183 and queries 64 → 109 in a few hours. Grouped:

| family | queries |
|---|---|
| **paper sizes** | **~29** |
| temperature | ~26 |
| roman numerals | ~10 |
| length / mm | ~9 |
| time | ~8 |
| colour | ~7 |

Paper produces 29 queries from 59 pages. It is the section I have improved most
deliberately and it is now the largest earner, which is the first time the
causal story and the numbers have lined up rather than one being inferred from
the other.

Three actionable gaps came straight out of the list.

**Nine queries want paper in pixels** — "a4 in px", "a2 pixels size", "a4
resolution", "a2 print dimensions", "a4 page size px", "a4 measurements in
pixels" — and every one of them was landing on a page whose title says
millimetres. There is now a page per size at `/paper/<id>/pixels/` that answers
the question in its title. The numbers are entirely its own, because pixel count
and file size both scale with the *square* of the DPI: A4 at 300 DPI is
2480 × 3508 and 26 MB uncompressed, while A0 is 9933 × 14043 and **399 MB**.
That squaring is the useful thing to say and it differs per sheet.

**"conversion mm to ft" and "convert millimeter to feet"** were landing on a bare
pair page with no value pages — the same gap millimetres-to-metres had this
morning, found the same way. Likewise "how many cubic litres in a cubic metre".
Both pairs now have values.

**The similarity metric lied in the flattering direction.** With the pixel pages
added, `paper` reported **23% average, 27% worst** — an enormous apparent
improvement. It was not: the sampler compares alphabetical neighbours, and
`/paper/a4/` now sits next to `/paper/a4/pixels/`, so it was measuring the
distance between two different page *types* and calling it sibling overlap. Split
apart, the real numbers are 65% for the size pages and 78% for the pixel pages.

This is the same defect I fixed for `/convert/` a few hours ago, recurring the
moment a new page type appeared under an existing prefix — and it is worth
noting that **the first time it hid a problem and this time it invented a
success**. A metric that moves a long way for a reason you have not identified
is telling you about itself, not about the thing you changed.

## Ring sizes: the section that should not have per-item pages

Built 22 pages, one per half size from US 3 to 13, and the similarity report
came back at **97% worst, 91% average — the worst number any section has had**.

The cause was the familiar one, for the fourth time in a day: the same advice
about band width and about fingers swelling, repeated on all 22. Moving it to
the hub took it to 94%. Still failing.

At that point the honest reading is not "needs more differentiation" but
**"these pages should not exist"**. A ring size is a point on a linear scale. A
battery page has a chemistry, a voltage and a device; a tyre page has its own
set of equivalent fitments and its own speedometer arithmetic; a ring size page
has a number, and the number is already in the hub's table. There is nothing for
it to say that the row above it does not.

So the per-size pages are gone and the section is a single 617-word hub with the
full chart, which is what the content actually supports. That is my own written
rule applied to my own work — *when a section will not differentiate, cut pages
rather than pad them* — and it is the first time today I have followed it before
shipping rather than after.

The formula still earns its keep on the hub: the ISO size **is** the inside
circumference in millimetres, the US scale is 36.537 + 2.5535 × size (matching
eleven published values to within 0.15 mm, checked on every build), and the UK
letter advances once per half US size. Those three rules replace every printed
conversion chart, which is a better thing to give a reader than 22 pages that
each restate one row of it.

## Tyre sizes, and the number that explains why one car takes three of them

A tyre marking is three measurements that people read as a part number.
205/55R16 is 205 mm of tread, a sidewall **55% of that width** — 112.8 mm, top
and bottom — on a 16-inch rim, so the overall diameter is
16 × 25.4 + 2 × 112.8 = 631.9 mm. Every figure in the section comes out of that
line, and I recomputed three of them independently before shipping.

The aspect ratio being a percentage rather than a height is the thing worth a
page for, because it means two markings that look unrelated can be the same
tyre. 205/55R16, 225/45R17 and 195/65R15 measure 631.9, 634.3 and 634.5 mm — a
spread of **0.41%** — which is exactly why a manufacturer lists all three
against one model. The wheel grows an inch, the sidewall loses ten points of
aspect, the width gains ten millimetres, and the rolling diameter stays where
the speedometer and the gearing expect it.

That gives the section its own useful output rather than a restated table: a
speedometer counts revolutions, so **a tyre 1% larger makes it read 1% low**.
Each page lists the alternatives within 3% and what each does to an indicated
100 km/h. 54 pages, ✓ at 67% average sibling overlap and 79% worst.

The two safety-adjacent notes are deliberate and match the restraint used on the
wire gauge ampacity column: diameter is not the whole decision — rim width, load
rating and speed rating matter too — and the placard in the door frame is the
authority for a particular car. Publishing "these sizes are interchangeable"
without that would be tidier and worse.

## Metric threads, and a number that is arithmetic rather than a chart

"What drill for M6" is a question people look up every time, and the answer is a
subtraction: **tapping drill = major diameter − pitch**. M6 coarse is a 1.0 mm
pitch, so 5.0 mm. M8 is 1.25, so 6.75 — sold as 6.8, because 6.75 is not a drill
anyone stocks. The rule reproduces every published tapping chart from M2 to M24
within the rounding those charts apply, and the generator checks all thirteen on
every build.

The section carries two things the arithmetic cannot give.

**The clearance hole is the one people reverse.** The tapping drill goes in the
part being threaded; the clearance hole goes in the part the bolt passes
through. Drilling the clearance size and then trying to tap it leaves a hole
with no thread in it, and that is a common enough mistake to be worth a sentence
on every page.

**An M10 bolt takes either a 16 mm or a 17 mm spanner.** DIN 933 specifies 17
across the flats and ISO 4017 specifies 16; the threads are identical and only
the head differs. The same split happens at M12 and M14. This is exactly the
shape of the UK/US King bed collision — a name that means one thing and a
measurement that means two — and it is why a socket set that covers 8, 10, 13,
17, 19 occasionally meets a bolt it cannot grip. Both numbers are printed rather
than one being chosen.

One restraint carried over from the wire gauge section: everything that is a
standard rather than a calculation is stated as such, and where two standards
disagree the page says so instead of picking the one that makes the table
tidier.

## Click depth is not the problem — measured rather than assumed

With 7,483 pages and roughly a seventh indexed, the obvious suspect is crawl
depth: pages buried five or six clicks from the home page get reached last and
often not at all. So I measured it instead of guessing.

    0 clicks          1
    1 click          98
    2 clicks       3254   43.5%
    3 clicks       2818   37.7%
    4 clicks       1312   17.5%   ← deepest on the site
    unreachable       0

**Nothing is deeper than four clicks and nothing is unreachable.** 82% of the
site is within three. The deepest sections are the two largest, `convert` at an
average of 2.99 and `cooking` at 2.91, which is what you would expect and is
fine.

So internal structure is not the constraint, and that hypothesis is closed. What
remains is crawl *rate* on a domain that is three days old, which is time and
external signal rather than anything in the repository — and the sitemap only
started delivering URLs to Google today, so the clock on that started this
morning rather than on launch.

Worth having built the measurement anyway: `scripts/depth-map.mjs` will say
immediately if a future section lands stranded, which is the failure the CSS
unit pages and the resolution pages both had before the footer link was added.

## Wire gauge: a section that is one formula, and a constant worth guarding

AWG is not a table. The diameter of gauge n is

    0.005 x 92^((36 - n) / 39)  inches

and the reason the numbers run backwards is that the scale counts drawing
operations — wire pulled through more dies is thinner and has a higher number.
The formula reproduces all fifteen published diameters from 4/0 to 40 to better
than 0.4%, which I checked before building anything on top of it.

Two rules fall out of the exponent and are why electricians can size wire in
their heads: 92^(6/39) = 2.005, so **six gauges doubles the diameter**, and
squaring that, **three gauges doubles the cross-sectional area**. Ten gauges is
10.16x the area, close enough to ten to be the third rule people use.

The resistance figures needed a constant, and this is where the section could
have gone quietly wrong. Copper's resistivity is 1.68e-8 Ω·m, which is the
number I would have reached for — and every resistance on the site would then
have been about 2.5% below every published wire table. The tables use the IACS
annealed-copper reference of 1.724e-8. With that, the computed values match the
published ones to **0.02%**.

So the generator checks itself on every build against fifteen diameters and six
resistances, and I confirmed it fires by planting exactly the mistake the comment
warns about — swapping 1.724e-8 back to 1.68e-8, which produced three failures
immediately. **A constant that is nearly right is the hardest kind of error to
notice**, because every page looks reasonable and none of them is.

One deliberate restraint. Ampacity is a safety number, so the chart carries only
the NEC 310.16 copper 60 °C values for the building-wire gauges — the ones with a
single well-known answer that sets the breaker — with the rest left blank and an
explicit note that insulation rating, ambient temperature, conductor count and
local code all govern. Publishing a confident number for every gauge would have
looked more complete and been worse.

## Battery sizes: the generator checked its own data and found a real error

Twenty-two cells, and the fact worth leading with is that **the code is the
size**. A CR2032 is 20 mm across and 3.2 mm thick; a CR1620 is 16 by 2.0; an
18650 is 18 by 65.0. The first two digits are the diameter in millimetres and
the rest is the thickness or length in tenths. Almost nobody knows this, and it
turns "is a CR2025 the same as a CR2032" from a lookup into arithmetic.

Because the rule exists, the generator does not store dimensions for those
cells — it decodes them from the designation, and compares the result against
any dimensions given by hand. That comparison caught something on the first run:

    LR1130: name decodes to 11×3 mm, table says 11.6×3.1

The table was right and my decoder was wrong. The **alkaline and silver-oxide
button cells are not named the same way** — an LR1130's digits are a rounded
nominal, not a measurement, so LR and SR had no business in the decode pattern.
Left in, every LR page would have asserted a size wrong in both dimensions
while explaining, confidently, that the digits are the measurement.

The check now fails the build rather than exporting a list, and I planted a
wrong dimension to confirm it fires before trusting the clean run.

The section came out at **42% average sibling overlap, 71% worst — the best of
any generated section on the site**, and I did not do anything special to make
that happen. Each cell has a genuinely different paragraph, a different alias
list, and different neighbours. That is the whole technique, and the sections
that score well are simply the ones where the per-item facts were interesting
enough to write about.

## Lumber sizes, and the same mistake for the third time today

"2x4 actual size" is one of the most-searched dimension questions there is, and
the answer — 1½ × 3½ inches — is the kind of fact this site should own. Eighteen
board sizes, with the rule computed rather than transcribed: a nominal inch
finishes at ¾, 2 to 6 inches lose ½, 8 and above lose ¾. I checked the computed
rule against thirteen published dressed sizes before shipping rather than after.

That caught nothing, but reading the output did. The generator was producing:

> Three 2x4s laid side by side are 10½ inches wide, not 12. Over a 3-foot run
> that is a gap of 4 inches.

The first sentence is right. The second glues together two unrelated
expressions — `r.w * 8 / 12` for the "3-foot run" and `(r.w - r.aw) * 8` for the
"4 inches" — so the two numbers in it have nothing to do with each other. It
reads like a fact and is arithmetic noise. Now: eight boards are 28 inches
rather than 32, four inches short, which is one claim and checks out.

**And then I made the shared-prose mistake again.** Every lumber page carried
the same two paragraphs explaining why the names differ, which took the section
to 92% sibling overlap — after doing exactly this with the ARCH sheets earlier
today, and again with the oven pages an hour after that. Each time the instinct
was that a thin page needs more words; each time the metric said the opposite,
because identical text on two pages raises a Jaccard overlap rather than
lowering it.

The fix, again: the explanation moved to the hub, and each board got a paragraph
about what that board is actually for — 2x4 for wall studs, 2x10 for stair
stringers because cutting the notches leaves so little material, 2x12 for spans
because doubling a joist's depth raises its stiffness eightfold while doubling
its width only doubles it. 92% → 83%.

I have now written this rule into CHECKING.md, because knowing it three times in
one session evidently was not enough.

## Bed sizes, and a duplicate H1 the suite reported but did not gate

The finite-namespace rule again, on the everyday side where the queries actually
are: 19 mattress sizes across North America, the UK and continental Europe.

The section is worth having because the names collide and collide the wrong way.
**A UK King is 150 cm wide and a US King is 193** — a 43 cm difference, which is
larger than the gap between a UK Single and a UK Small Double. The largest bed
sold as standard in Britain, the Super King at 180 cm, is still 13 cm narrower
than an ordinary American King. Nothing in the word "King" warns anyone.

Sizes are stored in the unit their standard is written in — inches for North
America, centimetres for the UK and Europe — and converted once, rather than
stored pre-converted and rounded twice. I cross-checked both directions against
the published figures before shipping, which caught a claim of my own: I had
written that a US Full and a UK Double are "within 2 cm in both directions" and
the width difference is 2.2 cm. The page now gives 137.2 × 190.5 against
135 × 190 and lets the reader see it.

The section came out at 55% average sibling overlap, 69% worst — second best on
the site after screen resolutions, for the same reason: most of the page is
derived, and the part that is not is genuinely different per row.

**The audit found a duplicate H1 and passed anyway.** Two pages were headed
"King bed size", one American and one British, competing for exactly the query
that most needs disambiguating. The check has always existed and always printed;
`dupH1` was simply absent from the `fatal` sum, so the suite exited 0 with the ✗
on screen. That is the second time today a check has been decorative — after
`audit.mjs` ending in an unconditional `process.exit(0)` — and both were found by
reading the output rather than by trusting the exit code. Headings are now
qualified where a name is shared, and `dupH1` counts.

**Cloudflare Pages propagation, twice mistaken for a bug.** A new path returns
404 for roughly the first minute after a deploy. `/resolution/` did it earlier
today and I went looking through `dist` for a missing file; `/bed-size/` did it
again and I checked `_redirects`. Both were fine both times. **Wait a minute
before verifying a new path, and do not treat an immediate 404 as evidence.**

## The similarity report was averaging two unrelated page families together

`/convert/` holds three things that share nothing but a URL prefix: 2,710
`N-unit-to-unit` value pages, 946 unit-pair landing pages, and **932
zone-to-zone timezone pages**. Reported as one section it read 41% average, 79%
worst — comfortably the healthiest large section on the site.

Split apart:

| family | pages | avg | worst |
|---|---|---|---|
| convert:values | 2,710 | 50% | 88% |
| convert:pairs | 946 | 52% | 75% |
| **convert:zones** | **932** | **74%** | **94%** |

The timezone pages were the largest duplicate-content risk on the site and had
been invisible for the whole project, hidden behind the average of a section
four times their size. `gmt-to-jst` and `gmt-to-kst` were 94% identical because
Japan and Korea are both UTC+9 with no daylight saving, so every computed thing
— offset, conversion table, meeting overlap — came out the same and only a
country name differed.

I had actually read one of these pages earlier today, decided the section was
fine, and moved on. It was fine; it just was not *distinct*, and reading one
page cannot tell you that.

Two problems with the tool, both found by the number moving when the content had
not:

**The sample depended on the page count.** The stride was `files.length / 40`
capped at 80 pairs — 1.7% coverage of a 4,589-page section — so adding 28 oven
pages elsewhere changed which pairs were compared and moved the reported worst
from 79% to 91%. A fixed cap of 600 makes the number describe the pages instead.

**Averaging hid the family that needed the work.** Splitting `/convert/` by slug
shape took ten lines and exposed a 94% pair immediately.

The fix to the pages themselves is the one that has now worked three times —
ports, paper, and here: a real paragraph per item in a data file. Thirty zone
paragraphs, each carrying what no formula produces: that CST means US Central,
China Standard and Cuba Standard time fourteen hours apart; that IST is UTC+5:30
and also stands for Irish and Israel Standard Time; that Arizona is on MST all
year while Denver moves; that Queensland stays on AEST while Sydney does not;
that Brazil abolished daylight saving in 2019 and Russia in 2014. Zones went
94% → 83% worst, 74% → 66% average, and no section on the site is now over the
duplicate threshold.

**Two process notes.** I built 40 oven pages and cut them to 28 after the metric
said the 12 Fahrenheit ones were restating the Celsius ones — the right response
to a section that will not differentiate is fewer pages, not more padding. And
those 12 had already been deployed and submitted to IndexNow before I measured,
so they are now 404s I told a search engine about. Settle the shape of a section
before announcing it.

Also: `npm run build` cleans `dist` first and `node build.mjs` does not. I had
been running the second all session, so removed pages stayed in the directory
and shipped. Only those 12 were affected, because nothing had been removed
before today, but the deploy should go through `npm run deploy` every time.

## The developer sections are not the ones earning

Grouping the 64 live queries by what they are about, rather than by URL prefix,
gave a result I would not have guessed for a site whose front page leads with
developer tools:

| kind | sections | queries |
|---|---|---|
| everyday reference | paper, temperature, roman, colour, cooking | ~40 |
| developer reference | http, port, cidr, chmod, ascii, file — 285 pages between them | 1 |

One query. `ms sql ports`, which is also the only click the site has ever had.

The reason is not that the developer pages are worse — `port` and `http` are two
of the four sections already under the duplicate threshold, and the port pages
got a real paragraph each earlier in the project. It is that a developer looking
up a status code or a port number lands on MDN, the RFC, or a ten-year-old Stack
Overflow answer with four hundred votes, and there is no long tail underneath
those. "A4 paper size in mm" has no such incumbent.

So the next namespaces should be everyday ones, and the two I built are:

**Screen resolutions** (36 pages) and **screen sizes** (29). They are the two
halves of one question — how many pixels, and how big is the box — and both are
almost entirely computed, which is why they came out at 54% and 71% sibling
overlap with no work spent on differentiating them. The screen size pages exist
because a diagonal does not tell you a width: a 55-inch 16:9 screen is 47.9
inches across, a 55-inch 4:3 one is 44, and the number people are given is the
one that answers neither question they have.

I checked the geometry against the generator rather than trusting it: at 55
inches and 16:9 the derived width and height give a diagonal of exactly 55.0000
and a ratio of exactly 1.7778.

**One more silent filter found.** The similarity report ended with
`.slice(0, 12)` — only the twelve largest sections. `chmod` had already dropped
off the bottom as the site grew, and `screen-size` never appeared at all, so a
new section could sit at 95% and never be printed. Reporting by size is exactly
backwards here: a small, heavily templated section is where duplicate risk
lives. It now reports every section.

That is the third tool this session whose output was quietly wrong or
incomplete — the similarity heading, the grep that missed two exit-code
handlers, and now this cutoff. All three were mine, and all three would have
been caught by asking "what would this look like if it were not working" before
reading the number off it.

## Screen resolutions, built on the rule the paper section taught

Applying the finite-namespace finding: 36 display resolutions from VGA to 8K,
each with aspect ratio, pixel count, megapixels, density at five diagonals, and
how it compares with 1080p and 4K. Everything except one paragraph per entry is
computed from the width and height, which is why the section came out at **54%
average sibling overlap, 69% worst** — the least repetitive generated section on
the site by a wide margin, without any effort spent on making it so.

Three real bugs, all caught by checking rather than by reading:

**Portrait ratios were nonsense.** `ratio()` divided width by height and matched
against a list of landscape shapes, so a 1080×2400 phone panel compared its 0.45
against 16:9's 1.78 and picked whatever was least wrong. Phone resolutions are
quoted portrait and their ratios are named the same way — 20:9, not 9:20 — so
reducing the long side against the short one fixes every case at once, and
1080×2400 now reads 20:9 exactly.

**3440×1440 was labelled approximate when it is exact.** The cutoff for "this
reduction is too ugly to print" was a numerator over 40, and 43:18 is a real,
exact, meaningful reduction. Raised to 100, which still sends 683:384 to the
nearest standard shape and keeps 43:18 as itself.

**Two arithmetic claims I wrote by hand were simply false**: 1600×900 described
as three quarters of 1920×1080 when it is 83% linear and 69% by area, and 720p
called a quarter of 4K when it is a ninth. Both are the sort of sentence that
reads perfectly and is wrong, which is the category nothing on this site catches
by accident.

So `resolution-consistency` joins the suite: every resolution named in prose must
exist in the table, and every "twice A×B", "N extra columns", "N columns wider
than UHD", "two 1080p displays", "a ninth of the pixels of 4K", "N% of a 1080p
frame" and "sixteen 1080p frames" claim is checked against the numbers. I
planted the two errors I had actually made plus a typo'd resolution and a wrong
doubling; it caught all four. **The clean run came first and meant nothing until
the planted run failed.**

## Paper pages earn 68× more per page than convert pages

The 64 queries in the 24-hour view, grouped by section, gave a ratio I had not
thought to compute:

| section | pages | queries | queries per page |
|---|---|---|---|
| paper | 38 | 13 | 0.34 |
| roman | 328 | 6 | 0.018 |
| convert | 4,562 | ~25 | 0.005 |

Paper is a **small, finite, high-demand reference namespace**: there are only so
many paper sizes, people look them up constantly, and nothing about the answer
is contested. Convert values are an infinite space where every page competes
with a calculator widget Google renders itself. Building more of the second kind
is not the same work as building more of the first, and I had been treating them
as interchangeable.

Twenty sizes the section was missing, all genuinely distinct rather than aliases:
the six ARCH architectural sheets, B9/B10, C3/C7, the US No. 10 and A7
envelopes, four photo print sizes, two book trim sizes, the 3 × 5 index card
and Super A3.

Two things this surfaced.

**The fallback I built to be visible was still silent.** `DETAIL[id] || note`
means a size with no paragraph quietly renders the one-line note instead, and
all twenty new sizes did exactly that until I wrote them. So there is now a
`paper-consistency` check in the suite: every size must have a paragraph, every
paragraph must match a size, and every dimension written in prose must
correspond to a real sheet.

Its first version was wrong in an instructive way. It compared the first
dimension pair in each paragraph against *that* sheet, and flagged four
paragraphs — every one of them correct, because a good paragraph explains a
sheet by comparing it to another one (A3 against Tabloid, the US A7 envelope
against ISO A7, the 3 × 5 card against A6). The check encoded an assumption
about how the prose should read rather than about what would be wrong with it.
Rewritten to ask whether every dimension in the prose matches *some* real sheet,
it flags only JIS B0 and a poker card, both cited deliberately, both now named
in an allowlist with the reason. Then I planted `297 × 999 mm` on the A4 page
and confirmed it fires, because a check that has never failed is not yet a check.

**Adding a shared paragraph would have made the duplicate problem worse.** My
first instinct for the ARCH pages coming in at 91% — shorter than the others
because the A and US series each have a bespoke block and ARCH had none — was to
write an ARCH series block. That is exactly backwards for a Jaccard overlap:
identical text added to two pages grows the intersection and the union together
and the ratio rises. Only text that differs per page moves it down. Six longer,
genuinely size-specific paragraphs took paper to 85% and left no section over
the threshold.

## The audit suite was reporting, not gating — and I was quoting its exit code

`scripts/audit.mjs` ended with an unconditional `process.exit(0)`. It computed
`fatal`, printed `✗ 152 issues that can block indexing`, and exited clean.
`schema.mjs` and `sitemap-check.mjs` had no exit handling at all.

This matters beyond the scripts. I have been running `npm run audit` after every
change this session and reporting **"audit exit: 0"** as evidence the change was
sound. That number was 0 whether the suite passed or not. It was not weak
evidence, it was no evidence, and I quoted it perhaps ten times.

`CHECKING.md` also stated that the audits "fail the build on missing or
duplicate metadata, broken internal links, pages unreachable from the home
page…" — describing behaviour the code did not have.

All five now exit non-zero on their own fatal condition, and `a11y.mjs` gained
one: a control with no accessible name is a control a screen reader cannot
announce, which is a defect and not a note.

One correction inside the correction. I said none of the scripts exited
non-zero. `contradiction.mjs` and `dead-code.mjs` already set
`process.exitCode` and were already real gates — my grep pattern
(`process.exitCode *= *[0-9]`) did not match `process.exitCode = total ? 1 : 0`,
so they were missing from the survey I based the claim on. I added redundant
`process.exit()` calls to both before noticing and removed them. **The tool that
produced the evidence was wrong in the same direction as the conclusion**, which
is the second time today: the similarity report's heading, and now this grep.

The gate immediately earned itself. The 152 new CSS unit value pages were
unreachable from the home page — nothing linked them, exactly the island problem
from earlier in the project — and the first `✗` I have seen the suite refuse to
pass on was that one. Fixed by listing the value pages on their pair page.

## I read my own similarity report backwards and told the user so

The report's heading said **"unique text per page, by section"**. The number
under it is a Jaccard overlap — the vocabulary a page *shares* with its
siblings, where lower is better and 100% would mean two pages built from
identical words. The heading names the opposite of the quantity.

So when it printed `convert 4200 pages avg 38%`, I read "only 38% of a convert
page is its own words", concluded that the site's largest section was also its
thinnest, and said so to the user in those words. The truth is the reverse:
38% is the **lowest** overlap on the site, and convert siblings are the most
distinct pages here. `paper` at avg 75% was second worst and I read it as second
best.

What caught it was not re-reading the code. I added a substantial new paragraph
to every one of the 38 paper pages, re-ran the report expecting the number to
climb, and it fell to 66%. A change whose direction I was sure of came out
backwards, which is the only reason I went and read what `j` actually holds.

The heading now says what the number is. The work I picked was still the right
work — `cron` at 91% and `paper` at 94% were the two sections over the duplicate
threshold, and the threshold reads `worst`, which I had right — but the reason I
gave for picking it was wrong, and it was wrong in a direction that would have
sent me to rewrite 4,200 healthy pages next.

The fixes themselves:

**cron 91% → 84%.** Sibling pages differed only in numbers: "Because 15 divides
evenly into 60…", "Because 12 divides evenly into 60…". The genuinely
per-schedule fact they were missing is where in the hour the job lands. Every
`*/n` fires on minute 0, and `*/15` and `*/30` hit only quarter-hour marks —
the minutes every other crontab, the distro's maintenance jobs and most
monitoring agents also pick. Each page now names its own run minutes, says how
many collide, and gives the offset expression with the identical cadence:
`13-59/15 * * * *` runs at :13, :28, :43, :58. Different text and different
advice on every page, because it is computed from the interval.

**paper 94% → 84%.** The same fix that took `port` from 91% to 75%: a real
paragraph per item in a data file, wired in so a missing key is visible rather
than silently falling back to the one-line note. All 38 have one — checked by
diffing the key set against the size list, not by looking at a page and assuming.

## Zero URLs had ever reached Google through a sitemap

Asked again why the child sitemaps still showed 无法抓取, I went and read the
table properly instead of repeating what I had already written, and found I had
understated it.

The four children had been submitted on 1 September, hours before the split
that created them, and returned 404. What I had recorded as a cosmetic stale
record was worse than that: their **上次读取时间 was blank**, so no read had ever
completed, and **已发现的网页 was 0 on every row including the index**, which
read 成功 on 2 September. Sitemap discovery had delivered nothing at all. Every
page Google has indexed so far it found by following links from the home page.

Search Console genuinely has no delete — I opened the ⋮ menu on a failed row to
check rather than assert it again, and it holds two greyed-out "view indexing"
items and nothing else. Resubmitting the same URL is accepted silently without
triggering a fetch. So the only clean record is a URL that has never failed:
the children moved to `/sitemaps/pages-N.xml`, with the index and robots.txt
pointing there, while the old paths keep serving the same bytes so any retry
against a poisoned record gets a 200 rather than a second 404.

Google fetched all four within seconds of submission:

| sitemap | status | pages discovered |
|---|---|---|
| pages-1.xml | 成功 | 2,000 |
| pages-2.xml | 成功 | 2,000 |
| pages-3.xml | 成功 | 2,000 |
| pages-4.xml | 成功 | 884 |

6,884, matching the build exactly, against 0 for the two days before.

Two things to carry forward. **A submitted-before-it-existed sitemap poisons its
own URL permanently**, so never submit one before deploying it. And I had
answered this question once already from my own notes and got it half wrong:
the note said "they block nothing", which was an inference from the red status
line, not from the 已发现的网页 column sitting at 0 right next to it. The column
that answers the question was on screen the first time and I did not read it.

While in the file, the sitemap checker was globbing `dist/sitemap*.xml`, which
after the move validated the leftover copies nobody reads and skipped the four
the index actually names. It now follows the index.

## The "everyday terms" comparison was one rung wrong on 2,186 pages

GSC showed `4 oz to grams butter` and `4 oz in grams butter`, so I opened the
page they were landing on. The maths was right and one sentence was not:

> In everyday terms, 4 ounces is about a bag of sugar.

4 ounces is 113 g. A bag of sugar is a kilogram.

The numbers in the comparison table are the *magnitude of the thing named* — a
bar of chocolate 0.1 kg, a bag of sugar 1 kg, the airline baggage limit 23 kg,
a marathon 42195 m, all exact. The selector treated them as upper bounds and
returned the first rung the value fell under, so every value was described as
the rung above it, up to ten times too large. It only read correctly when a
value landed exactly on a rung, which is why 100 grams looked fine and nothing
downstream ever flagged it.

Now it picks the nearest rung in log space, which is how a reader judges
"roughly like", and says nothing at all below the smallest rung, where no
object in the list is the right size. 4 ounces is a bar of chocolate.

Verifying that fix surfaced a worse one in the same feature:

> In everyday terms, 1 day is a day.

and, on the very page `1440 seconds to minutes` was ranking for:

> In everyday terms, 1,440 seconds is an hour.

1,440 seconds is 24 minutes — the page's own answer, in its own H1, directly
above a sentence contradicting it. The whole time category is now gone. The
point of the feature is to put a familiar object next to a unit that carries no
intuition, a gram or a byte; seconds and hours *are* the everyday terms, so the
line could only restate the conversion or distort it, and it did both.

2,186 pages carried the sentence, 1,819 still do, and none of them now says
something the reader can check and find false.

Two audits were sitting right next to this and caught nothing. The contradiction
checker looks for a number written two ways and for a title repeating itself; it
does not know that "1,440 seconds" and "an hour" are the same kind of claim. The
lesson stands from last time and I will stop re-learning it: **the audits catch
malformed pages, not wrong ones.** Both defects here were found by reading a page
that live query data pointed at — which is now the cheapest source of leads I
have, because it says which pages a stranger actually opened.

## Title Case was useless on the exact inputs the page invites

The case converter offers Title Case and camelCase side by side, so the obvious
thing to paste is an identifier. Every one of them came back wrong:

| input | was | now |
|---|---|---|
| `userAccountId` | Useraccountid | User Account Id |
| `XMLHttpRequest` | Xmlhttprequest | Xml Http Request |
| `HTTP_STATUS_CODE` | Http_status_code | Http Status Code |

`words()` finds identifier boundaries correctly and only the programming cases
used it. Title and Sentence case split on whitespace, so an identifier arrived
as one long word. Routing them through `words()` was the wrong fix — it discards
separators, and "state-of-the-art design" has to keep its hyphens in a title.
A separate `readable()` opens only the two boundaries that carry no meaning in
prose, a case change and an underscore, and leaves everything else alone.

Testing the fix surfaced a second one: "the quick brown fox. **a** second one".
A minor word is lowercased unless it is first or last, which is the standard
rule and ignores that a word after a full stop opens a sentence wherever it sits
in the string. Now `[.!?:]` before it counts as a first word — the colon
included, because Chicago and AP both capitalise a subtitle's first word.
`3:1` is untouched, since the rule requires whitespace after.

Three process notes, all previously recorded and all repeated here anyway:

- The template-literal escape trap, 5th occurrence. `\s` written into a `.mjs`
  template literal reaches the browser as `s` and matches a literal letter. The
  file's other regexes all use `\\s`. Reading the emitted JS out of
  `dist/case-converter/index.html` caught it; the source looked right.
- `sed -i 's/!?]/!?:]/'` applies per line, so it also hit the Sentence case rule
  two lines down, where a colon must *not* capitalise — "the answer is: yes"
  stays lowercase. Reverted that line alone. A substitution narrow enough to
  look safe still needs its blast radius checked.
- The colon rule was verified against `3:1` before shipping, not after.

## 2026-09-03 — the Markdown converter mangled ordinary Wikipedia links

No fresh Reddit threads today in any domain I have actually verified — subnets,
chmod, encoding, cron, ports, contrast, password entropy, UUID. There was a
UniFi wifi-roaming question an hour old, and I did not answer it. I could have
written something plausible about sticky clients and 802.11k/v/r, but I have
verified none of it this session, and on an account with zero comment karma a
shallow answer costs more than silence. Posting to have posted is not the same
as contributing.

So back to the site, and to the one surface I had never tested: **user input**.

**Search is clean.** Six queries behave correctly, including exact hits
("chmod 755" returns one result, the right one). Both input paths are safe: a
crafted query in the box and the same payload through `?q=` both land in the
input's value and are never echoed as HTML.

**The Markdown converter escapes raw HTML properly** — `<script>` and an
`onerror` image both come out as text, neither executes.

**But it broke real links.** An ordinary Wikipedia URL:

    [Turing](https://en.wikipedia.org/wiki/Alan_Turing_(film))
    -> href="https://en.wikipedia.org/wiki/Alan<em>Turing</em>(film"

Two faults at once. The URL pattern was `[^)\s]+`, so it stopped at the first
closing parenthesis and dropped the rest — and the emphasis rules ran *after*
link generation over the whole string, so the underscores inside the href it had
just written became `<em>` tags. A link that looks fine in the editor and is
silently wrong in the output.

Links and images are now parked as placeholders before emphasis runs and
restored afterwards, and the URL pattern accepts one level of balanced
parentheses. The decisive test is a line with both: `[docs](https://ex.com/a_b_c)
for *more*` now keeps the underscores in the href and still italicises "more".

Also filtered the URL scheme. `javascript:` and `data:` went straight into
`href`. Nothing here executes them — the preview is escaped and there is no
sharing — but this tool's entire purpose is HTML you paste somewhere else, so it
should not hand you a link you would not want on your own site. Those now keep
the text and drop the link.

Verified the rest of the converter still works after touching `inline()`:
headings, both list types, blockquote, table, code, strikethrough, images.

## 2026-09-03 — the GIF converter quietly dropped the animation

Read the 23 image-conversion pages, which I had never checked. The phrasing is
uniform and correct, but the tool has a limit none of them stated.

The conversion is `createImageBitmap` then `drawImage`, which takes **one
frame**. Feed it an animated GIF and you get a still picture back, with no
warning. The GIF page made it worse: its "About WebP" paragraph notes that WebP
supports animation, so a reader could reasonably expect an animated WebP out and
get a single frame instead.

Pages whose source format can animate — GIF, WebP, AVIF — now say so before the
format descriptions, and say why: assembling an animation needs an encoder for
the target format, which is a megabyte of WebAssembly and defeats the point of a
page that loads instantly. They point at `ffmpeg -i in.gif out.webp`, which does
the job locally and uploads nothing either, so the alternative keeps the property
the site is built on.

The sentence adapts to the target: on `gif-to-webp` it adds "even though WebP can
itself store animation", because that is exactly the expectation the rest of the
page sets up. On `gif-to-jpg` it does not, because JPEG cannot animate and
raising it would be noise.

**The condition did not fire on the first build**, and the pages came out
unchanged. The format objects live in an `F` map keyed by id and carry no `id`
property of their own, so `a.id` was undefined and the check silently matched
nothing. Caught by verifying which pages had the new text rather than assuming
the edit had landed — the same habit that caught the planted-contradiction test
doing nothing yesterday.

This is the third time this session that a change appeared to apply and did not.
The tell each time was identical: a result too clean to be true, from a step
whose success I had not confirmed separately from its output.

## 2026-09-03 — the token counter named no models in its HTML

The two query-driven gaps so far (password length, uuidv7) shared a shape: a
tool with a configurable parameter whose page never discussed specific values of
it. Rather than wait for the next query to point at the next one, I checked all
the parameterised tools against the terms someone would search them with.

That turned up something worse than a vocabulary gap. **The AI token counter's
model table was rendered entirely by script**, so the static HTML contained no
"GPT-4o", no "Claude", no "Gemini" — on a page whose entire subject is token
counts for those models, and whose own title promises them. Google does execute
JavaScript, but as a deferred second pass; the first-pass HTML named none of the
things the page is about.

The list now lives at module scope and is rendered server-side, with the script
interpolating the same array so the two cannot drift. The static rows carry the
model, its characters-per-token ratio and its input price — the facts that do
not depend on what the visitor types — and the script fills in the token count
and cost on input. Verified from the deployed HTML with script tags stripped:
all three model families are there.

Checked the tool still works rather than assuming: 44 characters, 9 words,
GPT-4o 10 tokens at 4.40 characters per token, no console errors. Those match
the figures I verified against a real BPE tokenizer yesterday.

Also confirmed the remaining conversion queries are properly served —
`1440 seconds to minutes` has its own page answering "1,440 seconds = 24
minutes", and `240000 ms to min` is covered on the milliseconds page. Those
needed nothing.

The same sweep flagged three more, and **all three were my own probe being
wrong.** I checked before acting, and none was a gap:

- The QR page does name the error-correction levels — "L — 7%, M — 15%,
  Q — 25%, H — 30%". My probe looked for the literal string "level L".
- The base converter says "Base 36". My probe looked for lowercase.
- The image compressor has a whole section headed "Resizing beats compressing"
  and a Max width control. My probe looked for "resize" and missed "Resizing".

So the sweep produced four flags, one real and serious, three artefacts of
case-sensitive exact matching. Worth recording because the natural next step
after a sweep is to act on its output, and three quarters of this one would have
been edits to pages that were already fine.

## 2026-09-03 — impressions doubled, and the query data keeps redirecting me

**24-hour view: 34 impressions, up from 14 yesterday. 15 queries, up from 7.**
The 3-month view still ends 8/31 and still reads 2 — it has not advanced despite
it now being the 3rd, so my "the 9/1 data lands around 9/3" estimate was
optimistic. `CHECKING.md` already says to use the 24-hour view; that turns out
to matter more than I thought.

    #f43f5e                  5
    14b8a6                   3
    #14b8a6                  3
    1440 seconds to minutes  2
    240000 ms to min         1
    uuidv7                   1
    #2563eb                  1
    #4da6ff                  1
    1440 seconds in minutes  1
    16pt to mm               1

Colour codes are still the bulk, 12 of 34. Notable: `14b8a6` and `#14b8a6` both
appear, so the page matches with and without the hash.

**`uuidv7` is the second tool page to show up in the data**, after the password
generator. I spent most of yesterday reasoning about reference matrices and have
now been corrected twice on the same point: tool pages pick up long-tail traffic
of their own.

Checked the UUID page against that query before writing anything. The v7
explanation there is genuinely good — it covers the index-locality argument
correctly — but it never used the vocabulary someone searching "uuidv7" would
expect, and it omitted the thing that actually decides the choice.

Verified the implementation first, since I was about to describe it: version
nibble 7, variant in 8–b, the 48-bit timestamp round-trips to the exact
millisecond, and sequential values sort lexicographically. All four hold.

Added RFC 9562 and the bit layout, stated the time-sortability explicitly, and
added the tradeoff that was missing everywhere: **a v7 identifier discloses its
own creation time**. The first twelve hex characters are a millisecond
timestamp, readable by anyone holding the value, so a v7 in a public URL leaks
when an account was made or an order was placed. v4 leaks nothing. That is the
real basis for choosing between them, and the page had nothing on it.

The example UUID in that section decodes to 2026-09-02T19:54:52Z — checked,
rather than invented.

**Also fixed in /http/:** every page asked "How do I fix a `<code>` error?",
including 100, 200, 204 and 301. The 418 page answered its own malformed
question with "Nothing to fix". The answers already branched by status class and
said "Neither — it indicates success or progress"; only the questions had not
been given the same branch. 14 of 38 pages affected.

## 2026-09-02 — turned the observation into a check, and it found 561 pages

Last round I wrote that self-contradiction seems to be the characteristic
failure of generated prose and that no checker looks for it. So I built one:
`scripts/contradiction.mjs`, covering the two forms that are mechanically
detectable — the same number written two ways in one page's prose, and a title
that repeats a phrase.

It found **561 pages**, and every one was real:

- Value pages read "1 kilogram = **1,000** grams" in the headline and "One
  kilogram is **1000** grams" three lines down. The prose used the plain
  formatter while the headline used the grouped one.
- Unit-pair pages: "1 acre = **43,560** square feet" then "Multiply the number
  of acres by **43560**".
- Roman year pages: "**1900** in Roman numerals" at the top, "**1,900** in other
  notations" further down — **my own fix from earlier today, incomplete.** I had
  changed the title, H1, intro and questions and missed two other places.

Code blocks and tables are excluded, because a formula legitimately writes 1000
and a numeric column legitimately groups. Down to zero after fixing all four
sources. While reading the flagged output I also caught "returns 1 **kilograms**"
in the reverse-conversion sentence, which no check would have found.

**The self-test failed, and the checker was innocent.** I planted "1,900" into
`/roman/1900/` and the checker reported clean. The plant string was
`The year 1900 is written`, and the actual HTML is `The year <strong>1900</strong>
is written` — tags in between, so the replacement silently matched nothing. The
checker was never given a contradiction to find. Redone with an anchor asserted
to exist first, it caught it immediately and cleared on restore.

That is the second time today a verification step has quietly done nothing. Both
times the tell was the same: a result that was too clean, from a step whose
success I had not confirmed separately from its outcome.

Wired into `npm run audit`.

## 2026-09-02 — a page earning impressions was contradicting itself

Followed the remaining two conversion queries from the live data. `240000 ms to
min` is served properly. `16pt to mm` lands on `/convert/pt-to-mm/`, which was
wrong in its first sentence.

It read **"At the browser default root font size of 16 px, 1pt = 0.352778mm"**,
which asserts a dependency that does not exist. A point is 1/72 of an inch and a
millimetre is a millimetre; the ratio is fixed whatever the font size. Root font
size only affects `rem` and `em`.

The generator already knew. It carries a `rel` flag per unit, and a paragraph
further down each page said, correctly, "Both units are absolute in CSS, so this
ratio never changes regardless of font size or user settings." So the page
asserted a dependency in its opening line and denied it three sections later.
The intro, the meta description and one FAQ answer all interpolated the root
font size unconditionally; they now branch on the same flag the rest of the page
was already using.

**And the widget had an inert control.** Every CSS unit page rendered a "Root
font size" input, but the conversion function ignores it for absolute units —
`aRel ? aPx*base/16 : aPx`. On a pt-to-mm page you could type in that box all
day and nothing would move. Hidden on absolute pairs, kept on relative ones.

Verified the arithmetic afterwards from the definitions rather than from the
page: 16/72 of an inch is 5.6444 mm, which is what 16pt now converts to.

That is the fourth page this session found saying one thing in one place and the
opposite in another — the colour pages calling #000000 a near-black grey under
an H1 reading "Black", the Roman numeral page calling 1,990 a year, the category
titles repeating their own name, and now this. Self-contradiction seems to be
the characteristic failure of generated prose, and no checker I have looks for
it.

## 2026-09-02 — first real query data, and it corrected me

The 3-month performance view reads 2 impressions, which is misleading: its data
window ends 8/31, the day before launch. The **24-hour view** is near real time
and shows **14 impressions** in the last day. The site is earning impressions
now; the headline number simply cannot see them yet.

More useful than the count, the seven queries behind it:

    240000 ms to min                    1
    14b8a6                              1
    #4da6ff                             1
    16pt to mm                          1
    8 character password generator      1
    password generator 8 characters     1
    password generator 15 characters    1

**What this confirms.** Two are bare hex codes, which is exactly the pattern I
measured earlier — arbitrary colours rank because nothing competes for them.

**What it corrected.** Three of seven are length-specific password-generator
queries. I had spent the day reasoning about reference matrices and had not
considered that a tool page would pick up long-tail traffic of its own. The page
has a length slider defaulting to 16 and **did not contain the string "8
characters" anywhere** — it answered none of the three queries that reached it.

Added a section that does, with figures computed from the generator's own
87-character set at log2(87) = 6.443 bits per character: 8 characters is 52 bits
and falls in about 27 minutes to an offline attack at a trillion guesses a
second; 16 is 103 bits; past 20 the numbers stop meaning anything. Plus the
three caveats that make the table honest — that the hash matters more than the
length up to a point, that online attacks are rate-limited and a different
problem, and that none of it applies to a reused password.

No new pages. The queries pointed at a gap in a page that already existed, which
is what real data is for. Page went from about 700 words to 1,070.

## 2026-09-02 — the colour coverage is aimed at the right half

Checked whether the section that ranks is composed of the pages that *can*
rank. Of the 681 colour pages, **542 are arbitrary hex codes and 139 are CSS
named colours**. The named ones — forestgreen, cadetblue, azure — have
established pages competing for them and we do not rank. The arbitrary ones are
where both page-one results came from.

So the coverage is already pointed at the winnable 80%, and nothing needs
changing. That is worth recording as a thing checked rather than assumed: it
would have been equally plausible for the matrix to be mostly named colours,
in which case the whole section would have been aimed at competition it cannot
beat yet.

I also tried to find a pattern in *which* 46 colour pages Google has indexed,
in case the hub's ordering was driving it and could be changed. The visible
sample is a mix of named and arbitrary with no discernible structure, so there
is nothing to act on. Reverse-engineering Google's crawl selection from nine
URLs is not analysis.

**A caveat I should state plainly rather than let the ranking finding imply
otherwise.** Ranking #1 for `169c16 color code` produces impressions only if
somebody searches it. An arbitrary hex code has very low individual volume —
the thesis is that 542 of them aggregate to something, not that any one of them
matters. That thesis is untested until GSC reports query data, which arrives
with the 9/1 window around 9/3. Until then, "we rank #1" and "we will get
impressions" are two different claims and only the first is evidenced.

## 2026-09-02 — read the page that ranks first

Since `/color/` is the one section demonstrably ranking, I read the page that
sits at #1 rather than assuming it was fine.

**The numbers are all correct.** Verified `#169C16` by hand: RGB (22, 156, 22)
from the hex, HSL (120, 75%, 35%), CMYK (86%, 0%, 86%, 39%), decimal 1481750,
and the two contrast ratios multiply to 21.0, which is the identity that must
hold for any colour measured against white and black. The "closest CSS named
colour is forestgreen" line is right too.

**One real defect, and my a11y check could not see it.** The swatch prints the
hex code twice, once in white and once in black, so a reader can judge which is
legible on that background before reading the measured ratios. Nothing said so.
The meaning of the demonstration was carried entirely by colour — a screen
reader got "#169C16 #169C16" with no explanation of why it was said twice, and
`scripts/a11y.mjs` passed it because these are spans with text rather than
unlabelled controls. Its rule is "every control has an accessible name", and
these are not controls.

The swatch now carries `role="img"` with a label describing what it shows, each
sample has a title, and a sentence under it explains the demonstration in the
page text. That last part helps everyone, not only screen-reader users: the
point of the two samples was never actually stated.

That is the sixth defect this session found by reading rather than measuring,
and the second where the checker was working correctly and simply had no rule
for the thing that was wrong.

## 2026-09-02 — the site ranks #1 for something

Indexed does not mean ranking, so I measured the second thing rather than
assuming it followed from the first.

**Head terms: nowhere.** "pints to gallons", "px to percent converter",
"228B22 hex color", "inches of mercury to millimeters of mercury", "ansi d paper
size in pixels" — none in the top 9 to 14. Expected on a two-day-old domain with
no backlinks.

**Obscure long tail: page one.**

| query | rank |
|---|---|
| `169c16 color code` | **1** |
| `afdf20 color` | **4** |
| `1877f2 color` | outside 12 |
| `228B22 hex color` | outside 12 |

The split is not random. `#1877F2` is Facebook's blue and `#228B22` is Forest
Green — named colours with established pages behind them. `#169C16` and
`#AFDF20` are arbitrary hex codes nobody has written about, so there is nothing
to outrank. The site is not being suppressed; it is simply new, and it wins
where nothing else is competing.

The pattern does **not** extend to the other sections yet. Even a genuinely
niche conversion like inHg to mmHg has established sites on it, and paper sizes
do too. Colour hex codes are unusual in having millions of queries with no
incumbent at all.

**Where the indexing actually is**, by section:

| section | indexed | total |
|---|---|---|
| /convert/ | 228 | 4,199 |
| /cooking/ | 152 | 990 |
| /color/ | 46 | 681 |

So the two page-one rankings come from 46 indexed colour pages. There are 635
more not yet crawled, and that is where near-term impressions will come from.

Checked whether discovery is the limit and it is not: every colour page is in
the sitemap, the hub links to all 681, IndexNow submits them on every deploy,
and each colour page links to ten related colours, so the crawl graph is dense.
What remains is Google's crawl rate on a new domain, which is time rather than
anything I can configure.

Worth being explicit about a temptation I did not take. The obvious move from
this finding is to generate tens of thousands more obscure hex pages, since they
demonstrably rank. That is exactly the same-day burst of templated pages on a
domain with nothing vouching for it that got the site in the r/SEO thread
suppressed. The 681 that exist already rank; the constraint is crawl rate, not
page supply.

## 2026-09-02 — indexation went from 8 pages to about 448

Went back to the actual bottleneck rather than more content polish, and the
picture has changed materially since this morning.

**`site:toolman.top` now reports about 448 results.** It reported 8 this
morning. Verified it is not a display artefact: page 11 of the results still
carries the 448 figure and lists deep pages — `/convert/pc-to-em/`,
`/convert/px-to-percent/`, `/convert/pints-to-gallons/` — so Google has indexed
hundreds of the unit-pair pages, not just hubs.

New in the indexed set since this morning: `/color-converter/` (a tool page),
`/convert/` (confirmed), `/image/`, `/color/1877f2/`, `/color/afdf20/`,
`/paper/letter/`. The pattern has broadened from hubs to leaves.

`site:toolman.top/chmod/` returns nothing, which is right — that section is a
few hours old.

**GSC has moved too, slightly.** Impressions 1 → **2**, and the data window
advanced from 8/30 to **8/31**, last updated five hours ago. The site launched
on 9/1, so the window still ends the day before launch: none of the 448 indexed
pages have had a chance to appear in reported impressions yet. That arrives with
the 9/1 data, around 9/3.

**Request-indexing could not be operated.** The inspection box finally accepted
input by setting the value through the native setter and dispatching input and
Enter events — synthetic typing never worked. `/chmod/` came back "Google 无法
识别此网址", never crawled, which is expected for a section built today. Clicking
"请求编入索引" produced no confirmation and no quota message, so I cannot say
whether it was submitted, and I am not going to claim it was.

That lever is marginal now in any case. Indexation grew fifty-six-fold in a day
without it, and IndexNow pushes all 6,674 URLs on every deploy.

## 2026-09-02 — the numbers we tell people about ourselves had drifted

Two smaller things after the section-by-section read.

**"28+" when there are exactly 28.** The home page title, the tools page title
and the home page intro all claimed `${tools.length}+`. The count is computed
from the directory, so it is exact, and the plus sign claims more than exists.
Everywhere else on this site a figure is the real one — I have spent the day
verifying arithmetic against independent sources — so an inflated count in the
one place a visitor sees first was out of step with the rest of it. Now plain.

**The README and the promotion copy were three sections behind.** README said
6,478 pages and 25 tools; PROMOTION.md, which is the copy meant to be posted to
Hacker News and Reddit, said 6,544 pages and 27 tools. Reality is 6,674 and 28.
Posting a number that does not match the site to an audience that checks is a
bad way to open. Both refreshed, and the README's matrix table — which listed
five sections and stopped before cooking, roman, ascii, cron, port, http, paper,
cidr, file and chmod ever existed — now lists all twelve.

**Reddit, with an honest read of the result.** The r/homelab comment is eight
and a half hours old, still live, still at score 1, no replies. The answer was
good; the timing was not. The thread was already twelve hours old when the
comment went up, and in a subreddit that size it had left the front page before
anyone could see the reply. Recorded in PROMOTION.md: aim for threads under
about three hours old. More comments is not the fix, earlier ones are.

Account is 13 hours old, so r/sysadmin's 24-hour gate is about eleven hours off.

## 2026-09-02 — 450 cooking pages said "1/2 cups"

Read the last unchecked section, `/cooking/`. The arithmetic holds: a cup of
all-purpose flour is 125 g, 1 1/2 cups is 188 g, and a tablespoon is 1/16 of a
cup, so 1 1/2 tablespoons is 11.7 g. All correct.

The grammar was not. **450 pages read "1/2 cups of all-purpose flour"**, and the
same in their titles and descriptions. English takes the singular for any
quantity below one — half a cup, 3/4 cup — and the pluralisation test was
`v === 1`, which is true only for exactly one. Anything under one fell through
to the plural.

`"1/2 cup flour in grams"` is a query people actually type, so this was on the
phrasing that matters most in the section. Now:

    1/2 cup of all-purpose flour        (was "1/2 cups")
    3/4 cup of all-purpose flour        (was "3/4 cups")
    1/2 tablespoon of butter            (was "1/2 tablespoons")
    1 cup of all-purpose flour          unchanged
    1 1/2 cups of all-purpose flour     unchanged, correctly plural

One helper, `unitFor(v, vol)`, used by both places that build the phrase, so the
title and the heading cannot disagree later.

That closes the reading pass over every generated section. Five rounds, and
every round found something the audit called clean: category titles repeating
their own name, 602 descriptions cut mid-sentence, three FAQ grammar bugs,
#000000 described as a near-black grey, years written 1,990, and now 450 pages
with a plural after a fraction. Not one of them was a missing tag, a broken
link, or a length violation — the things a checker can see.

## 2026-09-02 — years were written 1,990

Read the Roman numeral section at its edges. The arithmetic is right everywhere
I checked — 4 is IV, 9 is IX, 49 is XLIX, 3999 is MMMCMXCIX, 2026 is MMXXVI —
and I was wrong about one thing I expected to find: the "How do you read MCMXC?"
answer is not shared boilerplate. Only the rule sentence is common; each page
then breaks down its own numeral, "M is 1,000, CM is 900, XC is 90, giving
1,990 in total".

The real defect was a page disagreeing with itself. `/roman/1990/` said **"As a
year it appears in copyright lines and cornerstones"** and, in the same
paragraph, wrote the number as **1,990**. The page already knew it was a year
and still formatted it with a thousands separator — which nobody does for a
year, and which the search query does not contain either.

Years 1900–2050 now render plain in the title, the H1, the intro and the
questions, and read "The year 1990" rather than "The number 1,990". Everything
outside that range keeps the separator, because 3,999 genuinely is a number:

    1990 in Roman numerals      The year 1990 is written MCMXC
    3,999 in Roman numerals     The number 3,999 is written MMMCMXCIX

The numeric columns in the breakdown and nearby-numbers tables keep
`toLocaleString` — those are figures in a table rather than the subject of the
sentence.

## 2026-09-02 — #000000 was described as a near-black grey

Kept reading at the boundaries, this time the 682 colour pages. The two most
searched hex codes there are were both wrong:

- **`#000000`** — "a very dark, desaturated **near-black grey**"
- **`#FFFFFF`** — "a very light, desaturated **near-white grey**"

Pure black is not an approximation of itself. Worse, each page contradicted its
own heading: the H1 said "Black — #000000" while the sentence underneath called
it a near-black grey.

The cause is a threshold with no endpoint case: `l < 10 ? 'near-black grey'`
catches 0 along with everything else dark. Added the exact endpoints, and
dropped the lightness and saturation adjectives there — "a very light,
desaturated pure white" is no better than what it replaced.

Then a second pass for the grammar: the sentence template is `${H} is a
${desc}`, which gives "is a pure black". One `article()` helper now decides,
used by both places that build this sentence so they cannot drift.

Verified the neighbours still read correctly: `#111111` is still a near-black
grey and `#F5F5F5` a near-white one, which is accurate for both.

That is four rounds now of finding real defects by reading generated output at
the edges of its ranges, after the audit reported everything clean. The checks
are worth having — they catch what they were built for — but every one of these
was a sentence that satisfied all of them and that nobody would have written.

## 2026-09-02 — read the FAQ edge cases, found three grammar bugs

Continued reading rather than measuring, this time sampling FAQ answers at the
boundaries of each generated range — the values where a template is most likely
to produce something a human would not write.

Three real defects, all invisible to every check I have:

- **`/cidr/32/`: "1 addresses in total, of which 1 is usable."** The usable
  count was pluralised and the total was not.
- **`/ascii/32/`: "Space, the space character"** read as "Space, the character
  space", because the code point's name and its glyph label are the same word
  for whitespace and the template printed both.
- **`/chmod/000/`: "It sets owner to no access, group to no access, others to no
  access."** Correct, and three times longer than it needed to be. Now "It
  grants no access to anyone — not even the owner, who can still change the
  permissions back, because that right comes from ownership rather than from
  these bits", which is both shorter and says something worth knowing.

Also checked the case I expected to be wrong and was not: `/convert/1-kilograms-
to-pounds/` renders "1 kilogram to pounds" in its H1 and title. The singular was
already handled; only the URL slug carries the plural.

The pattern from the last few rounds holds. Every one of these passes the audit:
the titles are unique and short, the descriptions are present and within length,
the structured data matches the page. A generated sentence can satisfy every
mechanical constraint and still be one no person would write, and the only way
to find that is to read the output at the edges of its ranges.

## 2026-09-02 — 602 meta descriptions were being cut mid-sentence

Kept reading rather than measuring, after the category-title finding, and hit a
bigger one: **602 of 6,675 descriptions ended in an ellipsis**, cut mid-phrase by
`fitDesc()` because they were written past the ~160 characters Google shows.
Nine per cent of the site, and my audit had never mentioned it — it checks for
missing, duplicate, under-70 and over-175, and a description truncated at 155 is
none of those.

**I tried to fix it in the wrong place first.** Loosening `fitDesc()` to prefer a
word boundary over an early sentence boundary cut the too-short count from 620 to
481 — and pushed truncation from 602 to 748. Measuring four thresholds showed the
trade was roughly one for one at every setting, so it was not a fix at all.
Reverted, and went at the source instead.

Root cause by section, which made the work obvious:

| section | truncated | of |
|---|---|---|
| /cron/ | **59** | 59 — every page |
| tool pages | **21** | 28 |
| /convert/ | 430 | 4,200 |
| /color/ | 71 | 682 |

Every template had been written without accounting for how long the interpolated
name gets. `/cron/` was 100% truncated because the fixed part alone was near the
limit before any schedule title was added. Rewrote each template sized against
its *longest* interpolation rather than a typical one, and rewrote all 21 tool
descriptions by hand — those are the pages Google actually indexes.

Result: **602 truncated → 23**. Median description length 127, mean 127, only 54
pages under 100 characters, the bulk sitting in the 120–159 range Google will
show in full.

One number in that check was misleading and worth naming: "under 115 characters"
went from 620 to 1,405, which looks like a regression. The distribution shows it
is not — most of those are 100–115, which is a complete, readable description
rather than a short one. A shorter description that ends properly beats a longer
one cut off mid-list.

Also fixed while reading: `/ai/` said "1 free tool**s** that run in your browser",
a count interpolated into a hardcoded plural, and `/convert/` had the one-word H1
"Converters" while its title targeted "unit converter". It gates 4,200 pages.

## 2026-09-02 — four category titles were repeating themselves

Went back to the eight pages Google has actually indexed, since those are the
only pages that can earn an impression today, and read their titles rather than
counting their words.

`/dev/` read **"Developer Tools — Free Online Developer Tools | Toolman"**. The
shared template was `${name} — Free Online ${name}`, so four of the five
category pages said their own name twice and nothing else:

    Developer Tools — Free Online Developer Tools
    Text Tools      — Free Online Text Tools
    Image Tools     — Free Online Image Tools
    AI Tools        — Free Online AI Tools

`/convert/` read properly only because it had been overridden by hand at some
point, which is what hid the pattern.

Each category now carries its own tail describing what is in it, which is also
closer to how the thing is searched for:

    Developer Tools — Formatters, Encoders & Validators
    Text Tools      — Word Count, Diff, Case & Markdown
    Image Tools     — Compress & Convert in Your Browser
    AI Tools        — Token Counting & Prompt Cost

The audit never flagged this: it checks for missing titles, duplicate titles
across pages, and titles over 65 characters. A title that is unique, present and
short can still be useless, and no length check will say so.

## 2026-09-02 — the sitemap ranking had drifted from the site

Stopped adding pages. The site is 6,674 pages on a two-day-old domain with no
backlinks, which is close to the pattern in the r/SEO thread I recorded earlier
— a same-day burst of templated pages on a domain with nothing vouching for it.
More pages is not the lever any more; making sure Google crawls the right ones
is.

Checked whether the sitemap ranking still matched the site, and it did not.
`/chmod/`, `/cidr/` and `/ascii/` were built today; the `HUBS` list they should
have joined was last edited before they existed. So all three sat in the
**second** sitemap chunk at **priority 0.6**, ranked as ordinary top-level pages
— while gating 192 pages between them. `/convert/` and `/port/`, on the list,
were in chunk one at 0.8.

Fixed by deriving hubs from the URLs instead of listing them: a page with pages
beneath it is a hub. A list maintained separately from the thing it describes
drifts, and this one had.

**The derivation immediately broke something, which is the useful part.**
`/convert/time-zones/` dropped from 0.8 to 0.7, because the 848 time-zone pairs
live at `/convert/pst-to-est/` rather than nested beneath it — no prefix rule
can find them. Kept a small explicit seed for the three hubs whose children do
not nest, and derived the rest. Had I only checked the three pages I set out to
fix, I would have shipped that regression.

Final distribution: home 1.0, 28 tools 0.9, 18 hubs 0.8, 1,967 pair pages 0.7,
28 top-level generated 0.6, 4,632 long-tail leaves 0.5.

## 2026-09-02 — the 848 timezone pages were missing the thing that matters

Chased the largest section rather than the worst score: `/convert/` is 4,200
pages and its worst pair was two timezone conversions, of which there are 848 —
an order of magnitude more pages than cron's 59.

Each pair page carried one **identical** paragraph warning that abbreviations
are fixed offsets while places switch. True, generic, and on all 848 pages.
Replaced it with the version that is actually about the two zones in question,
derived from a standard/daylight partner map:

- SGT to CST — the gap is 14 hours, but the region on CST moves to CDT from
  March to November, so the figure only holds for part of the year.
- UTC to JST — neither shifts, so 9 hours holds all year. Worth saying,
  because it is unusual.
- PST to EST — both shift, and they do not switch on the same date, so there
  are short windows each spring and autumn when a recurring meeting is an hour
  out. That is the most common way this catches people, and no page said it.

This is a replacement rather than an addition: shared prose out, per-pair prose
in. The similarity metric barely moved (87% either way, and already in the "~"
band rather than the "✗" one) because the hour-by-hour table dominates the
vocabulary. The content is better regardless — the metric was the reason I
looked, not the reason to make the change.

**My own dead-code check earned its keep again.** I had drafted a `NO_DST` set
listing zones that never shift and then written the logic off the absence of a
`DST_PARTNER` entry instead, leaving the set defined and never read. The audit
named it immediately. Removed — two lists holding the same information is how
they drift apart.

## 2026-09-02 — why the child sitemaps say "cannot fetch", and per-port content

**The sitemap question, answered from git history rather than guessed.** The
user asked why four child sitemaps still show 无法抓取 when the index reads 成功.
I had put it down to queue latency; that was wrong, and the log settles it:

    c5501cf  09-01 23:32  Shard the sitemap into 2,000-URL chunks with an index
    e7a72fc  09-01 21:01  Deploy to Cloudflare Pages

`sitemap-1.xml` through `sitemap-4.xml` **did not exist** until 23:32 on 9/1.
The site first deployed at 21:01 with a single `sitemap.xml`. They were
submitted to Search Console at a moment when those URLs returned 404, Google
recorded the failure, and it has not retried since. Three observations follow
exactly from that and would not follow from latency:

- Type shows 未知 — never parsed, so Google does not know what they are.
- **Last-read time is blank**, not old. It is not that a read failed; no read
  ever completed.
- Only `sitemap.xml` succeeded, because that URL existed from the start — its
  contents changed from a urlset to an index, but it was always fetchable.

Verified there is nothing wrong now: all five return 200 with
`Content-Type: application/xml`, no BOM, a correct XML declaration, no
`x-robots-tag`, and robots.txt lists every one of them, all checked with a
Googlebot user agent.

It also does not matter. The index is the canonical submission, it reads
successfully, it lists all four children, and Google is demonstrably reaching
deep pages — 22 pages with valid breadcrumbs, `/convert/` and `/color/228b22/`
indexed. Resubmitting is accepted silently without creating a new record, and
the current Search Console UI has no delete option in the row menu. The only way
to force clean records is to rename the files so they become new URLs, which
restarts discovery on a working index to remove four cosmetic red lines. Not
worth it; they will clear on Google's own retry.

**Per-port content, and the lesson holding up.** `/port/993/` carried about
thirteen words of port-specific text inside four hundred words of shared
lsof/netstat boilerplate, and `/port/` is one of the eight pages Google has
indexed. Wrote a real paragraph for each of the 48 ports into
`src/data/port-detail.mjs` — why active FTP breaks behind NAT, why 993 and 995
differ in mail model rather than in encryption, why an exposed 2375 is a remote
root shell rather than a vulnerability, why `localhost` and `127.0.0.1` are not
the same thing to a MySQL client.

Result: port went from **✗ worst 91% to ✓ worst 75%**, average 75% → 62%, and
993 against 995 from 9 unique words to 33.

That is the same technique that failed on paper's ANSI sizes, and the difference
is instructive: ports have genuinely distinct behaviour to describe, ANSI D and
ANSI E do not. Enriching the data works when there is something true to add and
becomes padding when there is not.

## 2026-09-02 — first positive signal from Google

The Enhancements section of Search Console, which said "no enhancements yet"
this morning, now reports:

**Breadcrumbs: 22 valid, 0 invalid. Last updated 2026-09-01. No issues detected
in the past 90 days.**

Three things follow from that, and they change the picture I had:

1. **Google has processed structured data on 22 pages**, against the 8 that show
   up in a `site:` query. The `site:` count has been understating actual
   coverage all along — it is a cached approximation, and the enhancement report
   is derived from real parsing.
2. **The crawl-and-parse pipeline works.** It is slow for a two-day-old domain,
   which was the expectation, but it is not stuck.
3. **Our JSON-LD is valid to Google**, with zero invalid items. That
   independently confirms what `scripts/schema.mjs` reports, from a source that
   has no reason to agree with my own checker.

Worth noting what is *absent*: only Breadcrumbs appears under Enhancements. We
emit `FAQPage` on several thousand pages and Google reports nothing for it,
which is consistent with FAQ rich results having been withdrawn for most sites
in 2023. The markup costs nothing and the FAQ content is useful on the page
regardless, so there is no action here — but it should not be counted on for
rich results.

Reddit, for the record: the account is 8.1 hours old, the r/homelab comment is
3.5 hours old, still live in the thread, score 1, no replies. r/sysadmin's
24-hour gate is still hours away. Nothing to do but wait.

## 2026-09-02 — duplicate content, and the mistake I made three times

**My own similarity checker was giving false assurance.** It compared one pair
of pages per section — the first against the middle one. That reported `/cron/`
at 79%, comfortably under the threshold. Sampling many pairs instead showed the
section's *worst* pair at 97%. The risk is a duplicate pair, so one sample can
miss it entirely. `scripts/similarity.mjs` now walks consecutive and spread-out
pairs, reports average and worst, and names the worst pair.

That immediately surfaced three sections over the 90% line that had been
invisible: cron 97%, paper 93%, port 91%.

**Then I made the same mistake three times.** Each time I differentiated pages
by writing a paragraph shared across a *band* of items — hours 13–17, midweek
days, the US paper series — and each time the pages inside a band came out just
as identical as before. `/cron/every-day-at-14/` and `.../at-15/` shared 540 of
547 words after the first attempt. Bands cannot fix a per-item problem.

The lesson, stated plainly because I clearly needed it: **content generated from
a template is shared by definition. Only content that varies with the item
differentiates.** That means it has to come from the data, or be computed from
it, not written once in the generator.

What worked, on that principle:

- **24 distinct per-hour notes** for the daily cron pages, each saying something
  true only of that hour — midnight's date-boundary contention, 02:00 being the
  hour that repeats or vanishes under daylight saving, 15:00 being the widest
  Europe/US overlap, 23:00 finishing on the following calendar day.
- **A coverage sentence computed per hour** — which regions are working, awake
  or asleep when the job fires. That differs for all 24 by construction.
- **Seven distinct weekday notes** rather than one shared "midweek" paragraph.
- **Interval arithmetic** — runs per day, and overlap headroom, both derived
  from the interval. Verified: 1440/3 = 480, 1440/15 = 96.
- **Series arithmetic for paper**, computed rather than written: A8 is A0 halved
  eight times, 256 of them make an A0, 16 fit on an A4. All checked.

Result: cron 97% → 91% worst, average 85% → 72%.

**Where I stopped, and why.** Paper's worst pair is now ANSI D vs ANSI E at 94%,
and the honest reason is that those two sheets have almost nothing different to
say beyond their dimensions. The remaining sections over the line total 147
pages — 2% of the site. Pushing further would mean writing a bespoke paragraph
per item into the data, and for items with nothing distinctive that becomes
padding, which is a worse outcome than the duplication it would be hiding.

One genuine find while writing the ANSI content: the US series **alternates**
aspect ratio, 1:1.294 and 1:1.545 in turn, where the A series holds 1:1.414
through every fold. Verified against the dimensions. That is the real reason a
drawing does not scale cleanly between ANSI sizes, and it is worth a page saying
so.

## 2026-09-02 — regression check across all 28 tools

Everything on this site was tested at some point, but the tools were driven
*before* today's changes to `layout.mjs` (the robots tag, the footer), to
`main.css` (the wrapping nav) and to `build.mjs`. Any of those could have broken
a tool without the static audits noticing, because they check markup rather than
behaviour.

Two passes, both automated in the browser:

1. **Syntax.** Fetched each tool page, pulled its inline script, and ran it
   through `new Function()` — all 28 parse.
2. **Runtime.** Loaded each page in a hidden iframe with an `onerror` handler
   and let it settle. **No uncaught errors on any of the 28.**

Two categories in the output needed reading rather than reacting to. Five tools
reported an empty output area — base64, case converter, JSON formatter, JSON to
CSV and URL encoder — which is correct: they start with an empty input and wait
for one. Eight reported "no output node", which only means they use element ids
outside my probe list. Neither is a defect, and both would have looked like one
if I had taken the numbers at face value.

Site is consistent end to end: 6,674 URLs in the local build, 6,674 in the live
sitemaps, and every section spot-checked at 200 — chmod, cidr, ascii, both new
calculators, the repaired 37.5 °C URL, about, privacy and file.

## 2026-09-02 — text-to-binary tool, and a genuine ambiguity

Checked three more niches before building anything. "text to binary" is held by
rapidtables, "sql formatter" by dpriver/codebeautify/red-gate, and "http header
reference" by MDN, W3C and OWASP. None is the clean opening chmod and CIDR were.

Built the text converter anyway, for a reason that does not depend on winning
the head term: it completes the ASCII section, and its per-character breakdown
links each code to its `/ascii/N/` page and back. Tool pages are also what
Google has actually been indexing here.

The differentiator is showing every representation at once — binary, hex,
decimal, octal, HTML entities and real UTF-8 bytes — rather than one conversion.
Verified against known values: "Hi" is 01001000 01101001, and "é☃" comes out as
3 characters and 6 bytes with the combining acute as CC 81 and the snowman as
E2 98 83, which is correct and is what a one-byte-per-character tool gets wrong.

**A real decode bug, and it is not fixable by guessing better.** `72 105` is the
decimal for "Hi". It decoded to `:E`, because my format detection tried octal
first and every digit in `72 105` is a valid octal digit. The input is genuinely
ambiguous — it is valid decimal *and* valid octal and means different things in
each.

The fix is not a cleverer heuristic. Auto-detection now prefers decimal, which
is what people actually paste, **and the decoder names the format it read** so a
wrong guess is visible rather than silent, with an explicit format list to
override it. `48 69` is hex for "Hi" and also valid decimal; it reads as decimal
and says so, which is the honest outcome for input that carries no marker.

Also fixed a related case: `4869` with no separators was rejected, because a
single group parsed as one number (18537) rather than as two hex bytes. It now
falls through to fixed-width grouping when reading the groups as written yields
something that is not a byte.

**The escaping trap caught me again — fourth time.** Writing the tool's inline
JavaScript through a shell heredoc, `\s` reached the file as `\s`, and the
template literal then emitted a bare `s`, so `/[\s,]+/` shipped as `/[s,]+/`
and every decode failed. The rule I already wrote down and did not follow: for
anything containing backslashes, use the editor, not a heredoc. Fixed with Edit
and verified by reading the emitted JavaScript rather than the source.

## 2026-09-02 — ASCII reference, 129 pages

Third target picked the same way as chmod and CIDR: check who currently ranks
before writing anything. For "ascii table" the top results are ascii-code.com,
asciitable.com, theasciicode.com and commfront.com — single-purpose sites with
no authority behind them, the same profile chmod-calculator.com had. Regex was
checked at the same time and rejected: regex101, regexr and Stack Overflow hold
that ground.

Built `/ascii/` plus a page per code point. The angle that makes it worth having
rather than a 129th copy of the same table: **most tables render the control
characters as an empty cell**, and those get searched as much as the letters —
"what is ascii 13", "null character", "what does ctrl+d send". Every one of the
33 control characters gets a real explanation, including why Ctrl+C interrupts a
program (C is 67, Ctrl clears the top two bits, giving 3 = ETX, end of text) and
why DEL sits at 127 rather than with the other controls (all seven holes punched
on paper tape, and a hole cannot be un-punched).

Verified all 128 pages by computation rather than by eye: hex, octal, binary and
Unicode code point correct on every one.

**A false positive in my own checker, and the discipline that caught it.** The
structured-data check flagged six pages — ASCII 34, 60 and 62, the HTML-special
characters. The content was fine. The checker decoded `&amp;` and `&nbsp;` on
the visible side but not `&lt;`, while the JSON-LD carried a literal `<`, so the
two normalisations disagreed for exactly the characters the pages are about.
Both sides now go through one `decodeEntities`.

The important part: after changing a checker so an error goes away, I planted a
real mismatch to confirm it still fails. It did, and cleared on restore. Without
that step "fixed the checker" and "broke the checker" look identical from the
output.

## 2026-09-02 — improved the pages that can actually earn an impression

Only eight pages are indexed, so those eight are the only pages capable of
appearing in a search result at all. Audited them specifically rather than the
site as a whole:

| page | words | h2 |
|---|---|---|
| / | 1,085 | 9 |
| /color/ | 1,063 | 2 |
| /convert/ | 842 | 7 |
| /dev/ | 559 | 4 |
| /markdown-to-html/ | 464 | 6 |
| /port/ | 426 | 3 |
| /tools/ | 404 | 5 |
| /color/228b22/ | 360 | 6 |
| **/file/** | **294** | **11** |

`/file/` stood out: 294 words under eleven headings, because nine of them were
bare category labels sitting above a table. Two sections of actual prose for a
hub gating 34 pages, and one of only eight pages Google has taken.

Rewrote it to 992 words: a magic-number table for identifying a file when the
extension is missing or wrong, a format-choice table for images with the
reasoning rather than just the properties, the same-content-different-extension
traps (.jpg/.jpeg are identical, .doc/.docx are not remotely), and the two
invisible differences in text files — encoding and line endings.

Verified every hex signature and its ASCII rendering by computation rather than
from memory: all ten correct.

**The broken-link check paid for itself again.** Three of the format links I
added pointed at `/file/jpg/`, `/file/png/` and `/file/gif/`, which do not
exist — that section deliberately covers the less common formats. The audit
named all three immediately. Removed the links, kept the names.

One thing to remember when verifying a deploy: an un-busted URL comes back from
Cloudflare's edge cache and can report the old content. The first check said the
new section was not live; a cache-busting query string showed it was.

## 2026-09-02 — the thin pages, and a slug bug hiding among them

Ran the content-depth report properly for the first time and worked the tail
rather than the median. Seven indexable pages were under 200 words; the median
is 425.

**A real URL bug surfaced while reading that list.** Temperature slugs were
built with chained replaces:

    String(raw).replace('.', '-').replace('-', 'minus-')

For a negative that works. For 37.5 it does not: the decimal point becomes a
dash first, and the sign substitution then matches *that* dash, producing
`/convert/37minus-5-celsius-to-fahrenheit/`. Four published URLs were nonsense,
and 37.5 °C is body temperature — one of the higher-demand queries in the whole
temperature set. Sign and decimal point are separate concerns and are handled
separately now. The old URLs had already gone into the sitemap and IndexNow, so
they are 301s rather than fresh 404s; verified live.

**Thin pages, fixed by section:**

- `/about/` 89 → 483 words. It is the page that says who is behind the site,
  which is one of very few trust signals a domain with no history can offer.
- `/privacy/` 169 → 540, and more importantly corrected. It promised "contact
  details listed on the about page" that did not exist, and hedged analytics as
  something we "may" use — Cloudflare Web Analytics is in fact active, injected
  at the edge rather than present in our source, which is why it did not show up
  in a grep of the repo but did show up as a subresource when I measured load
  performance. A privacy policy is the wrong page to be vague on.
- Four category hubs at 124–139 words. Same shape as `/convert/` when Google
  fetched it and declined to index it: a table and a link list, no prose. Each
  gates its own pair pages. Wrote per-category notes for all twelve, plus the
  temperature hub, which goes through the affine code path and so was missed by
  the shared one. Every number in the temperature reference table was checked by
  computation before shipping.

Every indexable page is now over 200 words.

**And a defect I had introduced myself.** `/search/` was carrying two
conflicting robots tags — `index,follow` and `noindex,follow`. When I gave the
layout a `noindex` option earlier today I did not convert the one page that was
still setting the tag by hand through a raw `head` string, so both were emitted.
Fixed, and `scripts/audit.mjs` now fails on more than one robots meta per page.
Verified the check by planting a duplicate, seeing it caught, and seeing it
clear on removal — the same self-test the dead-code detector got.

## 2026-09-02 — first Reddit comment is live

The user pushed back on my only trying r/ccna, and was right. Broadening the
search found that subreddit strictness varies a lot:

| subreddit | outcome |
|---|---|
| r/ccna | hard age gate, hit directly |
| r/sysadmin | 24-hour gate, declared in submit text |
| r/webdev | self-promotion prohibited |
| r/SEO | AutoMod removes low-CQS accounts — saw the bot doing it inside a thread |
| **r/homelab** | **accepted the comment** |

Posted an answer on "Need a better understanding of the whole point of a
separate homelab network". The thread had four good answers on *why* to
segment, and none on *how to address* the segments, which is the part our CIDR
work actually covers. The comment gives the one-/24-per-VLAN-with-the-ID-in-the
-third-octet convention, warns against sizing tightly, and suggests a concrete
layout including a management VLAN. No link.

Verified it is genuinely public rather than shadow-removed: the thread's
comment count went 6 → 7 and the comment appears in the tree. An earlier check
said it was invisible, but that was a false negative — the author list came
back redacted, so "not found" meant "could not read", not "not there".

Two things worth carrying forward:

**Post through the API, not synthetic keystrokes.** The earlier attempt fired a
long key sequence at a page with single-key bindings and ended up saving and
hiding a post. `POST /api/comment` with the modhash is deterministic and has no
stray-input surface. Reddit's composer is inside a shadow DOM anyway, so the UI
route was never going to be reliable.

**One comment is the right pace.** A day-old account posting several comments in
quick succession is the exact footprint that gets flagged, and CQS is built
from comments that earn upvotes rather than from volume.

## 2026-09-02 — Reddit, measured rather than assumed

The user logged in a Reddit account and asked me to find people looking for
tools like ours and recommend them, without it reading as advertising.

**The account is one day old with zero comment karma.** That turns out to
decide everything:

- r/ccna returned a hard block on my attempt: "You can't contribute in this
  community yet ... u/DahyCC is 1 day old." Not a karma gate, an age gate, and
  it applies to plain comments with no link at all.
- r/sysadmin states in its own submit text that accounts under 24 hours cannot
  post.
- r/webdev prohibits self-promotion outright.
- r/ccna's self-promotion rule requires being an *active contributor* first and
  names the failure mode exactly: "no drive by self-promotion". We satisfy its
  other two conditions (relevant, free with no registration) and fail that one
  completely.

**I caused a side effect and had to clean it up.** Typing the comment through
synthetic keystrokes, some keys landed on the page rather than in the text box
and Reddit read them as single-key shortcuts — the post ended up saved and
hidden on the user's account. Reversed both via /api/unsave and /api/unhide
(both HTTP 200, saved and hidden lists back to zero) and told the user. The
lesson is to drive text fields through form_input or verify focus first, rather
than firing a long key sequence at a page with single-key bindings.

**The finding that overturned the plan.** PROMOTION.md led its r/SideProject
copy with "privacy-first, 100% client-side toolkit". Two existing posts with
essentially that exact pitch:

- one 10 hours old — score 1, zero comments
- one 30 days old — score 1, zero comments

Score 1 is the author's own upvote, and the median new post there also scores
1. The angle is saturated and invisible, not unlucky. Checking the week's top
25 showed what does work: a playful visual (nail-sorting simulator, 996), a
specific surprising number, a cost comparison, a personal story, or a
contrarian claim. **Not one of the top 25 was a general dev-tool collection.**

Rewrote PROMOTION.md around the specific technical failures instead — the QR
format-bit bug, the .top TLD blocklist, the 2,191-page island, the dead
lastmodOf. Those are genuinely uncommon and they are what this audience reads.

Nothing was posted. The one action the user approved — a no-link answer in
r/ccna — was refused by Reddit itself.

## 2026-09-02 — a checker for the failure mode that keeps recurring

Finding `lastmodOf()` dead made the pattern worth naming. Three times now a fix
of mine has looked complete and done nothing, and twice the checker I wrote to
catch a class of problem could not see the instance in front of it.
`sitemap-check.mjs` validated that lastmod was a well-formed date, which the
build date always is.

`scripts/dead-code.mjs` reports module-level declarations that are computed and
never read. It is deliberately conservative — module scope only, and a name
counts as used if it appears on any line but its own declaration — so it will
miss some dead code rather than produce noise nobody reads.

Two lessons applied while writing it:

**I tested the detector before trusting it.** The first version reported all
215 top-level declarations in the project as unused, which is obviously wrong.
Cause: the quoted heredoc still ate one level of backslash, so `'\b'` reached
the file as `''` — a backspace character rather than a word boundary — and
nothing matched. This is the same escaping trap that has corrupted generated JS
several times here; the reliable answer, again, is to write the file with the
editor rather than through a heredoc.

**Then I verified it can actually fail.** Planted a deliberately dead symbol,
confirmed it was reported, removed it, confirmed the report went away. A
checker that says "all clear" is worthless until you have watched it say
something else.

Real findings: `$` in build.mjs was a false positive (`` cannot bound a
non-word character — fixed with an identifier-class lookaround), and an unused
`cap` helper in `src/gen/cidr.mjs`, now removed. `lastmodOf` no longer appears,
which independently confirms this morning's fix landed.

Added `npm run audit`, `npm run audit:full` and `npm run check`. Running six
scripts from memory is how a check gets skipped.

## 2026-09-02 (evening) — /convert/ is indexed, and lastmod never worked

**`/convert/` is now indexed.** This morning URL Inspection said "已抓取 - 尚未编入索引"
(crawled, not indexed); it now says "网页已编入索引". That is the hub gating 4,200
pages. The `site:` listing still shows the old 8 URLs — it lags the inspection
tool, which reads live index status, so inspection is the one to trust.

`/cooking/` is still "Google 无法识别此网址" — never crawled, no referring page
detected. It gates 991 pages.

**Found a real structural imbalance.** Counting inbound internal links per hub:

| hub | pages gated | inbound links |
|---|---|---|
| /convert/ /color/ /image/ /text/ /ai/ | — | 6,545 (in the top nav) |
| /cooking/ | 991 | 992 |
| /roman/ | 328 | 328 |
| /cron/ /http/ /port/ /file/ /paper/ /chmod/ /cidr/ | 254 | 31–60 |

Internal link count is one of the clearest signals of which pages a site
considers important, and the site was saying the opposite of what is true.
Added the reference hubs to the site-wide footer: every one now has 6,545
inbound links and is linked from all eight pages Google has already indexed.

**Then found that the lastmod fix never worked at all.** The footer change
dirtied all 6,544 content hashes, which is what sent me looking. Two problems:

1. The hash covered the whole body including header, nav and footer, so a
   chrome change marked every page as modified. Now stripped, the same way
   `<head>` already was.
2. Much worse: the sitemap writes `${now}` — the build date — for every URL.
   `lastmodOf()` was computed and then **used nowhere**. `grep` confirms it:
   defined at line 550, zero call sites. The entire content-hashing mechanism
   has been dead code since it was written, and every deploy has been telling
   Google all 6,500 pages changed that day.

Fixed, and the dates restored from the committed stamp file so the footer
change did not falsely date everything today. The sitemaps now carry real
per-page dates: 3,349 URLs at 2026-09-01 and 3,195 at 2026-09-02.

Worth naming the pattern: this is the third time a fix of mine looked complete
and was not, and the second time the checker I wrote could not see the problem
it was written to find. `scripts/sitemap-check.mjs` validates that lastmod is a
well-formed date — which `${now}` always was.

## 2026-09-02 — CIDR subnet calculator and a 33-page prefix reference

The second target from the research. Same reasoning as chmod: low-authority
incumbents on the head term (jodies.de and cidr.xyz alongside mxtoolbox), a
natural long-tail matrix, and it sits under /dev/, which Google has indexed.

`subnet-calculator` takes CIDR notation and returns the network, broadcast,
mask, wildcard, usable range, host count and address classification, plus a
binary view showing where the network/host boundary falls and a table of what
the network splits into. `/cidr/` covers all 33 prefix lengths — the odd ones
get searched as much as the common ones.

Verified against an independently written mask table rather than against the
generator's own arithmetic: all 33 masks and usable-host counts correct.
Calculator checked on the cases that actually break implementations:

- `172.20.5.7/22` → network 172.20.4.0, broadcast 172.20.7.255, 1,022 usable
  (the non-octet-aligned case)
- `/31` → no broadcast, both addresses usable (RFC 3021)
- `/32` → single address, no broadcast
- `/0` → 4,294,967,294 usable. This one needed care: shifting by 32 in
  JavaScript shifts by 0 rather than clearing the register, so `maskOf(0)`
  is a special case rather than falling out of the arithmetic.
- CGNAT and link-local correctly classified; both invalid-octet and
  invalid-prefix inputs produce specific errors

Fixed one imprecision found while testing: `0.0.0.0` was reported as Public,
where `0.0.0.0/8` is reserved.

Site is now 6,544 pages across 27 tools. All audits clean, one unreachable page
(the 404, correctly).

## 2026-09-02 — researched what to build, and built it

The user's original brief included researching which tools to make. I had never
actually done that. The signal that made it worth doing now: of the 8 pages
Google has indexed, none is a generated conversion page. What got in was the
home page, four category hubs, a colour page and a *tool* page. Google is
taking the tools and the hubs, not the bulk matrices.

Searched candidate queries and looked at who ranks:

| query | who holds the top results | verdict |
|---|---|---|
| chmod calculator | chmod-calculator.com, chmodcommand.com, nettools.club, kbmisc.com | all tiny single-purpose domains — winnable |
| cidr subnet calculator | mxtoolbox, jodies.de, cidr.xyz | mixed; two of the three are small |
| sql formatter online | codebeautify, sqlformat.org, poorsql | established tool sites |
| yaml to json | onlineyamltools, jsonformatter.org, it-tools, codebeautify | crowded |

chmod wins on three counts: low-authority incumbents, a natural long-tail
matrix that Google's own "people also ask" spells out ("What is chmod 755 or
777?", "What chmod is drwxrwxrwx?"), and it sits under /dev/, which is one of
the four hubs already indexed.

Built `chmod-calculator` (checkboxes ↔ octal ↔ symbolic, including setuid,
setgid and sticky) and a 30-page `/chmod/` reference. Verified both against
canonical values rather than trusting the code: 1777→rwxrwxrwt, 2775→rwxrwsr-x,
4755→rwsr-xr-x, 6755→rwsr-sr-x and 10 others all correct, and the symbolic
input round-trips (rwxrwxrwt→1777).

**The reachability check earned its keep immediately.** The first build had all
30 chmod pages unreachable, because the only links to them were rendered by
script. Static markup instead, plus links from the home page. Unreachable is
back to 1 (the 404 page).

6,509 URLs pushed to IndexNow.

## 2026-09-02 (later still) — drove all 25 tools in a browser

Never verified anything but the QR encoder. Loaded each tool against a local
server and drove it with real input, checking output against known answers
rather than reading the code.

**Verified correct** — hash generator (SHA-256/384/512, SHA-1, MD5, CRC32 all
match the published digests for "abc"), base64 (UTF-8 round trip and a proper
error on invalid input), URL encoder, number base converter, roman numerals
(9 cases including IV, XL, CD, MMMCMXCIX), percentage calculator (all six
calculators), timestamp converter (1700000000 to 2023-11-14T22:13:20Z with the
right local offset), JWT decoder, colour converter (HEX/RGB/HSL/HSV/CMYK and
both contrast ratios recomputed by hand), word counter (17 words, 79 chars,
every platform length limit), age calculator (9,682 days across a leap-day
birth, exact), JSON to CSV (RFC 4180 quoting), regex tester (matches, indices,
capture groups, replacement), text diff (LCS), markdown converter, UUID
generator (10 unique, all valid v4), password generator, AI token counter.

**Three real defects, all fixed:**

1. **The JSON formatter's Unescape button did nothing** and reported success.
   `JSON.parse(s.startsWith('"') ? s : JSON.stringify(s))` — for input that is
   not already quoted, stringify escapes it and parse turns it straight back,
   so the branch was the identity function. Now wraps the text in quotes and
   parses that, escaping real newlines and tabs first. Built with
   `String.fromCharCode(92)` rather than literal backslashes, because this is
   inside a template literal where a backslash needs four levels of escaping —
   the exact trap that corrupted generated JS three times earlier.

2. **The cron explainer rendered `0 9-17 * * 1-5` as "At 1x9 times per day".**
   A template artifact: the fallback multiplied the minute count by the hour
   count. Contiguous hour runs now read as a range — "At minute 0 past every
   hour from 09:00 through 17:00, on Monday, ...".

3. **The AI token counter contradicted its own reference table.** The page
   states English prose runs ~4 characters per token; the calculator produced
   3.38, because five-letter words were charged two tokens. Corrected to
   one token up to six letters, two up to ten. It now scores the standard
   pangram at exactly 10 and "Hello, world!" at exactly 4, both matching a real
   BPE tokenizer, with prose at 4.46 chars/token.

Also cleared stale output in the JSON formatter: an invalid input left the
previous result on screen beside the error, which invites copying output that
does not match the input.

**Two false alarms I nearly reported as bugs.** The URL and Base64 tools looked
like their decode buttons were encoding — actually a two-pane design where
decode runs right-to-left, and I had put the encoded text in the plain-text
pane. Checked the source before claiming a defect. The `Math.random` hit in the
UUID generator was the FAQ text saying it does *not* use `Math.random`; the
code uses `crypto.getRandomValues` throughout, and the password generator does
rejection sampling to avoid modulo bias.

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
