---
title: AI Agent 可执行 Hooks 与控制流方案
slug: ai-agent-hooks-and-control-flow
tags: [claude-code, codex-cli, hooks, agent-control, enforcement]
created: 2026-06-06
updated: 2026-06-06
---

# AI Agent 可执行 Hooks 与控制流方案

## 核心问题

**Skill / MD 提示词在上下文压缩或新 session 中可能被忽略，只起到建议效果而非约束。**

Claude Code 的 `CLAUDE.md`、Skills、System Prompt 都属于「建议性控制」——它们设置意图，但不具备技术强制力。当上下文压缩发生、新 session 启动、或子 agent 被派生时，这些指令可能被弱化或完全丢失。我们需要一种**跨工具的、可执行的控制流方案**，能够在运行时真正约束 agent 行为。

## 两个参考项目分析

### AtlantisYuki/prompt — SDLC 阶段门控工作流

**仓库**: https://github.com/AtlantisYuki/prompt

这是一个为 Claude Code 设计的结构化软件开发生命周期（SDLC）工作流系统，通过 slash command 驱动的阶段门控来约束开发流程。

**核心理念**: 将开发拆分为 `sdlc-design-1` → `sdlc-design-2` → `sdlc-implement` → `sdlc-test` 四个严格顺序阶段，每个阶段产出结构化文档作为状态检查点。

**控制机制**:

- **Slash 命令激活** — 阶段只能通过显式命令触发
- **待确认门控** — 生成 `*-待确认.md` 文件，未解决则阻断下一阶段
- **前置上下文扫描** — 设计时必须先扫描代码库
- **知识回写** — 必须将学习内容写回知识库
- **回退修正** — 实现发现缺陷时可回退到 design-2

**优势**:

- 极其精细的流程工程，每个阶段输出格式都有明确规定
- 人工确认门控确保关键决策不跳过
- 任务级粒度追踪，包含逐行变更日志
- Solo 模式用于简单任务，避免过度仪式

**局限性**:

- **纯提示词级别控制** — 无技术强制力，agent 可跳过阶段
- 依赖 markdown 文件作为状态机，`status.md` 损坏会破坏流程
- 中文锁定，不适用于国际化团队
- Claude Code 专用，不可移植到其他工具
- 小任务开销过大

### mattpocock/skills — grill-with-docs

**仓库**: https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs

Matt Pocock 的 Claude Code Skill，通过「用文档质询」的方式强制领域驱动设计（DDD）的严谨性。将 agent 转变为对用户方案的苏格拉底式审讯者。

**核心理念**: 不是被动接受用户需求，而是逐一质疑每个设计决策，与现有代码交叉验证。

**控制机制**:

- **逐题追问** — 每次只问一个问题，等待回答再继续
- **代码交叉验证** — 如果代码与用户说法矛盾，指出冲突
- **术语规范化** — 模糊术语提出精确替代方案
- **CONTEXT.md 就地更新** — 决策在达成共识时立即写入文件
- **ADR 最小化** — 架构决策记录只在满足三个条件时创建：难以逆转、缺语境会令人困惑、存在真实权衡

**CONTEXT.md 格式**:

```
# {Context Name}
{Description}

## Language
**Order**: {Definition}
_Avoid_: Purchase, transaction
```

**ADR 稀疏准则** — 仅当以下三个条件全部满足时才创建 ADR：
1. 难以逆转 — 有意义的决策变更成本
2. 缺少上下文会令人困惑 — 未来读者会问「为什么？」
3. 真实权衡的结果 — 确实存在替代方案

**优势**:

- 极其实用，解决 DDD 中术语漂移的真实问题
- 最小仪式感 — ADR 可以只有一段话
- 交叉验证代码实现，不只依赖文档
- 懒加载文件创建，只在需要时才生成
- 支持多 bounded context（通过 CONTEXT-MAP.md）

**局限性**:

- **纯提示词控制** — agent 可以跳过步骤
- 无自动化验证输出格式
- Claude Code 专用
- 依赖人工回答质量

## 执行谱系：从建议到强制

```
建议性                                   可执行
←──────────────────────────────────────────────────→
  CLAUDE.md        Skills/          Hooks (exit 2)   OS Sandbox
  AGENTS.md        提示词           阻断工具调用       内核级限制
  System Prompt    Slash 命令       运行时拦截        物理不可绕过
```

AtlantisYuki/prompt 和 grill-with-docs 都处于谱系最左端（建议性）。我们需要利用更右侧的机制来实现真正的约束。

