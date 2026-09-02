# Ready-to-post copy

Written to be posted from a real account. Every claim here is verifiable
against the site or the repo — nothing is inflated, because these audiences
check.

**Why this matters for the goal:** GitHub links are `nofollow`, so they help
discovery but pass no authority. A link from a Hacker News or Reddit thread
that gets any traction is followed and does pass authority, which is currently
the single biggest lever on how fast Google indexes the remaining 6,470 pages.

**Timing:** Show HN does best posted 08:00–11:00 UTC on a weekday. Reddit is
more forgiving. Do not post the same thing to several subreddits within a few
hours — that is what gets flagged as spam.

---

## Hacker News — Show HN

Title (80 char limit, this is 62):

```
Show HN: 6,478 browser-only web tools with no backend at all
```

Body:

```
I wanted a set of tools I could paste production data into without thinking
about it — API responses, JWTs, config files. Everything here runs as plain
JavaScript in the browser. There is no server to send anything to.

It is a static site: 25 interactive tools plus ~6,400 generated reference
pages (unit conversions, time zones, HTTP status codes, port numbers, cooking
measures). No framework, no runtime dependencies, no build dependencies beyond
Node itself. Mobile Lighthouse is 100 on performance.

Three things I did not expect going in:

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

I ended up writing five audit scripts that run against the built output, and
they found more than I expected: 2,291 FAQ answers whose structured data did
not match the visible page (each generator wrote the copy twice and the two
drifted), 61 form controls with no accessible name, and one URL that two
generators were both writing where one silently overwrote the other.

https://toolman.top
Source: https://github.com/DahyXu/toolman
```

**If it gets comments, the useful thing to say:** the generated pages are the
part people will push back on. The honest answer is that each one carries a
working converter, the exact formula, a full table and unit definitions — the
content-depth audit reports a 410-word median — but that it is fair to judge
them individually rather than as a category.

---

## r/webdev

Title:

```
I built a 6,478-page static site with no framework and no runtime deps — here's what broke
```

Body:

```
Static site, plain Node build script, no framework. 25 browser-only tools plus
~6,400 generated reference pages. Everything runs client-side; there is no
backend.

The interesting failures:

**Inlining CSS was not a performance decision.** Blocklists that cover the
whole .top TLD drop subresource requests, so my external stylesheet silently
404'd for anyone running one and the site rendered completely unstyled. I only
caught it because a test browser had a blocker installed. Inlining fixed it
and also removed a render-blocking round trip.

**lastmod from the build date is actively harmful.** Stamping every page with
the build date tells Google the whole site changed on every deploy, so it
re-crawls pages it already has. On a new site that spends crawl budget you
badly need elsewhere. It now comes from a content hash — a no-op rebuild
reports zero changed pages.

**Writing structured data twice guarantees it drifts.** Each generator wrote
FAQ copy once for the HTML and once for the JSON-LD. 2,291 answers no longer
matched the visible page, which silently costs you the rich result. Both now
come from one array.

Source is up if any of it is useful: https://github.com/DahyXu/toolman
Site: https://toolman.top
```

---

## r/SideProject

```
Title: 6,478 pages of free browser-only tools — no upload, no sign-up, no tracking

Every tool runs entirely in your browser. Paste an API response into the JSON
formatter, drop a photo into the image compressor, decode a JWT — none of it
is transmitted, because there is no backend to transmit it to. You can load a
page, go offline, and keep working.

25 interactive tools (JSON, Base64, hashes, QR codes, regex, cron, image
compression, favicons, AI token counting) plus reference material for the
things I look up constantly: unit conversions, time zones, HTTP status codes,
port numbers, cooking measures, paper sizes.

Free, no account, and it stays that way — it is a static site on Cloudflare's
free tier, so it costs me nothing to run.

https://toolman.top
```

---

## V2EX — 分享创造

```
标题：做了个 6478 页的纯前端工具站，全部在浏览器里跑，没有后端

想要一套可以放心粘贴生产数据的工具 —— API 响应、JWT、配置文件。所以做了个
完全跑在浏览器里的：没有后端，数据没有地方可去。

静态站，25 个交互工具 + 约 6400 个生成的参考页（单位换算、时区、HTTP 状态码、
端口号、烹饪换算）。没有框架，没有运行时依赖，构建依赖只有 Node 本身。移动端
Lighthouse 性能 100 分。

过程中两个没想到的坑：

QR 码生成器最难。第一版画出来的码看着完全正常，但任何扫码器都读不出来 ——
15 个格式信息位写反了字节序，第二个副本还覆盖了固定的暗模块。最后是把矩阵和
参考库逐格对比才定位到。现在跑了 335 个用例验证，覆盖版本 1-20 和全部四个纠错
等级。

CSS 是内联进每个页面的，这不是性能考虑 —— 是因为有些广告拦截列表直接屏蔽了
整个 .top 顶级域的子资源请求，导致外链样式表静默失败，整站没有样式。如果你也
用便宜的顶级域，这个值得知道。

https://toolman.top
源码：https://github.com/DahyXu/toolman
```

---

## What not to do

- Do not post to five subreddits at once. Pick one, see how it lands.
- Do not open with "check out my site". Both HN and Reddit downvote that
  reflexively; leading with a specific technical problem does much better.
- Do not describe the generated pages as "6,478 pages of content" — that
  reads as SEO spam. "25 tools plus generated reference material" is both
  more accurate and better received.
- If someone points out a bug, fix it and say so in the thread. That single
  behaviour converts more sceptics than any amount of description.
