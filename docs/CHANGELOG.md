# LLM Wiki 开发历程 (CHANGELOG)

> 按开发阶段记录所有功能实现、Bug 修复和技术决策
>
> **项目归属**: 由 [z.ai](https://z.ai) 的 Agent 模式提供 AI 编程支持，用户通过**微信 (WeChat)** 完成会话沟通，手动在 **PC 网页** 上发布更新并预览 `https://zengsipei.space-z.ai/`。

---

## 阶段一：项目从零到一（首次会话）

### 1.1 数据库设计
- 使用 Prisma + SQLite 设计 3 个模型: `Source`, `WikiPage`, `ActivityLog`
- WikiPage 支持类型分类 (entity/concept/summary)、标签 (JSON 数组)、反向链接 (JSON 数组)
- 数据库文件: `db/custom.db`

### 1.2 后端 API (7+ 路由)
- **CRUD**: `/api/wiki` + `/api/wiki/[id]` — 完整的增删改查
- **AI 摄入**: `/api/wiki/ingest` — 粘贴文本或输入 URL，AI 自动拆解为 Wiki 页面
- **AI 问答**: `/api/wiki/query` — 基于知识库回答问题
- **AI 健康检查**: `/api/wiki/lint` — 分析 Wiki 质量并给出建议
- **搜索**: `/api/wiki/search` — 全文搜索标题和内容
- **日志**: `/api/wiki/logs` — 最近 50 条活动日志
- **导出**: `/api/wiki/export` — Markdown 知识库 (.zip) 或知识图谱 (.json)

### 1.3 前端 UI
- 基于 `src/app/page.tsx` 的客户端 SPA 架构，通过 `activeTab` 状态切换视图
- 6 个主要视图: page-view, page-edit, ingest-view, query-view, lint-view, logs-view, export-view
- 左侧 WikiSidebar (桌面 w-280px + 移动端抽屉) + 顶部 WikiHeader (h-14) + 右侧主内容区
- shadcn/ui 组件库 (new-york 风格), 亮/暗模式支持

### 1.4 初始数据
- Seed 6 个示例页面
- 后续手动创建到 25 个页面 (Claude/Opus 使用指南等)

### 1.5 部署
- PM2 持久化进程管理 (进程名: wiki, 端口: 3000)
- Caddy 反向代理 (:81 → :3000)
- GitHub 仓库: https://github.com/zengsipei/llm-wiki
- GitHub CLI: `~/bin/gh` (已配置 auth)

---

## 阶段二：Markdown 渲染修复（第二次会话）

### 2.1 表格渲染
- **问题**: ReactMarkdown 默认不支持 GFM 表格
- **修复**: 添加 `remark-gfm` 插件到 ReactMarkdown 的 `remarkPlugins` 中
- 自定义 `table/thead/th/tr/td` 组件，添加边框和悬停效果

### 2.2 代码块语法高亮
- **问题**: 代码块无语法高亮，无复制按钮
- **修复**: 集成 `react-syntax-highlighter` + `oneDark` 主题
- 自定义 `CodeBlock` 组件：语言标签、复制按钮、行号 (>3行时显示)
- 用 `not-prose` class 防止 Tailwind Typography 插件干扰代码块样式
- 修复 `pre` 组件防止 Typography 的 `white-space: pre-wrap` 冲突

### 2.3 编辑器字体连字 (Ligatures)
- **问题**: 代码编辑器中 `=>`、`!=` 等字符显示为连字符号，影响复制
- **修复**: 在编辑器 textarea 中使用无连字字体 (JetBrains Mono 等需要显式关闭)

### 2.4 知识图谱导出
- 实现 Markdown Vault 导出 (.zip) 和知识图谱 (.json) 导出
- 知识图谱使用 D3.js 力导向图可视化 (HTML 内嵌)

---

## 阶段三：TOC 目录系统（第三/四次会话 — 最复杂的部分）

### 3.1 初始实现：吸顶操作栏 + 回到顶部 + TOC 侧边栏
- **吸顶操作栏**: `sticky top-0`，scrollTop > 160px 后显示，含返回/编辑/删除按钮
- **回到顶部按钮**: `fixed bottom-8 right-8`，scrollTop > 300px 后显示
- **TOC 侧边栏**: 初始为传统侧边栏设计，可折叠

**Bug 修复**:
- 回到顶部按钮监听在 `window` 而非 `<main>` → 修改为监听 `<main>` 的 scroll 事件
- TOC heading ID 不匹配：`nextHeadingId` 回调计数器有竞态条件 → 改为预计算 `headingIds` 数组

### 3.2 TOC 重写：灯条 + 浮窗设计
用户参考 zread 文档详情页风格，要求：
- 未 hover 时只显示右侧细灯条（进度条 + 追踪点）
- hover 时展开为浮窗面板（目录列表）

**实现**:
- 灯条: 40px 宽，3px 进度条 + 9px 发光追踪点 + 底部目录图标
- 浮窗: 264px (w-72), glassmorphism 头部, 可滚动标题列表
- 标题缩进: `(level - 2) * 12` px
- 高亮样式: `bg-primary/8` + `ChevronRight` 箭头

### 3.3 点击跳转：标题被吸顶栏遮挡
- **问题**: 点击目录项后，标题滚动到视口最顶部，被吸顶操作栏遮住
- **首次尝试**: 给 heading 添加 `scroll-margin-top: 80px` CSS + `scrollIntoView`
- **发现**: `scrollIntoView` 在嵌套滚动容器 `<main>` 中**不尊重** `scroll-margin-top`（浏览器已知行为）
- **最终方案**: 手动计算 `el.offsetTop - 48` + `mainEl.scrollTo()`

### 3.4 高亮追踪：标题不跟随阅读位置（最曲折的部分）

经历了 **6 次迭代**：

| 版本 | 方案 | 问题 |
|------|------|------|
| v1 | `getBoundingClientRect` + 固定 80px | 高亮滞后 1-2 章节 |
| v2 | `getBoundingClientRect` + 20% 视口 | 更滞后，百分比随屏幕变大更糟 |
| v3 | `getBoundingClientRect` + 48px | 仍然不准，方向搞反了 |
| v4 | IntersectionObserver | 只在元素进出根容器时触发，不在内部移动时触发 → 完全不工作 |
| v5 | rAF + `offsetTop` | `offsetTop` 的 `offsetParent` 链不经过 `<main>` → 偏移完全错误 |
| **v6** | **rAF + `getBoundingClientRect` 公式** | **成功！** |

**最终正确算法**:
```typescript
// 预计算（初始化时，不受 scroll 影响）
const contentOffset = el.getBoundingClientRect().top
                   - mainEl.getBoundingClientRect().top
                   + mainEl.scrollTop

// 滚动时判断（zread 风格：视窗内最上面的标题）
const stickyBarH = 48
for (let i = 0; i < headingOffsets.length; i++) {
  if (headingOffsets[i] >= scrollTop + stickyBarH) {
    activeIdx = i
    break
  }
}
```

**为什么 v6 正确**:
- `getBoundingClientRect` 公式在数学上不受 scroll 位置影响（证明：scroll 改变 rect.top 和 main.rect.top 同步变化，差值不变）
- 不依赖 CSS 定位上下文（不需要 `position: relative`）
- 高亮和点击用同一个函数，天然一致

### 3.5 代码块注释误提取为标题
- **问题**: Python/Rust 代码块中的 `# 注释` 被识别为 Markdown 标题
- **修复**: `extractTocItems` 增加 `inCodeBlock` 状态追踪，遇到 ` ``` ` 围栏时翻转状态，代码块内的行全部跳过

### 3.6 Hover 交互：灯条到浮窗的移动失败
- **问题**: 灯条和浮窗是两个独立 `fixed` 元素，中间有 4px 间隙，鼠标离开灯条后面板就隐藏了
- **首次尝试**: 300ms 延迟定时器 → 前几次仍不顺滑
- **最终方案** (用户建议): **单容器方案** — 灯条和浮窗包裹在同一个 `fixed` div 中
  - 关闭时容器宽 36px（只响应灯条 hover）
  - 打开时容器扩展到 328px（覆盖灯条 + 间隙 + 面板）
  - 鼠标在灯条和面板之间移动永远不离开容器 → 零死区
  - 删除所有定时器代码，更简洁

---

## 技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| SPA 架构 | 单 page.tsx + activeTab | 简单直接，不需要 Next.js 路由 |
| 滚动容器 | `<main> overflow-y-auto` | 标准模式，不使用 window 滚动 |
| Markdown 渲染 | react-markdown + remark-gfm | Next.js 生态标准方案 |
| 代码高亮 | react-syntax-highlighter | 支持语言多、主题丰富 |
| TOC 偏移计算 | getBoundingClientRect 公式 | 唯一不受 CSS 定位影响的方案 |
| TOC Hover | 单容器包裹 | 零死区、无定时器、代码更少 |
| AI SDK | z-ai-web-dev-sdk | 平台内置，无需额外配置 |
| AI 抽象层 | ai-provider.ts 多 Provider | 解耦路由代码，支持一键切换 LLM 后端 |
| 视觉反馈 | Agentation (dev-only, dynamic import) | SSR 不兼容，仅开发环境加载 |
| 进程管理 | PM2 (npx) | 持久化、自动重启 |

---

## 阶段四：HTML Effectiveness 研究（2026-05-21）

### 4.1 研究内容摄入
- 调研 [thariqs.github.io/html-effectiveness](https://thariqs.github.io/html-effectiveness/) — Anthropic 工程师 Thariq 的博文及配套 20 个 Demo
- 核心理念：**AI Agent 应该直接输出可交互的 HTML 文件**，而非纯文本 Markdown
- 创建 Wiki 页面「The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）」，包含完整的 9 大场景分析和设计原则
- 通过 `scripts/add-html-effectiveness.mjs` 种子脚本写入数据库

### 4.2 Demo 文件
- 将 20 个自包含 HTML Demo 文件放入 `public/html-effectiveness-demos/`
- 覆盖 9 大场景：探索与规划、代码审查、设计系统、原型开发、图表插图、演示文稿、研究与学习、报告、自定义编辑器
- 所有 Demo 文件零依赖（纯 HTML + CSS + 原生 JS），可直接在浏览器中打开

### 4.3 Demo 画廊页面
- 新增 `/html-effectiveness` 路由（`src/app/html-effectiveness/page.tsx`）
- 分类筛选、搜索、网格/列表视图切换
- 每张卡片点击可直接打开对应 Demo
- 返回按钮链接 Wiki 主页

### 4.4 Git 操作
- 推送 commit `77bb507`（HTML Effectiveness demos + seed script）到 GitHub

---

## 阶段五：内容持久化改进 — md 做记忆，html 做展示（2026-05-22）

### 5.1 问题背景
- SQLite 数据库（`db/custom.db`）被 `.gitignore` 排除，从未纳入 Git 管理
- 5月22日午夜 cron 触发器意外重建了数据库，导致所有页面内容丢失
- 之前手动创建的 25 个页面内容无法恢复

### 5.2 架构改进：三层分离
| 层 | 格式 | 存储 | 作用 |
|---|---|---|---|
| **内容层** | `.md` + frontmatter | `wiki-content/` 目录，**Git 管理** | Source of Truth，可 diff、可回溯 |
| **索引层** | SQLite | `db/custom.db`，不入 Git | 搜索缓存，可丢弃，随时从 .md 重建 |
| **展示层** | HTML | react-markdown → 富交互渲染 | 比纯 md 渲染更强的展示 |

### 5.3 wiki-content/ 目录结构
- 每个页面一个 `.md` 文件，文件名由标题 slug 生成
- YAML frontmatter 存储：`id`、`title`、`type`、`tags`、`created`、`updated`
- 文件内容为纯 Markdown，任何编辑器可直接修改

### 5.4 双向同步脚本
- `scripts/sync-to-md.mjs` — 数据库 → .md 文件（全量导出）
- `scripts/sync-from-md.mjs` — .md 文件 → 数据库（全量导入/重建）
- 数据库丢失时：`node scripts/sync-from-md.mjs` 即可恢复

### 5.5 API 自动同步
- `POST /api/wiki` — 创建页面时自动写入对应 `.md` 文件
- `PUT /api/wiki/[id]` — 更新页面时自动同步 `.md` 文件
- `DELETE /api/wiki/[id]` — 删除页面时自动删除对应 `.md` 文件
- 同步为 fire-and-forget，不阻塞 API 响应

---

## 阶段六：四步改进计划 — 展示层增强 + Agent Widget + CMS（2026-05-22 上午）

### 6.1 Step 2: 展示层增强
- 重写 `markdown-renderer.tsx`（+1642/-119 行）：
  - **Callout 组件**: 6 种类型（note/warning/tip/info/caution/danger），支持 `> [!type]` GitHub 风格语法
  - **Mermaid 图表**: 动态 import mermaid@11.15.0，暗色模式自适应，错误回退
  - **交互式代码预览**: HTML/JS 代码块显示"运行"按钮，iframe sandbox 执行
  - **表格增强**: 圆角边框、悬停高亮、响应式滚动
  - **图片增强**: 圆角阴影、alt 标题显示
- 创建 `wiki-content/markdown-渲染增强演示.md`（演示页面）
- Commit: 2c5d827

### 6.2 Step 3: Agent 生成 HTML 知识组件
- `POST /api/wiki/generate-widget` — LLM 分析页面内容生成交互式 HTML widget
- `GET /api/wiki/[id]/widgets` — 列出页面关联的 widget
- `GET /api/wiki/widget/[slug]` — 提供 widget HTML 文件
- WidgetPanel 组件：生成按钮、预览、全屏模式
- Widget 存储: `wiki-content/widgets/{slug}-{timestamp}.html`（Git 管理）
- Commit: 674fe6d

### 6.3 Step 4: flat-file CMS 架构收尾
- `POST /api/wiki/sync` — 运行 sync-from-md.mjs 实现自动同步
- `GET /api/wiki/[id]/history` — Git log 查询 .md 文件变更历史
- PageHistory 组件：可折叠面板，懒加载，commit hash + 作者 + 时间
- MDXEditor v3.52.3 替换 textarea：
  - dynamic import（ssr: false）
  - 插件: headings/lists/quote/codeBlock/table/link/diffSource/codeMirror
  - 工具栏 + 编辑/预览切换 + Ctrl+S 快速保存
- Commit: 157df76

---

## 阶段七：文档恢复 + grahify-kb 摄入（2026-05-22 下午）

### 7.1 数据库被清空后的恢复
- 5月22日午夜 cron 触发器意外重建了数据库
- 还原 17 篇丢失的 Wiki 文档，恢复到 25 篇
- 更新预览地址为 `https://zengsipei.space-z.ai`
- PM2 部署修复（清理 errored 进程，production 模式重启）
- DB 从 .md 文件全量重建（sync-from-md.mjs --force）
- Commit: f285530

### 7.2 grahify-kb 文章摄入
- 从 `zengsipei/grahify-kb`（注意：仓库名少一个 p）的 `raw/articles/` 摄入 18 篇文章
- 文件格式：双层 YAML frontmatter（外层 grahify-kb 元数据 + 内层文章元数据 + body）
- 编写 `scripts/ingest-grahify-kb.mjs`：解析双层 frontmatter → wiki-content 格式 .md + DB
- 编写 `scripts/fix-grahify-titles.mjs`：修复 14 个标题（从 body heading 和 topic 字段提取正确标题）
- 摄入的 18 篇文章：
  - Claude Code Operator 模式、Cursor Debug、GitNexus、Graphify
  - Obscura 浏览器、Pretext 文本测量、Stitch 2.0、暗壳AI
  - Anthropic Prompting Best Practices、Codex CLI /goal、HereOS
  - Browser Harness、Supabase vs Firebase、Windsurf Codemaps
  - Hermes Operator 对比、Grill-Me Skill、RTK Token Killer、Trellis
- Wiki 总计 43 页（原有 25 + 新增 18）
- Commit: bbcfcb7

### 7.3 关联仓库
- `zengsipei/grahify-kb` — 知识库原始调研素材（raw/articles/ + entities/ + concepts/ + comparisons/）
- `zengsipei/llm-wiki` — Wiki 系统（产品化实现）

---

## 阶段八：AI Provider 抽象 + Agentation 集成（2026-05-22 晚）

### 8.1 AI 多 Provider 抽象层

**问题**: 4 个 AI 路由全部硬编码 `import ZAI from 'z-ai-web-dev-sdk'`，代码重复，无法切换 LLM 后端。

**解决方案**: 创建 `src/lib/ai-provider.ts` 统一抽象层。

- **接口设计**: `AIProvider` 接口定义 `complete()` 方法
- **内置 Provider**: ZAIProvider / OpenAIProvider / AnthropicProvider / CustomProvider
- **工厂模式**: `createProvider()` 根据环境变量创建对应 Provider（单例缓存）
- **便捷 API**: `aiComplete(messages, options)` 一行调用，`parseAIJson()` 安全解析
- **配置方式**: 环境变量 `AI_PROVIDER` + `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL`
- **重构路由**: 4 个 AI 路由全部改用 `aiComplete()`，不再直接依赖 z-ai-web-dev-sdk
- **新增依赖**: `openai@6.39.0`、`@anthropic-ai/sdk@0.98.0`

**路由变更**:
- `src/app/api/wiki/query/route.ts` — `ZAI.create()` → `aiComplete()`
- `src/app/api/wiki/ingest/route.ts` — 同上
- `src/app/api/wiki/lint/route.ts` — 同上
- `src/app/api/wiki/[id]/widgets/route.ts` — 同上

Commit: 5695fdd

### 8.2 Agentation 视觉反馈工具集成

**需求**: 集成 [Agentation](https://github.com/benjitaylor/agentation) — 将 UI 元素批注转化为 AI Agent 可理解的结构化上下文。

**实现**:
- 安装 `agentation@3.0.2` (devDependency)
- 创建 `src/components/agentation-wrapper.tsx`:
  - `next/dynamic({ ssr: false })` — 禁用 SSR（需要 DOM API）
  - 生产环境自动排除（`NODE_ENV === 'production'` 时返回 null）
  - 注册 `onCopy`、`onSubmit` 回调
- 集成到 `src/app/layout.tsx` 全局布局
- 使用方式：页面右下角浮动按钮 → 点击任意元素添加批注 → 生成结构化 Markdown → 粘贴给 AI Agent

**技术决策**:

| 决策 | 选择 | 原因 |
|------|------|------|
| SSR | `next/dynamic({ ssr: false })` | Agentation 依赖 window/document API |
| 生产环境 | 条件渲染返回 null | Agentation 是开发者工具，不应影响用户体验 |
| 安装方式 | devDependency | 生产构建不包含 |

Commit: 5695fdd

### 8.3 文档更新
- 更新 README.md：补充 AI Provider 配置、Agentation、Widget、Git 历史等新特性
- 更新 SESSION_LOG.md：记录会话 8 的完整对话和决策
- 更新 CHANGELOG.md：本文件
