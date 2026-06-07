---
id: cmq2lb6g00000nebtkhh0tosj
title: Matt Pocock Skills — AI Agent Skills 合集调研
type: concept
tags:
  - [claude-code, skills, agent, workflow, engineering, mattpocock]
created: 2026-06-06T16:51:16.705Z
updated: 2026-06-06T16:51:16.705Z
---

# Matt Pocock Skills — AI Agent Skills 合集调研

## 项目概览

**仓库**: https://github.com/mattpocock/skills
**作者**: Matt Pocock — TypeScript/JS 生态知名人物，Total TypeScript (`totaltypescript.com`) 和 AI Hero (`aihero.dev`) 创始人，约 6 万 newsletter 订阅者。
**许可证**: MIT
**定位**: 一组为 Claude Code 设计的 **agent skills（slash commands）**，每个 skill 是一个结构化的 `SKILL.md` 提示模板，教 AI agent 以工程纪律执行特定任务。

### 解决的核心问题

Matt 识别了 AI coding agent 的 **四种常见失败模式**：

1. **Agent 没做你想要的** — 人机意图不对齐
2. **Agent 太啰嗦** — 缺乏共享语言
3. **代码跑不通** — 反馈循环不足
4. **代码库变成一团泥** — AI 加速了代码劣化

这组 skills 就是他的回答：小型、可组合、基于工程纪律的工具，适用于任何模型。

## 目录结构

```
mattpocock/skills/
├── .claude-plugin/
│   └── plugin.json                    # Claude Code 插件清单（14 个已发布 skill）
├── .out-of-scope/                     # 被拒绝的功能需求知识库
├── CLAUDE.md                          # 仓库级 Claude 指令
├── CONTEXT.md                         # 本仓库的共享语言
├── docs/adr/                          # 本仓库的架构决策记录
├── scripts/
│   ├── list-skills.sh                 # 列出所有 SKILL.md
│   └── link-skills.sh                 # 符号链接到 ~/.claude/skills
│
├── skills/
│   ├── engineering/                   # 10 个 — 日常代码工作（稳定）
│   │   ├── diagnose/                   # 6 阶段诊断循环
│   │   ├── grill-with-docs/           # 文档驱动的需求质询
│   │   ├── triage/                     # Issue 状态机管理
│   │   ├── improve-codebase-architecture/ # 深度模块重构
│   │   ├── setup-matt-pocock-skills/  # 一次性仓库配置
│   │   ├── tdd/                        # 红绿重构 TDD 循环
│   │   ├── to-issues/                  # 计划 → Issue 拆分
│   │   ├── to-prd/                     # 对话 → PRD 发布
│   │   ├── zoom-out/                   # 放大上下文查看
│   │   └── prototype/                  # 可抛弃原型
│   │
│   ├── productivity/                  # 4 个 — 通用工作流（稳定）
│   │   ├── caveman/                    # 极简压缩通信模式
│   │   ├── grill-me/                   # 对用户方案的追问
│   │   ├── handoff/                    # 会话交接文档
│   │   └── write-a-skill/              # 元 skill：创建新 skill
│   │
│   ├── misc/                          # 4 个 — 偶尔使用（稳定）
│   │   ├── git-guardrails-claude-code/ # Git 危险命令阻断 hooks
│   │   ├── migrate-to-shoehorn/        # TypeScript as → shoehorn 迁移
│   │   ├── scaffold-exercises/         # 课程练习目录脚手架
│   │   └── setup-pre-commit/           # Husky + lint-staged 配置
│   │
│   ├── personal/                      # 2 个 — Matt 专用
│   │   ├── edit-article/               # 文章重构
│   │   └── obsidian-vault/             # Obsidian 笔记管理
│   │
│   ├── in-progress/                   # 5 个 — 草稿，未发布
│   │   ├── review/                     # 双轴 Code Review
│   │   ├── teach/                      # 教学系统
│   │   ├── writing-beats/              # 选择式文章写作
│   │   ├── writing-fragments/          # 素材碎片挖掘
│   │   └── writing-shape/              # 素材 → 文章成型
│   │
│   └── deprecated/                    # 4 个 — 已被取代
│       ├── design-an-interface/       # → improve-codebase-architecture
│       ├── qa/                         # → triage
│       ├── request-refactor-plan/      # → to-prd + to-issues
│       └── ubiquitous-language/        # → CONTEXT.md
```

**总计 29 个 skills**，其中 14 个通过 plugin 发布。

