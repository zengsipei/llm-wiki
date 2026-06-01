---
id: 86958675-f8a2-4180-999d-dee51fc67514
title: GitNexus - 给 Agent 用的仓库索引
type: concept
tags:

created: 2026-06-01T08:52:57.728Z
updated: 2026-06-01T10:37:42.940Z
---

---
source_type: chat
date: 2026-05-05
topic: GitNexus - AI Agent 仓库索引工具
tags: [工具, AI, 代码索引, MCP, 知识图谱]
---

# GitNexus - 给 Agent 用的仓库索引

## 概述

GitNexus 是零服务器代码智能引擎，将代码库索引为知识图谱，追踪依赖、调用链、集群和执行流。通过 MCP 或 CLI 暴露给 AI agent，让 agent 改代码时不会漏依赖、看错 impact。

两种使用方式：
- **CLI + MCP**（推荐）：本地索引仓库，通过 MCP 连接 AI agent
- **Web UI**：浏览器中可视化图谱 + AI 聊天

## 安装

```bash
npm install -g gitnexus
# 或 npx gitnexus
```

## 核心命令

| 命令 | 说明 |
|------|------|
| `gitnexus setup` | 配置编辑器 MCP（一次性） |
| `gitnexus analyze [path]` | 索引仓库 |
| `gitnexus mcp` | 启动 MCP 服务器（stdio） |
| `gitnexus serve` | 启动 HTTP 服务供 Web UI |
| `gitnexus list` | 列出已索引仓库 |
| `gitnexus wiki [path]` | 从图谱生成 wiki |

analyze 参数：
- `--force` 强制重建
- `--skills` 生成仓库技能文件
- `--skip-embeddings` 跳过嵌入（更快）
- `--skip-agents-md` 保留自定义 AGENTS.md

## MCP 集成

支持 Claude Code、Cursor、Codex、Windsurf、OpenCode。

WorkBuddy MCP 配置示例（~/.workbuddy/mcp.json）：
```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

## MCP 工具（16个）

核心工具：
- `query` — 混合搜索（BM25 + 语义 + RRF）
- `context` — 360° 符号视图
- `impact` — 爆炸半径分析
- `detect_changes` — Git diff 影响映射
- `rename` — 多文件协调重命名
- `cypher` — 原始 Cypher 图谱查询

## 多仓库支持

```bash
gitnexus group create <name>
gitnexus group add <group> <path> <registry>
gitnexus group sync <name>  # 跨仓库合约匹配
```

## 支持语言

TypeScript, JavaScript, Python, Java, Kotlin, C#, Go, Rust, PHP, Ruby, Swift, C, C++, Dart（14种）

## 来源

- GitHub: https://github.com/abhigyanpatwari/GitNexus
- npm: https://www.npmjs.com/package/gitnexus
- Web UI: https://gitnexus.vercel.app