---
id: agent-hooks-system
title: Agent Hooks System — Claude Code 与 Codex CLI 的硬约束控制系统
type: concept
tags:
  - Claude-Code
  - Codex-CLI
  - hooks
  - agentic-coding
  - agent-governance
  - SDLC
created: 2026-06-05T15:00:00.000Z
updated: 2026-06-05T15:00:00.000Z
---

# Agent Hooks System — 兼容 Claude Code & Codex CLI 的硬约束控制系统

## 设计动机

Skill / CLAUDE.md / AGENTS.md 中的提示词在以下场景中会失效：
1. **上下文压缩**（context compaction）— 长对话中 prompt 被截断
2. **新 session** — CLAUDE.md 虽然会重载，但 agent 可能选择"忽略建议"
3. **子代理** — subagent 继承部分上下文，约束力进一步衰减

Hooks 是**确定性执行**的——不管上下文状态如何，每次工具调用都会经过 hook 检查。

## 架构分层

```
┌─────────────────────────────────────────────┐
│              软约束层（建议性）                │
│  CLAUDE.md / AGENTS.md / Skills              │
│  - 行为指导、架构模式、领域术语               │
│  - 上下文压缩后降级为建议                     │
├─────────────────────────────────────────────┤
│              硬约束层（强制性）                │
│  Hooks (PreToolUse / PostToolUse / Stop)     │
│  - 文件保护、范围控制、阶段门控               │
│  - 确定性执行，不受上下文影响                  │
├─────────────────────────────────────────────┤
│              状态层（持久化）                  │
│  .agent-state/ 目录                          │
│  - 当前阶段、文件范围、检查点                  │
│  - Hooks 读取状态，Prompt 引用状态            │
└─────────────────────────────────────────────┘
```

## 三层职责分工

| 层 | 职责 | 执行保证 |
|----|------|---------|
| **状态层** | 持久化阶段、范围、约束到文件系统 | 文件 I/O，100% 可靠 |
| **硬约束层** | Hooks 读取状态文件，强制执行规则 | Shell 脚本 exit code，确定性 |
| **软约束层** | 引导行为、提供领域知识 | Prompt 遵循，建议性 |

## 目录结构

```
project-root/
├── .claude/
│   └── settings.local.json      # Claude Code hooks 配置
├── .codex/
│   ├── AGENTS.md                 # Codex CLI 系统提示
│   └── hooks/                    # Codex CLI hooks 目录
│       └── enforce-scope.sh
├── hooks/                        # 共享 hook 脚本（git tracked）
│   ├── enforce-scope.sh          # 文件范围控制
│   ├── enforce-phase.sh          # SDLC 阶段门控
│   ├── block-dangerous.sh         # 危险命令拦截
│   ├── lint-on-edit.sh           # 编辑后自动 lint
│   └── check-completion.sh        # Stop 时检查任务完整性
├── .agent-state/                  # Agent 状态持久化（gitignored）
│   ├── phase.txt                  # 当前 SDLC 阶段
│   ├── scope.txt                  # 允许编辑的文件列表
│   └── checkpoints.json           # 阶段完成检查点
├── docs/
│   ├── CONTEXT.md                 # 领域术语表（grill-with-docs 风格）
│   └── adr/                      # 架构决策记录
└── CLAUDE.md                     # Claude Code 项目级提示（引用状态层）
```

## 兼容性矩阵

| Hook 脚本 | Claude Code | Codex CLI | 触发事件 |
|-----------|:-----------:|:---------:|----------|
| `enforce-scope.sh` | ✅ Write/Edit/MultiEdit | ⚠️ 仅通过 Bash wrapper | PreToolUse |
| `enforce-phase.sh` | ✅ 所有写入操作 | ⚠️ 仅通过 Bash wrapper | PreToolUse |
| `block-dangerous.sh` | ✅ | ✅ | PreToolUse (Bash) |
| `lint-on-edit.sh` | ✅ Write/Edit/MultiEdit | ❌ 不支持 | PostToolUse |
| `check-completion.sh` | ✅ | ✅ | Stop |
| `session-context.sh` | ✅ | ✅ | SessionStart |

> **Codex CLI 局限**：PreToolUse/PostToolUse 仅对 Bash 工具触发。文件编辑类操作无法被 hook 拦截。解决方案见下文" Codex CLI 适配策略"。

