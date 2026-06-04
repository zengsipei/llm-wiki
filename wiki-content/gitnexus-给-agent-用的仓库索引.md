---
id: cmpyz15bq0002lm53fedz1pfk
title: "GitNexus - 给 Agent 用的仓库索引"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-04T04:04:18.615Z
updated: 2026-06-04T04:04:18.615Z
---

1|---
     2|source_type: chat
     3|date: 2026-05-05
     4|topic: GitNexus - AI Agent 仓库索引工具
     5|tags: [工具, AI, 代码索引, MCP, 知识图谱]
     6|---
     7|
     8|# GitNexus - 给 Agent 用的仓库索引
     9|
    10|## 概述
    11|
    12|GitNexus 是零服务器代码智能引擎，将代码库索引为知识图谱，追踪依赖、调用链、集群和执行流。通过 MCP 或 CLI 暴露给 AI agent，让 agent 改代码时不会漏依赖、看错 impact。
    13|
    14|两种使用方式：
    15|- **CLI + MCP**（推荐）：本地索引仓库，通过 MCP 连接 AI agent
    16|- **Web UI**：浏览器中可视化图谱 + AI 聊天
    17|
    18|## 安装
    19|
    20|```bash
    21|npm install -g gitnexus
    22|# 或 npx gitnexus
    23|```
    24|
    25|## 核心命令
    26|
    27|| 命令 | 说明 |
    28||------|------|
    29|| `gitnexus setup` | 配置编辑器 MCP（一次性） |
    30|| `gitnexus analyze [path]` | 索引仓库 |
    31|| `gitnexus mcp` | 启动 MCP 服务器（stdio） |
    32|| `gitnexus serve` | 启动 HTTP 服务供 Web UI |
    33|| `gitnexus list` | 列出已索引仓库 |
    34|| `gitnexus wiki [path]` | 从图谱生成 wiki |
    35|
    36|analyze 参数：
    37|- `--force` 强制重建
    38|- `--skills` 生成仓库技能文件
    39|- `--skip-embeddings` 跳过嵌入（更快）
    40|- `--skip-agents-md` 保留自定义 AGENTS.md
    41|
    42|## MCP 集成
    43|
    44|支持 Claude Code、Cursor、Codex、Windsurf、OpenCode。
    45|
    46|WorkBuddy MCP 配置示例（~/.workbuddy/mcp.json）：
    47|```json
    48|{
    49|  "mcpServers": {
    50|    "gitnexus": {
    51|      "command": "npx",
    52|      "args": ["-y", "gitnexus@latest", "mcp"]
    53|    }
    54|  }
    55|}
    56|```
    57|
    58|## MCP 工具（16个）
    59|
    60|核心工具：
    61|- `query` — 混合搜索（BM25 + 语义 + RRF）
    62|- `context` — 360° 符号视图
    63|- `impact` — 爆炸半径分析
    64|- `detect_changes` — Git diff 影响映射
    65|- `rename` — 多文件协调重命名
    66|- `cypher` — 原始 Cypher 图谱查询
    67|
    68|## 多仓库支持
    69|
    70|```bash
    71|gitnexus group create <name>
    72|gitnexus group add <group> <path> <registry>
    73|gitnexus group sync <name>  # 跨仓库合约匹配
    74|```
    75|
    76|## 支持语言
    77|
    78|TypeScript, JavaScript, Python, Java, Kotlin, C#, Go, Rust, PHP, Ruby, Swift, C, C++, Dart（14种）
    79|
    80|## 来源
    81|
    82|- GitHub: https://github.com/abhigyanpatwari/GitNexus
    83|- npm: https://www.npmjs.com/package/gitnexus
    84|- Web UI: https://gitnexus.vercel.app
    85|