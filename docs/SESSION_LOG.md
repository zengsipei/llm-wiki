# LLM Wiki 会话对话记录 (SESSION LOG)

> 保留关键对话原文，让新会话理解每个决策的完整上下文和用户意图
> 新会话必须先读本文件，再读 CHANGELOG.md

---

## 平台与协作模式

本项目由 **z.ai 的 Agent 模式** 提供支持，用户通过 **微信 (WeChat)** 完成会话沟通，Agent 在云端沙盒中直接操作文件系统和终端完成开发，用户在 **PC 网页** 上手动发布更新后预览 `https://zengsipei.space-z.ai/` 的效果，通过微信反馈问题。

| 项目 | 说明 |
|------|------|
| **AI Agent 平台** | z.ai 的 Agent 模式，提供 AI 编程能力 |
| **沟通渠道** | 微信 (WeChat)，用户通过微信发送需求、截图、反馈 |
| **开发环境** | 云端沙盒 Linux 服务器，Agent 直接操作文件系统和终端 |
| **预览网站** | `https://zengsipei.space-z.ai/`（用户在 PC 网页上查看效果） |
| **部署方式** | 手动在 PC 网页上发布更新，PM2 重启 + Caddy 反向代理 |
| **代码托管** | GitHub: `https://github.com/zengsipei/llm-wiki` |
| **数据库** | SQLite (沙盒内文件型) |

**协作流程**: 用户微信发消息/截图 → Agent 接收 → 修改代码 → PM2 重启 → 用户 PC 网页预览 → 微信反馈 → 迭代

---

## 会话 1: 项目从零到一

### 用户需求
> "帮我创建一个 LLM Wiki 智能知识库系统，参考 Karpathy 的 llm-wiki 概念"

### 实现内容
- 完整的 Next.js 全栈应用：数据库 (Prisma + SQLite)、8 个 API 路由、前端 SPA
- 25 个 Wiki 页面内容（Claude/Opus 使用指南等 AI 实践知识）
- PM2 持久化部署 + Caddy 反向代理 + GitHub 推送
- 功能：页面 CRUD、AI 文档摄入、AI 知识问答、AI 健康检查、全文搜索、活动日志、Markdown 知识库导出、知识图谱可视化

---

## 会话 2: Markdown 渲染修复

### 用户反馈
> "表格显示不对，代码块没有语法高亮，编辑器里字体连字问题"

### 修复内容
- 添加 `remark-gfm` 插件支持 GFM 表格渲染
- 集成 `react-syntax-highlighter` + `oneDark` 主题，自定义 `CodeBlock` 组件
- 代码块添加：语言标签、复制按钮（Check/Copy 图标）、行号（>3行时显示）
- 用 `not-prose` class 防止 Tailwind Typography 插件干扰代码块样式
- 修复 `pre` 组件防止 Typography 的 `white-space: pre-wrap` 冲突

---

## 会话 3: TOC 目录系统 — 初始实现

### 用户需求（附参考截图）
> "【TOC 目录标题没有高亮；点击目录标题并不会滚动到对应标题；目录能折叠，但展示空间还占用在那，我给你个截图参考，未 hover 时类似灯条提示，hover 时是浮窗展示。】这个没完成"

### 实现方案
参考用户提供的 zread 文档详情页截图风格，重写了 TOC 系统：
- 右侧细灯条（40px）：进度条 + 发光追踪点 + 底部目录图标
- Hover 浮窗（w-72, 264px）：glassmorphism 头部 + 可滚动标题列表

### 初始 Bug（4 个问题）
> 用户: "1. 细灯条不跟随阅读位置移动 2. hover 能悬浮面板，但是面板也不随阅读移动，只在最上面，往下阅读就看不到了。3. 由于上一条，也就看不到，不过点击确实能滚动到大致标题 4. 未同步显示阅读进度。"

**修复**:
- Back-to-top 按钮监听在 `window` 而非 `<main>` → 修改为监听 `<main>` 的 scroll 事件
- TOC heading ID 不匹配：`nextHeadingId` 回调计数器有竞态条件 → 改为预计算 `headingIds` 数组从 `extractTocItems`
- HTML 注入被 ReactMarkdown 转义 → 改为 React 组件 props 方式分配 ID
- 折叠 TOC 仍占空间 → 新灯条设计替代

---

## 会话 4: TOC 目录系统 — 深度调试（最复杂的迭代）

