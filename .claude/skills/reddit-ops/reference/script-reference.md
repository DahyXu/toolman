# 脚本参数手册

所有脚本的通用参数：

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `--tab-id` | 是* | - | Tab ID（绝大多数脚本必需，标注例外的除外） |
| `--base-url` | 否 | `http://localhost:9867` | PinchTab 服务地址 |
| `--token` | 否 | `fakeToken` | 认证 token |
| `--profile-id` | 否 | - | 传入后自动查询对应的 base-url/token，可省略二者 |

> 显式传的 `--base-url`/`--token` 总是覆盖 profile 查询结果。

调用格式统一为：

```bash
cd $SCRIPTS && node <脚本名>.js --tab-id $TAB_ID [特有参数]
```

---

## 生命周期

### reddit-start — 启动实例

`--profile-id`（必填）。返回 `instanceId: <id>`。

profile 必须已存在，否则 404。详见 SKILL.md §2 ①。

### reddit-stop — 停止实例

`--instance-id`（必填）。

### reddit-open-tab — 打开标签页

`--instance-id`（必填）、`--url`（必填）。返回 `tabId: <32位十六进制>`。

拒绝帖子链接（URL 含 `/r/xxx/comments/`），必须用 `reddit-post-click` 点进去。

### reddit-close-tab — 关闭标签页

`--tab-id`（必填）。

---

## 列表与导航

### reddit-post-list — 浏览列表（滚动 + 收集 + 轻互动）

| 参数 | 默认 | 说明 |
|------|------|------|
| `--max-posts` | `20` | 最多收集数（传 `0` 会被当 NaN 回退到 20） |
| `--interest` | N(0.5, 0.2) | 控制滚动节奏，高兴趣慢滚多读 |
| `--enable-upvote` | 关 | 布尔 flag。开启后按每帖独立兴趣度随机点赞 |

在 feed 内做轻互动（开图 lightbox、看视频、翻图集），**不点进任何帖子**。
返回 `browseEndScrollY`，可传给 `reddit-post-click --browse-end-scroll`。

### reddit-post-list-update — 快速提取

`--max-posts`（默认 20，传 `0` = 不限）。无滚动无拟人，纯 DOM 快照。

### reddit-post-click — 点进帖子

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `--post-id` | 是 | - | `t3_xxx`，缺失返回 failed |
| `--entry` | 否 | `auto` | `title`/`body`/`comments`/`auto`。auto 探测可达性后加权：标题 0.6 / 评论 0.25 / 正文 0.15。**不校验枚举**，非法值当 auto |
| `--browse-end-scroll` | 否 | - | 来自 post-list 的 `browseEndScrollY`，约束向下搜索范围 |

支持滚动寻找被虚拟化卸载的帖子。

### reddit-back — 返回

无特有参数。详情页 50% 点页面返回按钮 / 50% 浏览器后退；其他页一律后退。

### reddit-enter-subreddit — 进入子社区

| 参数 | 必填 | 说明 |
|------|------|------|
| `--subreddit` | 是 | 社区名（**不带 `r/`**）。特殊 feed：`popular`/`news`/`explore`/`home` |
| `--raw-data` | 否 | 布尔 flag。额外提取社区头信息到 `data.rawData` |

优先点左栏"最近访问"或顶部导航，找不到走搜索（三种入口加权随机），全失败才 URL 兜底。

### reddit-change-sort — 切换排序

`--mode`（必填）：`hot`/`new`/`rising`/`top`。**没有 `best`**，非法值返回 failed。

通过点击 `shreddit-sort-dropdown` 菜单实现，不是直接改 URL。

### reddit-search — 搜索

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `--query` | 是 | - | 关键词 |
| `--type` | 否 | 随机 post/media | `post`/`community`/`comment`/`media`/`profile` |
| `--sort` | 否 | 浏览中轮换 | `relevance`/`hot`/`top`/`new`/`comments`（`community`/`profile` 静默忽略） |
| `--browse-count` | 否 | 随机 1–3 | 浏览结果数 |

~70% 逐字输入 + ~30% 粘贴。优先点下拉建议里的精确匹配，避开 `/answers/` 陷阱。

---

## 内容读取

### reddit-post-detail — 帖子详情

无特有参数。提取元信息、正文、媒体 URL、评论树（含投票状态）。

**建议在 browse-post 之前调用**，用它判断对该帖的兴趣度。

### reddit-browse-post — 浏览帖子

`--interest`（0~1，默认随机）。

前置：必须在帖子详情页（URL 含 `/comments/` 且存在 `shreddit-post`），否则 `invalid_page`。

按 `post-type` 分支：

| post-type | 行为 |
|-----------|------|
| `text` | 读正文，按兴趣度决定是否读完 |
| `image` | 点图开 lightbox → 停留 → Escape |
| `gallery` | 翻页浏览图集 |
| `video` | 读播放状态、按需点播放，兴趣度控制取消静音/全屏/画质/拖进度 |
| `link` | ~80% 概率中键开外链新 tab → 停留 12~155s → 滚动外站 → 关掉回原帖 |

阅读期间偶有「切到别的 tab 再切回」的分心行为。低兴趣时可能跳过正文/图片/评论。

### reddit-browse-subreddit — 逛右边栏

| 参数 | 默认 | 说明 |
|------|------|------|
| `--sections` | `stats,rules,mods,about,wiki,flair` | 逗号分隔 |
| `--flair` | `auto` | `auto`（命中 `--flair-prob` 才设）/`random`（强制）/`none`（不碰）。仅 sections 含 flair 时生效 |
| `--flair-prob` | `0.2` | auto 模式下设置 flair 的触发概率 |
| `--interest` | N(0.5, 0.2) | 派生 wiki 深入数（0–3）与 rule 展开条数（0–2） |

