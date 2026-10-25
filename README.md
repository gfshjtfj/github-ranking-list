# GitHub 星标排行榜

一个**单页、零依赖、无需构建**的 GitHub 高星项目排行榜：总榜 / 年榜 / 月榜 / 周榜，可按类别筛选、搜索、排序，右上角一键更新，桌面和手机都能用，支持深色模式。

> **在线体验**：暂未部署在线演示。下载仓库后双击 `index.html` 即可运行（联网拉 GitHub 实时数据，断网自动用内置快照）。
> 想挂到网上，按下方「部署到 GitHub Pages」三步操作，拿到地址后把这一行替换成真链接。

本地直接双击 `index.html` 就能打开（不需要装环境、不需要起服务）。

## 在线预览与下载

**在线预览不需要自己买服务器、不需要部署后端**：整站是纯静态的（HTML + CSS + 原生 JS，没有构建步骤、也没有数据库），推到 GitHub 后开启 GitHub Pages 就得到一个公开网址，别人点开即用。

| 想做的事 | 怎么做 |
| --- | --- |
| 让所有人在浏览器里打开 | 开启 GitHub Pages（见下方「部署到 GitHub Pages」） |
| 下载完整源码 | 仓库页绿色 **Code ▾** → **Download ZIP**，解压后双击 `index.html` |
| 下载「即点即用」的单文件 | 到 Releases 下载 `github-star-ranking.html`（约 84 KB），一个文件双击就能跑，CSS/JS/离线快照都内联在里面 |

单文件版由 `node tools/build-standalone.mjs` 从源码自动生成，改完源码重新跑一次即可。

![桌面端](preview/desktop.png)

## 功能

| 功能 | 说明 |
| --- | --- |
| 四个榜单维度 | 总榜（历史累计）、年榜、月榜、周榜，点击标签切换 |
| 分类筛选 | AI / 大模型、前端、后端、数据、云原生、移动端、开发工具、学习资源、系统底层、安全、其他，带数量角标 |
| 搜索 | 按仓库名、简介、语言、topic 实时过滤（按 `/` 聚焦搜索框） |
| 排序 | 星标数（多→少）、最近更新、名称 A→Z |
| 一键更新 | 右上角「更新」重新拉取当前榜单，并显示"更新于 X 分钟前" |
| 分页 | 「加载更多」每次追加 100 条（最多 3 页） |
| 项目信息 | 仓库全名、星标数、分叉数、语言、分类、topic、中文简介、GitHub 链接 |
| 深色模式 | 跟随系统，也可点月亮按钮手动切换（记忆选择） |
| 响应式 | ≥1200px 四列，900px 三列，640px 以下单列；手机端工具栏自动换行 |
| 离线兜底 | 连不上 GitHub 时自动显示内置快照（星标前带 `≈`），不会白屏 |
| 可选配置 | 填 GitHub Token 提升额度；填自己的反代前缀解决网络问题 |

手机端：

![移动端](preview/mobile.png)

深色模式：

![深色模式](preview/desktop-dark.png)

## 榜单是怎么算的

星标数是 GitHub 上的实时累计值，接口**没有**"本月新增星标"这类数据，所以：

- **总榜**：`stars:>=1000` 按星标降序，即历史累计最高；
- **年榜 / 月榜 / 周榜**：`created:>=(今天-365/30/7 天)` + `stars>=N` 按星标降序，含义是**该时间段内新建、且星标最高的仓库**（新项目榜）。

页头每个榜单下面都有小字说明口径，避免误读。如果你想要"涨星榜"，需要本地前后两次快照做差集，属于后续可扩展项。

## 数据来源与限流

请求顺序（自动降级，失败自动换下一个）：

1. GitHub 官方 `https://api.github.com`（填了 Token 才会带 Token）
2. `gh-proxy.com` 镜像
3. `api.kkgithub.com` 镜像
4. `corsproxy.io` / `allorigins.win` 中转

限流：未登录时 GitHub 搜索接口约 **10 次/分钟**，一小时上限也更低。页面一次刷新只发 1 个请求（翻页 1 个），所以正常使用不会触发；"更新"点太频繁可能短暂 403，此时页面会保留上次数据并提示。