### 问题 A: 点击跳转后标题被吸顶栏遮挡

> 用户（附截图）: "功能都实现了。但是点击目录跳转还是有点显示问题，可能滚动后开始顶部没有预留间距，选中跳转的标题被隐藏在吸顶的操作栏下面看不到，如图"

**修复历程**:

尝试 1: 给 heading 添加 `[scroll-margin-top:80px]` CSS + `el.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- 发现: `scrollIntoView` 在嵌套滚动容器 `<main>` 中**不尊重** `scroll-margin-top`（浏览器规范已知行为）

尝试 2: 手动计算 `el.offsetTop - 72` + `mainEl.scrollTo()`
- 发现: `el.offsetTop` 的 `offsetParent` 链不经过 `<main>`（`<main>` 无 `position: relative`）

最终方案: 用 `getBoundingClientRect` 公式:
```typescript
const getContentOffset = (el: HTMLElement, mainEl: HTMLElement): number => {
  return el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop
}
// 点击: mainEl.scrollTo({ top: offset - 48, behavior: 'smooth' })
```

---

### 问题 B: 高亮不跟随阅读位置（6 次迭代）

> 用户（附截图）: "目录所在标题和实际阅读进度标题没对上的问题，手动测试发现目录标题在实际的上面，问题展示如截图，有什么好的方式来处理最近提到的这种展示么"

**修复 v1**: 将固定的 `+80px` 改为 `mainEl.clientHeight * 0.2`（20% viewport 高度）

> 用户（附截图）: "当前依旧是不准确，有没有更简单更现代的友好解决方式呢。比如我看 zread 产品的文档详情，总是以视窗内最上面的标题来作为目录定位。类似这样的实现？"

**修复 v3（IntersectionObserver 尝试）**: 改用 IntersectionObserver 来检测标题可见性

> 用户（附截图）: "改出问题了。1. 现在变成一直高亮最后的某个标题；2. 跳转依旧没有达到 zread 类似的效果；3. 同步总出问题，可能是方案没选对"

**修复 v5（offsetTop 尝试）**: 添加 `getOffsetRelativeTo()` 递归函数遍历 offsetParent 链

> 用户（附截图，指出 3 个问题）: "1. 高亮基本对了，虽然还是从吸顶下算的，但是已经没有偏那么多了 2. 点击跳转依旧不对 3. TOC 扫描到了代码块内的注释作为标题，这是 bug"

**修复 v6（最终方案）**: 回归 getBoundingClientRect 公式，同时修复了 3 个问题

> 用户确认: "完美！功能性上都没问题了。"

**6 次迭代完整历程**:

| 版本 | 方案 | 用户反馈 |
|------|------|---------|
| v1 | `getBoundingClientRect` + 固定 `mainTop + 80px` | "高亮基本对了，虽然还是从吸顶下算的，但是已经没有偏那么多了" |
| v2 | `getBoundingClientRect` + `mainTop + 20% 视口高度` | "当前依旧是不准确，有没有更简单更现代的友好解决方式呢" |
| v3 | IntersectionObserver (root: mainEl) | "改出问题了。1. 现在变成一直高亮最后的某个标题" |
| v4 | IntersectionObserver + rAF 节流 | 仍然不工作，observer 只在元素进出根容器边界时触发 |
| v5 | rAF + `el.offsetTop` (offsetParent 链) | "1. 高亮基本对了...2. 点击跳转依旧不对...3. TOC 扫描到了代码块内的注释" |
| **v6** | **rAF + getBoundingClientRect 公式** | **"完美！功能性上都没问题了。"** |

**v6 为什么正确**:
- 公式 `el.rect.top - main.rect.top + main.scrollTop` 在数学上**不受 scroll 位置影响**（scroll 改变 rect.top 和 main.rect.top 同步变化，差值不变）
- 不依赖 CSS 定位上下文（不需要 `position: relative`）
- 高亮和点击用**同一个** `getContentOffset()` 函数，天然一致
- **算法方向修正**: 从"最后一个在阅读线上方的标题"改为"第一个在阅读线下方的标题"（zread 风格）
- `offsetTop` + `offsetParent` 链**失败**的原因: `<main>` 没有 `position: relative`，所以它不在 offsetParent 链中
- IntersectionObserver **不适用**的原因: 它只在元素进出根容器边界时触发，不会在内部 readingLine 位置触发

---

### 问题 C: 代码块注释被误提取为 TOC 标题

> 用户: "1. 高亮基本对了，虽然还是从吸顶下算的，但是已经没有偏那么多了 2. 点击跳转依旧不对 3. TOC 扫描到了代码块内的注释作为标题，这是 bug"

**原因**: 代码块中的 Python/Rust `# 注释` 被 `extractTocItems` 误识别为 Markdown 标题。