## Claude Code Hooks 系统（技术级控制）

Claude Code 提供了目前最成熟的 agent 生命周期 hook 系统。Hooks 是用户定义的 shell 命令、HTTP 端点或 LLM 提示，在特定生命周期点自动执行。**关键特性：hooks 可以阻断操作。**

### 配置结构

在 `.claude/settings.json` 中配置：

```json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node scripts/guard.mjs"
        }
      ]
    }
  }
}
```

### 13 个生命周期事件

| 事件 | 触发时机 | 可阻断？ | 典型用途 |
|------|---------|---------|---------|
| **Setup** | 进入仓库 | 否 | 初始化环境检查 |
| **SessionStart** | 新 session 启动/恢复 | 否 | 加载上下文 |
| **UserPromptSubmit** | 用户提交提示词后 | **是** | 输入过滤/增强 |
| **PreToolUse** | 工具执行前 | **是** | 阻断危险操作 |
| **PermissionRequest** | 权限对话框弹出时 | 否 | 观察记录 |
| **PostToolUse** | 工具执行成功后 | 否 | 输出验证/格式化 |
| **PostToolUseFailure** | 工具执行失败后 | 否 | 错误处理 |
| **SubagentStart** | 子 agent 派生时 | 否 | 传递约束 |
| **SubagentStop** | 子 agent 结束时 | 否 | 收集结果 |
| **Stop** | Claude 完成回复时 | **是** | 强制继续工作 |
| **Notification** | 发送通知时 | 否 | 通知拦截 |
| **PreCompact** | 压缩操作前 | 否 | 保存关键信息 |
| **SessionEnd** | Session 结束时 | 否 | 清理/归档 |

### 关键控制流机制

**退出码控制**:
- `exit 0` — 允许操作继续
- `exit 2` — **阻断操作**（PreToolUse）或**强制 Claude 继续工作**（Stop）
- 其他退出码 — 错误通知

**PreToolUse 阻断能力是关键差异化**：agent 在技术层面无法执行被 hook 阻断的工具。这不是建议，而是技术门控。

**Payload 格式**: 每个 hook 通过 stdin 接收 JSON payload，包含 `tool_name`、`tool_input`、`session_id` 等结构化数据。

## Codex CLI 控制机制（OS 级控制）

OpenAI Codex CLI 采用完全不同的策略：**OS 级沙箱隔离**而非生命周期 hooks。

### Sandbox 模式

| 模式 | 权限 | 适用场景 |
|------|------|---------|
| `read-only` | 只读文件系统，无网络 | 不受信任仓库探索 |
| `workspace-write` | 工作区可写，受限网络 | 正常开发（默认） |
| `danger-full-access` | 完全文件系统+网络 | 仅 CI 或已知安全环境 |

**技术实现**:
- macOS: Apple Seatbelt 框架 (`sandbox-exec`) — 内核级执行
- Linux: Landlock + seccomp — syscall 级过滤

**这是最强的控制形式** — OS 内核物理上阻止 agent 超越权限。任何提示词工程都无法绕过。

### Approval Policy

| 策略 | 行为 |
|------|------|
| `on-request` | 潜在破坏操作前询问批准（推荐默认） |
| `never` | 从不询问，依赖沙箱作为唯一安全边界 |
| `untrusted` | 额外谨慎 |

### AGENTS.md（跨工具标准）

AGENTS.md 是一个开放标准，驻留在仓库根目录，随代码库传播，在 Codex、Cursor、Copilot、Amp 等工具间共享项目级指令。距编辑文件最近的 AGENTS.md 优先。

### Codex Hooks

Codex v0.133+ 新增了 hooks 系统，但成熟度低于 Claude Code：
- 主要是扩展性框架，聚焦行为增强而非阻断
- 可观察子 agent、工具执行、turn 元数据
- 通过 `/hooks` CLI 命令管理

## 跨工具能力对比

| 能力 | Claude Code | Codex CLI | Cursor | Copilot |
|------|------------|-----------|--------|---------|
| OS 级沙箱 | 否 | 是（Seatbelt/Landlock） | 是 | 是 |
| Pre-tool hooks（阻断） | 是（exit code 2） | 有限 | 是 | 是 |
| Post-tool hooks | 是 | 有限 | 是 | 是 |
| Session 生命周期 hooks | 是（13 个事件） | 较新 | 有限 | 有限 |
| 提示词注入/预处理 | 是（UserPromptSubmit） | 否 | 否 | 否 |
| 跨工具指令 | CLAUDE.md | AGENTS.md | .cursorrules | copilot-instructions |
| 确定性策略引擎 | 通过 hooks | 通过沙箱 | 否 | 否 |

