---
id: cmpyz15e0001rlm530v6n8fx8
title: 三个极简Agent开源项目——从骨架到工程化
type: summary
tags:

created: 2026-06-04T04:04:18.697Z
updated: 2026-06-04T04:04:18.697Z
---

# 三个极简Agent开源项目——从骨架到工程化

> 来源：小红书帖子「看完这三个github小项目，我对agent去媚了」
> 学习路径：最小可运行骨架 → 原理深化 → 工程化实现

## 为什么值得研究

AI Agent 领域充斥着复杂框架和抽象概念，容易让人产生"门槛很高"的错觉。这三个项目共同遵循极简主义哲学，但各自解决不同层次的问题：如何用最少的代码让 Agent 跑起来、如何让 Agent "思考"的方式更高效、如何在生产环境中落地。理解它们，比读十篇 Agent 综述更能帮助你建立真实的心智模型。

---

## 1. mini-swe-agent：100行代码的极简 Coding Agent

| 属性 | 详情 |
|------|------|
| GitHub | https://github.com/SWE-agent/mini-swe-agent |
| Stars | ~4,754 |
| 语言 | Python |
| 团队 | Princeton & Stanford NLP（SWE-bench 原创团队） |
| 许可证 | MIT |

### 核心定位

剥离所有复杂功能，只保留 Coding Agent 的最小骨架——任务接收 → 动作生成 → Bash 执行 → 线性历史。它是 SWE-agent 的极简继任者，回答的问题是："如果我们的 Agent 简单 100 倍，效果会差多少？"答案是：几乎不差（SWE-bench >74%）。

### 三条设计原则

**只用 Bash**：不使用 LLM 的 tool-calling 接口，所有操作都通过 Bash 命令完成。这意味着它兼容任何模型——不需要模型支持 function calling。

**线性历史**：每一步操作只是追加到消息列表中。轨迹（trajectory）= 消息序列。这使得调试和理解变得极其简单，也便于后续的 fine-tuning。

**subprocess.run 执行**：每个动作都是独立进程（无状态 shell）。把 `subprocess.run` 替换为 `docker exec` 就能实现即时沙箱化，扩展到分布式执行也很容易。

### 关键洞察

一个 100 行的窗口查看器 + 行级编辑 + 语法检查自动保存，就能让 SWE-bench 得分翻倍（相比裸 Bash）。这说明 Agent 效果的关键不在于框架复杂度，而在于对环境的精细操作能力。

### 安装与使用

```bash
pip install uv && uvx mini-swe-agent        # 快速体验，无需安装
pip install mini-swe-agent && mini           # 完整安装
```

```python
agent = DefaultAgent(LitellmModel(model_name=...), LocalEnvironment())
agent.run("Write a sudoku game")
```

### 适用场景

理解 Agent 最小骨架、SWE-bench 评测、代码修复任务、作为学习 Agent 原理的第一站。也适合作为自己构建 Coding Agent 的参考起点。

---

## 2. smolagents：HuggingFace 的"用代码思考"框架

| 属性 | 详情 |
|------|------|
| GitHub | https://github.com/huggingface/smolagents |
| Stars | ~27,620（三者中最热门） |
| 语言 | Python |
| 团队 | HuggingFace 官方 |
| 许可证 | Apache 2.0 |

### 核心定位

~1,000 行核心代码的通用 Agent 框架。它的核心创新是 **CodeAgent**——Agent 的"动作"不是 JSON 格式的 tool_calls，而是直接编写可执行的 Python 代码。名字中的"smol"就是小而精的意思。

### ReAct 循环机制

1. 用户任务进入 Agent 记忆
2. Agent 生成 Python 代码作为下一步动作（不是 JSON 工具调用）
3. 代码在沙箱中执行（工具调用就是代码中的函数调用）
4. 执行结果写入记忆 → 循环直到调用 `final_answer()`

### 为什么"代码即动作"更优

相比传统的字典式 tool-calling，代码方式有两项显著优势：**减少 30% 的 LLM 调用次数**（因为一个代码块里可以包含多个工具调用和循环逻辑），以及**在高难度基准测试上表现更好**。例如，Agent 可以在一个代码块里写一个 for 循环来批量处理搜索结果，而传统方式需要多轮 tool-call 交互。

### 设计支柱

- **极简抽象**：~1,000 LOC，保持认知负担低
- **模型无关**：支持 LiteLLM（100+ 模型）、HuggingFace Inference、Azure、Bedrock
- **多模态**：文本/图像/视频/音频
- **工具无关**：MCP、LangChain、Hub Spaces
- **安全沙箱**：E2B、Blaxel、Modal（云端）、Docker（自托管）