**修复**: 增加 `inCodeBlock` 状态追踪:
```typescript
let inCodeBlock = false
for (const line of lines) {
  if (line.trimStart().startsWith('```')) { inCodeBlock = !inCodeBlock; continue }
  if (inCodeBlock) continue  // 跳过代码块内的所有行
  // ... 正常提取标题
}
```

---

### 问题 D: Hover 交互 — 灯条到浮窗移动失败

> 用户: "完美！功能性上都没问题了。现在有个体验问题，TOC hover 窗口跟进度条之间的互动，从进度条移动到浮窗上大部分会失败，因为离开进度条hover，浮窗隐藏了，但是我明明鼠标已经在浮窗上了，你看有什么好的方式修复一下"

**首次修复**: 300ms 延迟定时器

> 用户反馈: "这种需要等加载一下么。感觉开始的几次还是不顺滑。有没有可能用伪类将面板与灯条搭边呢，这种可行么"

**最终方案**（用户提出的思路）:
- 灯条和浮窗包裹在**同一个** `fixed` 容器中
- 关闭时容器宽 36px（只响应灯条 hover）
- 打开时容器扩展到 328px（覆盖灯条 + 间隙 + 面板）
- **零死区**: 鼠标在灯条和面板之间移动永远不会离开容器
- 不需要定时器，代码反而少了 31 行

> 用户确认: "太棒啦，我们是冠军！"

---

### 问题 E: 项目记忆文档

> 用户: "项目从零到一不容易，加上后续的更新迭代。当前沙盒说不定什么时候就销毁了。我需要你将本次llm-wiki的每个点都记录下来，保存成可下载文件，可以分阶段多文件保存，目的是让新会话读取文件后，可以回忆整个过程，无缝继续项目，越详尽越好，最好保持原文对话，要求就是只包含llm-wiki项目相关。如果你觉得文件保存太原始，我觉得git管理当前会话对话记录可能也是一个很好的方案。"

**方案**: 在 Git 仓库中创建 `docs/` 目录，3 个文件纳入版本控制：
- `PROJECT_HANDOFF.md` — 架构全景 + 快速上手
- `CHANGELOG.md` — 开发历程 + 技术决策
- `SESSION_LOG.md` — 对话原文（本文件）

> 用户反馈（3 点）: "1. 整点报时定时任务，不属于llm-wiki项目，相关需要移除。2. 还有对话原文会不会保留较少，总结的始终是不能100%还原场景，因此原始对话很重要。3. 可以标出是由 z.ai 的 Agent 模式提供支持，连接的微信完成会话沟通，手动在 PC 网页上发布更新的 `https://zengsipei.space-z.ai/` 预览网站"

---

## 会话 5: HTML Effectiveness 研究（2026-05-21）

### 用户需求
> （通过 cron 触发自动摄入调研任务）调研 Anthropic 工程师 Thariq 的 HTML Effectiveness 理念

### 实现内容
- 摄入博文及配套 20 个自包含 HTML Demo
- 核心理念：AI Agent 应该直接输出可交互的 HTML 文件，而非纯文本 Markdown
- 创建 Wiki 页面「The Unreasonable Effectiveness of HTML」
- 新增 `/html-effectiveness` Demo 画廊页面（分类筛选、搜索、网格/列表视图）
- 20 个 Demo 放入 `public/html-effectiveness-demos/`

---

## 会话 6: 四步改进计划（2026-05-22 上午）

### 背景
数据库被 cron 意外清空后，确立了「md 做记忆，html 做展示」的架构。用户回到成都后讨论下一步。

### 用户对话
> 用户: "我已经回到成都。关于 wiki 系统，下一步计划是？"

Agent 提出四步改进计划，用户批准后开始执行。

> 用户: "那现在我们应该做什么，第一阶段不是完成了吗？"

确认 Steps 1-2 为第一阶段（已完成），Steps 3-4 为第二阶段。

> 用户: "继续下一步"

