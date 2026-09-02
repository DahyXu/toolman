# Ready-to-post copy

Written to be posted from a real account. Every claim here is verifiable
against the site or the repo — nothing is inflated, because these audiences
check.

---

## What was measured on 2026-09-02, and what it changed

I checked Reddit directly rather than guessing, and two findings overturned the
earlier version of this file.

**The "privacy-first client-side toolkit" angle is dead on r/SideProject.**
Two posts with essentially our exact pitch:

| post | age | score | comments |
|---|---|---|---|
| "tired of ad-bloated utility sites tracking my code, so I built a 100% private, client-side developer toolkit" | 10 hours | 1 | 0 |
| "I built a 100% client-side developer toolkit because I didn't want to paste sensitive data into random websites" | 30 days | 1 | 0 |

Score 1 is the author's own automatic upvote. Thirty days, zero comments. The
median score of a new r/SideProject post is also 1, so these are not unlucky —
they are invisible, and the pitch is saturated. The previous draft of this file
led with exactly that angle.

**What actually reaches the top of r/SideProject** (top 25 of the week): a
playful visual thing (a nail-sorting simulator, 996), a specific surprising
number ("read 9.2 million news articles in 145 days"), a cost comparison ("an
alternative to Vestaboard that doesn't cost $199/year"), a personal story ("I
code at 4 AM in Cuba because that's when the internet works"), or a contrarian
claim ("your AI-generated SaaS is 99.9% a waste of time — prove me wrong",
380 comments). **Not one of the top 25 was a general-purpose dev-tool
collection.**

So the copy below leads with the specific technical failures, which is the one
thing here that is genuinely uncommon. The tool collection is context, not the
headline.

## Account gates, verified from Reddit's own responses

| subreddit | what blocks us | source |
|---|---|---|
| r/ccna | Hard block: "Your account isn't old enough yet." Self-promo additionally requires being an *active contributor* — "no drive by self-promotion" | the dialog itself; the subreddit's written rules |
| r/sysadmin | "accounts less than 24 hours old will be unable to post" | the subreddit's own submit text |
| r/webdev | self-promotion prohibited | the subreddit's own submit text |
| r/SEO | AutoModerator removes comments from accounts with a low CQS (Contributor Quality Score) | a bot removal seen inside a thread |
| **r/homelab** | **nothing — a comment posted and is publicly visible** | verified: thread comment count 6 → 7 |
| r/SideProject | no gate found | — |

Gates are mostly invisible until you hit them: only r/sysadmin declares one in
its submit text, and r/ccna's did not appear until the attempt. But they are
not universal — **r/homelab accepted a comment from this one-day-old account**,
so the rule is per-subreddit strictness, not a blanket lockout.

CQS is the thing to grow, and it is built from comments that get upvoted, not
from votes cast. Upvoting to build standing does nothing for it and, done
systematically, is vote manipulation.

**Comment on fresh threads.** The r/homelab comment was genuinely useful and
sat at score 1 with no replies eight hours later. The thread was already twelve
hours old when it went up, which in a subreddit that size means it had left the
front page before the comment existed. Aim for threads under about three hours
old — the answer being good is necessary and not sufficient, because nobody
scrolls to a day-old thread to read it.

**The sequence that works** is the one r/ccna's rule spells out: become a
contributor first, link later. Comments that answer a question and contain no
link build both the karma and the history that every later link depends on.

---

## Hacker News — Show HN

Title (80 char limit, this is 62):

```
Show HN: 6,674 browser-only web tools with no backend at all
```

Body:

```
I wanted a set of tools I could paste production data into without thinking
about it — API responses, JWTs, config files. Everything here runs as plain
JavaScript in the browser. There is no server to send anything to.

It is a static site: 28 interactive tools plus ~6,600 generated reference
pages (unit conversions, time zones, HTTP status codes, port numbers, chmod
values, CIDR prefixes, cooking measures). No framework, no runtime
dependencies, no build dependencies beyond Node itself.

Four things I did not expect going in:

The QR encoder was the hardest part. My first version produced codes that
looked perfectly fine and that no decoder on earth could read. The 15 format
bits were being written LSB-first instead of MSB-first, and the second copy of
them skipped the dark module. I only found it by diffing my matrix against a
reference library cell by cell. It now decodes correctly across versions 1–20
and all four error-correction levels — I verified 335 generated codes.

CSS is inlined into every page, which I resisted for a while. It turns out
blocklists covering the entire .top TLD drop subresource requests, so the
stylesheet silently failed to load and the whole site rendered unstyled. Worth
knowing if you ever launch on a cheap TLD.

34% of the site was unreachable and I did not know. A parent page linked to
none of its children, so 2,191 pages linked only to each other — an island
nothing could walk into. My own audit reported zero orphans the whole time,
because every page in the island had inbound links from inside the island.
Checking for inbound links cannot find this; you have to walk the graph from
the home page.

The worst one: my fix for lastmod churn never ran. I hashed page content so
the sitemap would only report genuinely changed pages, and the sitemap kept
writing the build date, because the function was computed and never called.
Defined at line 550, zero call sites. Every deploy had been telling Google all
6,500 pages changed that day. I now have a check for exactly this.

https://toolman.top
Source: https://github.com/DahyXu/toolman
```

**If it gets comments, the useful thing to say:** the generated pages are the
part people will push back on. The honest answer is that each one carries a
working converter, the exact formula, a full table and unit definitions — the
content-depth audit reports a 410-word median — but that it is fair to judge
them individually rather than as a category.

---

## r/webdev — do not post a link here

Self-promotion is prohibited. The only viable route is answering questions in
threads where the answer stands on its own.

---

## r/SideProject

The privacy angle is measurably dead here (see above). Lead with the failure
instead — a specific bug story is what this subreddit rewards.

Title:

```
My QR codes looked perfect and no scanner on earth could read them
```

Body:

```
I wrote a QR encoder from scratch for a static tools site — no library, since
the whole site has no runtime dependencies. The output looked exactly like a
QR code. Sharp corners, clean timing patterns, correct quiet zone. Every
scanner I tried refused it.

The data was fine. The problem was the 15 format-information bits, which carry
the error-correction level and the mask pattern. I was writing them LSB-first
where the spec wants MSB-first, and the second copy of those bits was
overwriting the fixed dark module at (8, N-8).

Neither mistake changes how a code looks to a human. Both make it unreadable
to every decoder, because a scanner reads the format bits before it knows how
to interpret anything else. If those are wrong it never gets as far as your
data.

I found it by generating the same payload with a reference library and diffing
the two matrices cell by cell. The data area matched exactly on mask 2 — zero
differences — which proved the encoding was right and narrowed it to the
format bits.

Two lines:

  var bit = (fmt >> (14 - i)) & 1;   // was (fmt >> i) & 1
  if (i < 7) ...                      // was i < 8, which clobbered the dark module

It now decodes across versions 1–20 and all four EC levels; I verified 335
generated codes with jsQR.

Generator is here if it is useful: https://toolman.top/qr-code-generator/
Source: https://github.com/DahyXu/toolman
```

Why this shape: it is a specific bug with a satisfying cause, it teaches
something a reader can use, and the link is the last line rather than the
point. That matches what the top posts on this subreddit actually look like.

---

## r/ccna — comment only, no link, and not yet

Blocked by account age today. Once the gate lifts, this is the highest-value
place for us: subnetting questions recur constantly and `/cidr/` genuinely
answers them.

Drafted for the thread "What helped you finally understand subnetting?" — this
adds a method none of the existing three answers gave, and contains no link:

```
The thing that finally made it stick for me was noticing a mask octet can only
ever be one of nine values, because it's always a solid run of ones from the
left:

0, 128, 192, 224, 240, 248, 252, 254, 255

So the arithmetic becomes: divide the prefix by 8 for the number of full 255
octets, and the remainder picks the next one off that list. /26 is 3 full
octets, remainder 2, so 255.255.255.192. /20 is 2 full octets, remainder 4, so
255.255.240.0.

The useful side effect is that it's self-checking. If a mask has anything else
in it, like 255.255.255.100, you know it's wrong without doing any arithmetic.

That plus the network-bits/host-bits framing someone else mentioned covers
most of it. The bits idea tells you what you're doing; the nine values make
the arithmetic fall out.
```

Post several like this before ever linking. That is not politeness — it is the
literal precondition in r/ccna's self-promotion rule.

---

## V2EX — 分享创造

```
标题：做了个 6544 页的纯前端工具站，全部在浏览器里跑，没有后端

想要一套可以放心粘贴生产数据的工具 —— API 响应、JWT、配置文件。所以做了个
完全跑在浏览器里的：没有后端，数据没有地方可去。

静态站，27 个交互工具 + 约 6500 个生成的参考页（单位换算、时区、HTTP 状态码、
端口号、chmod 权限值、CIDR 前缀、烹饪换算）。没有框架，没有运行时依赖，构建
依赖只有 Node 本身。

过程中三个没想到的坑：

QR 码生成器最难。第一版画出来的码看着完全正常，但任何扫码器都读不出来 ——
15 个格式信息位写反了字节序，第二个副本还覆盖了固定的暗模块。最后是把矩阵和
参考库逐格对比才定位到。现在跑了 335 个用例验证，覆盖版本 1-20 和全部四个纠错
等级。

CSS 是内联进每个页面的，这不是性能考虑 —— 是因为有些广告拦截列表直接屏蔽了
整个 .top 顶级域的子资源请求，导致外链样式表静默失败，整站没有样式。

最糟的一个：全站 34% 的页面从首页走不到，而我不知道。父页面没有链向自己的子
页面，2191 个页面只互相链接，形成一座爬虫走不进去的孤岛。我自己写的审计一直
报告「孤儿页 0」，因为岛内每个页面都有入链 —— 只是入链全在岛内。查「有没有
入链」发现不了这个，必须从首页走一遍链接图。

https://toolman.top
源码：https://github.com/DahyXu/toolman
```

---

## What not to do

- Do not lead with "privacy-first client-side tools". Measured: score 1, zero
  comments, on two separate posts, one of them 30 days old.
- Do not post to five subreddits at once. Pick one, see how it lands.
- Do not link from an account with no history in that subreddit. r/ccna calls
  this "drive by self-promotion" in its rules, and it is the first thing a
  moderator looks for.
- Do not describe the generated pages as "6,674 pages of content" — that reads
  as SEO spam. "28 tools plus generated reference material" is both more
  accurate and better received.
- If someone points out a bug, fix it and say so in the thread. That single
  behaviour converts more sceptics than any amount of description.