## 推荐方案：四层防御架构

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: 意图层 — 提示词控制（建议性）                    │
│  - CLAUDE.md / AGENTS.md 项目约定                         │
│  - grill-with-docs 领域严谨性                             │
│  - AtlantisYuki SDLC 阶段门控提示词                        │
├──────────────────────────────────────────────────────────┤
│  Layer 2: 拦截层 — Hook 级控制（软执行）                   │
│  - PreToolUse hooks 阻断危险操作                           │
│  - PostToolUse hooks 验证输出                             │
│  - UserPromptSubmit 输入过滤                               │
├──────────────────────────────────────────────────────────┤
│  Layer 3: 隔离层 — OS 级沙箱（硬执行）                    │
│  - Codex sandbox 模式                                     │
│  - Seatbelt/Landlock 内核执行                              │
│  - 文件系统/网络权限限制                                    │
├──────────────────────────────────────────────────────────┤
│  Layer 4: 验证层 — 外部独立验证                            │
│  - CI/CD 管道                                             │
│  - Pre-commit hooks                                       │
│  - Lint/Test 自动化                                       │
└──────────────────────────────────────────────────────────┘
```

每一层捕获上一层遗漏的问题。提示词控制设定意图；hooks 强制运行时行为；沙箱防止灾难性操作；外部验证提供独立确认。

## 具体实施方案

### 方案 A：Claude Code PreToolUse Hook Guard（推荐首选）

在 Claude Code 项目中，创建 `.claude/settings.json` 配置阻断性 hooks：

```json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/guard-bash.mjs"
        }
      ]
    },
    "PreToolUse": {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/guard-files.mjs"
        }
      ]
    },
    "PostToolUse": {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/validate-output.mjs"
        }
      ]
    },
    "Stop": {
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/check-completeness.mjs"
        }
      ]
    }
  }
}
```

#### guard-bash.mjs — 危险命令阻断

```javascript
#!/usr/bin/env node
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
const cmd = input.tool_input?.command || '';

// 阻断模式
const blocked = [
  /rm\s+-rf\s+(?!node_modules)/,    // 禁止 rm -rf（除了 node_modules）
  /sudo\s+/,                          // 禁止 sudo
  /chmod\s+777/,                      // 禁止 777 权限
  /DROP\s+TABLE/,                     // 禁止删表
  />\s*\/dev\/sd/,                   // 禁止直接写设备
  /curl.*\|\s*(ba)?sh/,              // 禁止 curl | bash
];

for (const pattern of blocked) {
  if (pattern.test(cmd)) {
    console.error(`BLOCKED: Dangerous command pattern: ${pattern}`);
    process.exit(2); // exit 2 = 阻断
  }
}

process.exit(0); // exit 0 = 允许
```

#### guard-files.mjs — 文件边界保护

```javascript
#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
const toolName = input.tool_name;
const toolInput = input.tool_input || {};

// 获取目标文件路径
const filePath = toolInput.file_path || toolInput.path || '';

// 受保护的文件/目录
const protectedPaths = [
  '.env', '.env.local', '.env.production',
  'package-lock.json', 'bun.lock',
  '.claude/settings.json',
  'prisma/schema.prisma',
];

for (const pp of protectedPaths) {
  if (filePath.includes(pp)) {
    console.error(`BLOCKED: Protected path: ${pp}`);
    process.exit(2);
  }
}

process.exit(0);
```

#### check-completeness.mjs — 完整性检查（Stop hook）

```javascript
#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));

// 检查是否有未完成的 TODO 标记
// 如果 Claude 试图结束但还有遗留工作，强制继续
const sessionInfo = input.stop_hook_active;

if (existsSync('.claude/state/work-in-progress.json')) {
  const wip = JSON.parse(readFileSync('.claude/state/work-in-progress.json', 'utf8'));
  if (wip.pendingTasks && wip.pendingTasks.length > 0) {
    console.error(`CONTINUE: ${wip.pendingTasks.length} tasks remaining`);
    process.exit(2); // exit 2 on Stop = 强制继续
  }
}

