# LLM Wiki 项目交接文档

> **最后更新**: 2026-05-17 21:30 CST
> **项目版本**: v0.2.0
> **Git**: https://github.com/zengsipei/llm-wiki
> **预览**: https://v1z5640xhrq1-d.space-z.ai
> **用途**: 新会话读取此文档 + `docs/CHANGELOG.md` + `docs/SESSION_LOG.md` 即可无缝继续项目

---

## 一、项目概述

LLM Wiki 是一个受 Karpathy [llm-wiki](https://github.com/karpathy/llm-wiki) 概念启发的智能知识库系统。用户可以通过 AI 自动摄入文档生成 Wiki 页面，也可以手动创建和管理知识条目，支持全文搜索、知识问答、健康检查、Markdown 知识库导出和知识图谱可视化。

当前已收录 25 篇 Wiki 页面（涵盖 Claude/Opus 使用指南等 AI 实践知识）。

---

## 二、技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router, Standalone) | ^16.1.1 |
| UI | React + TypeScript | ^19.0.0 / ^5 |
| CSS | Tailwind CSS 4 + @tailwindcss/typography | ^4 |
| UI 组件库 | shadcn/ui (new-york 风格) | 40+ 组件 |
| 图标 | Lucide React | ^0.525.0 |
| ORM | Prisma | ^6.11.1 |
| 数据库 | SQLite (文件型) | — |
| AI SDK | z-ai-web-dev-sdk (GLM) | ^0.0.17 |
| Markdown | react-markdown + remark-gfm | ^10.1.0 |
| 代码高亮 | react-syntax-highlighter (oneDark 主题) | ^15.6.6 |
| 包管理 | Bun (主) + npm (备) | bun.lock |
| 反向代理 | Caddy | 端口 81 |
| 进程管理 | PM2 (通过 npx 调用) | — |
| CLI | ~/bin/gh (GitHub CLI, 已配置 auth) | — |

---

## 三、项目结构

```
/home/z/my-project/
├── .env                          # DATABASE_URL=file:/home/z/my-project/db/custom.db
├── .env.example                  # 模板
├── Caddyfile                     # 反向代理 :81 → localhost:3000
├── package.json                  # v0.2.0
├── next.config.ts                # standalone 输出, ignoreBuildErrors
├── tailwind.config.ts            # shadcn/ui 主题 token
├── postcss.config.mjs            # @tailwindcss/postcss
├── components.json               # shadcn/ui 配置
│
├── prisma/
│   └── schema.prisma             # 3 模型: Source, WikiPage, ActivityLog
│
├── db/
│   └── custom.db                 # 生产数据库 (176KB, 25 pages, 25 logs)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局 (Geist 字体, Toaster, zh-CN)
│   │   ├── page.tsx              # 主 SPA (488 行, 客户端组件, activeTab 路由)
│   │   ├── globals.css           # Tailwind 4 + shadcn/ui CSS 变量 (亮/暗模式)
│   │   └── api/wiki/
│   │       ├── route.ts          # GET (列表) + POST (创建)
│   │       ├── [id]/route.ts     # GET/PUT/DELETE 单页
│   │       ├── ingest/route.ts   # POST: AI 文档摄入 → Wiki 页面
│   │       ├── query/route.ts    # POST: AI 知识问答
│   │       ├── lint/route.ts     # POST: AI 健康检查
│   │       ├── logs/route.ts     # GET: 活动日志 (最近50条)
│   │       ├── search/route.ts   # GET: 全文搜索 (?q=term)
│   │       └── export/route.ts   # GET: Markdown 知识库(.zip) 或 知识图谱(.json)
│   │
│   ├── components/
│   │   ├── wiki/
│   │   │   ├── wiki-sidebar.tsx      # 侧边栏导航 + 页面列表 (桌面+移动端)
│   │   │   ├── wiki-header.tsx       # 顶部搜索栏 (h-14, shrink-0)
│   │   │   ├── markdown-renderer.tsx # Markdown 渲染 (GFM表格, 代码高亮, 复制按钮, heading IDs)
│   │   │   └── views/
│   │   │       ├── page-view.tsx     # 页面详情 + TOC灯条/浮窗 + 吸顶栏 + 回到顶部 (~498行)
│   │   │       ├── page-edit.tsx     # 创建/编辑页面表单
│   │   │       ├── ingest-view.tsx   # 文档摄入 UI
│   │   │       ├── query-view.tsx    # 知识问答 UI
│   │   │       ├── lint-view.tsx     # 健康检查结果 UI
│   │   │       ├── logs-view.tsx     # 活动日志查看器
│   │   │       └── export-view.tsx   # 导出面板 (Markdown+知识图谱, ~634行)
│   │   └── ui/                     # ~40 个 shadcn/ui 组件
│   │
│   ├── lib/
│   │   ├── db.ts                  # Prisma 客户端单例 (含 query 日志)
│   │   └── utils.ts               # cn() 工具函数 (clsx + tailwind-merge)
│   │
│   ├── hooks/                     # use-mobile.ts, use-toast.ts
│   └── types/
│       └── wiki.ts                # 全部 TS 接口 + 标签/颜色映射
│
├── docs/                          # ★ 项目文档 (本目录)
│   ├── PROJECT_HANDOFF.md         # 交接文档 (本文件)
│   ├── CHANGELOG.md               # 开发历程 (按阶段)
│   └── SESSION_LOG.md             # 会话对话记录 (关键决策原文)
│
├── download/                      # 截图和导出 (gitignored)
├── upload/                        # 上传目录
└── worklog.md                     # 工作日志 (gitignored)
```

---

## 四、数据库模型

```prisma
// prisma/schema.prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model Source {
  id          String   @id @default(uuid())
  title       String
  content     String
  sourceType  String   @default("manual")  // manual | file | web
  status      String   @default("pending")  // pending | processed
  createdAt   DateTime @default(now())
  pages       WikiPage[]
  logs        ActivityLog[]
}

model WikiPage {
  id          String   @id @default(uuid())
  title       String
  content     String                        // Markdown 内容
  pageType    String   @default("concept")  // entity | concept | summary
  tags        String   @default("[]")       // JSON 数组
  backlinks   String   @default("[]")       // JSON 数组 (page ID)
  sourceId    String?
  source      Source?  @relation(fields: [sourceId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  logs        ActivityLog[]
}

model ActivityLog {
  id            String   @id @default(uuid())
  actionType    String                        // ingest | query | lint | edit | create | delete
  summary       String
  relatedPages  String   @default("[]")       // JSON 数组
  sourceId      String?
  source        Source?  @relation(fields: [sourceId], references: [id])
  pageId        String?
  createdAt     DateTime @default(now())
}
```

**当前数据**: 25 个 WikiPage, 0 个 Source, 25 条 ActivityLog
**DB 文件**: `/home/z/my-project/db/custom.db`

---

## 五、滚动容器架构（关键！）

新会话处理任何滚动相关功能前必须了解：

```
html > body
  └─ div.h-screen.flex.flex-col          ← 根视口 (100vh)
      ├─ header.h-14.shrink-0             ← WikiHeader (56px, 固定)
      └─ div.flex-1.flex.min-h-0          ← Body 行
          ├─ aside.w-[280px]              ← WikiSidebar (桌面)
          └─ main.flex-1.overflow-y-auto   ← ★ 滚动容器 ★
              └─ div.p-6
                  └─ PageView
                      ├─ div.sticky.top-0  ← 吸顶操作栏 (~44px, scrollTop>160 后出现)
                      └─ div.max-w-4xl
                          └─ MarkdownRenderer
                              └─ h1/h2/h3/h4#heading-N  ← 标题元素
```

**关键要点**:
- `<main>` 是唯一滚动容器 (`overflow-y-auto`)，不是 `window`/`body`
- `<main>` 没有 `position: relative`，因此 `offsetTop`/`offsetParent` 链不经过 `<main>`
- 标题偏移计算必须用公式: `contentOffset = el.rect.top - main.rect.top + main.scrollTop`
- 吸顶操作栏高度约 44px (py-2 + h-7 按钮)
- WikiHeader 高度 56px (h-14)

---

## 六、API 路由

| 方法 | 路径 | 用途 | AI |
|---|---|---|---|
| GET | `/api/wiki` | 列出所有页面 (按 updatedAt 降序) | — |
| POST | `/api/wiki` | 创建新页面 | — |
| GET | `/api/wiki/[id]` | 获取单个页面 | — |
| PUT | `/api/wiki/[id]` | 更新页面 | — |
| DELETE | `/api/wiki/[id]` | 删除页面 | — |
| POST | `/api/wiki/ingest` | AI 文档摄入 → 生成 Wiki 页面 | GLM |
| POST | `/api/wiki/query` | AI 知识问答 | GLM |
| POST | `/api/wiki/lint` | AI 健康检查 | GLM |
| GET | `/api/wiki/logs` | 最近 50 条活动日志 | — |
| GET | `/api/wiki/search?q=` | 全文搜索 (title+content) | — |
| GET | `/api/wiki/export?type=markdown\|graph` | 导出 | — |

AI 集成: 使用 `z-ai-web-dev-sdk` 的 `ZAI.create()` → `zai.chat.completions.create()`，无显式 API key（依赖平台环境）。

---

## 七、TOC 系统架构（核心组件详解）

### 提取: `extractTocItems(content: string)`
- 逐行扫描 Markdown
- 追踪 ` ``` ` 围栏状态，**跳过代码块内的 `#` 注释**（Python/Rust 等不会误识别）
- 只匹配 `#{1,4}` 开头、非代码块的行
- 返回 `TocItem[]`: `{ id: 'heading-N', text, level }`

### 渲染: `MarkdownRenderer` 的 heading IDs
- 接收 `headingIds: string[]` prop（从 `extractTocItems` 预计算）
- 使用 `useRef(0)` 计数器，渲染时依次分配 `id` 到 h1-h4
- 注意：**不使用 `scroll-margin-top`**（嵌套滚动容器中不可靠）

### 追踪: `page-view.tsx` 的滚动处理
- 单一 `scroll` 监听器 + `requestAnimationFrame` 节流
- 偏移公式: `getContentOffset(el, main) = el.rect.top - main.rect.top + main.scrollTop`
- **预计算**: useEffect 初始化时收集所有 heading 的 contentOffset 到数组
- **高亮逻辑**: 第一个 `headingOffset >= scrollTop + 48` 的标题为活跃标题（zread 风格：视窗内最上面的标题）
- 如果所有标题都滚过了，使用最后一个

### 交互: TOC 灯条 + 浮窗
- **单容器方案**: 灯条和浮窗包裹在同一个 `fixed` div 中
- 关闭时容器宽 36px（只响应灯条 hover）
- 打开时容器扩展到 328px（覆盖灯条 + 间隙 + 面板）
- **零死区**: 鼠标在灯条和面板之间移动不会离开容器
- 不需要定时器、不需要 `pointer-events-none` hack

### 点击跳转: `handleTocClick`
- 使用与追踪**相同**的 `getContentOffset()` 函数
- `mainEl.scrollTo({ top: offset - 48, behavior: 'smooth' })`
- 48px = 吸顶栏高度 (44px) + 4px 间距

---

## 八、部署与环境

### 开发
```bash
cd /home/z/my-project
npm run dev          # next dev -p 3000
# 或 PM2: npx pm2 start wiki
```

### 生产构建
```bash
npm run build        # next build + 复制静态资源到 standalone
npm run start        # NODE_ENV=production bun .next/standalone/server.js
```

### PM2 管理
```bash
npx pm2 list                              # 查看进程
npx pm2 restart wiki                      # 重启
npx pm2 stop wiki && npx pm2 start wiki   # 完全重启 (端口冲突时)
```
- 进程名: `wiki`
- 端口: 3000 (Caddy 反向代理 81 → 3000)

### GitHub
```bash
git remote -v  # origin → https://github.com/zengsipei/llm-wiki.git
~/bin/gh auth setup-git  # 首次需配置
git push origin main     # 推送
```

---

## 九、已知注意事项

1. **`ignoreBuildErrors: true`** — TypeScript 构建错误被抑制，可能有隐藏的类型问题
2. **`reactStrictMode: false`** — 禁用了双重渲染（副作用密集型应用常见做法）
3. **Prisma query 日志开启** — `db.ts` 中 `log: ['query']` 可能影响生产性能
4. **Source 表为空** — 25 个页面都是直接 seed 的，没有 Source 记录，`page.source` 为 null
5. **AI SDK 无显式 API key** — `ZAI.create()` 依赖平台环境，迁移服务器时需验证
6. **未使用的依赖** — `zustand`, `@dnd-kit/*`, `recharts`, `next-intl`, `next-auth` 已安装但未使用
7. **无 PM2 配置文件** — 建议创建 `ecosystem.config.js`
8. **Tailwind 4 + tailwind.config.ts 共存** — TW4 使用 CSS 配置，config 文件可能是遗留的

---

## 十、快速上手（新会话）

```bash
# 1. 读取项目记忆
cat docs/PROJECT_HANDOFF.md   # 本文件：架构和部署
cat docs/CHANGELOG.md         # 开发历程
cat docs/SESSION_LOG.md       # 会话对话记录

# 2. 检查环境
cd /home/z/my-project
npx pm2 list                  # 确认 wiki 进程在线
curl -s http://localhost:3000 # 确认服务响应

# 3. 开发
npm run dev                   # 启动开发服务器

# 4. 推送
git add . && git commit -m "..." && ~/bin/gh auth setup-git && git push origin main
```
