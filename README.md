# LLM Wiki - 智能知识库系统

基于 Karpathy 的 [llm-wiki](https://github.com/karpathy/llm-wiki) 理念构建的个人知识库系统。用 LLM 将各种知识文档编译为结构化的 Markdown Wiki 页面，支持 AI 知识问答和健康检查。

## 特性

- **Wiki 页面管理** - 创建、编辑、删除知识页面，支持 Markdown 渲染
- **AI 文档摄入** - 粘贴文本或输入 URL，LLM 自动提取知识生成结构化 Wiki 页面
- **AI 知识问答** - 基于知识库进行智能问答，显示引用来源
- **AI 健康检查** - 检测重复内容、孤立页面，给出改进建议
- **AI Widget 生成** - 为任意知识页面生成可交互的 HTML 可视化组件
- **富文本 Markdown 渲染** - GFM 表格、代码高亮、Mermaid 图表、Callout、交互式代码预览
- **TOC 目录** - 灯条 + 浮窗式目录导航，zread 风格
- **全文搜索** - 标题和内容关键词搜索
- **标签系统** - 灵活的标签分类
- **操作日志** - 记录所有操作历史
- **Markdown 知识库导出** - 支持 .zip 和知识图谱 .json 两种格式
- **Git 变更历史** - 基于 git log 的页面版本历史查看
- **Agentation 视觉反馈** - 集成 Agentation 工具，支持页面元素批注和 AI Agent 上下文输出
- **响应式设计** - 移动端适配，亮/暗模式

## 技术栈

| 层 | 技术 |
|---|---|
| **框架** | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| **样式** | Tailwind CSS 4 + shadcn/ui (New York) |
| **数据库** | SQLite via Prisma ORM |
| **AI** | 多 Provider 抽象层 (z-ai / OpenAI / Anthropic / 自定义) |
| **编辑器** | MDXEditor v3 (headings/lists/quote/table/codeMirror) |
| **图表** | Mermaid 11 + Recharts + D3.js |
| **进程管理** | PM2 |
| **反向代理** | Caddy |
| **视觉反馈** | Agentation (dev-only) |

## AI Provider 配置

系统通过统一抽象层支持多种 LLM 后端，切换只需修改环境变量：

| Provider | 环境变量配置 |
|---|---|
| **z-ai** (默认) | `AI_PROVIDER=z-ai` |
| **OpenAI** | `AI_PROVIDER=openai` `AI_API_KEY=sk-xxx` |
| **Anthropic** | `AI_PROVIDER=anthropic` `AI_API_KEY=sk-ant-xxx` |
| **自定义** | `AI_PROVIDER=custom` `AI_BASE_URL=...` `AI_API_KEY=...` |

详见 `.env.example`。

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

### 初始化数据库

```bash
npx prisma db push
```

### 从 Markdown 恢复知识库（可选）

```bash
node scripts/sync-from-md.mjs
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 生产构建

```bash
npm run build
cp -r .next/static .next/standalone/.next/static
node .next/standalone/server.js
```

## 项目结构

```
src/
├── app/
│   ├── api/wiki/            # API 路由
│   │   ├── route.ts         # GET 列表 + POST 创建
│   │   ├── [id]/route.ts    # GET/PUT/DELETE 单页
│   │   ├── [id]/widgets/    # AI Widget 生成 + 管理
│   │   ├── ingest/route.ts  # AI 文档摄入
│   │   ├── query/route.ts   # AI 知识问答
│   │   ├── lint/route.ts    # AI 健康检查
│   │   ├── logs/route.ts    # 操作日志
│   │   ├── search/route.ts  # 全文搜索
│   │   ├── sync/route.ts    # Markdown 同步
│   │   └── export/route.ts  # 知识库导出
│   ├── html-effectiveness/  # HTML Effectiveness Demo 画廊
│   ├── page.tsx             # 主页面 (SPA)
│   ├── layout.tsx           # 根布局
│   └── globals.css
├── components/
│   ├── agentation-wrapper.tsx  # Agentation 视觉反馈 (dev-only)
│   ├── wiki/                  # Wiki 组件
│   │   ├── wiki-sidebar.tsx
│   │   ├── wiki-header.tsx
│   │   ├── markdown-renderer.tsx  # 富文本渲染器
│   │   └── views/               # 功能视图
│   └── ui/                    # shadcn/ui 组件
├── lib/
│   ├── ai-provider.ts       # AI 多 Provider 抽象层
│   ├── db.ts                # Prisma 客户端
│   └── utils.ts
├── types/
│   └── wiki.ts              # TypeScript 类型
wiki-content/                 # Markdown 知识库文件 (Git 管理)
├── *.md                     # 每个 Wiki 页面一个 .md 文件
└── widgets/                 # AI 生成的 HTML Widget
scripts/
├── sync-to-md.mjs           # 数据库 → .md 文件
├── sync-from-md.mjs         # .md 文件 → 数据库
├── ingest-grahify-kb.mjs    # grahify-kb 摄入脚本
└── fix-grahify-titles.mjs   # 标题修复脚本
docs/
├── SESSION_LOG.md           # 会话对话记录
├── CHANGELOG.md             # 开发历程
└── PROJECT_HANDOFF.md       # 架构全景
```

## 数据模型

- **Source** - 原始文档来源（标题、内容、状态）
- **WikiPage** - Wiki 知识页面（标题、Markdown 内容、类型、标签、反向链接）
- **ActivityLog** - 操作日志（创建、编辑、摄入、查询、检查）

## 内容持久化架构

| 层 | 格式 | 存储 | 作用 |
|---|---|---|---|
| **内容层** | `.md` + frontmatter | `wiki-content/` (Git 管理) | Source of Truth，可 diff、可回溯 |
| **索引层** | SQLite | `db/custom.db` (不入 Git) | 搜索缓存，可丢弃，随时从 .md 重建 |
| **展示层** | HTML | react-markdown → 富交互渲染 | Callout、Mermaid、代码预览等增强 |

## 知识来源

已摄入 44 篇知识页面，来源包括：
- **grahify-kb** (18 篇) — AI/开发工具调研：Claude Code Operator、Anthropic Prompting、Browser Harness、Windsurf CodeMaps、暗壳 AI、Stitch2、Supabase vs Firebase 等
- **HTML Effectiveness** — Anthropic 工程师 Thariq 的 AI Agent 输出 HTML 理念
- **Agentation** — 视觉反馈工具调研
- **原始 25 页** — Claude/Opus 使用指南等 AI 实践知识

## License

MIT