### 安装与使用

```bash
pip install "smolagents[toolkit]"
```

```python
from smolagents import CodeAgent, WebSearchTool, InferenceClientModel
model = InferenceClientModel()
agent = CodeAgent(tools=[WebSearchTool()], model=model, stream_outputs=True)
agent.run("Plan a trip to Tokyo")
```

### 适用场景

构建任何类型的通用 Agent、需要多工具协作的复杂任务、多 Agent 编排、学术研究与基准测试。是目前社区最活跃的轻量 Agent 框架。

---

## 3. Mini-Agent：MiniMax 的工程化 Agent 参考实现

| 属性 | 详情 |
|------|------|
| GitHub | https://github.com/MiniMax-AI/Mini-Agent |
| Stars | ~2,691 |
| 语言 | Python |
| 团队 | MiniMax AI |
| 许可证 | MIT |

### 核心定位

一个"最小但专业"的生产级 Agent 演示项目。它不是研究原型，而是展示如何用 MiniMax M2.5 模型构建一个具备完整工程特性的 Agent。MiniMax M2.5 在 SWE-bench Verified 上达到 80.2%，完成任务速度比 M2.1 快 37%，与 Claude Opus 4.6 的速度相当。

### 架构特点

**Anthropic 兼容 API**：使用 Anthropic 的消息格式，支持 interleaved thinking（M2.5 在动作之间进行"思考"，类似 Claude 的 extended thinking）。

**完整执行循环**：文件系统操作、Shell 命令、笔记工具、外部集成——一个完整的从接收任务到交付结果的闭环。

**持久化记忆**：通过 Session Note Tool 跨会话保留信息，Agent 可以"记住"之前的工作上下文。

**智能上下文管理**：当对话超出配置的 token 限制时，自动进行摘要压缩，使 Agent 能处理任意长度的任务。

**15 个 Claude Skills**：覆盖文档处理（PDF/DOCX）、设计、测试、开发等专业能力，通过 MCP 工具集成。

### 安装与使用

```bash
uv tool install git+https://github.com/MiniMax-AI/Mini-Agent.git
curl -fsSL https://raw.githubusercontent.com/MiniMax-AI/Mini-Agent/main/scripts/setup-config.sh | bash
```

```yaml
# config.yaml
api_key: "YOUR_API_KEY"
api_base: "https://api.minimax.io"
model: "MiniMax-M2.5"
max_steps: 100
```

```bash
mini-agent --workspace /path/to/your/project
```

### 适用场景

学习 Agent 工程化落地的最佳实践（记忆持久化、上下文管理、多工具编排）、作为生产 Agent 的模板/起点、体验 MiniMax M2.5 的能力。

---

## 三者对比总览

| 维度 | mini-swe-agent | smolagents | Mini-Agent |
|------|----------------|------------|------------|
| 定位 | 最小骨架 | 通用框架 | 工程模板 |
| 核心代码量 | ~100 行 | ~1,000 行 | 完整项目 |
| Stars | ~4,754 | **~27,620** | ~2,691 |
| 动作格式 | Bash 命令 | Python 代码 | Tool Calls |
| 模型支持 | 任意（litellm） | 任意（litellm/transformers） | MiniMax M2.5 |
| 沙箱方案 | Docker/Podman/Singularity 等 | E2B/Modal/Docker | 本地执行 |
| 工具系统 | 仅 Bash | MCP/LangChain/Hub Spaces | MCP/Claude Skills |
| SWE-bench | >74% | 可评测 | 80.2%（M2.5） |
| 记忆管理 | 无 | 基础 | 持久化 + 自动摘要 |
| 最佳用途 | 理解 Agent 骨架 | 构建各类 Agent | 工程化落地参考 |

## 学习建议

按帖子的递进顺序阅读：先看 mini-swe-agent 的 100 行代码理解 Agent 最小循环，再看 smolagents 理解"代码即动作"的 ReAct 模式和工具系统设计，最后看 Mini-Agent 学习持久化记忆、上下文管理等工程化实践。三个项目读完，对 Agent 的理解会从"知道概念"变成"能自己搭一个"。

## 与 Claude Code 的关联

这三个项目的设计理念与 Claude Code 的 Operator 模式有直接的对比价值：Claude Code 同样采用 Bash 作为核心执行环境、线性历史记录、极简工具抽象，但在此基础上增加了 IDE 集成、权限控制、多文件编辑等工程能力。mini-swe-agent 可以视为 Claude Code Coding Agent 部分的"学术极简版"。