### Step 1（已在上一会话完成）: md 做记忆
- 创建 `wiki-content/` 目录，每个页面一个 `.md` 文件 + YAML frontmatter
- 双向同步脚本 `sync-to-md.mjs` / `sync-from-md.mjs`
- API 路由自动同步（创建/更新/删除页面时同步 .md 文件）

### Step 2: 展示层增强
- 重写 `markdown-renderer.tsx`：
  - Callout 组件：6 种类型（note/warning/tip/info/caution/danger），支持 `> [!type]` 语法
  - Mermaid 图表：动态 import，暗色模式自适应
  - 交互式代码预览：HTML/JS 代码块显示"运行"按钮，iframe sandbox 执行
  - 表格增强（圆角边框、悬停高亮）、图片增强（圆角阴影、alt 标题）
- 创建演示页面 `markdown-渲染增强演示.md`
- Commit: 2c5d827

### Step 3: Agent 生成 HTML 知识组件
- `POST /api/wiki/generate-widget` — LLM 分析页面内容生成交互式 HTML widget
- `GET /api/wiki/[id]/widgets` — 列出页面关联的 widget
- `GET /api/wiki/widget/[slug]` — 提供 widget HTML 文件
- WidgetPanel 组件：生成按钮、预览、全屏模式
- Commit: 674fe6d

### Step 4: flat-file CMS 架构收尾
- `POST /api/wiki/sync` — 运行 sync-from-md.mjs 自动同步
- `GET /api/wiki/[id]/history` — Git log 查询 .md 文件变更历史
- PageHistory 组件：可折叠面板，commit hash + 作者 + 时间
- MDXEditor 替换 textarea（dynamic import SSR-safe，工具栏，Ctrl+S 保存）
- Commit: 157df76

---

## 会话 7: 文档恢复 + grahify-kb 摄入（2026-05-22 下午）

### 用户对话
> 用户: "我已经在成都了。如果你觉得第二阶段优先级不高，那么就先帮我把之前丢失的文档补上，要求尽可能还原。最后预览地址已经变更为 `https://zengsipei.space-z.ai`，但是部署更新失败了。"

### 三个任务
1. 还原 25 篇丢失的 Wiki 文档
2. 更新预览地址
3. 修复部署

### 执行结果
- 还原 17 篇文档，总计恢复到 25 篇
- 预览地址更新为 `https://zengsipei.space-z.ai`
- PM2 修复，production 模式重启
- Commit: f285530

### grahify-kb 摄入

> 用户: "拉取当前 github 用户的 graphify-kb 仓库，摄入其中的 raw 目录下的源文件内容"

注意：实际仓库名为 `grahify-kb`（少一个 p）。

- 从 `zengsipei/grahify-kb` clone 到 `/tmp/grahify-kb`
- 分析 `raw/articles/` 目录：18 篇技术调研文章，双层 YAML frontmatter
- 编写 `scripts/ingest-grahify-kb.mjs` 摄入脚本
- 修复 14 个标题（双层 frontmatter 解析问题），编写 `scripts/fix-grahify-titles.mjs`
- Wiki 总计 43 页（原有 25 + 新增 18）
- Commit: bbcfcb7

> 用户: "不太对，之前有摄入 grahify-kb 中的 raw 文件，怎么没看到补"

（因为上一会话只还原了之前手动创建的 25 页，grahify-kb 的内容在数据库清空前未纳入 Git 管理，原始文件也已不在服务器上，需要重新从 GitHub 拉取）

> 用户: "留存与 llm-wiki 相关对话了吗？"

（用户强调原始对话记录的重要性，触发本次文档更新）

---

## 关键用户偏好（新会话必读）

1. **语言**: 全部使用中文（UI、代码注释、Git commit message）
2. **设计参考**: 喜欢 zread 文档站风格（简洁、灯条+浮窗 TOC）
3. **代码风格**: 注重简洁，不喜欢过度工程。减少代码量会得到正面反馈（如 hover 单容器方案减少 31 行时用户说"太棒啦"）
4. **沟通方式**: 直接，附截图说明问题，期望快速迭代
5. **部署要求**: 每次改动都要 `git push` 到 GitHub
6. **协作模式**: z.ai Agent 模式 + 微信沟通 + PC 网页预览，手动发布更新
7. **文档要求**: 保留对话原文，总结不能 100% 还原场景，原始对话是核心
8. **范围**: 只包含 llm-wiki 项目相关内容，不混入其他功能（如定时任务）
