---
id: cmpnqrx0s000fl9x70w97plwu
title: Agentation — AI 编码 Agent 的视觉反馈工具
type: tool
tags:

created: 2026-06-01T08:52:57.757Z
updated: 2026-06-01T10:37:22.382Z
---

# Agentation — AI 编码 Agent 的视觉反馈工具

> Agent-agnostic visual feedback tool for AI coding agents.
> 给 AI 编码 Agent 的视觉反馈工具——点击页面元素、添加批注、输出结构化信息，让 Agent 精准定位代码。

## 基本信息（GitHub API, 2026-05-22）

| 项目 | 数据 |
|------|------|
| 全名 | benjitaylor/agentation |
| Stars | 3,706 |
| Forks | 294 |
| Open Issues | 41 |
| Language | TypeScript |
| License | PolyForm Shield 1.0.0 |
| 创建时间 | 2026-01-18 |
| 最近推送 | 2026-03-25 |
| npm | `agentation` + `agentation-mcp` |
| 官网 | https://agentation.com |

## 核心定位

传统 AI 编码流程中，用户给 Agent 的反馈是纯文本："把侧边栏那个蓝色按钮改小一点"。Agent 需要从自然语言描述中猜测目标元素，经常找错。

**Agentation 把这个过程反过来**：用户直接在浏览器页面上点击元素、框选区域、添加批注，Agentation 自动捕获 CSS 选择器、元素位置、DOM 上下文，输出结构化的 Markdown，让 Agent 用 `grep` 直接定位到代码——零歧义。

核心理念：**与其描述"侧边栏那个蓝色按钮"，不如直接给 Agent `.sidebar > button.primary` 和你的反馈。**

## 功能特性

### 页面标注能力

| 能力 | 说明 |
|------|------|
| **点击标注** | 点击任意元素，自动识别 CSS 选择器 |
| **文本选择** | 选中文字后标注特定内容 |
| **多选** | 拖拽框选多个元素，批量标注 |
| **区域标注** | 框选任意区域（包括空白区域） |
| **动画冻结** | 暂停所有动画（CSS/JS/视频），捕获特定视觉状态 |
| **结构化输出** | 复制 Markdown 格式（含选择器、位置、上下文） |
| **暗/亮模式** | 自动跟随系统偏好或手动切换 |
| **零依赖** | 纯 CSS 动画，无运行时库依赖 |

### MCP Server（agentation-mcp）

Agentation 不只是一个 UI 工具——它通过 MCP（Model Context Protocol）与 AI Agent 实现实时双向通信：

- **HTTP Server**（端口 4747）：接收浏览器工具栏发来的标注
- **MCP Server**（stdio）：向 Claude Code 等 Agent 暴露工具

MCP 工具列表：

| 工具 | 说明 |
|------|------|
| `agentation_list_sessions` | 列出所有活跃标注会话 |
| `agentation_get_pending` | 获取待处理的标注 |
| `agentation_get_all_pending` | 获取所有会话的待处理标注 |
| `agentation_acknowledge` | 标记标注为已确认 |
| `agentation_resolve` | 标记标注为已解决（附总结） |
| `agentation_dismiss` | 驳回标注（附原因） |
| `agentation_reply` | 向标注线程添加回复 |
| `agentation_watch_annotations` | 阻塞等待新标注（批量返回） |

### Hands-Free 模式（全自动反馈循环）

Agentation 最强大的功能——让 Agent 自动处理视觉反馈：

```
1. Agent 调用 agentation_watch_annotations（阻塞等待）
2. 用户在浏览器添加标注 → 批量返回给 Agent
3. Agent 处理每个标注：
   - agentation_acknowledge → 确认收到
   - 修改代码
   - agentation_resolve → 标记完成并附总结
4. 循环回到步骤 1
```

用户只需要在页面上点点画画面出问题，Agent 自动接收、修改、确认——无需打字描述。

### Self-Driving 模式（AI 自动设计评审）

Agentation 还提供了一个 "自动驾驶" 技能（`agentation-self-driving`）：

- Agent 启动可见浏览器，打开目标页面
- 自动遍历页面各区域（Hero → 导航 → 内容 → CTA → Footer）
- 对每个元素添加设计批评标注（5-8 个/页）
- 批评遵循具体可操作原则：引用 CSS 值、设计模式、对标产品

