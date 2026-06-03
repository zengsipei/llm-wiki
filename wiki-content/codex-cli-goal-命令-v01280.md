---
id: 05fd54eb-ea7a-4622-abcc-a03edc9a47b2
title: Codex CLI /goal 命令（v0.128.0+）
type: concept
tags:

created: 2026-06-01T08:52:57.746Z
updated: 2026-06-01T10:37:42.946Z
---

---
source_type: web_research
date: 2026-05-06
topic: Codex CLI /goal 命令
tags: [codex, cli, goal, ralph-loop, agentic, openai]
---

# Codex CLI /goal 命令（v0.128.0+）

## 概述

`/goal` 是 OpenAI 在 Codex CLI **v0.128.0**（2026-04-30）中新增的斜杠命令，代表一套完整的目标生命周期管理机制——从"回答这个 prompt"升级为"追求这个结果"。

核心能力：设定目标后，Agent 跨多轮自主推进直至完成，支持暂停/恢复/预算控制。

Greg Brockman 原话：*"codex now has a built in Ralph loop++"*

## 启用方式

**方式 1：命令行**
```bash
codex features enable goals
# 或单次启动
codex --enable goals
```

**方式 2：配置文件**
```toml
# ~/.codex/config.toml
[features]
goals = true
```

**验证**：启动后输入 `/`，在补全列表中看到 `/goal` 即成功。

## 控制命令

| 命令 | 作用 |
|------|------|
| `/goal <objective>` | 创建/替换目标 |
| `/goal` | 查看当前目标摘要 |
| `/goal pause` | 暂停 |
| `/goal resume` | 恢复 |
| `/goal clear` | 清空 |
| `codex resume <id>` | 跨会话恢复 |

## 目标状态机

```
/goal <objective> → CREATED (active)
  ├─ 自动延续轮次推进
  ├─ /goal pause → PAUSED
  ├─ /goal resume → RESUMED
  ├─ 模型调用 update_goal → COMPLETED
  ├─ token 预算耗尽 → BUDGET_LIMITED（软停止）
  └─ /goal clear → REMOVED
```

## 架构（5 个 PR 构建）

1. **持久化层**（#18073）：`thread_goals` 表，存储 objective/status/token_budget/tokens_used/time_used_seconds
2. **App-Server RPC**（#18074）：`thread/goal/get`、`set`、`clear` + 通知
3. **模型工具**（#18075）：`get_goal` / `create_goal` / `update_goal`。模型**不能**自己暂停/清空目标
4. **运行时**（#18076）：空闲时注入延续轮次、token 计费、预算软停止
5. **TUI**（#18077）：目标摘要渲染、状态栏、确认替换

## 与普通 Task 的区别

| 维度 | 普通 Prompt | /goal |
|------|-------------|-------|
| 状态 | 随对话可能被压缩覆盖 | 独立持久化，跨会话可恢复 |
| 自主延续 | 单轮 | 多轮自动推进 |
| Token 控制 | 无 | 可设预算，软停止+收尾报告 |
| 完成信号 | 无 | 模型标记 + 状态机 |
| /compact 影响 | 压缩上下文 | 目标独立存储，不受影响 |

## 五段式黄金模板

```markdown
/goal <一句话目标>

Scope: <作用范围>

Constraints:
- <硬性约束 1>
- <硬性约束 2>

Done when:
1. <可验证产物 1>
2. <可验证产物 2>

Stop if:
- <机械可识别停止条件>

Use a token budget of <N> tokens.
```

关键原则：
- Objective 用具体数字，避免"全部/improve/彻底"等虚词
- Done when 引用具体文件路径或命令
- Stop if 比 Done when 更重要，防止钻牛角尖
- **永远设 token budget**

## 适用场景

**适合：**
- 批量修 bug / 批量生成测试
- 按规格文档实现功能（配合 OpenSpec）
- 代码迁移、重构、类型严格化
- QA 完整流程、架构梳理

**不适合：**
- 单轮小任务
- 说不清完成标准的探索性任务
- 需要用户频繁决策的任务
- 破坏性/不可回滚操作
- Plan 模式下（会静默跳过延续，Issue #20656）

## 已知坑点

| 坑 | 对策 |
|----|------|
| Plan 模式下不延续 | 先退出 Plan 再下 /goal |
| /compact 丢失目标 | 长任务不要手动 compact |
| 新会话找不到 thread | 第一条消息不要直接用 /goal |
| 声称完成但跑偏 | 用具体数字而非虚词 |
| Token 烧光 | 永远设 budget |

## 相关页面

- [[Claude 使用指南]]
- [[AI 编程工具对比]]
- [[Agent 架构设计模式]]