process.exit(0);
```

### 方案 B：Codex CLI 沙箱 + Permission Profile

在 `.codex/config.toml` 中配置：

```toml
model = "gpt-5.5"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[profiles.safe-development]
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[profiles.read-only-review]
sandbox_mode = "read-only"
approval_policy = "on-request"
```

### 方案 C：AGENTS.md 跨工具共享约定

在仓库根目录创建 `AGENTS.md`（兼容 Codex、Cursor、Copilot）：

```markdown
# Project Instructions

## Code Style
- TypeScript strict mode, no any
- Use functional components with hooks
- Import order: react → third-party → local

## Testing
- Run `bun test` after any code changes
- Run `bun run lint` before committing
- All new API routes must have error handling

## Protected Files
- Never modify .env files
- Never modify prisma/schema.prisma without explicit approval
- package-lock.json is auto-generated, do not edit

## Workflow
- For features > 100 lines: plan first, then implement
- For bug fixes: add regression test before fix
- Always update related documentation
```

### 方案 D：组合使用 — AtlantisYuki 流程 + Claude Code Hooks

将 AtlantisYuki 的阶段门控提示词与 Claude Code 的阻断性 hooks 结合，实现流程级控制：

```json
{
  "hooks": {
    "PreToolUse": {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/phase-gate.mjs"
        }
      ]
    }
  }
}
```

#### phase-gate.mjs — 阶段门控 hook

```javascript
#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
const filePath = input.tool_input?.file_path || '';
const stateFile = resolve('.claude/state/phase.json');

// 读取当前阶段
let phase = 'idle';
if (existsSync(stateFile)) {
  phase = JSON.parse(readFileSync(stateFile, 'utf8')).currentPhase;
}

