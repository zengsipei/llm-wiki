# LLM Wiki - 智能知识库系统

基于 Karpathy 的 [llm-wiki](https://github.com/karpathy/llm-wiki) 理念构建的个人知识库系统。用 LLM 将各种知识文档编译为结构化的 Markdown Wiki 页面，支持 AI 知识问答和健康检查。

## 特性

- **Wiki 页面管理** - 创建、编辑、删除知识页面，支持 Markdown 渲染
- **AI 文档摄入** - 粘贴文本或输入 URL，LLM 自动提取知识生成结构化 Wiki 页面
- **AI 知识问答** - 基于知识库进行智能问答，显示引用来源
- **AI 健康检查** - 检测重复内容、孤立页面，给出改进建议
- **全文搜索** - 标题和内容搜索
- **标签系统** - 灵活的标签分类
- **操作日志** - 记录所有操作历史
- **响应式设计** - 移动端适配

## 技术栈

- **前端**: Next.js 16 + React + TypeScript + Tailwind CSS 4 + shadcn/ui
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite
- **AI**: GLM (via z-ai-web-dev-sdk)

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
│   ├── api/wiki/          # API 路由
│   │   ├── route.ts       # GET 列表 + POST 创建
│   │   ├── [id]/route.ts  # GET/PUT/DELETE 单页
│   │   ├── ingest/route.ts  # 文档摄入
│   │   ├── query/route.ts   # 知识问答
│   │   ├── lint/route.ts    # 健康检查
│   │   ├── logs/route.ts    # 操作日志
│   │   └── search/route.ts  # 全文搜索
│   ├── page.tsx           # 主页面
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── wiki/              # Wiki 组件
│   │   ├── wiki-sidebar.tsx
│   │   ├── wiki-header.tsx
│   │   ├── markdown-renderer.tsx
│   │   └── views/         # 功能视图
│   └── ui/                # shadcn/ui 组件
├── lib/
│   ├── db.ts              # Prisma 客户端
│   └── utils.ts
└── types/
    └── wiki.ts            # TypeScript 类型
```

## 数据模型

- **Source** - 原始文档来源
- **WikiPage** - Wiki 知识页面（标题、Markdown 内容、类型、标签、反向链接）
- **ActivityLog** - 操作日志（创建、编辑、摄入、查询、检查）

## 知识来源

已从 [grahify-kb](https://github.com/zengsipei/grahify-kb) 摄入 18 篇 AI/开发工具相关文章，涵盖：
- Claude Code Operator 模式
- Anthropic Prompting 最佳实践
- Browser Harness、Windsurf CodeMaps
- 暗壳 AI 室内设计、Stitch2 AI 设计
- Supabase vs Firebase 对比
- 等

## License

MIT
