---
name: reddit-ops
description: "在 reddit.com 上执行拟人化自动化操作：浏览帖子、点赞、评论、进入社区、搜索、发帖。通过 PinchTab 浏览器服务驱动真实 Chrome，所有动作走 CDP Input 域保证 isTrusted=true。当任务涉及 Reddit 内容浏览、互动、账号养号或数据采集时使用本 skill。自包含，无需其他 reddit-* skill。"
metadata:
  version: "1.0"
  created: "2026-09-11"
  requires:
    services:
      - "PinchTab server (默认 http://localhost:9867)"
    bins:
      - node          # 18+，无需 npm/npx，脚本已预编译
  optional:
    skills:
      - humanizer          # 评论去 AI 化，发评论时建议加载
      - reddit-community-styles
---

# Reddit 自动化操作

通过 PinchTab 驱动真实 Chrome 在 reddit.com 上模拟人类操作。**你（agent）是编排者**——脚本只负责把单个动作做得像人，什么时候调、调几次、要不要调，由你决定。

---

## 0. 开工前：一项检查

脚本已预编译内置，**零依赖**——不需要 `npm install`，不需要 `tsx`，只要有 Node.js 18+ 就能跑：

```
reddit-ops/
  SKILL.md
  reference/script-reference.md
  js/
    package.json          仅 {"type":"module"}
    api.js                PinchTab HTTP 客户端（原生 fetch）
    types/
    reddit/               ← $SCRIPTS，39 个脚本在这里
```

唯一要确认的是服务在不在：

```bash
curl -s -H "Authorization: Bearer $PINCHTAB_TOKEN" $PINCHTAB_BASE_URL/health
```

不通就停下来告诉用户，不要硬着头皮往下走。

默认值：

| 变量 | 默认 |
|------|------|
| `$PINCHTAB_BASE_URL` | `http://localhost:9867` |
| `$PINCHTAB_TOKEN` | `fakeToken` |
| `$SCRIPTS` | `<本 skill 目录>/js/reddit` |

`/health` 返回里留意两处：`allowedDomains` 必须含 `www.reddit.com`，否则导航会被拒；`instances` 是当前运行中的实例数。

---

## 1. 调用约定（三条硬规则）

### 用 `node` 直接跑 `.js`

```bash
cd $SCRIPTS && node <脚本名>.js --参数
```

脚本是预编译的 ESM，零外部依赖（只用 `node:path`/`node:fs` 等内置模块和原生 `fetch`）。
不要用 `npx tsx`，也不需要装任何东西。

### 只读 stdout 最后一行

脚本前面可能打若干日志，**只有最后一行是 JSON**：

```typescript
interface ActionResult {
  status: "success" | "skipped" | "invalid_page" | "failed";
  message: string;
  data?: Record<string, unknown>;
}
```

| status | 含义 | 你该怎么做 |
|--------|------|-----------|
| `success` | 成功 | 继续 |
| `skipped` | 前置不满足或已操作过（如已点赞） | **不是错误**，继续下一步 |
| `invalid_page` | 当前页面不符合该脚本的前置要求 | 检查是否走错页面，通常是流程顺序错了 |
| `failed` | 元素没找到、参数缺失、点击没生效 | 看 message 决定重试还是跳过 |

退出码：`0` = success/skipped，`1` = invalid_page/failed。**同时检查退出码和最后一行**。

### 禁止绕过脚本

- 不要直接 curl PinchTab 的 `/tabs/.../evaluate`、`/navigate` 等端点操作 Reddit
- 不要自己写 JS 注入页面
- 不要往脚本目录里添加自己写的脚本

例外：启动实例那一步（见 §2）在没有现成 profile 时允许直接调 API。

---

## 2. 标准流程

```
① 启动实例  → instanceId
② 开 tab    → tabId          ← 全程复用这一个
③ 登录检测
④ 取列表    → posts[]
⑤ 循环：点进 → 浏览 → (可选)点赞 → (可选)评论 → 返回
⑥ 收尾：关 tab → 停实例
```

### ① 启动实例

优先走脚本：

```bash
cd $SCRIPTS && node reddit-start.js \
  --base-url $PINCHTAB_BASE_URL --token $PINCHTAB_TOKEN --profile-id $PROFILE_ID
```