### reddit-check-subscribed — 列出已订阅社区

无特有参数。

⚠️ **名字有误导**：不是"检查是否订阅某社区"，是"列出全部已订阅社区名"，返回数组不是布尔。

### reddit-user-last-post — 用户最新帖

| 参数 | 必填 | 说明 |
|------|------|------|
| `--instance-id` | 是 | ⚠️ **用 instance-id，不是 tab-id** |
| `--user-url` | 是 | 如 `https://www.reddit.com/user/xxx/` |

### reddit-inbox-chat — 收件箱/通知

`--scope`（默认 `all`）：`check`（仅读徽章）/`chat`/`notifications`/`all`。非法值返回 failed。

**全部只读，不回复。**

### reddit-account-info — 逛自己主页

无特有参数。随机切 profile tab、偶尔看通知、滚动闲逛。

---

## 互动（有副作用）

### reddit-upvote — 点赞

| 参数 | 说明 |
|------|------|
| `--post-id` | 帖子 ID。详情页不传会自动检测，**列表页必传** |
| `--thing-id` | 评论 thing ID，传入则点赞评论而非帖子 |

自动检测是否已点赞，已赞返回 `skipped`。
拟人化：贝塞尔曲线移动 → 40% 微抖动 / 15% 游走后返回 → 点击抖动 → 移开。

### reddit-comment — 评论/回复

| 参数 | 说明 |
|------|------|
| `--text` | 评论内容 |
| `--reply-target` | 回复目标评论的 thing ID，不传则发顶层评论 |

按词分块输入（8–10 词一块），输入后复查。自动查重，相同内容返回 `skipped`。

### reddit-join-subreddit — 加入社区

`--checked`（布尔 flag）：只检测是否已加入，不浏览不加入，立即返回。

不传则模拟"逛逛再决定"——随机浏览列表或点进一帖，然后点 Join。

### reddit-share — 分享

`--post-id` / `--thing-id`（同 upvote 语义）。

从分享菜单随机选一项（copy-link / X / WhatsApp / native-share）。

### reddit-submit-post — 发帖

| 参数 | 必填 | 默认 | 说明 |
|------|------|------|------|
| `--title` | 是* | - | 标题（`--form-info` 模式可不传） |
| `--subreddit` | 是* | - | 目标社区（不带 `r/`） |
| `--body` | 否 | - | 正文（text 帖） |
| `--wrong-title` | 否 | - | 先打这个"错标题"，再 blur+删除+重打 `--title`（拟人化） |
| `--images` | 否 | - | 图片列表。`path` 模式逗号分隔，`url`/`base64` 模式 `\|` 分隔 |
| `--images-file` | 否 | - | 从 UTF-8 文件读图片列表（优先于 `--images`） |
| `--upload-mode` | 否 | `path` | `path`/`url`/`base64`。`path` 相对服务器 `StateDir/uploads/` |
| `--flair` | 否 | - | flair 文本，部分匹配（大小写不敏感） |
| `--tag-switches` | 否 | - | 逗号分隔：`isNsfw`/`isSpoiler`/`isCommercialCommunication` |
| `--save-draft` | 否 | 关 | 布尔 flag。存草稿而非发布（**图片帖不支持**，会 failed） |
| `--form-info` | 否 | 关 | 布尔 flag。仅列出该社区的 flair/tag 后退出 |

脚本自行导航到 `/submit`。发帖前不确定 flair 取值时，先用 `--form-info` 查一次。

### reddit-edit-avatar — 改头像

| 参数 | 默认 | 说明 |
|------|------|------|
| `--entry` | `auto` | `menu`/`profile`/`settings`/`auto`（menu 25% / profile 25% / settings 50%）。非法值当 settings |
| `--mode` | 随机 | `A`=lazy outfit / `B`=few parts / `C`=full mix / `D`=outfit+tweak |

付费配饰仅 ~20% 预览后关掉 paywall，**不实际购买**。

### reddit-account-settings — 改设置

`--action`：目前只支持 `hide-activity`（隐藏 profile 的 Content and activity）。

### reddit-login — 登录

| 参数 | 说明 |
|------|------|
| `--check` | 布尔 flag。**只检测登录状态，不登录** |
| `--username` | 用户名或邮箱 |
| `--password` | 密码 |

必须从 reddit.com 首页发起（脚本会找页头的 Log In 按钮）。

- 已登录同账号 → 直接 success（no-op）
- 已登录其他账号 → 先登出再登录
- 未登录 → 直接登录

### reddit-random-browse — 随机浏览

`--action`（不传则随机 1–2 个，去重乱序）：

```
displaymode | premium | achievements | profile-update
mod-tools | avatar-update | social-link | manage-communities
```

只做点击触发的操作，模拟真人随意点点。

---

## 不能直接运行的文件

以下是库文件，由其他脚本 import，**没有 CLI 入口**：

```
reddit-human.js            拟人化核心库，70+ 导出（鼠标、键盘、滚动、shadow DOM 定位器）
cli.js                     参数解析 + ActionResult 输出 + 退出码约定
reddit-video-interact.js   视频交互，详情页与列表页共用
reddit-listing-media.js    feed 内媒体交互，被 post-list 调用
```

## 依赖外部服务的脚本

以下会向外部接口发数据，**通用部署时通常用不上**，使用前确认目标地址：

```
reddit-account-update.js   注册后同步账号密码到业务后台（--api-url 可覆盖）
reddit-report-result.js    上报任务结果（--url 可覆盖）
reddit-auto-post.js        从远程 API 拉内容再发帖（--api-base 可覆盖）
```
