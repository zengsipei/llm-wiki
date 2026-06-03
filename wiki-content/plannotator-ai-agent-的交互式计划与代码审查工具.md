---
id: plannotator-interactive-plan-code-review
title: Plannotator — AI Agent 的交互式计划与代码审查工具
type: tool
tags:

created: 2026-06-01T08:52:57.835Z
updated: 2026-06-01T10:37:22.449Z
---

# Plannotator — AI Agent 的交互式计划与代码审查工具

> Interactive Plan & Code Review for AI Coding Agents.
> 用可视化 UI 审查和标注 AI Agent 的计划与代码 Diff，支持团队协作分享，一键将反馈发送回 Agent。

## 基本信息（GitHub API, 2026-05-22）

| 项目 | 数据 |
|------|------|
| 全名 | backnotprop/plannotator |
| Stars | 5,520 |
| Forks | 377 |
| Open Issues | 115 |
| Language | TypeScript |
| License | Apache-2.0 / MIT 双许可 |
| 创建时间 | 2025-12-28 |
| 最近推送 | 2026-05-22（今天） |
| 官网 | https://plannotator.ai |
| 作者 | backnotprop |
| Topics | agents, claude-code, code-review, codex, obsidian, opencode, plan-mode |

## 核心定位

Plannotator 解决的问题是：AI Agent 在执行代码修改前通常会先制定计划（Plan），但用户只能通过纯文本阅读和回复来审批计划——既不直观，也没有结构化的反馈机制。

Plannotator 在 Agent 的**计划阶段**和**代码审查阶段**之间插入了一个**可视化审查 UI**：

- Agent 输出计划 → Plannotator 在浏览器中渲染计划 → 用户可视化标注 → Approve 或 Request Changes → 结构化反馈回到 Agent

核心理念：**把"阅读文本计划 + 打字回复"变成"在计划上直接画线标注 + 一键审批"**。

## 五大核心能力

### 1. 可视化计划审查（Plan Review）

当 Agent 进入计划模式（Plan Mode）并输出计划后：

1. Plannotator 自动拦截 Agent 的 `ExitPlanMode`（通过 Hook）
2. 在浏览器中打开可视化 UI 渲染计划
3. 用户可以：删除行、插入内容、替换文本、添加批注
4. 可以对高亮选区直接 Ask AI（侧边对话）
5. **Approve** → Agent 继续执行实现
6. **Request Changes** → 标注作为结构化反馈发回 Agent

支持**计划 Diff**：当用户打回计划、Agent 修改后重新提交，UI 自动显示版本差异（+N/-M badge），支持渲染模式（彩色边框）和原始模式（git 风格 +/-）。

### 2. 代码审查（Code Review）

通过 `/plannotator-review` 斜杠命令启动：

- 捕获本地 git diff（支持 jj diff）
- 在浏览器中渲染代码差异视图
- 用户在具体代码行上添加标注
- 内置 **Ask AI** 和 **Agent Code Reviews**
- 支持 GitHub PR 审查（`/plannotator-review <pr-url>`）
- 支持 PR 切换和全栈/Layer diff 范围切换

### 3. 任意文件标注（Annotate）

`/plannotator-annotate <file|folder|url>` 支持标注任意内容：

- Markdown 文件（.md/.mdx）
- HTML 文件（通过 Turndown 转为 Markdown）
- URL（通过 Jina Reader 抓取网页内容）
- 文件夹（打开文件浏览器，按需转换）

### 4. 标注 Agent 上一条消息（Annotate Last）

`/plannotator-last` 让用户直接对 Agent 的最后回复进行可视化标注——适合 Agent 输出了一段分析或方案后，你想逐行批注。

### 5. 团队协作分享

- **小计划**：完整编码进 URL hash，零服务器参与
- **大计划**：AES-256-GCM 端到端加密 → 短链接分享 → 7 天自动删除
- 类似 PrivateBin 的零知识存储
- 完全开源，可自建 paste-service

## 支持的 AI Agent

| Agent | 集成方式 | 计划审查 | 代码审查 |
|-------|---------|---------|---------|
| **Claude Code** | Plugin + Hook | 自动（拦截 ExitPlanMode） | `/plannotator-review` |
| **Copilot CLI** | Plugin | 自动（Plan Mode Shift+Tab） | `/plannotator-review` |
| **Gemini CLI** | Hook + Policy | 自动 | `/plannotator-review` |
| **OpenCode** | Plugin | 自动 | 自动 |
| **Pi** | Extension | Plan Mode（`--plan`） | 自动 |
| **Codex** | Hook（Stop hook） | 自动（macOS/Linux/WSL） | `$plannotator-review` |

## 技术架构

### Monorepo 结构

```
plannotator/
├── apps/
│   ├── hook/                # Claude Code 插件
│   ├── opencode-plugin/     # OpenCode 插件
│   ├── marketing/           # 官网（Astro 5）
│   ├── paste-service/       # 短链接分享服务
│   ├── review/              # 独立 Code Review 服务器
│   ├── vscode-extension/    # VS Code 扩展
│   └── skills/              # Agent Skills（agentskills.io 格式）
│       ├── plannotator-compound/        # 研究分析（map-reduce 被拒计划）
│       ├── plannotator-setup-goal/      # /goal 工作流脚手架
│       └── plannotator-visual-explainer/ # 可视化 HTML 生成器
├── packages/
│   ├── server/    # 共享服务器实现（Bun）
│   ├── ui/        # 共享 React 组件 + 主题 + 快捷键系统
│   ├── ai/        # Provider 无关的 AI 骨干（providers, sessions）
│   ├── shared/    # 共享类型、工具、存储
│   ├── editor/    # 计划审查 App
│   └── review-editor/  # 代码审查 UI
└── docs/          # Astro 文档站
```