**建议**：到 [GitHub Settings → Tokens](https://github.com/settings/tokens) 建一个只勾 `public_repo`（或只读）的 token，点右上角 ⚙️ 填进去，额度会高很多。Token 只存在你浏览器的 localStorage 里，只会发给 `api.github.com`。

## 中文简介从哪来

优先级：**内置人工字典**（100 多个常见项目） → **机器翻译**（MyMemory 免费接口，命中即缓存到本地） → **英文原文**（卡片上会有 `EN` 标记）。仓库简介本身就是中文的，会直接显示，不打标记。

机器翻译有每日额度，翻不完的会显示英文原文，这是预期行为。

## 离线 / 演示模式

- 自动：网络不可用时，页面自动回退到 `snapshot.js` 里的内置快照（约 90 个知名项目，星标是整理时的近似值，界面用 `≈` 标出），并显示黄色提示条，点「重试联网」即可再试。
- 手动：地址栏加 `?snapshot=1`，例如 `index.html?snapshot=1`，直接进离线演示，不发任何请求。

## 想改点什么

| 想改的东西 | 改哪里 |
| --- | --- |
| 分类规则（关键词 → 分类） | `core.js` 里的 `RULES`，顺序即优先级，前面的先命中 |
| 分类名称 / 图标 | `core.js` 里的 `CATEGORIES` |
| 榜单数量、时间跨度、星标门槛 | `core.js` 里的 `BOARDS`（`windowDays` / `minStars` / `pages`） |
| 中文简介字典 | `core.js` 里的 `ZH_DICT`（`"owner/repo": "简介"`） |
| 离线快照 | `snapshot.js`，字段见文件顶部注释 |
| 主题色 | `styles.css` 顶部的 CSS 变量（`--accent` 等） |

## 文件结构

```
github-star-ranking/
├── index.html      页面结构
├── styles.css      样式（主题变量 + 响应式）
├── core.js         纯逻辑：榜单定义、分类器、查询构造、筛选排序、格式化
├── snapshot.js     内置离线快照数据
├── app.js          界面渲染 + 网络请求 + 缓存 + 设置
├── tests/
│   └── selftest.js Node 自测（分类 / 查询 / 链接 / 排序 / 格式化 / 快照完整性）
├── tools/          开发脚本：无头浏览器验证 + 单文件版打包
├── preview/        截图
├── dist/
│   └── github-star-ranking.html  单文件版（自动生成，可直接双击）
├── LICENSE         MIT
└── .nojekyll       告诉 GitHub Pages 不要跑 Jekyll
```

## 部署到 GitHub Pages

1. 把代码推到 GitHub 仓库（分支 `main`）。
2. 仓库页 → **Settings** → 左侧 **Pages** → *Build and deployment* 里 Source 选 **Deploy from a branch**，Branch 选 **main** + **/(root)**，点 **Save**。
3. 等 1–2 分钟并刷新，页面顶部出现 `Your site is live at …`，那个地址就是演示地址；同一页的 **Visit site** 按钮也能直接打开。

项目全部用相对路径，放在子目录下也能正常工作；`.nojekyll` 已经放好，不需要构建步骤。

**打开是 404 时按顺序检查**：

- Pages 页面顶部有没有 `Your site is live at …`？没有就是还没构建完（再等 1–2 分钟）或没点 Save。
- 分支选的是不是 `main`、目录是不是 `/ (root)`？选错就会 404。
- 仓库里 `index.html` 是否在**根目录**（不是套在 `github-star-ranking/` 子目录里）？网页上传时多套一层目录最容易踩这个坑。
- 仓库 **Actions** 标签里有没有失败的 `pages build and deployment`？失败点进去看报错。
- 仓库是 Private 的话，Pages 需要 Pro/Team 才能用；公开仓库免费。

## 自测与打包

```bash
# 纯逻辑自测（67 项，不需要浏览器）
node tests/selftest.js

# 界面冒烟测试（27 项，需要 Edge/Chrome，离线快照模式即可跑）
msedge --headless=new --remote-debugging-port=9334 --user-data-dir=%TEMP%\eg about:blank
node tools/ui-smoke.mjs --url=file:///<绝对路径>/index.html?snapshot=1 --port=9334

# 生成 dist/github-star-ranking.html 单文件版
node tools/build-standalone.mjs
```

## 已知限制

- 没有后端，所有数据在浏览器里直接取；本地缓存 10 分钟，重复打开更快。
- 月榜 / 周榜是"新建项目榜"，不是"涨星榜"（GitHub 不提供后者）。
- 分类是关键词启发式判断，个别项目可能归错类，可直接在 `snapshot.js` / `RULES` 里修。
- 机器翻译依赖第三方免费接口，额度用尽或网络不通时显示英文原文（带 `EN` 标记）。
- 星标实时值以 GitHub 为准；快照里的 `≈` 数字只是兜底展示。

## 许可证

[MIT](LICENSE) © 2026 <你的名字>

