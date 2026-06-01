---
id: 4189b324-e457-4b3a-9c19-c820f605310c
title: Graphify - 给人看的双链知识图谱
type: concept
tags:

created: 2026-06-01T08:52:57.730Z
updated: 2026-06-01T10:37:42.941Z
---

---
source_type: chat
date: 2026-05-05
topic: Graphify - 给人看的双链知识图谱
description: 基于 Tree-sitter + LLM 的知识图谱工具，将代码仓库、论文、文档转化为可交互查询的知识图谱
tags: [工具, AI, 知识图谱, LLM Wiki, 代码索引, 可视化]
---

# Graphify - 给人看的双链知识图谱

## 概述

Graphify 是一个独立的知识图谱工具，灵感来源于 Karpathy 的 LLM Wiki 理念（将代码仓库转化为知识图谱进行查询）。与 Karpathy 的概念原型不同，Graphify 是一个完整的产品化实现，通过 Tree-sitter 静态分析 + LLM 语义提取，将代码仓库、论文、文档、图表统一转化为可交互查询的知识图谱。

核心卖点：71.5× token 压缩，支持多模态输入（代码、Markdown、PDF、图片），输出人可读的双链 HTML + 审计报告。

## 与 GitNexus 的区别

| 维度 | Graphify | GitNexus |
|------|----------|----------|
| 定位 | 知识图谱 + 可视化（给人看） | 代码索引 + MCP 工具（给 agent 用） |
| 输出 | graph.html 交互式图谱 | MCP 工具调用 |
| 输入 | 代码 + 论文 + 文档 + 图片 | 代码仓库 |
| 语言 | Python 3.10+ | Node.js |
| 图谱算法 | Leiden 社区检测（无向量） | 知识图谱 + 混合搜索 |
| token 压缩 | 71.5× | 预计算关系智能 |

## 安装

```bash
pip install graphifyy && graphify install
# 注意：pip 包名是 graphifyy（双 y），CLI 命令是 graphify
```

## 使用

```bash
# 为任意文件夹构建知识图谱
graphify ./raw
```

输出到 `graphify-out/`：
```
graphify-out/
├── graph.html        # 交互式可视化（人看）
├── GRAPH_REPORT.md   # 核心节点、惊喜发现、建议问题
├── graph.json        # 可查询的持久化图谱
└── cache/            # 增量缓存
```

## 管线架构

detect（收集文件）→ extract（AST + LLM 节点/边）→ build（NetworkX 图）→ cluster（Leiden 社区）→ analyze（god nodes & 惊喜发现）→ report → export

## 主要特性

- 多模态提取：代码（Tree-sitter AST）、文档、PDF、图片
- 社区检测：Leiden 算法，无需向量嵌入
- God Nodes：识别系统中度最高的核心节点
- 惊喜发现：标记跨文件/跨领域的意外连接
- 安全设计：SSRF/注入/XSS 防护
- 隐私：只发语义描述到 LLM，不发原始源码
- 无遥测

## 支持工具

Claude Code、OpenAI Codex、OpenCode、任何支持 shell 的助手

## 来源

- 官网: https://graphify.net/
- Karpathy 原始理念: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f