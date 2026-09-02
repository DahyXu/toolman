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