## 逐 Skill 详解

### Engineering Skills（10 个核心）

#### `/diagnose` — 6 阶段诊断循环

**用途**: 硬 Bug 和性能回归的纪律化诊断。

**机制**: 严格 6 阶段管线：
1. **构建反馈循环** — 最关键的阶段；构造快速的、确定性的、agent 可运行的 pass/fail 信号（失败测试、curl 脚本、无头浏览器、二分 harness 等）
2. **复现** — 确认循环能产生用户描述的故障
3. **假设** — 生成 3-5 个排序的、可证伪的假设；测试前展示给用户
4. **插桩** — 每次只改一个变量；优先级：debugger > 定向 log > 绝不"log everything"
5. **修复 + 回归测试** — 在正确层次先写回归测试再修复
6. **清理 + 复盘** — 移除插桩，可选交给 `/improve-codebase-architecture`

**亮点**: 附带 `hitl-loop.template.sh` 模板，用于无法自动化的 Bug 的人工循环。

#### `/grill-with-docs` — 文档驱动的需求质询

**用途**: 在开始任何重要变更前，挑战方案与现有领域模型的一致性，锤炼术语，实时更新文档。

**机制**: Agent 逐一对用户方案的每个方面提问，一次一个：
- **术语冲突检查** — 用户术语与 CONTEXT.md 不一致时标记
- **模糊语言锤炼** — 为模糊词汇提出规范术语
- **场景压力测试** — 发明边缘情况迫使精确化
- **代码交叉验证** — 代码与用户说法矛盾时指出
- **CONTEXT.md 实时更新** — 决策达成共识时立即写入
- **ADR 稀疏创建** — 仅当三个条件全满足：难以逆转 + 缺上下文会令人困惑 + 真实权衡的结果

**ADR 稀疏准则**: 这是最精妙的设计——不是每件事都值得记录。只有那些未来读者会问"为什么？"且存在真实替代方案的决策才创建 ADR，且只写 1-3 句话。

#### `/triage` — Issue 状态机管理

**用途**: 通过状态机角色管理 Issue。

**机制**: 5 个状态角色（needs-triage → needs-info → ready-for-agent → ready-for-human → wontfix）。每条 AI 生成评论都附带免责声明。

**关键设计**: `ready-for-agent` 状态会生成结构化的 **Agent Brief**（行为性描述，非程序性指令，不含文件路径，含验收标准）。`wontfix`（增强类）写入 `.out-of-scope/` 作为机构记忆。

#### `/improve-codebase-architecture` — 深度模块重构

**用途**: 基于 John Ousterhout《A Philosophy of Software Design》寻找"深化机会"——将浅模块变为深模块的重构。

**机制**: 3 阶段：
1. **探索** — 走查代码库，发现摩擦（浅模块、信息泄漏、局部性差、未测试代码）
2. **HTML 报告** — 生成自包含 Tailwind+Mermaid HTML 文件，含前后对比可视化和推荐强度标签（Strong/Worth exploring/Speculative）
3. **质询循环** — 用户选择候选后，走查设计树

**关键概念**: 附带精密的共享词汇定义（LANGUAGE.md）——module、interface、depth、seam、adapter、leverage、locality，每个词都有精确到一两句话的边界定义。

#### `/tdd` — 红绿重构 TDD

**用途**: 垂直切片的测试驱动开发。

**机制**: 强制 **垂直切片**（一个测试 → 最少代码 → 重复），明确拒绝"水平切片"（先写所有测试再写所有代码）。核心哲学：测试验证**通过公共接口的行为**，不是实现细节。

**Mock 原则**: 只在系统边界 mock；通过依赖注入模式实现可测试性。

#### `/to-issues` — 计划 → Issue 拆分

**用途**: 将计划/规范/PRD 拆分为可独立领取的 Issue。

**机制**: 使用**垂直切片**（tracer bullets），每个 slice 端到端穿越所有层。标记为 HITL（需人工）或 AFK（agent 可独立完成），按依赖顺序发布到 Issue Tracker。

#### `/to-prd` — 对话 → PRD

**用途**: 将当前对话综合为 PRD 并发布为 GitHub Issue。

**关键设计**: **不做访谈**——只提炼已讨论的内容。包含 Problem Statement、Solution、User Stories、Implementation Decisions（无文件路径！）、Testing Decisions、Out of Scope。

#### `/prototype` — 可抛弃原型

**用途**: 在投入前构建原型回答设计问题。

