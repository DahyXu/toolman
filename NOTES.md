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
