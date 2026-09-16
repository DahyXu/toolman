# reddit-ops

给 AI agent 用的 Reddit 自动化 skill。通过 PinchTab 驱动真实 Chrome 完成浏览、点赞、评论等操作。

**这份 README 是给人看的**，agent 只读 [SKILL.md](./SKILL.md)。

```
reddit-ops/
  SKILL.md                      agent 的行为规约（浏览流程、概率参数、错误处理）
  reference/
    script-reference.md         39 个脚本的完整参数手册
  js/
    package.json                只有 {"type":"module"}
    api.js                      PinchTab HTTP 客户端（原生 fetch）
    types/
    reddit/                     39 个预编译脚本
```

852 KB，45 个文件，零依赖。

---

## 安装

复制整个目录到目标 agent 的 skills 目录：

```
Claude Code / Claude Desktop   ~/.claude/skills/reddit-ops/
                               或 <项目>/.claude/skills/reddit-ops/（仅该项目生效）
OpenClaw                       按其插件目录约定
其他                           放进该 agent 的 skill/prompt 目录
```

**拷完就能用，没有安装步骤**——脚本已预编译为纯 JS，不需要 `npm install`，不需要 `tsx`。

目标机器只需要：

| 依赖 | 说明 |
|------|------|
| **Node.js 18+** | 原生 `fetch` 需要 18+ |
| **PinchTab 服务** | 可以是远程的，改 `$PINCHTAB_BASE_URL` 指过去即可，不必每台都部署 |

如果目标 agent 不支持 skill 机制，把 `SKILL.md` 当 system prompt 的一部分喂进去也能用——内容是自包含的。

---

## 配置

skill 通过三个变量定位服务和脚本，都有默认值：

| 变量 | 默认 |
|------|------|
| `$PINCHTAB_BASE_URL` | `http://localhost:9867` |
| `$PINCHTAB_TOKEN` | `fakeToken` |
| `$SCRIPTS` | `<本目录>/js/reddit` |

改服务地址时告诉 agent 即可，或写进目标项目的 CLAUDE.md。

---

## 从源码重新生成 js/

TS 源码在 PinchTab 仓库的 `build/plugin/`（`reddit/*.ts` + `api.ts` + `types/`）。
脚本更新后在仓库里重新编译，分发包本身不需要这一步：

```bash
cd build/plugin
./reddit/node_modules/.bin/esbuild reddit/*.ts api.ts types/*.ts \
  --outdir=../reddit-ops/js --outbase=. \
  --format=esm --platform=node --target=node18
echo '{"type":"module"}' > ../reddit-ops/js/package.json
```

esbuild 来自 `build/plugin/reddit/node_modules`（tsx 的依赖），那份 TS 开发环境需要先 `npm ci`。这是**开发侧**的事，跟分发无关。

### ⚠️ 编译后必须修补 cli.js

`runMain` 用文件名判断是否被直接执行，而各脚本传的是自己的 **`.ts`** 文件名：

```js
runMain(main, "reddit-post-list-update.ts");
```

转译后入口变成 `.js`，`endsWith(".ts")` 匹配不上就直接 return——**静默不执行，退出码 0，无任何输出**。这种失败很难查，务必改掉 `js/reddit/cli.js`：

```js
if (filename) {
  const entry = process.argv[1] ?? "";
  const alt = filename.replace(/\.ts$/, ".js");
  if (!entry.endsWith(filename) && !entry.endsWith(alt)) return;
}
```

一处改动覆盖全部 39 个脚本。

### 为什么能零依赖

`package.json` 声明的 `axios` 和 `minimist` **实际无人使用**（全项目零引用）。外部 import 只有 Node 内置模块：

```
node:path  node:fs  node:child_process  node:http  node:test  node:assert
```

HTTP 走原生 `fetch`，CLI 参数是 `process.argv.slice(2)` 手写解析。原本那 19MB `node_modules` 里唯一起作用的是 `tsx`，而它存在的唯一理由就是让 `.ts` 能直接跑——编译成 JS 之后这个理由就没了。

---

## 与仓库内其他 skill 的关系

`build/plugin/skills/` 下的 `reddit-farming`、`social-media/reddit-automation` 是**给虎牙生产环境用的**：脚本路径写死 `/data/plugin/reddit/`，结果上报打到内网接口。

`reddit-ops` 是它们的**可分发版本**——同一批脚本，去掉了环境绑定，任何机器拷过去都能跑。