**机制**: 根据问题类型分两条路径：
- **LOGIC 分支** — 构建交互式 TUI，让用户手动驱动状态模型。核心是可移植的纯模块（reducer、状态机、纯函数）。TUI 可抛弃，逻辑模块可提升到生产环境。
- **UI 分支** — 生成 3+ 个截然不同的 UI 变体，通过 `?variant=` URL 参数切换，带底部浮动切换栏。优先嵌入现有页面而非新建抛弃式路由。

#### `/zoom-out` — 放大上下文

**用途**: 告诉 agent 对不熟悉的代码段给出更广泛的上下文。超极简 skill——仅 8 行内容。

#### `/setup-matt-pocock-skills` — 一次性配置

**用途**: 为每个仓库配置所有其他 engineering skills 消费的设置。

**机制**: 提示驱动（非脚本），引导用户做 3 个决策：Issue Tracker 类型、Triage 标签映射、领域文档布局。写入 `docs/agents/` 下的配置文件。

### Productivity Skills（4 个）

#### `/caveman` — 极简压缩通信

**用途**: 将 token 用量压缩约 75%。去掉冠词、填充词、礼貌用语、模糊措辞。模式：`[事物] [动作] [原因]。[下一步]。` 持续到用户说"stop caveman"。

#### `/grill-me` — 对用户方案的追问

**用途**: 整个 skill 指令仅 11 行——逐一对方案每个方面追问，一次一个问题，每个问题附推荐答案。能通过探索代码库回答的就不问用户。

#### `/handoff` — 会话交接

**用途**: 将当前对话压缩为交接文档供另一个 agent 继续。引用已有产物（PRD、Issue、ADR）的路径/URL 而非复制内容，包含"suggested skills"段。

#### `/write-a-skill` — 元 Skill

**用途**: 创建新 skill 的模板和指导。定义了规范 skill 结构和 SKILL.md 编写规则。

### Misc Skills（4 个）

#### `/git-guardrails-claude-code` — Git 危险命令阻断

**用途**: 通过 Claude Code **PreToolUse hook** 阻断危险的 git 命令（push、reset --hard、clean -f、branch -D 等）。

这是与我们的 hooks 研究最直接相关的 skill——它证明了 **Claude Code 的 hook 系统（exit code 2）可以被用来实现真正的运行时阻断**，而不仅仅是建议。

## 共享基础设施与约定

### Skill 文件结构约定

```
skill-name/
├── SKILL.md           # 必须 — frontmatter + 指令
├── [REFERENCE].md     # 可选 — 详细文档（SKILL.md 超 100 行时拆出）
└── scripts/           # 可选 — 确定性工具脚本
```

### SKILL.md Frontmatter 约定

```yaml
---
name: skill-name                    # 必须
description: 简述。Use when [触发条件]。  # 必须，最长 1024 字符
disable-model-invocation: true      # 可选 — 仅显式命令触发
argument-hint: "下一个 session 用于什么？"  # 可选
---
```

### 渐进披露模式

使用 `<what-to-do>` 和 `<supporting-info>` XML 标签分离核心指令与背景知识。Agent 先读 `<what-to-do>`；需要时再加载 `<supporting-info>`。

### 领域文档约定