> ⚠️ **profile 必须已存在于磁盘**。`reddit-start.js` 调的是 `POST /profiles/{id}/start`，profile 不存在会返回 `{"status":"failed","message":"404 Not Found"}`。
>
> **PinchTab 没有创建 profile 的 API**（`/profiles` 只有 `{id}/start`、`{id}/stop`、`{id}/instance`）。本地调试没有现成 profile 时，改用：
>
> ```bash
> curl -X POST -H "Authorization: Bearer $PINCHTAB_TOKEN" \
>   -H "Content-Type: application/json" -d "{}" \
>   $PINCHTAB_BASE_URL/instances/start
> ```
>
> 它会自动建一个临时 profile 并返回 `id`（即 instanceId），之后从步骤② 正常接回。

**僵尸实例防护**：启动前先查该 profile 有无残留实例，有就先 `reddit-stop.js` 强停，确保环境干净。

### ② 开 tab

```bash
cd $SCRIPTS && node reddit-open-tab.js \
  --base-url $PINCHTAB_BASE_URL --token $PINCHTAB_TOKEN \
  --instance-id $INSTANCE_ID --url https://www.reddit.com/
```

返回 `tabId: <32位十六进制>`。提取方式：

```bash
... | grep -oP 'tabId: \K[A-F0-9]+'
```

**这个 tabId 要贯穿整个任务**，后面每个脚本都传它。

> Reddit 可能返回带 `js_challenge=1&jsc_token=...` 的 URL，这是它的 JS 挑战。只要 `title` 正常（`Reddit - The heart of the internet`），说明已经过了，直接继续。

> `reddit-open-tab.js` 拒绝导航到帖子链接（URL 含 `/r/xxx/comments/`），必须用 `reddit-post-click.js` 点进去。这是防风控设计，真人不会凭空跳进详情页。

### ③ 登录检测

```bash
cd $SCRIPTS && node reddit-login.js \
  --base-url $PINCHTAB_BASE_URL --token $PINCHTAB_TOKEN --tab-id $TAB_ID --check
```

- `{ loggedIn: true }` → 继续
- `{ loggedIn: false }` → **停止任务并上报**，不要自己尝试登录（除非用户明确给了账号密码）

### ④ 取列表

```bash
# 带滚动 + feed 内轻互动（推荐，更像真人）
cd $SCRIPTS && node reddit-post-list.js --base-url ... --token ... --tab-id $TAB_ID

# 纯快照，无滚动无拟人（只在需要快速采集时用）
cd $SCRIPTS && node reddit-post-list-update.js --base-url ... --token ... --tab-id $TAB_ID
```

返回的每个帖子含 30+ 字段，你需要关注的：

```
id                  t3_xxxxxx     → 传给 post-click / upvote 的 --post-id
permalink           /r/xxx/comments/...
post-type           text | image | gallery | video | link
subreddit-name      不带 r/ 前缀
score / comment-count / upvote-ratio
nsfw / spoiler      布尔
feedindex           在 feed 中的位置（可能不连续，跳号通常是广告）
```

### ⑤ 循环处理每个帖子

```bash
# 点进详情页（同 tab 导航）
node reddit-post-click.js --tab-id $TAB_ID --post-id t3_xxxxxx

# 浏览（--interest 0~1 控制深度，见 §3）
node reddit-browse-post.js --tab-id $TAB_ID --interest 0.65

# 点赞（interest 高时才做，见 §3）
node reddit-upvote.js --tab-id $TAB_ID --post-id t3_xxxxxx

# 评论（低频，见 §3）
node reddit-comment.js --tab-id $TAB_ID --text "..."

# 返回列表
node reddit-back.js --tab-id $TAB_ID
```

**切页优先用 `post-click` 保持同一 tab**。点击失败才走兜底：

```
close-tab → open-tab(帖子 URL) → browse-post
```

严禁不关旧 tab 就开新 tab。

### ⑥ 收尾（无论成功失败都要做）

```bash
node reddit-close-tab.js --tab-id $TAB_ID
node reddit-stop.js --instance-id $INSTANCE_ID
```

任务中途出错、超时、被中断——都要执行这套，不能留后台进程和僵尸 Chrome。

---

## 3. 行为参数（这部分由你决定，脚本不管）

脚本被调用就一定会执行。**要不要调、调多少次，是你掷骰子**。

### 兴趣度 interest（0~1）

同一个帖子的 browse / upvote / comment 应该**传同一个 interest**，让行为前后一致——真人不会草草扫过却又认真评论。

建议先 `reddit-post-detail.js` 看一眼内容再定值，或按正态分布 N(μ=0.5, σ=0.2) 随机，分布大致：

```
< 0.3   约 16%   低兴趣：快速扫过，不点赞不评论
0.3~0.7 约 68%   中等：正常浏览，可能点赞
> 0.7   约 16%   高兴趣：读完正文和评论，大概率点赞，可能评论
```

