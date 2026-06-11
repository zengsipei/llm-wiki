---
id: cmq0fbqe9001dncklm9r87j35
title: mini-swe-agent — 100行代码的极简 Coding Agent
type: concept
tags:

created: 2026-06-05T04:28:12.513Z
updated: 2026-06-05T04:28:12.513Z
---

---
source_type: manual
date: 2026-06-03
topic: mini-swe-agent
tags: [agent, coding-agent, swe-bench, python, princeton, minimal, bash]
---

# mini-swe-agent — 100行代码的极简 Coding Agent

## 概览

- **仓库：** https://github.com/SWE-agent/mini-swe-agent
- **团队：** Princeton & Stanford NLP（SWE-bench 原创团队）
- **定位：** 剥离所有复杂功能的极简 Coding Agent 骨架
- **语言：** Python
- **核心代码：** ~100 行
- **Stars：** ~4,754
- **许可证：** MIT

## 核心定位

SWE-agent 的极简继任者，回答的问题是："如果我们的 Agent 简单 100 倍，效果会差多少？" 答案是：几乎不差（SWE-bench >74%）。

## 三条设计原则

**只用 Bash**：不使用 LLM 的 tool-calling 接口，所有操作都通过 Bash 命令完成。兼容任何模型——不需要模型支持 function calling。

**线性历史**：每一步操作追加到消息列表中。轨迹（trajectory）= 消息序列。调试和理解极其简单。

**subprocess.run 执行**：每个动作都是独立进程（无状态 shell）。替换为 `docker exec` 就能实现即时沙箱化。

## 关键洞察

一个 100 行的窗口查看器 + 行级编辑 + 语法检查自动保存，能让 SWE-bench 得分翻倍（相比裸 Bash）。Agent 效果的关键不在于框架复杂度，而在于对环境的精细操作能力。

## 安装与使用

```bash
pip install uv && uvx mini-swe-agent        # 快速体验
pip install mini-swe-agent && mini           # 完整安装
```

```python
agent = DefaultAgent(LitellmModel(model_name=...), LocalEnvironment())
agent.run("Write a sudoku game")
```

## 与 Claude Code 的关联

mini-swe-agent 可以视为 Claude Code Coding Agent 部分的"学术极简版"。两者都采用 Bash 作为核心执行环境、线性历史记录、极简工具抽象。

## 相关页面

- [[三个极简Agent开源项目——从骨架到工程化]] — 包含 mini-swe-agent 的完整对比和学习路径
- [[Agent 架构设计模式]] — 理解 Agent 设计模式的背景知识
- [[Claude Code Operator 模式与 5 种 Agentic 工作流]] — Claude Code 的 Operator 模式对比

## 对比参考

| 维度 | mini-swe-agent | smolagents | Mini-Agent |
|------|----------------|------------|------------|
| 核心代码量 | ~100 行 | ~1,000 行 | 完整项目 |
| 动作格式 | Bash 命令 | Python 代码 | Tool Calls |
| 沙箱方案 | Docker/Podman | E2B/Modal/Docker | 本地执行 |
| SWE-bench | >74% | 可评测 | 80.2%（M2.5） |