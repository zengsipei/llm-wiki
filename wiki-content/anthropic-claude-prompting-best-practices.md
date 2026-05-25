---
id: cmpgyj6e90008orxtqckbtwet
title: Anthropic Claude Prompting Best Practices
type: entity
tags:

created: 2026-05-22T13:51:40.396Z
updated: 2026-05-22T14:36:56.600Z
---

# Anthropic Claude Prompting Best Practices

> 官方文档（2026-04 更新至 Opus 4.7），是 Claude 最新模型提示工程的最权威参考。
> 以下综合官方文档、深度解读和 GitHub 摘要整理。

---

## 一、核心理念：把提示词当工程学科

提示词工程不是"玄学"，而是可测量、可复用、可迭代的接口设计。
**黄金法则**：把 Claude 当作"缺乏上下文的新同事"——如果同事看不懂你的 prompt，Claude 也一样。

---

## 二、通用原则

### 2.1 黄金法则 — 为新同事写提示词
- 隐性标准要变成显性标准
- 模糊：`Create an analytics dashboard`
- 清晰：`Create an analytics dashboard. Include as many relevant features and interactions as possible.`

### 2.2 解释"为什么"（ generalize 的关键）
- 差：`NEVER use ellipses`
- 好：`Never use ellipses because the text-to-speech engine cannot pronounce them.`
- 原理：理解因果链后，模型能把规则泛化到其他场景

### 2.3 Few-shot 示例（3~5 个最佳）
- 要相关、多样、用 `<example>` 标签包裹
- 更多示例会稀释指令、降低泛化能力

### 2.4 用 XML 标签结构化提示词
```xml
<documents>
  <document index="1">
    <source>file.pdf</source>
    <document_content>{{CONTENT}}</document_content>
  </document>
</documents>

Analyze the document and answer the question.
```
- 给模型一棵可解析的"文档树"
- 标签名要一致且有语义

### 2.5 给 Claude 一个角色
```python
client.messages.create(
    model="claude-opus-4-7",
    system="You are a helpful coding assistant specializing in Python.",
    ...
)
```
- 角色越贴近真实岗位效果越好
- 避免过于戏剧化的设定（"你是世界上最好的黑客"）

---

## 三、长上下文处理

### 关键排版原则
- **文档放在提示词顶部**
- **查询和指令放在末尾**

效果：最多约 **30% 的质量提升**（模型自回归生成，越靠近生成位置的 token 权重越大）

### 配套建议
```xml
请先用 <relevant_quotes> 标签列出你引用的原文片段，
再在 <answer> 标签中给出你的回答。
```

---

## 四、输出与格式控制

### 4.1 控制冗长度（Claude 4.6/4.7 已更简洁）
- 用正面示例代替负面指令
- 差：`Do not be verbose, do not add fluff`
- 好：`Provide concise, focused responses. Skip non-essential context.`

### 4.2 抑制过度 Markdown
```xml
<avoid_excessive_markdown_and_bullet_points>
Write in clear, flowing prose using complete paragraphs.
Reserve markdown primarily for `inline code`, code blocks, and simple headings.
Avoid using **bold** and *italics*.
DO NOT use ordered/unordered lists unless truly discrete items.
</avoid_excessive_markdown_and_bullet_points>
```

### 4.3 迁移离开"预填充响应"（prefilled response）
从 Claude 4.6/4.7 开始，**不再支持**在最后一个 assistant 回合做预填充。
- 控制输出格式 → 改用 **Structured Outputs** 或工具调用
- 消除冗余序言 → 在 system prompt 里用直接指令

---

## 五、effort 参数（Opus 4.7 核心）

### 五个档位

| 档位 | 描述 | 适用场景 |
|------|------|----------|
| `max` | 极限努力 | 智能要求最高的任务（有过度思考风险） |
| `xhigh` | Opus 4.7 新增 | **编码和代理类用例的最佳设置** |
| `high` | 平衡 | 大多数智能敏感场景的最低推荐 |
| `medium` | 成本敏感 | 默认设置 |
| `low` | 短小任务 | 对延迟敏感的高并发 |

### Opus 4.7 严格遵循档位
- 4.6 时代用 `low` 能跑的推理任务，4.7 可能直接"想都不想"
- 解决方案：把 effort 提到 `high` 或 `xhigh`
- 开启 `max`/`xhigh` 时，建议 `max_tokens` 设到 **64k**

### 迁移：从固定 budget 到自适应思考
```python
# 旧写法（固定 budget）
thinking={"type": "enabled", "budget_tokens": 32000}

# 新写法（自适应 + effort）
thinking={"type": "adaptive"}
output_config={"effort": "high"}
```

### 避免过度思考
```xml
When you're deciding how to approach a problem, choose an approach and commit
to it. Avoid revisiting decisions unless you encounter new information.
```

---

## 六、工具使用

### 6.1 行动 vs 建议（Claude 会严格按动词行事！）
| 提示词 | 结果 |
|--------|------|
| `Can you suggest some changes?` | 只给建议 |
| `Change this function.` | 直接修改 |

### 6.2 偏向"默认动手"的 system prompt
```xml
<default_to_action>
By default, implement changes rather than only suggesting them.
If the user's intent is unclear, infer the most useful likely action and proceed.
</default_to_action>
```

