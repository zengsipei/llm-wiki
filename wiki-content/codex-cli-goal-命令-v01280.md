---
id: cmpyz15c00009lm53aez11rtx
title: "Codex CLI /goal 命令（v0.128.0+）"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-04T04:04:18.625Z
updated: 2026-06-04T04:04:18.625Z
---

1|---
     2|source_type: web_research
     3|date: 2026-05-06
     4|topic: Codex CLI /goal 命令
     5|tags: [codex, cli, goal, ralph-loop, agentic, openai]
     6|---
     7|
     8|# Codex CLI /goal 命令（v0.128.0+）
     9|
    10|## 概述
    11|
    12|`/goal` 是 OpenAI 在 Codex CLI **v0.128.0**（2026-04-30）中新增的斜杠命令，代表一套完整的目标生命周期管理机制——从"回答这个 prompt"升级为"追求这个结果"。
    13|
    14|核心能力：设定目标后，Agent 跨多轮自主推进直至完成，支持暂停/恢复/预算控制。
    15|
    16|Greg Brockman 原话：*"codex now has a built in Ralph loop++"*
    17|
    18|## 启用方式
    19|
    20|**方式 1：命令行**
    21|```bash
    22|codex features enable goals
    23|# 或单次启动
    24|codex --enable goals
    25|```
    26|
    27|**方式 2：配置文件**
    28|```toml
    29|# ~/.codex/config.toml
    30|[features]
    31|goals = true
    32|```
    33|
    34|**验证**：启动后输入 `/`，在补全列表中看到 `/goal` 即成功。
    35|
    36|## 控制命令
    37|
    38|| 命令 | 作用 |
    39||------|------|
    40|| `/goal <objective>` | 创建/替换目标 |
    41|| `/goal` | 查看当前目标摘要 |
    42|| `/goal pause` | 暂停 |
    43|| `/goal resume` | 恢复 |
    44|| `/goal clear` | 清空 |
    45|| `codex resume <id>` | 跨会话恢复 |
    46|
    47|## 目标状态机
    48|
    49|```
    50|/goal <objective> → CREATED (active)
    51|  ├─ 自动延续轮次推进
    52|  ├─ /goal pause → PAUSED
    53|  ├─ /goal resume → RESUMED
    54|  ├─ 模型调用 update_goal → COMPLETED
    55|  ├─ token 预算耗尽 → BUDGET_LIMITED（软停止）
    56|  └─ /goal clear → REMOVED
    57|```
    58|
    59|## 架构（5 个 PR 构建）
    60|
    61|1. **持久化层**（#18073）：`thread_goals` 表，存储 objective/status/token_budget/tokens_used/time_used_seconds
    62|2. **App-Server RPC**（#18074）：`thread/goal/get`、`set`、`clear` + 通知
    63|3. **模型工具**（#18075）：`get_goal` / `create_goal` / `update_goal`。模型**不能**自己暂停/清空目标
    64|4. **运行时**（#18076）：空闲时注入延续轮次、token 计费、预算软停止
    65|5. **TUI**（#18077）：目标摘要渲染、状态栏、确认替换
    66|
    67|## 与普通 Task 的区别
    68|
    69|| 维度 | 普通 Prompt | /goal |
    70||------|-------------|-------|
    71|| 状态 | 随对话可能被压缩覆盖 | 独立持久化，跨会话可恢复 |
    72|| 自主延续 | 单轮 | 多轮自动推进 |
    73|| Token 控制 | 无 | 可设预算，软停止+收尾报告 |
    74|| 完成信号 | 无 | 模型标记 + 状态机 |
    75|| /compact 影响 | 压缩上下文 | 目标独立存储，不受影响 |
    76|
    77|## 五段式黄金模板
    78|
    79|```markdown
    80|/goal <一句话目标>
    81|
    82|Scope: <作用范围>
    83|
    84|Constraints:
    85|- <硬性约束 1>
    86|- <硬性约束 2>
    87|
    88|Done when:
    89|1. <可验证产物 1>
    90|2. <可验证产物 2>
    91|
    92|Stop if:
    93|- <机械可识别停止条件>
    94|
    95|Use a token budget of <N> tokens.
    96|```
    97|
    98|关键原则：
    99|- Objective 用具体数字，避免"全部/improve/彻底"等虚词
   100|- Done when 引用具体文件路径或命令
   101|- Stop if 比 Done when 更重要，防止钻牛角尖
   102|- **永远设 token budget**
   103|
   104|## 适用场景
   105|
   106|**适合：**
   107|- 批量修 bug / 批量生成测试
   108|- 按规格文档实现功能（配合 OpenSpec）
   109|- 代码迁移、重构、类型严格化
   110|- QA 完整流程、架构梳理
   111|
   112|**不适合：**
   113|- 单轮小任务
   114|- 说不清完成标准的探索性任务
   115|- 需要用户频繁决策的任务
   116|- 破坏性/不可回滚操作
   117|- Plan 模式下（会静默跳过延续，Issue #20656）
   118|
   119|## 已知坑点
   120|
   121|| 坑 | 对策 |
   122||----|------|
   123|| Plan 模式下不延续 | 先退出 Plan 再下 /goal |
   124|| /compact 丢失目标 | 长任务不要手动 compact |
   125|| 新会话找不到 thread | 第一条消息不要直接用 /goal |
   126|| 声称完成但跑偏 | 用具体数字而非虚词 |
   127|| Token 烧光 | 永远设 budget |
   128|