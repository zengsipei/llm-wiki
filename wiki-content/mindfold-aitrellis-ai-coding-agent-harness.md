---
id: 00b06be7-1c81-476e-8195-02ad08bebf74
title: "mindfold-ai/Trellis — AI Coding Agent Harness"
type: concept
tags: ["grahify-kb"]
created: 2026-05-14
updated: 2026-05-14
source: grahify-kb
---


# mindfold-ai/Trellis — AI Coding Agent Harness

> The harness that makes coding agents production-ready. 让 AI Agent 真正具备生产力的 Coding Harness。

## 基本信息（GitHub API, 2026-05-14）

| 项目 | 数据 |
|------|------|
| 全名 | mindfold-ai/Trellis |
| Stars | 7,893 |
| Forks | 431 |
| Open Issues | 10 |
| Language | TypeScript |
| License | AGPL-3.0 |
| Default Branch | main |
| 创建时间 | 2026-01-26 |
| 最近推送 | 2026-05-14 |
| npm 包 | `@mindfoldhq/trellis` v0.5.15 |
| 月下载量 | 16,730 (2026-04-13 至 2026-05-12) |
| 官网 | https://docs.trytrellis.app |
| 仓库大小 | ~231 MB |
| 社区 | Discord: https://discord.com/invite/tWcCZ3aRHc |

## 简介

Trellis 是一个**跨平台 AI Coding Agent 协作框架**——它在项目 repo 中建立一层 `.trellis/` 结构，让不同的 AI 编码工具（Claude Code、Codex、Cursor、Gemini CLI、Windsurf 等 14 个平台）共享同一套规范、任务定义、工作区记忆和子 agent 能力。

一句话：**用 Gemini 写前端，Claude Code 写后端，Codex 审查，或者交给团队接力开发——上下文、规范与标准在所有平台和团队内部之间共享。**

## 核心能力

| 能力 | 说明 |
|------|------|
| **自动注入规范** | 规范沉淀在 `.trellis/spec/`，按当前任务自动按需注入相关上下文，无需反复说明 |
| **任务驱动工作流** | PRD、实现上下文、审查上下文与任务状态统一存放于 `.trellis/tasks/` |
| **项目记忆** | `.trellis/workspace/` 下的 journal 保存跨会话历史，新会话直接继承上下文 |
| **团队共享标准** | 规范存在于 repo 中，一人的最佳实践提升整个团队 |
| **多平台统一** | 同一套 `.trellis/` 结构适配 14 个 AI coding 平台 |

## 四阶段工作流

```
Plan → Implement → Verify → Finish
  │        │          │        │
brainstorm  implement  check   update-spec
research    (subagent) (subagent) → 新经验回写 spec
→ PRD.md    → 代码      → diff 审查 + lint/type/test 自修
```

1. **Plan** — `trellis-brainstorm` 逐问引导写 PRD；研究型任务派 `trellis-research` 子 agent
2. **Implement** — 子 agent 从 PRD + 注入的 spec 上下文写代码（不自动 commit）
3. **Verify** — `trellis-check` 对 diff 做规范审查 + lint/type-check/test，能自修则自修
4. **Finish** — 最终检查 + `trellis-update-spec` 将新经验回写 spec，下次更聪明

## 项目结构

```
.trellis/
├── config.yaml          # 项目级配置
├── workflow.md          # 开发工作流定义
├── spec/                # 编码规范（按 package/layer 组织）
│   ├── cli/             # CLI 层规范
│   ├── docs-site/       # 文档站点规范
│   └── guides/          # 跨包思维指南
│       ├── cross-platform-thinking-guide.md
│       ├── cross-layer-thinking-guide.md
│       └── code-reuse-thinking-guide.md
├── agents/              # 子 agent prompt
│   ├── check.md         # 审查 agent
│   ├── implement.md     # 实现 agent
│   └── research.md      # 研究 agent
├── scripts/             # Python 工具脚本
│   ├── task.py          # 任务生命周期管理
│   ├── get_context.py   # 规范上下文注入
│   ├── add_session.py   # 会话记录
│   └── hooks/           # 平台 hook 脚本
├── tasks/               # 活跃任务 (prd.md + implement.jsonl + check.jsonl)
└── workspace/           # 每人 journal + session trace

.{cursor,claude,codex,opencode,pi}/   # 各平台适配配置
├── agents/    → 子 agent 定义
├── hooks/     → 生命周期 hook
├── commands/  → slash 命令 (如 /trellis:finish-work)
└── skills/    → 平台 skill
```

## 支持的平台（14 个）

完整覆盖 Claude Code、Cursor、Codex、OpenCode、Pi（Cognition）、Windsurf、Cline、Gemini CLI、GitHub Copilot、Kilo Code 等。每个平台有独立的 `.cursor/` `.claude/` 等目录存放 agent、hooks、commands、skills 配置。

## 安装

```bash
npm install -g @mindfoldhq/trellis@latest
cd your-repo
trellis init -u your-name
# 指定平台
trellis init --cursor --opencode --codex -u your-name
```

前提：Node.js ≥ 18，Python ≥ 3.9。

## 核心贡献者

| 贡献者 | Commits |
|---|---|
| taosu0216 (@taosu0216) | 62 |
| lapse12 | 13 |
| SamCuipogobongo | 7 |
| jsfaint | 5 |

## 版本历史

| 版本 | 日期 | 备注 |
|------|------|------|
| v0.6.0-beta.14 | 最新 beta | 活跃开发中 |
| v0.5.15 | 2026-05-13 | 当前 stable |

## Trellis vs 同类

| 对比项 | CLAUDE.md / AGENTS.md | Trellis |
|--------|-----------------------|---------|
| 规范组织 | 单一文件，易成"大杂烩" | 分域 spec，按 package/layer 组织，按任务自动注入 |
| 任务结构 | 无 | PRD + implement.jsonl + check.jsonl 结构化管理 |
| 跨会话记忆 | 依赖 LLM 记忆 | workspace journal 持久化 |
| 团队协作 | 每人手动同步 | repo 内共享规范，一人优化全队受益 |
| 多平台 | 每种平台独立配置 | 统一结构生成多平台配置 |

## 与 Hermes 的关联

Trellis 和 Hermes 都属于 AI Agent 生态的不同层面：

- **Hermes** 是 Agent **运行时**——管理模型调用、工具执行、会话存储、memory、cron、网关等
- **Trellis** 是 Agent **工作框架层**——管理规范注入、任务生命周期、子 agent 编排、跨平台配置

两者可以互补：在 Hermes 管理的项目中使用 Trellis 的 `workflow.md` + `spec/` 结构作为 skill 和 memory 的补充，或反过来将 Hermes 的 `delegate_task` + `kanban` 编排模式与 Trellis 的四阶段工作流结合。