- **CONTEXT.md** — 项目术语表，含 `_Avoid_` 别名，零实现细节
- **CONTEXT-MAP.md** — 多 bounded context 仓库的 context 关系映射
- **docs/adr/** — 超精简 ADR（1-3 句话，顺序编号）
- **`.out-of-scope/`** — 被拒绝功能需求的持久记录

### Hard vs Soft 依赖

- **Hard 依赖**（to-issues、to-prd、triage）— 包含显式配置指针，缺配置则无法工作
- **Soft 依赖**（diagnose、tdd、improve-codebase-architecture、zoom-out）— 模糊引用领域文档，缺配置时优雅降级

## Claude Code 集成机制

### 安装方式

1. **Plugin 系统**: `.claude-plugin/plugin.json` 定义 skills 包，Claude Code 读取后注册为 slash commands
2. **安装命令**: `npx skills@latest add mattpocock/skills`
3. **Symlink**: `scripts/link-skills.sh` 将非废弃 skills 链接到 `~/.claude/skills`

### Skill 加载流程

用户输入 `/grill-me` 或描述匹配 skill description 触发条件时：
1. Claude Code 读取 SKILL.md frontmatter（name + description）进行路由
2. 加载完整 SKILL.md 内容作为该交互的系统提示
3. 按需加载引用的补充文件（CONTEXT-FORMAT.md 等）

### Hooks 集成

`git-guardrails` skill 使用 Claude Code 的 **PreToolUse hook 系统**——bash 脚本在工具执行前拦截。这直接证明了 hooks 可以实现**运行时阻断**。

### Sub-agent 模式

多个 skills（improve-codebase-architecture、review、prototype）使用 Claude Code 的 Agent tool 派生平行 sub-agents 处理独立工作流。

## 核心设计哲学

### 1. 工程基础在 AI 时代更重要，不是更少

AI 不消除对良好工程实践的需求——它加速了糟糕实践的后果。这些 skills 基于数十年工程经验，引用了：

- *The Pragmatic Programmer*（David Thomas & Andrew Hunt）— 反馈循环、小步前进
- *Domain-Driven Design*（Eric Evans）— 统一语言
- *A Philosophy of Software Design*（John Ousterhout）— 深度模块、"设计两次"
- *Extreme Programming Explained*（Kent Beck）— 每天投资设计
- *Working Effectively with Legacy Code*（Michael Feathers）— 接缝（seams）

### 2. 小型、可组合、模型无关

不像重型框架（GSD、BMAD、Spec-Kit），每个 skill 只做一件事且可独立使用。虽然为 Claude Code 设计但不绑定于它。

### 3. 渐进披露

复杂 skill 拆分为 SKILL.md（核心）+ 支撑文件（深度）。Agent 按需加载。

### 4. 懒创建文档

CONTEXT.md 和 ADR 只在术语/决策真正固化时创建——绝不做前置仪式。

### 5. 行为性规范，非程序性指令

Agent Brief、PRD、测试都描述**系统应该做什么**，而非**如何实现**。不包含文件路径或行号。

### 6. 用户始终在控制中

每个 skill 设计为保持人工在环——质询 session 一次问一个问题，原型需要人工驱动，配置是提示驱动而非脚本执行。

## 与我们的 Hooks 研究的关系

### 已覆盖的交叉点

- `/grill-with-docs` 的 CONTEXT.md 机制 → 我们的四层防御 Layer 1（意图层）
- `/git-guardrails-claude-code` 的 PreToolUse hook → 我们的四层防御 Layer 2（拦截层）
- `/setup-matt-pocock-skills` 的仓库配置 → 我们的方案 C（AGENTS.md 跨工具共享）
- ADR 稀疏准则 → 适合直接采用到我们的项目中

### Matt 的 Skills 未覆盖的

- **PreCompact hook** — Matt 没有针对上下文压缩的保护机制
- **阶段门控 hook** — AtlantisYuki 的 SDLC 阶段门控没有 hook 级执行
- **OS 级沙箱** — Matt 的方案纯 Claude Code，不涉及 Codex CLI
- **跨工具兼容** — 所有 skills 专为 Claude Code 设计

### 可借鉴的具体实践

1. **ADR 稀疏准则**（三条件过滤器）— 直接可用，避免文档膨胀
2. **CONTEXT.md 懒创建** — 不前置创建，用到再建
3. **垂直切片 Issue 拆分** — to-issues 的 tracer bullet 方法
4. **behavioral spec（行为性规范）** — 不写文件路径，只写行为和验收标准
5. **caveman 模式** — 高 token 消耗场景的压缩方案
6. **handoff 交接文档** — 跨 session 上下文保持

## 统计

| 类别 | 数量 | 状态 | 已发布？ |
|------|------|------|---------|
| Engineering | 10 | 稳定，日常使用 | 是 |
| Productivity | 4 | 稳定，日常使用 | 是 |
| Misc | 4 | 稳定，偶尔使用 | 是 |
| Personal | 2 | Matt 专用 | 否 |
| In-Progress | 5 | 草稿 | 否 |
| Deprecated | 4 | 已被取代 | 否 |
| **总计** | **29** | | **14 已发布** |

## 相关页面

- [[ai-agent-可执行hooks与控制流方案]] — 兼容 Claude Code + Codex CLI 的可执行 hooks 方案
- [[claude-code-operator模式与5种agentic工作流]] — Claude Code 的 operator 模式
- [[hermes-agent-中的-operator-模式三维框架与-claude-code-的深度对比]] — Hermes vs Claude Code
- [[system-prompt-设计指南]] — 系统提示词设计方法论
- [[prompt-engineering-最佳实践]] — 提示工程最佳实践