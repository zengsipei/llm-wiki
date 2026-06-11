---
id: cmq4vimsh0001l4saqvm3qrpr
title: Flowtrace — AI Agent 任务的结构化 Trace 框架
type: concept
tags:
  - [flowtrace, agent, workflow, trace, dag, claude-code, codex, rust, react]
created: 2026-06-08T07:12:32.993Z
updated: 2026-06-08T07:12:32.993Z
---

# Flowtrace — AI Agent 任务的结构化 Trace 框架

## 项目概览

**仓库**: https://github.com/AIScientists-Dev/Flowtrace
**组织**: AIScientists-Dev (MorphMind / morphmind.ai)
**许可证**: MIT
**语言**: TypeScript（前端）+ Rust（CLI/后端）
**创建**: 2026 年 5 月 9 日
**Stars**: 94 | **Forks**: 9 | **Open Issues**: 3

### 一句话定位

**将 AI agent 任务转化为透明的、可复用的、可演进的 Trace。** 不再是一次性对话，而是结构化的步骤流（DAG），每一步都在磁盘留下真实文件，整个过程 git 记录，任何步骤可审查、覆盖和重跑。

### 解决的核心问题

| 问题 | Flowtrace 的回答 |
|------|-----------------|
| AI 执行是黑盒 | 可见的步骤流，每步展示其做了什么 |
| 知识在任务结束后消失 | 全过程 git 记录，Trace 作为方法持久保存 |
| 类似任务每次从头组装 | Trace skeleton 可复用于新输入 |
| 干预需要写长段纠正文字 | 指向某个节点，改一步，下游自动重跑 |

### 六大价值

1. **Transparent**（透明）— 可见的步骤流
2. **Grounded**（有据）— 每个结果背后有真实文件
3. **Steerable**（可驾驶）— 改一步，依赖步骤重跑
4. **Traceable**（可追溯）— 每次 CLI 写入 = 一次 git commit
5. **Reusable**（可复用）— 同一 Trace skeleton 适用新输入
6. **Evolving**（可演进）— 每次运行可改进 Trace

## 架构

### 两部分设计

**1. Rust CLI（`flowtrace` 二进制）**

Cargo workspace 含两个 crate：

- **flowtrace-core** — 共享库：Trace JSON schema 类型（Trace、StepSpec、Deliverable、Environment）、状态管理（state.json）、验证（slug 正则、DAG 环检测、路径安全检查）、结构化输出类型
- **flowtrace-cli** — 主二进制：
  - `clap` derive 宏解析 CLI 命令
  - Git 集成 — 每次 write 精确产生一次 git commit，限定作用路径
  - 内嵌 HTTP 服务器 — `axum` + `rust-embed`（编译时将前端嵌入二进制）
  - 文件监听 — `notify` 开发模式热重载
  - DAG 渲染 — JSON、ASCII、Mermaid、DOT 格式
  - Schema 自省 — `flowtrace explain` 从同一 Rust 类型读取

**2. React 前端（编译时嵌入二进制）**

Vite 构建 → 静态资源 → `rust-embed` 编译时嵌入。

- React 19 + TypeScript
- **@xyflow/react**（React Flow）— DAG 可视化
- ELK.js — 自动图布局
- Tailwind CSS 4
- i18next — 中英双语
- 丰富渲染：Markdown、KaTeX 数学、Mermaid 图表、PDF、XLSX、DOCX

### 关键设计：CLI 就是 API

CLI 是 agent 与系统之间的唯一契约。人类和 AI agent 通过同一 CLI 驱动 Trace。自文档化：`--help` 和 `flowtrace explain`。

## 核心概念

### Trace（方法记录）

Trace 是一个 **文件系统原生的、自描述的、git 支持的文件夹**：

```
trace/
├── trace.json          # 静态计划：步骤、DAG 依赖（from_steps）、预期资产、交付物
├── steps/
│   └── <id>/
│       └── STEP.md      # 每步的合约（写给执行者：AI 或人类）
├── scripts/             # 共享代码
├── resources/           # 共享材料
└── runs/
    └── <run_id>/
        ├── state.json   # 运行状态（单一事实来源）
        ├── replies/     # 追加式结构化输出流
        │   └── NNNN.json
        └── <step_id>/   # 步骤输出文件
```

### Run（一次执行）

一次 Trace 执行活在 `runs/<run_id>/` 下。`state.json` 是运行状态的单一事实来源，每次 CLI 命令原子写入。