### 双运行时服务器

- **Bun 服务器**（`packages/server/`）：Claude Code + OpenCode 使用
- **Node.js 服务器**（`apps/pi-extension/server/`）：Pi 扩展使用

两者 API 表面完全一致，共享 `packages/shared/` 中的业务逻辑。

### 安装方式

```bash
# 安装 plannotator CLI
curl -fsSL https://plannotator.ai/install.sh | bash

# Claude Code
/plugin marketplace add backnotprop/plannotator

# OpenCode（opencode.json）
{ "plugin": ["@plannotator/opencode@latest"] }

# Pi
pi install npm:@plannotator/pi-extension
```

### 关键 API 端点

计划服务器和审查服务器各自暴露约 20+ 个 REST API 端点，覆盖：

- 计划 CRUD + 版本历史 + Diff
- 代码 Diff 切换 + 文件暂存
- AI 会话管理（SSE 流式响应）
- 外部标注（SSE 实时流 + 批量 REST）
- 图片上传、草稿自动保存
- VS Code 编辑器标注桥接
- Obsidian 集成（Vault 检测 + 文件引用）

### 安全与验证

- 每个 release 二进制文件附带 SHA256 sidecar（自动验证）
- 支持 SLSA provenance 验证（v0.17.2+）
- 端到端加密分享（AES-256-GCM）
- 可自建 paste-service

## Agent Skills（agentskills.io 格式）

Plannotator 还提供了 6 个高级 Agent Skills：

| Skill | 功能 |
|-------|------|
| `plannotator-review` | 轻量级：打开 Code Review UI |
| `plannotator-annotate` | 轻量级：打开标注 UI |
| `plannotator-last` | 轻量级：标注 Agent 上一条消息 |
| `plannotator-compound` | 研究分析 Agent：对被拒计划执行 map-reduce 分析 |
| `plannotator-setup-goal` | `/goal` 工作流脚手架 |
| `plannotator-visual-explainer` | 可视化 HTML 生成器（计划、图表、PR 说明） |

## VS Code 扩展

独立的 VS Code 扩展（publisher: backnotprop），功能：

- 在编辑器标签页中打开计划
- 编辑器内标注（annotation → VS Code bridge）
- Cookie 代理 + IPC 服务器
- VS Code 主题适配

## Markdown 解析器

Plannotator 内置了完整的 Markdown 解析器（`packages/ui/utils/parser.ts`），支持：

- 标题（slug-derived anchor ids）
- 代码块（语言高亮，highlight.js）
- 列表、引用块、GitHub Alerts
- 表格（带工具栏：复制为 Markdown/CSV）
- 原始 HTML 块（marked + DOMPurify）
- Directive 容器（`:::kind ... :::`）
- 内联 extras：URL 自动链接、@mentions、emoji shortcodes

## 快捷键系统

三层架构：

1. **Engine**（`packages/ui/shortcuts/`）— 声明式绑定解析器、分发器、平台适配
2. **Scopes** — 每个 UI surface 一个 scope（annotation toolbar、file tree、AI chat 等）
3. **Surfaces** — 每个 App 组合其 scopes

营销站文档页面从快捷键注册表自动生成。

## Plannotator Flavored Markdown（PFM）

Plannotator 的计划渲染器扩展了标准 Markdown，支持：

- 代码文件链接（可点击跳转到源码）
- Callout（GitHub 风格提示框）
- 表格、图表
- 任务列表
- 色值 swatches
- Wiki-links

可通过 `pfmReminder` 配置项让计划 Agent 自动使用这些扩展。

## 与 Agentation 对比

| 维度 | Plannotator | Agentation |
|------|------------|------------|
| **核心场景** | 计划审查 + 代码审查 | 用户视觉反馈 |
| **触发方式** | Agent Hook 自动拦截 | 用户手动点击浏览器工具栏 |
| **标注对象** | Agent 输出的计划文本和代码 Diff | 浏览器中的 UI 元素 |
| **反馈方向** | 用户 → Agent（审批/打回） | 用户 → Agent（标注 UI 问题） |
| **协作分享** | E2E 加密分享 + 团队导入 | 无内置分享 |
| **支持 Agent** | Claude Code/Copilot/Gemini/OpenCode/Pi/Codex（6 个） | 任意 MCP 兼容 Agent（9+ 个） |
| **自动化** | Hands-Free（Agent 提交计划自动弹窗） | Hands-Free + Self-Driving（AI 自动扫描标注） |
| **安装方式** | Plugin/Extension + CLI | npm 组件 + MCP Server |
| **Stars** | 5,520 | 3,706 |

**互补关系**：Plannotator 是"审查者视角"（审查 Agent 的计划和代码），Agentation 是"用户视角"（标注 UI 上的问题）。两者可以配合使用——用 Plannotator 审查 Agent 的实现计划，用 Agentation 收集 UI 实际效果的视觉反馈。

## 局限性

- 计划审查功能与特定 Agent 深度绑定（Claude Code Hook、Codex Stop Hook 等），非通用 MCP
- 需要 Bun 运行时
- 代码审查依赖本地 VCS（git/jj）
- Ask AI 功能依赖本地安装的对应 Agent CLI

## 相关页面

- [[Hapi - 手机远程控制 AI Coding Agent]] — 同为 Agent 辅助工具：Plannotator 做计划和代码的可视化审查，Hapi 做手机远程控制和权限审批
- [[mindfold-ai/Trellis — AI Coding Agent Harness]] — 同为 Agent 编排框架，Trellis 做规范注入和任务生命周期管理