### 6.3 并行工具调用（高 ROI）
```xml
<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between
the tool calls, make all of the independent tool calls in parallel.
</use_parallel_tool_calls>
```

---

## 七、Agent 系统治理（长时间任务）

### 7.1 上下文与状态跟踪
```xml
Your context window will be automatically compacted as it approaches its limit.
Therefore, do not stop tasks early due to token budget concerns.
As you approach your token budget limit, save your current progress to memory.
```
- 结构化状态用 **JSON**
- 进度笔记用**自由文本 + 时间戳**
- 用 git 或文件系统做长期持久化

### 7.2 平衡自主性与安全性
```xml
Consider the reversibility and potential impact of your actions.
Encouraged to take local, reversible actions (editing files, running tests),
but for actions that are hard to reverse, affect shared systems, or could be
destructive, ask the user before proceeding.

Examples requiring confirmation:
- Destructive operations: deleting files, rm -rf
- Hard to reverse: git push --force, git reset --hard
- Visible to others: pushing code, commenting on PRs
```

### 7.3 子代理编排
```xml
Use subagents when tasks can run in parallel, require isolated context, or
involve independent workstreams. For simple tasks, sequential operations,
single-file edits, work directly rather than delegating.
```

**Opus 4.7 更克制**，需要显式补充：
```xml
Spawn multiple subagents in the same turn when fanning out across items
or reading multiple files.
```

### 7.4 抑制幻觉和过度工程
```xml
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a
specific file, you MUST read the file before answering.
</investigate_before_answering>
```

```xml
Avoid over-engineering. Only make changes that are directly requested or
clearly necessary. Don't add features, refactor code, or make "improvements"
beyond what was asked. Don't add docstrings/comments to code you didn't change.
```
---

## 八、前端设计指南（Opus 4.7 新默认风格）

### Opus 4.7 默认审美
- 暖奶油色背景（~#F4F1EA）
- 衬线显示字体（Georgia, Fraunces, Playfair）
- 赤陶色/琥珀色强调色

### 如何覆盖默认风格（二选一）
**方式 1：指定具体配色**
```
Background: #E9ECEC
Accent: #44545B
Text: #11171B
Fonts: [具体选择]
```

**方式 2：要求先提 4 个方案**
```
Before building, propose 4 distinct visual directions (each as:
bg hex / accent hex / typeface — one-line rationale).
Ask the user to pick one, then implement only that direction.
```

### 最小化审美约束块（Opus 4.7）
```xml
<frontend_aesthetics>
NEVER use generic AI-generated aesthetics like overused font families
(Inter, Roboto, Arial), clichéd color schemes (purple gradients),
predictable layouts, and cookie-cutter design. Use unique fonts,
cohesive colors, and animations for micro-interactions.
</frontend_aesthetics>
```

---

## 九、Opus 4.7 专属行为变化速查

| 变化点 | 描述 | 处理建议 |
|--------|------|----------|
| 指令更字面化 | 不隐式泛化 | 写明"apply to every section, not just the first" |
| 工具使用更克制 | bug 检出率反而 +11pp | 代码审查时提醒"不要过早过滤严重性" |
| 前端默认风格明显 | 奶油色+Georgia | 给规格或走"先提方案再实现"流程 |

### 代码审查：覆盖优先
```xml
Report every issue you find, including ones you are uncertain about or
consider low-severity. Do not filter for importance at this stage.
```

---

## 十、从 4.5/4.6 升级到 4.7 迁移清单

| # | 任务 | 说明 |
|---|------|------|
| 1 | 显式说明行为期望 | 任何隐式约束都补成显式 |
| 2 | 迁移到 adaptive + effort | 从固定 thinking budget 迁移 |
| 3 | 智能敏感任务升到 high/xhigh | 比反复改提示词更有效 |
| 4 | 迁移离开 prefilled response | 优先用 Structured Outputs |
| 5 | 收敛反懒惰提示 | 4.6+ 模型更主动，可能过度触发 |
| 6 | 检视子代理生成策略 | 需要时显式写条件 |
| 7 | 覆盖前端默认审美 | 给规格或走两步流程 |
| 8 | 长上下文任务优化 | 文档靠前、指令末尾、XML 结构化 |
| 9 | Agent 任务治理 | 加状态持久化和行动可逆性提示 |
| 10 | 保持评估集 | 任何变更都跑一遍固定样本 |

---

## 十一、核心原则速查（10 条）

1. 把 Claude 当作"缺乏上下文的新同事"
2. 解释约束背后的"为什么"——让规则可泛化
3. 用 3~5 个 XML 包裹的 few-shot 示例
4. 文档靠前，指令放末尾
5. 正面描述想要什么，而非否定不想要的
6. 根据任务选 effort 档位（xhigh 编码，high 通用）
7. 收敛"反懒惰"提示词（4.6+ 已更主动）
8. 显式引导子代理使用（尤其 Opus 4.7 更克制）
9. 加 anti-overengineering 约束
10. 代码审查用覆盖优先策略，分离发现和过滤

---

## 适用模型

- Claude Opus 4.7
- Claude Opus 4.6 / Sonnet 4.6
- Claude Haiku 4.5

## 官方文档

- 原文：https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Interactive Tutorial：https://github.com/anthropics/prompt-eng-interactive-tutorial