### Step 状态机

```
idle → running → done（→ running 可重跑）
              ↘ blocked（需要消息）
              ↘ error（需要消息）
```

任何状态可跟任何状态。`done` 不是终态——你可以重入 `running` 来调整。

### 数据流

步骤通过**文件**传递数据，不是参数。每步写输出文件；下游步骤读取。`from_steps` 声明依赖边；执行者决定如何使用上游文件。

### Git 作为审计追踪

每次 CLI 写入 = 精确一次 git commit，限定到声明的路径。Commit 消息约定：`<step_id>: running, <message>`、`deliverable: done, <message>` 等。

### 驾驶 / 重跑

- 改某步输出 → 标记 `running` → 重新执行 → 标记 `done`
- `flowtrace show --downstream <step_id>` 列出所有传递依赖（拓扑排序）
- 交付物在下游变更后必须重新确认

## 与其他工具的本质区别

### Flowtrace 不是工作流引擎

项目明确将自己与工作流引擎区分：

| 维度 | 工作流引擎 | Flowtrace |
|------|-----------|-----------|
| 控制流 | 硬性："先 A，再 B，再 C" | 软性："B 的推理需要 A 的输出" |
| 执行 | 强制、自动化 | 任何人（AI、人类、daemon）读取 Trace 作为参考 |
| 条件分支 | 分支、循环 | 不支持 — 用交付物拆分代替 |
| 状态跟踪 | 内置 | 执行者的关注点，非 Trace 的 |
| 生命周期 | 运行后消亡 | 超越任何特定执行；积累知识 |

### AI 工具链中的"缺失层"

Flowtrace 定位为 **组合层**：

```
agent = model    （判断力）
      + traces  （方法：如何思考某类任务）
      + skills   （能力：具体的招式）
```

- **Model** — 判断力/能力
- **Skills** — 个体能力：Python 函数、MCP 工具、SKILL.md 指南
- **Traces** — 如何为某类任务组合 skills

### 与其他工具对比

| 工具 | 控制流 | 持久性 | 复用性 | 可驾驶性 |
|------|--------|--------|--------|---------|
| LangChain / LlamaIndex | 硬链/图 | Session 级 | 有限 | 低 |
| CrewAI / AutoGen | Agent 编排 | Session 级 | 角色级 | 中 |
| Temporal / Prefect | 硬工作流 | 持久 | 完全可复用 | 高（但代码重） |
| CI/CD (GitHub Actions) | 硬 DAG | 永久 | 完全可复用 | 高（但刚性） |
| ChatGPT / Claude Chat | 无（线性） | 无 | 无 | 无 |
| **Flowtrace** | **软 DAG（方法，非控制）** | **Git 支持永久** | **Trace 即方法** | **步骤级指向** |

## 示例（13 个）

| 类别 | 示例 | 来源 Skill |
|------|------|-----------|
| 参考（合成） | `minimal` — 1 步 | 内置 |
| 参考（合成） | `dream-analysis` — 多步 | 内置 |
| 参考（合成） | `iris-analysis` — 24 步 ML 管线 | 内置 |
| 参考（合成） | `nested-deps` — 嵌套依赖 | 内置 |
| 📄 职业 | `tailored-resume` — 定制简历 | ComposioHQ |
| 💰 投资 | `nvda-decision` — NVDA 买卖分析 | tradermonty |
| 🤝 并购 | `saas-dd` — SaaS 尽职调查 | alirezarezvani |
| 🛡 安全 | `security-cicd` — CI/CD 安全管线 | mukul975 |
| ✍️ 研究 | `research-writer` — 行业深度报告 | ComposioHQ |
| 🐛 SWE | `swe-bugfix` — Bug 修复学习循环 | obra/superpowers |
| 📈 营销 | `paid-ads` — 付费广告优化 | coreyhaines31 |
| 🧠 知识 | `distill-mind` — 蒸馏思维为 Skill | alchaincyf/nuwa-skill（女娲） |
| 🖼 设计 | `talk-to-deck` — 演讲→幻灯片 | op7418/guizang-ppt-skill（歸藏） |

### make-trace Skill

`skills/make-trace/SKILL.md` — 一个 agent skill，可将任何来源（SKILL.md、runbook、聊天记录、已完成的任务）转化为可运行的 Trace。

## 技术栈

### 后端（Rust）

