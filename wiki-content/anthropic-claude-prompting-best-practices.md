---
id: cmpyz15bz0008lm53vx793w13
title: "Anthropic Claude Prompting Best Practices"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-04T04:04:18.623Z
updated: 2026-06-04T04:04:18.623Z
---

1|---
     2|source_type: web_research
     3|date: 2026-05-06
     4|topic: Anthropic Claude Prompting Best Practices
     5|tags: [anthropic, claude, prompt-engineering, best-practices, xml-tags, effort, agentic, opus-4.7]
     6|sources:
     7|  - https://www.iceyao.com.cn/2026/04/25/claude-prompting-best-practices/
     8|  - https://raw.githubusercontent.com/tim-kaa-py/ai-wiki/main/summaries/2026-04-13_anthropic_claude-prompting-best-practices.md
     9|  - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
    10|---
    11|
    12|# Anthropic Claude Prompting Best Practices
    13|
    14|> 官方文档（2026-04 更新至 Opus 4.7），是 Claude 最新模型提示工程的最权威参考。
    15|> 以下综合官方文档、深度解读和 GitHub 摘要整理。
    16|
    17|---
    18|
    19|## 一、核心理念：把提示词当工程学科
    20|
    21|提示词工程不是"玄学"，而是可测量、可复用、可迭代的接口设计。
    22|**黄金法则**：把 Claude 当作"缺乏上下文的新同事"——如果同事看不懂你的 prompt，Claude 也一样。
    23|
    24|---
    25|
    26|## 二、通用原则
    27|
    28|### 2.1 黄金法则 — 为新同事写提示词
    29|- 隐性标准要变成显性标准
    30|- 模糊：`Create an analytics dashboard`
    31|- 清晰：`Create an analytics dashboard. Include as many relevant features and interactions as possible.`
    32|
    33|### 2.2 解释"为什么"（ generalize 的关键）
    34|- 差：`NEVER use ellipses`
    35|- 好：`Never use ellipses because the text-to-speech engine cannot pronounce them.`
    36|- 原理：理解因果链后，模型能把规则泛化到其他场景
    37|
    38|### 2.3 Few-shot 示例（3~5 个最佳）
    39|- 要相关、多样、用 `<example>` 标签包裹
    40|- 更多示例会稀释指令、降低泛化能力
    41|
    42|### 2.4 用 XML 标签结构化提示词
    43|```xml
    44|<documents>
    45|  <document index="1">
    46|    <source>file.pdf</source>
    47|    <document_content>{{CONTENT}}</document_content>
    48|  </document>
    49|</documents>
    50|
    51|Analyze the document and answer the question.
    52|```
    53|- 给模型一棵可解析的"文档树"
    54|- 标签名要一致且有语义
    55|
    56|### 2.5 给 Claude 一个角色
    57|```python
    58|client.messages.create(
    59|    model="claude-opus-4-7",
    60|    system="You are a helpful coding assistant specializing in Python.",
    61|    ...
    62|)
    63|```
    64|- 角色越贴近真实岗位效果越好
    65|- 避免过于戏剧化的设定（"你是世界上最好的黑客"）
    66|
    67|---
    68|
    69|## 三、长上下文处理
    70|
    71|### 关键排版原则
    72|- **文档放在提示词顶部**
    73|- **查询和指令放在末尾**
    74|
    75|效果：最多约 **30% 的质量提升**（模型自回归生成，越靠近生成位置的 token 权重越大）
    76|
    77|### 配套建议
    78|```xml
    79|请先用 <relevant_quotes> 标签列出你引用的原文片段，
    80|再在 <answer> 标签中给出你的回答。
    81|```
    82|
    83|---
    84|
    85|## 四、输出与格式控制
    86|
    87|### 4.1 控制冗长度（Claude 4.6/4.7 已更简洁）
    88|- 用正面示例代替负面指令
    89|- 差：`Do not be verbose, do not add fluff`
    90|- 好：`Provide concise, focused responses. Skip non-essential context.`
    91|
    92|### 4.2 抑制过度 Markdown
    93|```xml
    94|<avoid_excessive_markdown_and_bullet_points>
    95|Write in clear, flowing prose using complete paragraphs.
    96|Reserve markdown primarily for `inline code`, code blocks, and simple headings.
    97|Avoid using **bold** and *italics*.
    98|DO NOT use ordered/unordered lists unless truly discrete items.
    99|</avoid_excessive_markdown_and_bullet_points>
   100|```
   101|
   102|### 4.3 迁移离开"预填充响应"（prefilled response）
   103|从 Claude 4.6/4.7 开始，**不再支持**在最后一个 assistant 回合做预填充。
   104|- 控制输出格式 → 改用 **Structured Outputs** 或工具调用
   105|- 消除冗余序言 → 在 system prompt 里用直接指令
   106|
   107|---
   108|
   109|## 五、effort 参数（Opus 4.7 核心）
   110|
   111|### 五个档位
   112|
   113|| 档位 | 描述 | 适用场景 |
   114||------|------|----------|
   115|| `max` | 极限努力 | 智能要求最高的任务（有过度思考风险） |
   116|| `xhigh` | Opus 4.7 新增 | **编码和代理类用例的最佳设置** |
   117|| `high` | 平衡 | 大多数智能敏感场景的最低推荐 |
   118|| `medium` | 成本敏感 | 默认设置 |
   119|| `low` | 短小任务 | 对延迟敏感的高并发 |
   120|
   121|### Opus 4.7 严格遵循档位
   122|- 4.6 时代用 `low` 能跑的推理任务，4.7 可能直接"想都不想"
   123|- 解决方案：把 effort 提到 `high` 或 `xhigh`
   124|- 开启 `max`/`xhigh` 时，建议 `max_tokens` 设到 **64k**
   125|
   126|### 迁移：从固定 budget 到自适应思考
   127|```python
   128|# 旧写法（固定 budget）
   129|thinking={"type": "enabled", "budget_tokens": 32000}
   130|
   131|# 新写法（自适应 + effort）
   132|thinking={"type": "adaptive"}
   133|output_config={"effort": "high"}
   134|```
   135|
   136|### 避免过度思考
   137|```xml
   138|When you're deciding how to approach a problem, choose an approach and commit
   139|to it. Avoid revisiting decisions unless you encounter new information.
   140|```
   141|
   142|---
   143|
   144|## 六、工具使用
   145|
   146|### 6.1 行动 vs 建议（Claude 会严格按动词行事！）
   147|| 提示词 | 结果 |
   148||--------|------|
   149|| `Can you suggest some changes?` | 只给建议 |
   150|| `Change this function.` | 直接修改 |
   151|
   152|### 6.2 偏向"默认动手"的 system prompt
   153|```xml
   154|<default_to_action>
   155|By default, implement changes rather than only suggesting them.
   156|If the user's intent is unclear, infer the most useful likely action and proceed.
   157|</default_to_action>
   158|```
   159|
   160|### 6.3 并行工具调用（高 ROI）
   161|```xml
   162|<use_parallel_tool_calls>
   163|If you intend to call multiple tools and there are no dependencies between
   164|the tool calls, make all of the independent tool calls in parallel.
   165|</use_parallel_tool_calls>
   166|```
   167|
   168|---
   169|
   170|## 七、Agent 系统治理（长时间任务）
   171|
   172|### 7.1 上下文与状态跟踪
   173|```xml
   174|Your context window will be automatically compacted as it approaches its limit.
   175|Therefore, do not stop tasks early due to token budget concerns.
   176|As you approach your token budget limit, save your current progress to memory.
   177|```
   178|- 结构化状态用 **JSON**
   179|- 进度笔记用**自由文本 + 时间戳**
   180|- 用 git 或文件系统做长期持久化
   181|
   182|### 7.2 平衡自主性与安全性
   183|```xml
   184|Consider the reversibility and potential impact of your actions.
   185|Encouraged to take local, reversible actions (editing files, running tests),
   186|but for actions that are hard to reverse, affect shared systems, or could be
   187|destructive, ask the user before proceeding.
   188|
   189|Examples requiring confirmation:
   190|- Destructive operations: deleting files, rm -rf
   191|- Hard to reverse: git push --force, git reset --hard
   192|- Visible to others: pushing code, commenting on PRs
   193|```
   194|
   195|### 7.3 子代理编排
   196|```xml
   197|Use subagents when tasks can run in parallel, require isolated context, or
   198|involve independent workstreams. For simple tasks, sequential operations,
   199|single-file edits, work directly rather than delegating.
   200|```
   201|
   202|**Opus 4.7 更克制**，需要显式补充：
   203|```xml
   204|Spawn multiple subagents in the same turn when fanning out across items
   205|or reading multiple files.
   206|```
   207|
   208|### 7.4 抑制幻觉和过度工程
   209|```xml
   210|<investigate_before_answering>
   211|Never speculate about code you have not opened. If the user references a
   212|specific file, you MUST read the file before answering.
   213|</investigate_before_answering>
   214|```
   215|
   216|```xml
   217|Avoid over-engineering. Only make changes that are directly requested or
   218|clearly necessary. Don't add features, refactor code, or make "improvements"
   219|beyond what was asked. Don't add docstrings/comments to code you didn't change.
   220|```
   221|---
   222|
   223|## 八、前端设计指南（Opus 4.7 新默认风格）
   224|
   225|### Opus 4.7 默认审美
   226|- 暖奶油色背景（~#F4F1EA）
   227|- 衬线显示字体（Georgia, Fraunces, Playfair）
   228|- 赤陶色/琥珀色强调色
   229|
   230|### 如何覆盖默认风格（二选一）
   231|**方式 1：指定具体配色**
   232|```
   233|Background: #E9ECEC
   234|Accent: #44545B
   235|Text: #11171B
   236|Fonts: [具体选择]
   237|```
   238|
   239|**方式 2：要求先提 4 个方案**
   240|```
   241|Before building, propose 4 distinct visual directions (each as:
   242|bg hex / accent hex / typeface — one-line rationale).
   243|Ask the user to pick one, then implement only that direction.
   244|```
   245|
   246|### 最小化审美约束块（Opus 4.7）
   247|```xml
   248|<frontend_aesthetics>
   249|NEVER use generic AI-generated aesthetics like overused font families
   250|(Inter, Roboto, Arial), clichéd color schemes (purple gradients),
   251|predictable layouts, and cookie-cutter design. Use unique fonts,
   252|cohesive colors, and animations for micro-interactions.
   253|</frontend_aesthetics>
   254|```
   255|
   256|---
   257|
   258|## 九、Opus 4.7 专属行为变化速查
   259|
   260|| 变化点 | 描述 | 处理建议 |
   261||--------|------|----------|
   262|| 指令更字面化 | 不隐式泛化 | 写明"apply to every section, not just the first" |
   263|| 工具使用更克制 | bug 检出率反而 +11pp | 代码审查时提醒"不要过早过滤严重性" |
   264|| 前端默认风格明显 | 奶油色+Georgia | 给规格或走"先提方案再实现"流程 |
   265|
   266|### 代码审查：覆盖优先
   267|```xml
   268|Report every issue you find, including ones you are uncertain about or
   269|consider low-severity. Do not filter for importance at this stage.
   270|```
   271|
   272|---
   273|
   274|## 十、从 4.5/4.6 升级到 4.7 迁移清单
   275|
   276|| # | 任务 | 说明 |
   277||---|------|------|
   278|| 1 | 显式说明行为期望 | 任何隐式约束都补成显式 |
   279|| 2 | 迁移到 adaptive + effort | 从固定 thinking budget 迁移 |
   280|| 3 | 智能敏感任务升到 high/xhigh | 比反复改提示词更有效 |
   281|| 4 | 迁移离开 prefilled response | 优先用 Structured Outputs |
   282|| 5 | 收敛反懒惰提示 | 4.6+ 模型更主动，可能过度触发 |
   283|| 6 | 检视子代理生成策略 | 需要时显式写条件 |
   284|| 7 | 覆盖前端默认审美 | 给规格或走两步流程 |
   285|| 8 | 长上下文任务优化 | 文档靠前、指令末尾、XML 结构化 |
   286|| 9 | Agent 任务治理 | 加状态持久化和行动可逆性提示 |
   287|| 10 | 保持评估集 | 任何变更都跑一遍固定样本 |
   288|
   289|---
   290|
   291|## 十一、核心原则速查（10 条）
   292|
   293|1. 把 Claude 当作"缺乏上下文的新同事"
   294|2. 解释约束背后的"为什么"——让规则可泛化
   295|3. 用 3~5 个 XML 包裹的 few-shot 示例
   296|4. 文档靠前，指令放末尾
   297|5. 正面描述想要什么，而非否定不想要的
   298|6. 根据任务选 effort 档位（xhigh 编码，high 通用）
   299|7. 收敛"反懒惰"提示词（4.6+ 已更主动）
   300|8. 显式引导子代理使用（尤其 Opus 4.7 更克制）
   301|9. 加 anti-overengineering 约束
   302|10. 代码审查用覆盖优先策略，分离发现和过滤
   303|
   304|---
   305|
   306|## 适用模型
   307|
   308|- Claude Opus 4.7
   309|- Claude Opus 4.6 / Sonnet 4.6
   310|- Claude Haiku 4.5
   311|
   312|## 官方文档
   313|
   314|- 原文：https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
   315|- Interactive Tutorial：https://github.com/anthropics/prompt-eng-interactive-tutorial
   316|