// 阶段规则
const rules = {
  idle: {
    allow: [/CLAUDE\.md/, /\.claude\//, /docs\//],
    message: 'Start with /sdlc-design-1 before modifying source files'
  },
  'design-1': {
    allow: [/docs\/.*概要设计/, /docs\/status/, /CLAUDE\.md/],
    message: 'Phase 1: Only design documents allowed. Use /sdlc-design-2 to proceed.'
  },
  'design-2': {
    allow: [/docs\/.*详细设计/, /docs\/.*概要设计/, /docs\/status/],
    message: 'Phase 2: Only detailed design allowed. Use /sdlc-implement to proceed.'
  },
  'implement': {
    allow: [/.*/],
    block: [/docs\//],
    message: 'Implementation phase: Focus on code, not docs.'
  }
};

const currentRules = rules[phase] || rules.idle;
const isBlocked = currentRules.block?.some(p => p.test(filePath));
const isAllowed = currentRules.allow?.some(p => p.test(filePath)) || !currentRules.allow;

if (isBlocked || !isAllowed) {
  console.error(`BLOCKED [${phase}]: ${currentRules.message}`);
  process.exit(2);
}

process.exit(0);
```

### 方案 E：PreCompact Hook — 上下文压缩保护

解决核心痛点：上下文压缩时关键指令丢失。

```json
{
  "hooks": {
    "PreCompact": {
      "hooks": [
        {
          "type": "command",
          "command": "node .claude/hooks/pre-compact.mjs"
        }
      ]
    }
  }
}
```

#### pre-compact.mjs

```javascript
#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync, appendFileSync } from 'fs';
import { resolve } from 'path';

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'));
const summaryFile = resolve('.claude/state/session-summary.md');

// 收集当前状态
let state = {
  phase: 'idle',
  pendingTasks: [],
  keyDecisions: [],
  lastModifiedFiles: [],
};

if (existsSync(resolve('.claude/state/phase.json'))) {
  state.phase = JSON.parse(readFileSync(resolve('.claude/state/phase.json'), 'utf8')).currentPhase;
}

if (existsSync(resolve('.claude/state/work-in-progress.json'))) {
  state.pendingTasks = JSON.parse(readFileSync(resolve('.claude/state/work-in-progress.json'), 'utf8')).pendingTasks;
}

// 生成压缩前摘要，注入到压缩后的上下文中
const summary = `## Session State (Auto-saved before compaction)

### Current Phase: ${state.phase}
### Pending Tasks: ${state.pendingTasks.length > 0 ? state.pendingTasks.join(', ') : 'None'}
### Key Decisions: ${state.keyDecisions.join('; ') || 'See docs/'}

IMPORTANT: This state was preserved before context compaction. Do NOT ignore these constraints.
`;

// 写入可被 session start hook 读取
writeFileSync(summaryFile, summary);

// 输出到 stdout 让 Claude 看到
console.log(summary);

process.exit(0);
```

## 跨工具兼容性策略

由于 Claude Code 和 Codex CLI 的 hook 实现不同，建议以下兼容方案：

### 共享层（工具无关）

```
project-root/
├── AGENTS.md           ← Codex/Cursor/Copilot 共享指令
├── CLAUDE.md           ← Claude Code 专用指令
├── .claude/
│   ├── settings.json   ← Claude Code hooks 配置
│   └── hooks/          ← Claude Code hook 脚本
│       ├── guard-bash.mjs
│       ├── guard-files.mjs
│       ├── validate-output.mjs
│       ├── check-completeness.mjs
│       ├── phase-gate.mjs
│       └── pre-compact.mjs
├── .codex/
│   └── config.toml     ← Codex CLI 沙箱+审批配置
└── docs/
    ├── status.md        ← 工作流状态
    └── CONTEXT.md       ← 术语表（来自 grill-with-docs）
```

### 工具特定层

| 关注点 | Claude Code | Codex CLI |
|--------|------------|-----------|
| 运行时行为约束 | PreToolUse hooks | Sandbox 模式 |
| 流程门控 | phase-gate.mjs (exit 2) | Permission profiles |
| 上下文压缩保护 | PreCompact hook | 无（依赖 AGENTS.md） |
| 子 agent 控制 | SubagentStart hooks | Extension hooks |
| 输出验证 | PostToolUse hooks | 无直接对应 |

### 策略：最小公约数

两个工具都支持的核心约束策略：

1. **文件系统级** — 两个工具都支持路径匹配（Codex 通过 sandbox，Claude 通过 hooks）
2. **命令审批** — 两个工具都有 approval 机制（Codex 的 `on-request`，Claude 的 PermissionRequest）
3. **项目指令** — AGENTS.md（Codex）/ CLAUDE.md（Claude）— 不同文件，但可共享内容
4. **外部 CI** — pre-commit hooks 和 CI/CD 对两个工具生成的代码一视同仁

## Agent RuleZ — 第三方确定性策略引擎

**项目**: https://medium.com/spillwave-solutions/agent-rulez-a-deterministic-policy-engine-for-ai-coding-agents-9489e0561edf

Agent RuleZ 是一个 Rust 实现的策略引擎，通过 Claude Code hooks 集成，在 agent 和操作之间提供**确定性策略执行**。它将简单的 hook 机制升级为完整的策略引擎。

**关键优势**:

- Rust 实现，高性能
- 基于 Claude Code hooks 作为集成点
- 提供超越简单 hooks 的基于规则的策略执行
- 作为策略引擎/守护层运行

## 推荐的落地路径

### Phase 1：基础防护（立即可用）

1. 创建 `.claude/settings.json` 配置 `guard-bash` 和 `guard-files` hooks
2. 创建 `AGENTS.md` 共享基本项目约定
3. 配置 Codex 的 `workspace-write` sandbox + `on-request` approval

### Phase 2：流程门控（一周内）

1. 实现 `phase-gate.mjs` 将 AtlantisYuki 的阶段门控从提示词提升为技术执行
2. 创建 `pre-compact.mjs` 解决上下文压缩丢失问题
3. 建立 `CONTEXT.md` 术语表（采用 grill-with-docs 格式）

### Phase 3：完整验证（持续迭代）

1. 添加 `PostToolUse` 输出验证 hooks
2. 接入 CI/CD 作为最终验证层
3. 评估 Agent RuleZ 或类似工具的确定性策略引擎

## 已知局限与挑战

1. **无通用 hook 标准** — 每个工具的 hook 实现不同，无 W3C 式规范
2. **无工作流级强制** — hooks 控制单次工具调用，无法直接强制多步工作流
3. **无跨工具策略可移植性** — Claude Code 的 hook 脚本不能直接用于 Codex
4. **无结构化输出验证** — hooks 和沙箱都不验证 agent 输出是否符合预期 schema
5. **无组合模型** — 无法将 AtlantisYuki 的工作流提示词 + Claude Code 阻断 hooks + Codex OS 沙箱统一为一个控制面

## 相关页面

- [[claude-code-operator模式与5种agentic工作流]] — Claude Code 的 operator 模式和 agentic 工作流
- [[hermes-agent-中的-operator-模式三维框架与-claude-code-的深度对比]] — Hermes 与 Claude Code 的 operator 模式对比
- [[system-prompt-设计指南]] — 系统提示词设计方法论
- [[prompt-engineering-最佳实践]] — 提示工程最佳实践
- [[ai-安全与对齐]] — AI 安全与对齐研究