## 安装

### Claude Code

将以下内容添加到项目根目录 `.claude/settings.local.json`：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash hooks/session-context.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash hooks/enforce-scope.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash hooks/block-dangerous.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash hooks/lint-on-edit.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash hooks/check-completion.sh"
          }
        ]
      }
    ]
  }
}
```

### Codex CLI

```bash
# hooks/ 目录会被 Codex CLI 自动发现
# 确保 .codex/hooks/ 下有符号链接或脚本副本
ln -sf ../hooks/enforce-phase.sh .codex/hooks/
ln -sf ../hooks/block-dangerous.sh .codex/hooks/
ln -sf ../hooks/check-completion.sh .codex/hooks/
```

Codex CLI hooks 配置通过 TUI `/hooks` 命令管理，或编辑 `settings.json`。

## 工作流

### 1. 初始化阶段

```bash
# 设置当前阶段
echo "design" > .agent-state/phase.txt

# 设置允许编辑的范围（由设计阶段产出）
cat > .agent-state/scope.txt <<EOF
src/components/UserProfile.tsx
src/hooks/useUser.ts
src/api/user.ts
EOF
```

### 2. 设计 → 实施转换

设计阶段产出 `scope.txt` 和 `checkpoints.json`，实施阶段的 hooks 自动读取这些状态：

```
设计完成 → phase.txt: "implement" → scope.txt: [文件列表]
                                        ↓
实施中 → enforce-scope.sh 读取 scope.txt
        → 只允许编辑列表中的文件
        → 编辑列表外文件 → exit 2 拒绝
```

### 3. 实施完成 → 测试

Stop hook 检测所有 scope 中的文件是否都已修改并有测试覆盖：
- 未完成 → exit 2 阻断，提示缺少的文件
- 已完成 → 更新 phase.txt 为 "test"

## 进阶：Prompt Hook（Claude Code 独有）

Claude Code 的 `prompt` 类型 hook 可以用 LLM 评估复杂条件：

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "检查以下 Agent 输出：$ARGUMENTS。是否更新了 CONTEXT.md 中的领域术语？是否所有修改的文件都有对应的测试？如果没有，回复 {\"decision\": \"block\", \"reason\": \"需要更新 CONTEXT.md 或补充测试\"}",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

这比纯 shell 脚本更智能——能理解语义，但成本更高。

## 与 AtlantisYuki/prompt 的集成

AtlantisYuki 的 SDLC 阶段门控（`sdlc-design-1` → `sdlc-implement`）可以用 hooks 硬化：

| AtlantisYuki 原有机制 | Hooks 硬化方式 |
|----------------------|---------------|
| "未完成设计不能实施"（prompt 约束） | `enforce-phase.sh` 读取 `phase.txt`，实施阶段只允许编辑 scope 中的文件 |
| "绝对红线"（prompt 约束） | `enforce-scope.sh` 检查敏感文件模式，exit 2 阻断 |
| "3 次重试规则"（prompt 约束） | `check-completion.sh` 检查错误处理模式 |
| "待确认机制"（prompt 约束） | `check-completion.sh` 检查 `待确认*.md` 是否已处理 |

## 与 grill-with-docs 的集成

grill-with-docs 的 CONTEXT.md 驱动方式可以与 hooks 结合：

```
SessionStart → session-context.sh 注入 CONTEXT.md 摘要到上下文
                ↓
编码中 → enforce-scope.sh 确保只编辑 scope 中的文件
      → PostToolUse 触发 lint-on-edit.sh
      → Stop 触发 check-completion.sh 检查 CONTEXT.md 是否需要更新
```

## 注意事项

1. **Claude Code 配置快照**：Hooks 配置在 session 启动时快照，运行中修改不生效
2. **Codex CLI Bash 限制**：文件编辑拦截只能通过 Bash wrapper 实现，不够可靠
3. **Exit code 2 的行为**：有时会导致 Claude 完全停止而非尝试替代方案
4. **性能成本**：每次工具调用都执行 hook，高频操作（Read 循环）可能有延迟
5. **Shell 脚本安全**：确保 hook 脚本本身不可被 agent 修改（放在 git tracked 位置）