| 依赖 | 用途 |
|------|------|
| `clap` 4 | CLI 参数解析 |
| `serde` + `serde_json` | JSON 序列化 |
| `tokio` | 异步运行时 |
| `axum` 0.8 | HTTP 服务器（`flowtrace serve`） |
| `rust-embed` 8 | 编译时嵌入前端静态资源 |
| `notify` 8 | 文件系统监听 |
| `similar` 2 | Diff 计算 |

### 前端（React/TypeScript）

| 依赖 | 用途 |
|------|------|
| React 19 + Vite 5 | UI 框架 + 构建工具 |
| `@xyflow/react` 12 | DAG 流图可视化 |
| ELK.js 0.11 | 自动图布局 |
| Tailwind CSS 4 | 样式 |
| `@tanstack/react-query` 5 | 服务端状态管理 |
| `react-markdown` + KaTeX + Mermaid | 富内容渲染 |
| `pdfjs-dist` + `xlsx` + `mammoth` | 文档查看 |
| `i18next` 23 | 国际化 |

### 构建

Rust workspace，`lto = "thin"`，`codegen-units = 1`，`strip = true`。**前端必须先于 CLI 构建**（因为 `rust-embed` 在编译时烘焙前端）。

## 设计哲学

### 文件系统原生

没有数据库，没有运行时，只有文件和 git。Trace 是一个普通文件夹，可 git clone、fork、diff、审查。

### 模型无关

与 Claude Code、Codex、Cursor 等任何 agent 兼容。Agent 通过 CLI 与 Trace 交互，不依赖特定模型。

### 软执行

Trace 描述方法，不描述执行路径。执行者（AI 或人类）读取 Trace 作为参考，决定如何执行。这不是工作流引擎的硬控制。

### 人-AI 共享对象

两者读取同一结构，将对话对齐成本从"写段落式纠正"降低为"指向某个节点"。

### 认知即知识制品

> "The first framework to make cognitive labor traceable and reusable." — 第一个让认知劳动可追溯、可复用的框架。

### 组合优于能力

Flowtrace 位于 skills 之上，提供"如何为某类任务串联招式"的层。

## 与我们的 Hooks 研究的关系

### 互补性

| 维度 | Flowtrace | 我们的 Hooks 方案 |
|------|-----------|-----------------|
| 抽象层级 | 任务/方法层（Trace 是一种方法的记录） | 运行时执行层（hooks 拦截具体操作） |
| 控制粒度 | 步骤级（整步可重跑） | 工具调用级（单个 Bash/Write 可阻断） |
| 持久性 | Git 支持永久 | 内存 + 配置文件 |
| 强制力 | 软性（方法描述，不强制执行） | 硬性（exit code 2 阻断） |
| 复用模型 | Trace skeleton 复用 | Hook 脚本复用 |

### 可结合的方案

1. **Flowtrace 的 `make-trace` skill + Claude Code PreToolUse hooks** — 用 hooks 确保每步执行不偏离 Trace 规范
2. **Flowtrace 的 git 审计 + 我们的 PostToolUse hooks** — 双重记录，CLI 层和 hook 层都有审计
3. **Flowtrace 的状态机 + 我们的 phase-gate hook** — Trace 提供高层方法，hooks 提供低层执行约束

### Flowtrace 的独特价值

它回答了一个我们的 hooks 方案没有覆盖的问题：**如何让 AI 的工作方法变得可观察、可复用、可演进**。Hooks 控制的是"不能做什么"，Flowtrace 管的是"如何系统地做某类事"。

## 已知局限

- **非常新的项目**（2026 年 5 月创建），尚未发布正式版本
- **Star 数量低**（94），社区早期阶段
- **无 hooks 系统** — 不能在步骤执行时拦截或阻断
- **不支持条件分支/循环** — 用交付物拆分代替
- **执行需要人工/agent 读取 Trace 后操作** — 不是自动编排
- **TypeScript 类型从 Rust 同步生成** — 增加构建复杂度

## 相关页面

- [[AI Agent 可执行 Hooks 与控制流方案]] — 兼容 Claude Code + Codex CLI 的可执行 hooks 方案
- [[Matt Pocock Skills — AI Agent Skills 合集调研]] — Matt Pocock Skills 合集调研
- [["Claude Code Operator模式与5种Agentic工作流"]] — Claude Code 的 operator 模式
- [[Agent 架构设计模式]] — Agent 架构设计模式