# LLM Wiki 开发历程 (CHANGELOG)

> 按开发阶段记录所有功能实现、Bug 修复和技术决策

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
| 进程管理 | PM2 (npx) | 持久化、自动重启 |
