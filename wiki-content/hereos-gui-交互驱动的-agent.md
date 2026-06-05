---
id: cmq0fbqdw0015ncklumo942sp
title: "HereOS — GUI 交互驱动的 Agent"
type: concept
tags:

created: 2026-06-05T04:28:12.501Z
updated: 2026-06-05T04:28:12.501Z
---

1|---
     2|source_type: web_research
     3|date: 2026-05-06
     4|topic: HereOS — GUI 交互驱动的 Agent
     5|tags: [hereos, ai-agent, gui, macos, curiosity-ai]
     6|---
     7|
     8|# HereOS — GUI 交互驱动的 Agent
     9|
    10|## 概述
    11|
    12|HereOS 定位为**世界首个 GUI 交互驱动的 Agent**。核心理念：将 AI Agent 的输出从静态 artifact 转化为用户可以理解、操作、持续推进的工作界面。
    13|
    14|Slogan：**"点击，说话 · 告别打字"**
    15|
    16|中文官网描述：**"HereOS 是一台 Agent State × UI State 双层状态机。"**
    17|
    18|## 产品信息
    19|
    20|| 项目 | 详情 |
    21||------|------|
    22|| **公司** | CURIOSITY AI, Inc. |
    23|| **产品名** | HereOS / Here·OS |
    24|| **官网** | https://hereos.ai |
    25|| **阶段** | Research Preview（研究预览） |
    26|| **最新版本** | v1.0.5（2026-05-04 发布，5 个版本同一天） |
    27|| **平台** | macOS（Apple Silicon M 系列芯片 only） |
    28|| **架构** | aarch64 (ARM64) |
    29|| **定价** | 免费（Waitlist 模式） |
    30|| **下载** | GitHub: charliechen11/here-os-releases |
    31|
    32|## 核心机制
    33|
    34|### Agent State × UI State 双层状态机
    35|
    36|- **Agent State**：Agent 的目标、进度、上下文
    37|- **UI State**：用户可见、可操作的界面状态
    38|- 双层联动：Agent 产出驱动 UI 更新，用户操作反馈回 Agent State
    39|- 关键特性：Agent 的产出不再是静态文件/文本，而是可交互的界面
    40|
    41|### 交互方式
    42|
    43|- **点击**：通过 GUI 元素（按钮、面板等）操作 Agent
    44|- **语音**：语音输入替代文本 prompt
    45|- **无需打字**：完全脱离传统 CLI/chat 交互范式
    46|
    47|## 发布历史
    48|
    49|| 版本 | 日期 | 备注 |
    50||------|------|------|
    51|| v1.0.1 | 2026-05-04 13:03 UTC | 首个公开版本 |
    52|| v1.0.2 | 2026-05-04 17:39 UTC | 同 commit，疑似修复打包 |
    53|| v1.0.3 | 2026-05-04 18:28 UTC | 同 commit |
    54|| v1.0.4 | 2026-05-04 19:41 UTC | 同 commit |
    55|| v1.0.5 | 2026-05-04 20:26 UTC | 最新版，同 commit |
    56|
    57|> 所有版本共享同一 commit hash（`9e3a69d`），说明是打包/元数据层面的迭代，非代码变更。每个版本含 9 个 assets（可能含不同架构/格式）。
    58|
    59|## 技术特点与局限性
    60|
    61|### 已知
    62|- macOS only（Apple Silicon M 系列）
    63|- 通过 GitHub Releases 分发 .dmg
    64|- 非常早期的产品，官网极简
    65|- 邮箱联系：chenchenzhaoyang1111@gmail.com
    66|
    67|### 未知
    68|- 底层 AI 模型（用哪个 LLM？）
    69|- 技术架构细节
    70|- 具体使用场景和 Demo
    71|- Windows/Linux 支持计划
    72|- 商业模式
    73|
    74|## 竞品对比参考
    75|
    76|| 维度 | HereOS | Claude Code Operator | Codex /goal |
    77||------|--------|---------------------|-------------|
    78|| 交互方式 | GUI 点击+语音 | CLI prompt | CLI /goal |
    79|| 输出形式 | 可操作界面 | 代码/文本 | 代码/文本 |
    80|| 目标持久化 | Agent State 状态机 | subagent 编排 | thread_goals 表 |
    81|| 平台 | macOS only | 跨平台 | 跨平台 |
    82|| 阶段 | Research Preview | GA | Experimental |
    83|
    84|## 潜在价值
    85|
    86|- **降低 Agent 使用门槛**：GUI/语音交互比 prompt engineering 更易上手
    87|- **可操作的输出**：区别于传统 Agent 返回静态文本，HereOS 将输出转化为交互界面
    88|- **双层状态机**：理论上可以让 Agent 工作流更加可视化、可控
    89|
    90|## 风险与关注点
    91|
    92|- 极早期产品（5 个版本同天发布，0 stars, 0 forks）
    93|- 仅支持 macOS Apple Silicon
    94|- 官网无技术文档、无 changelog、无定价
    95|- 无公开评测或社区反馈
    96|