### 概率

| 动作 | 概率 | 说明 |
|------|------|------|
| 点赞 | 约 **60%** | 仅在 `browse_upvote` 类任务下 |
| 评论 | **5%~10%** | 日常养号务必控制在这个区间 |
| 浏览 | 100% | 点赞/评论前**必须**先 `browse-post` |

### 节奏

```
浏览后      sleep 3~5s
点赞/评论后  sleep 3~5s
```

不要连续无间隔调用脚本。

### 评论内容

- 保持 **30 词以内**
- 如果加载了 `humanizer` skill，评论文本必须先过一遍去 AI 化
- 打字的拟人化（高斯延迟、邻键错字、分块输入）脚本内部已实现，你只管给文本

---

## 4. 错误处理

| 现象 | 判断 | 处理 |
|------|------|------|
| HTTP 409 Conflict | **不是异常**，是业务状态（任务已在执行/状态冲突） | 视为成功，直接进下一步 |
| `status: skipped` | 已操作过或前置不满足 | 继续，不重试 |
| `status: invalid_page` | 当前页面不对 | 检查流程顺序；必要时 `reddit-back` 回列表重来 |
| `Cannot find module` | 没 `cd` 进 `js/reddit/`，或目录拷贝不完整 | 确认 `js/` 下 api.js、types/、reddit/ 齐全 |
| `404 Not Found`（start 阶段） | profile 不存在 | 见 §2 ① 的兜底方案 |
| `navigation target resolves to blocked private/internal IP` | Go 侧 SSRF 预检拦截（常见于 fake-IP 代理环境） | 这是服务端配置问题，报告用户检查 `trustedResolveCIDRs`，不要重试 |
| 单个帖子处理失败 | 局部失败 | 记录后跳过该帖，不中断整个任务 |
| 任务超时（建议 600s） | 视为"已尽力完成" | 走收尾流程并上报已完成部分 |

---

## 5. 任务轨迹

从头到尾在上下文里维护一份记录，任务结束时一并汇报：

```json
{
  "account": { "profileId": "prof_xxx", "username": "xxx" },
  "stats": { "posts_browsed": 5, "posts_upvoted": 2, "posts_commented": 1 },
  "trajectory": [
    { "postId": "t3_xxx", "feedIndex": 0, "subreddit": "r/xxx",
      "interest": 0.72, "action": "browse", "details": "image, 开 lightbox 看了图" },
    { "postId": "t3_yyy", "feedIndex": 2, "subreddit": "r/yyy",
      "interest": 0.81, "action": "upvote", "details": "点赞" }
  ]
}
```

同一任务周期内**记住已处理的 postId，不重复操作同一个帖子**。

---

## 6. 可用脚本

安全（只读，随便用）与有副作用（谨慎）分开列。完整参数见 [reference/script-reference.md](./reference/script-reference.md)。

### 🟢 只读

```
reddit-post-list          列表页滚动收集 + feed 内轻互动
reddit-post-list-update   纯快照提取，无滚动
reddit-post-detail        帖子完整结构（正文、媒体、评论树）
reddit-check-subscribed   列出已订阅社区（注意：不是"检查是否订阅"）
reddit-user-last-post     某用户最新一帖（⚠️ 用 --instance-id 不是 --tab-id）
reddit-inbox-chat         收件箱/通知，只读不回复
reddit-account-info       逛自己主页
```

### 🟡 浏览与导航（无持久影响）

```
reddit-post-click         点进指定帖子
reddit-browse-post        帖子详情页模拟阅读
reddit-back               返回上一页
reddit-enter-subreddit    进入子社区
reddit-browse-subreddit   逛子社区右边栏
reddit-change-sort        切换排序
reddit-search             全站搜索
reddit-random-browse      随机点点看看
```

### 🔴 有副作用（务必确认任务确实需要）

```
reddit-upvote             点赞
reddit-comment            发评论
reddit-join-subreddit     加入社区
reddit-share              分享
reddit-submit-post        发帖
reddit-edit-avatar        改头像
reddit-account-settings   改账号设置
reddit-login              登录（会改变登录态）
reddit-register           注册新账号
```

### ⚙️ 生命周期

```
reddit-start / reddit-stop / reddit-open-tab / reddit-close-tab
```

> 没列在上面的文件（`reddit-human.js`、`cli.js`、`reddit-video-interact.js`、`reddit-listing-media.js`）是**库文件，不能直接跑**，由其他脚本 import。