配合 MCP 可实现**双会话全自动驾驶**：

- **Session 1**：在浏览器中自动扫描并添加设计批评标注
- **Session 2**：接收标注、修改代码、确认解决

用户全程只需旁观。

## 安装与使用

### 基础安装（React 18+）

```bash
npm install agentation -D
```

在 Next.js App Router 中添加：

```tsx
import { Agentation } from "agentation";

// layout.tsx
{process.env.NODE_ENV === "development" && <Agentation />}
```

工具栏出现在右下角，点击激活，然后点击任意元素添加批注。

### MCP Server 安装

```bash
npm install agentation-mcp

# 通用方式（支持 Claude Code、Cursor、Codex、Windsurf 等 9+ 个 Agent）
npx add-mcp "npx -y agentation-mcp server"

# Claude Code 专用
claude mcp add agentation -- npx agentation-mcp server
```

### 验证

```bash
agentation-mcp doctor  # 检查配置
agentation-mcp server   # 启动服务
```

## 技术架构

### Monorepo 结构

```
agentation/
├── package/          # npm 包（agentation）
│   ├── src/          # 组件源码
│   └── example/      # 官网/文档站
├── mcp/              # MCP Server（agentation-mcp）
├── skills/
│   ├── agentation/              # 安装技能
│   └── agentation-self-driving/ # 自动驾驶技能
├── CLAUDE.md         # Claude Code 项目指引
└── pnpm-workspace.yaml
```

### API 设计

组件暴露的回调 Props（v1.2.0+）：

- `onAnnotationAdd(annotation)` — 标注创建时
- `onAnnotationDelete(annotation)` — 标注删除时
- `onAnnotationUpdate(annotation)` — 标注编辑时
- `onAnnotationsClear(annotations[])` — 全部清除时
- `onCopy(markdown)` — 复制按钮点击时
- `copyToClipboard` (boolean, 默认 true)

### HTTP API

| 端点 | 说明 |
|------|------|
| `POST /sessions` | 创建标注会话 |
| `GET /sessions` | 列出所有会话 |
| `POST /sessions/:id/annotations` | 添加标注 |
| `GET /sessions/:id/pending` | 获取待处理标注 |
| `GET /sessions/:id/events` | SSE 事件流 |
| `GET /health` | 健康检查 |

### 存储

默认使用 SQLite（`~/.agentation/store.db`），支持内存模式（`AGENTATION_STORE=memory`）。

## 支持的 AI Agent（MCP）

通过 `add-mcp` 工具自动适配 9+ 个 Agent：

- Claude Code、Cursor、Codex、Windsurf
- Cline / Roo Code、OpenCode
- 以及其他支持 MCP 协议的 Agent

## 设计哲学

1. **选择器优先**：给 Agent 的是代码可搜索的选择器（`.sidebar > button.primary`），不是自然语言描述
2. **Agent-Agnostic**：不绑定任何特定 Agent，通过 MCP 标准协议与所有 Agent 通信
3. **零依赖**：npm 包无运行时依赖，纯 CSS 动画
4. **开发环境限定**：通过 `NODE_ENV` 检查，生产环境不加载
5. **渐进增强**：从简单的复制 Markdown 开始，到 MCP 实时同步，再到全自动驾驶

## 与同类工具对比

| 维度 | 截图+文字描述 | Agentation |
|------|--------------|------------|
| 精确度 | 依赖自然语言，Agent 可能找错元素 | CSS 选择器直接定位代码 |
| 交互方式 | 截图 → 描述 → 粘贴 | 点击 → 批注 → 自动同步 |
| 实时性 | 异步（需要手动传递） | MCP 实时推送 |
| 自动化 | 无 | Hands-Free 循环 + Self-Driving |
| 评审能力 | 依赖人工发现 | Agent 自动扫描并标注问题 |

## 局限性

- 仅支持桌面浏览器（移动端不支持）
- 需要 React 18+
- Self-Driving 模式依赖 `agent-browser` 技能
- 自动设计评审的质量取决于页面复杂度

## 相关页面
- [[三个极简Agent开源项目——从骨架到工程化]] — Agent 开发学习路径
