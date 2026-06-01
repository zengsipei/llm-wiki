---
id: 4189b324-e457-4b3a-9c19-c820f605310c
title: "Graphify - 给人看的双链知识图谱"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-01T08:52:57.730Z
updated: 2026-06-01T08:52:57.730Z
---

1|---
     2|source_type: chat
     3|date: 2026-05-05
     4|topic: Graphify - 给人看的双链知识图谱（Karpathy LLM Wiki 的产品化实现）
     5|tags: [工具, AI, 知识图谱, LLM Wiki, 代码索引, 可视化]
     6|---
     7|
     8|# Graphify - 给人看的双链知识图谱
     9|
    10|## 概述
    11|
    12|Graphify 是 Karpathy LLM Wiki 理念的产品化实现。通过 Tree-sitter 静态分析 + LLM 语义提取，将代码仓库、论文、文档、图表统一转化为可交互查询的知识图谱。
    13|
    14|核心卖点：71.5× token 压缩，支持多模态输入（代码、Markdown、PDF、图片），输出人可读的双链 HTML + 审计报告。
    15|
    16|## 与 GitNexus 的区别
    17|
    18|| 维度 | Graphify | GitNexus |
    19||------|----------|----------|
    20|| 定位 | 知识图谱 + 可视化（给人看） | 代码索引 + MCP 工具（给 agent 用） |
    21|| 输出 | graph.html 交互式图谱 | MCP 工具调用 |
    22|| 输入 | 代码 + 论文 + 文档 + 图片 | 代码仓库 |
    23|| 语言 | Python 3.10+ | Node.js |
    24|| 图谱算法 | Leiden 社区检测（无向量） | 知识图谱 + 混合搜索 |
    25|| token 压缩 | 71.5× | 预计算关系智能 |
    26|
    27|## 安装
    28|
    29|```bash
    30|pip install graphifyy && graphify install
    31|# 注意：pip 包名是 graphifyy（双 y），CLI 命令是 graphify
    32|```
    33|
    34|## 使用
    35|
    36|```bash
    37|# 为任意文件夹构建知识图谱
    38|graphify ./raw
    39|```
    40|
    41|输出到 `graphify-out/`：
    42|```
    43|graphify-out/
    44|├── graph.html        # 交互式可视化（人看）
    45|├── GRAPH_REPORT.md   # 核心节点、惊喜发现、建议问题
    46|├── graph.json        # 可查询的持久化图谱
    47|└── cache/            # 增量缓存
    48|```
    49|
    50|## 管线架构
    51|
    52|detect（收集文件）→ extract（AST + LLM 节点/边）→ build（NetworkX 图）→ cluster（Leiden 社区）→ analyze（god nodes & 惊喜发现）→ report → export
    53|
    54|## 主要特性
    55|
    56|- 多模态提取：代码（Tree-sitter AST）、文档、PDF、图片
    57|- 社区检测：Leiden 算法，无需向量嵌入
    58|- God Nodes：识别系统中度最高的核心节点
    59|- 惊喜发现：标记跨文件/跨领域的意外连接
    60|- 安全设计：SSRF/注入/XSS 防护
    61|- 隐私：只发语义描述到 LLM，不发原始源码
    62|- 无遥测
    63|
    64|## 支持工具
    65|
    66|Claude Code、OpenAI Codex、OpenCode、任何支持 shell 的助手
    67|
    68|## 来源
    69|
    70|- 官网: https://graphify.net/
    71|- Karpathy 原始理念: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
    72|