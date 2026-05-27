---
id: cmpnqrwzm0000l9x7fg2es9q4
title: "Claude Code Operator模式与5种Agentic工作流"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-05-27T07:27:43.043Z
updated: 2026-05-27T07:27:43.043Z
---

1|---
     2|title: "Claude Code Operator模式与5种Agentic工作流"
     3|date: 2026-05-05
     4|source: Web Search + Web Fetch
     5|tags: [Claude-Code, Agent, Workflow, Operator, Sub-agent, Headless, Worktree, Lead-Teammate, Skill-Discoverability]
     6|status: raw
     7|---
     8|
     9|# Claude Code Operator模式与5种Agentic工作流
    10|
    11|## 基本信息
    12|
    13|- **产品**: Claude Code（Anthropic 终端 AI 编程助手）
    14|- **发布**: 2024年11月，2025年5月 Google I/O 公开
    15|- **年化营收**: 突破 $10 亿（2026年初）
    16|- **工作流模式**: 5 种 agentic workflow patterns（Anthropic 官方文档记录）
    17|- **相关产品**: Claude Cowork（非技术用户桌面端）、Managed Agents（云端 Agent 基础设施）
    18|
    19|## 5种Agentic Workflow Patterns 概览
    20|
    21|| 模式 | 核心特点 | Token成本 | 人工监督 | 适用场景 |
    22||------|---------|-----------|---------|---------|
    23|| **Sequential Flow** | 固定顺序，Explore-Plan-Act | 1x | 高 | 日常任务、调试、重构 |
    24|| **Operator** | 编排器+子代理，中央协调 | 1.5x | 中 | 多视角审查、复杂项目 |
    25|| **Split-and-Merge** | 并行worktree，独立分支工作 | 3-4x | 低 | 独立功能、并行修复 |
    26|| **Agent Teams** | 多Agent协作，对等通信 | 3-4x | 低 | 大型代码库、复杂调查 |
    27|| **Headless** | 完全自主，无交互 | 1x | 无 | CI/CD、定时任务 |
    28|
    29|## 核心基础：Sub-Agents（子代理）
    30|
    31|### 三种内置子代理类型
    32|
    33|| 类型 | 模型 | 能力 | 用途 |
    34||------|------|------|------|
    35|| **Explore Agent** | Haiku（快速） | 只读 | 搜索文件、读取代码、回答问题。三个详细级别：quick/medium/very thorough |
    36|| **Plan Agent** | 与主会话相同 | 只读 | 收集上下文、分析架构、生成实施计划。用于 Plan Mode |
    37|| **General-Purpose Agent** | 可配置 | 完整工具 | 可读、写、编辑、运行bash。处理需要探索和修改的复杂多步操作 |
    38|
    39|### 自定义子代理
    40|
    41|在 `.claude/agents/` 目录放置 `.md` 文件，Claude Code 自动发现：
    42|
    43|```markdown
    44|---
    45|name: code-reviewer
    46|description: Reviews code for quality and best practices
    47|tools: Read, Glob, Grep
    48|model: sonnet
    49|---
    50|
    51|You are a code reviewer. Analyze code for bugs,
    52|security issues, and style violations.
    53|```
    54|
    55|## Pattern 1: Sequential Flow（顺序流程）
    56|
    57|### 核心思想
    58|采用 **Explore-Plan-Act** 三阶段循环，任务按顺序执行，每步建立在前一步之上。
    59|
    60|### 三阶段
    61|1. **Explore** — Claude 以只读模式读取代码库，理解架构，映射依赖
    62|2. **Plan** — 基于发现提出策略，用户审核、调整、批准
    63|3. **Act** — 解锁完整工具访问权限，Claude 实现计划、运行测试
    64|
    65|### 启动方式
    66|```bash
    67|claude --permission-mode plan
    68|# 或在会话中 Shift+Tab 切换
    69|# Normal → Auto-Accept → Plan Mode
    70|```
    71|
    72|### 适用场景
    73|- 不熟悉的代码库探索
    74|- 多文件重构
    75|- 调试会话
    76|- draft-review-polish 循环
    77|
    78|---
    79|
    80|## Operator 模式：三维一体框架
    81|
    82|Operator 不是单一模式，而是一个**组合式编排框架**，包含三个核心维度：
    83|
    84|```
    85|┌─────────────────────────────────────────────────────────┐
    86|│                    Operator 框架                          │
    87|│                                                         │
    88|│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
    89|│  │  Worktree    │  │  Subagent    │  │ Lead-Teammate  │  │
    90|│  │  并行隔离    │  │  编排调度    │  │  分工协作      │  │
    91|│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
    92|│         │                │                   │            │
    93|│         ▼                ▼                   ▼            │
    94|│  文件系统隔离      能力发现与委派       多 Agent 协调     │
    95|│  独立分支/CLAUDE.md  skill discoverability  共享任务列表   │
    96|└─────────────────────────────────────────────────────────┘
    97|```
    98|
    99|### 维度一：Worktree 并行隔离
   100|
   101|#### 核心优势
   102|
   103|用原生 `git worktree` 而非 clone，实现：
   104|- **共享 refs**：所有 worktree 共享同一 .git 对象库，节省磁盘
   105|- **干净 context**：每个 worktree 是独立的工作目录，互不干扰
   106|- **秒级创建**：`git worktree add` 无需复制仓库，接近瞬时
   107|
   108|#### 启动方式
   109|```bash
   110|claude --worktree feature-auth
   111|claude --worktree bugfix-payments
   112|claude --worktree refactor-api
   113|# 自动创建 .claude/worktrees/{name}/ 及独立分支
   114|```
   115|
   116|#### ⚠️ 关键实践：独立 CLAUDE.md
   117|
   118|每个 worktree 必须配**独立的 CLAUDE.md**，明确该分支的任务边界：
   119|
   120|```markdown
   121|# .claude/worktrees/feature-auth/CLAUDE.md
   122|## 任务边界
   123|- 只修改 src/auth/ 目录下的文件
   124|- 不触碰数据库 schema
   125|- 测试框架使用 vitest
   126|```
   127|
   128|**为什么不能共用根目录 CLAUDE.md：** 根目录规则包含全局约束（如"不要修改 migrations/"），如果 worktree 的任务恰好需要修改该目录，共用规则会破坏隔离性，导致 agent 自我束缚。
   129|
   130|#### 隔离配置
   131|`.env` 默认不复制到 worktree，需创建 `.worktreeinclude`：
   132|```
   133|.env
   134|.env.local
   135|config/secrets.json
   136|```
   137|
   138|#### 适用场景
   139|- 多个涉及不同文件的特性并行开发
   140|- 并行测试竞争性实现方案
   141|- 跨隔离模块的 bug 修复
   142|- Token 成本 3-4x，但时间大幅缩短
   143|
   144|---
   145|
   146|### 维度二：Subagent 编排调度
   147|
   148|#### 核心思想
   149|编排器（Orchestrator）不执行具体工作，只负责**规划、分配、审查**。将复杂任务分解后委托给专门的子代理执行。
   150|
   151|#### 三种内置子代理类型
   152|
   153|| 类型 | 模型 | 能力 | 用途 |
   154||------|------|------|------|
   155|| **Explore Agent** | Haiku（快速） | 只读 | 搜索文件、读取代码、回答问题。三个详细级别：quick/medium/very thorough |
   156|| **Plan Agent** | 与主会话相同 | 只读 | 收集上下文、分析架构、生成实施计划。用于 Plan Mode |
   157|| **General-Purpose Agent** | 可配置 | 完整工具 | 可读、写、编辑、运行bash。处理需要探索和修改的复杂多步操作 |
   158|
   159|#### 自定义子代理
   160|在 `.claude/agents/` 目录放置 `.md` 文件，Claude Code 自动发现：
   161|
   162|```markdown
   163|---
   164|name: code-reviewer
   165|description: Reviews code for quality and best practices
   166|tools: Read, Glob, Grep
   167|model: sonnet
   168|---
   169|
   170|You are a code reviewer. Analyze code for bugs,
   171|security issues, and style violations.
   172|```
   173|
   174|#### ⚠️ 关键实践：Skill Discoverability
   175|
   176|subagent 编排的成败取决于 **skill 的可发现性**（discoverability）。
   177|
   178|**常见问题：** Agent 跳过已安装的 skill，自己重新实现 → silent failure（静默失败，看起来完成了但质量差）
   179|
   180|**解决方法：** skill 的 `description` 要写得足够"有攻击性"，像搜索入口一样精准匹配使用场景：
   181|
   182|```markdown
   183|# ❌ 差的 description（太模糊）
   184|description: "A code review agent"
   185|
   186|# ✅ 好的 description（精准匹配）
   187|description: "Use this agent when you need to review PR changes for security vulnerabilities, OWASP top 10, SQL injection, and XSS. Always invoke before merging."
   188|```
   189|
   190|**原则：** description 要回答三个问题：
   191|1. 这个 agent 什么时候该被调用？
   192|2. 它擅长什么具体领域？
   193|3. 什么情况下必须用它？
   194|
   195|#### 配置方式
   196|
   197|**内联定义 agents：**
   198|```bash
   199|claude --agents '{
   200|  "security-reviewer": {
   201|    "description": "Use when reviewing code for security vulnerabilities. Focus on OWASP top 10.",
   202|    "prompt": "You are a security expert. Focus on OWASP top 10.",
   203|    "tools": ["Read", "Grep", "Glob"],
   204|    "model": "sonnet"
   205|  },
   206|  "test-writer": {
   207|    "description": "Use when generating unit tests. Covers edge cases and integration tests.",
   208|    "prompt": "You write thorough tests. Cover edge cases.",
   209|    "tools": ["Read", "Edit", "Bash"],
   210|    "model": "sonnet"
   211|  }
   212|}'
   213|```
   214|
   215|**工具权限控制：**
   216|```json
   217|{
   218|  "allowedTools": {
   219|    "Write": true,
   220|    "Edit": true,
   221|    "Agent(general-purpose)": true,
   222|    "Agent(explore)": true
   223|  }
   224|}
   225|```
   226|
   227|#### 适用场景
   228|- ✅ 任务需要协调多种不同能力（搜索→分析→写作→格式化→保存）
   229|- ✅ 需要根据中间结果动态调整计划
   230|- ✅ 需要将"思考层"与"执行层"分离
   231|- ✅ 多角度代码审查（安全、性能、测试）
   232|
   233|---
   234|
   235|### 维度三：Lead-Teammate 分工协作
   236|
   237|#### 核心思想
   238|这是多 Agent 编排的**默认结构**。Lead Agent 负责全局架构判断，Teammate 负责具体执行。
   239|
   240|#### 架构组成
   241|
   242|| 组件 | 角色 |
   243||------|------|
   244|| **Lead Agent** | 全局架构判断、任务拆分、接口定义、质量把关 |
   245|| **Teammate** | 独立 Claude Code 实例，负责具体执行，有自己的 context 和工具 |
   246|| **Shared Task List** | 工作项有状态（pending/in_progress/completed）和依赖跟踪 |
   247|| **Mailbox** | 点对点消息传递，任何 agent 可消息任何其他 agent 或广播 |
   248|
   249|#### 启用方式
   250|```bash
   251|export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
   252|# 或在 settings.json 中配置
   253|```
   254|
   255|#### ⚠️ 关键实践：避免 Context Fragmentation
   256|
   257|| 问题 | 说明 | 解决方案 |
   258||------|------|---------|
   259|| Context fragmentation | 多 Agent 各自只看到局部信息，缺乏全局视角 | Lead 统一维护架构和接口定义 |
   260|| Merge 冲突 | 多 Agent 并行修改相同区域 | Lead 提前划定文件边界，每个 Teammate 负责不同文件 |
   261|| Dependency deadlock | Agent A 等 Agent B 的输出，B 又等 A | 先约定接口（interface-first），再并行开发 |
   262|
   263|#### 先约定接口再并行（Interface-First 策略）
   264|
   265|```
   266|Step 1: Lead 定义接口（types/interfaces）
   267|  ↓
   268|Step 2: Teammates 并行实现各自模块
   269|  ↓
   270|Step 3: Lead 合并 + 集成测试
   271|```
   272|
   273|**为什么这很重要：** 如果不先定义接口，Agent A 实现了自己的数据结构，Agent B 也实现了自己的，最终合并时发现完全不兼容——这就是 dependency deadlock 的典型表现。
   274|
   275|#### 实用技巧
   276|- 从 3-5 个队友开始
   277|- 每个队友 5-6 个任务
   278|- 每个队友负责不同文件
   279|- Shift+Down/Up 导航队友
   280|- Ctrl+T 查看共享任务列表
   281|
   282|#### 实际案例
   283|测试 WebSocket 断连 bug：spawn 5 个队友探索不同假设（服务器超时、客户端重连逻辑、代理缓冲、负载均衡、DNS），20 分钟收敛到根因——独立工作需一上午。
   284|
   285|---
   286|
   287|### 三维组合：Operator 的完整形态
   288|
   289|复杂项目同时启用三个维度：
   290|
   291|```
   292|Lead Agent（Operator/编排器）
   293|  │
   294|  ├── 定义全局架构和接口
   295|  ├── 约定接口契约（interface-first）
   296|  │
   297|  ├── Teammate 1 ── worktree feature-auth
   298|  │     └── subagent: security-reviewer
   299|  │
   300|  ├── Teammate 2 ── worktree refactor-api
   301|  │     └── subagent: test-writer
   302|  │
   303|  └── Teammate 3 ── worktree bugfix-payments
   304|        └── subagent: performance-analyzer
   305|```
   306|
   307|**组合顺序建议：**
   308|1. **先 Lead-Teammate**：确立分工结构和全局接口
   309|2. **再 Worktree**：为每个 Teammate 创建隔离工作环境
   310|3. **最后 Subagent**：在 Teammate 内部用 skill 编排具体能力
   311|
   312|---
   313|
   314|### 常见问题与解决方案
   315|
   316|| 问题 | 说明 | 解决方案 |
   317||------|------|---------|
   318|| Context fragmentation | 多 Agent 各自只看到局部信息 | Lead 统一维护架构；独立 CLAUDE.md 划定边界 |
   319|| Dependency deadlock | Agent 间互相等待，形成循环依赖 | 先约定接口再并行开发 |
   320|| Merge 冲突 | 并行修改相同区域 | worktree 隔离 + Lead 提前划分文件归属 |
   321|| Skill silent failure | Agent 跳过已装 skill 自己重实现 | description 写得精准"有攻击性" |
   322|| 编排器死循环 | 缺乏明确终止条件 | 编排前明确定义"完成"标准 |
   323|| 单点故障 | 编排器推理出错全盘崩溃 | 关键决策点加 checkpoint |
   324|
   325|### Operator 与其他模式对比
   326|
   327|| 维度 | Operator（三维一体） | Sequential | Agent Teams（单独） | Split-and-Merge（单独） |
   328||-----|----------|------------|-------------|-----------------|
   329|| **架构** | 层级式 + 并行隔离 + 协作 | 线性链条 | 协作式（对等协作） | 并行独立 |
   330|| **文件冲突** | worktree 隔离，无冲突 | 单线程无冲突 | 需手动避免 | worktree 隔离 |
   331|| **可发现性** | skill description 精准匹配 | N/A | N/A | N/A |
   332|| **适应性** | 可动态调整 | 固定顺序 | 多方协商 | 预定义拆分 |
   333|| **类比** | 项目经理 + 独立工位 + 专业团队 | 装配线 | 团队讨论 | 多条产线 |
   334|
   335|---
   336|
   337|## Pattern 3 & 4：已整合入 Operator 框架
   338|
   339|Split-and-Merge 和 Agent Teams 已分别作为 **Operator 框架的维度一（Worktree 并行隔离）** 和 **维度三（Lead-Teammate 分工协作）** 整合，见上方详细说明。
   340|
   341|---
   342|
   343|## Pattern 5: Headless（完全自主）
   344|
   345|### 核心思想
   346|使用 `-p` 标志，Claude Code 处理任务、输出到 stdout、退出。无交互会话、无审批提示。
   347|
   348|### 基础命令
   349|```bash
   350|# 基本无头执行
   351|claude -p "Find and fix lint errors in src/" --allowedTools "Read,Edit,Bash"
   352|
   353|# 结构化 JSON 输出
   354|claude -p "List all TODO comments" --output-format json
   355|
   356|# 预算控制
   357|claude -p "Refactor the auth module" --max-budget-usd 5.00
   358|
   359|# 管道输入
   360|cat build-error.txt | claude -p "Explain the root cause"
   361|
   362|# Bare 模式用于 CI（跳过 hooks/plugins/MCP/CLAUDE.md）
   363|claude --bare -p "Run the test suite" --allowedTools "Bash,Read"
   364|```
   365|
   366|### GitHub Actions 集成
   367|```yaml
   368|name: Claude Code Review
   369|on:
   370|  pull_request:
   371|    types: [opened, synchronize]
   372|jobs:
   373|  review:
   374|    runs-on: ubuntu-latest
   375|    steps:
   376|      - uses: anthropics/claude-code-action@v1
   377|        with:
   378|          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
   379|          prompt: "Review this PR for bugs and security issues"
   380|```
   381|
   382|### 无人值守运行
   383|通过 `-p` 标志 + 权限绕过 + 循环模式 + 终端持久化组合，可实现数小时甚至整夜无人值守运行。推荐容器化运行环境。
   384|
   385|---
   386|
   387|## 模式组合
   388|
   389|复杂项目通常组合多种模式：
   390|
   391|> **示例架构：**
   392|> - **顶层**：Operator 模式（编排器整体协调）
   393|> - **某阶段**：Split-and-Merge（并行处理）
   394|> - **另一阶段**：Sequential Flow（固定管道）
   395|
   396|---
   397|
   398|## Anthropic Agent 三件套
   399|
   400|| 产品 | 类比 | 目标用户 | 部署 |
   401||------|------|---------|------|
   402|| **Claude Code** | 驻场程序员 | 开发者 | 本地终端 |
   403|| **Claude Cowork** | 行政助理 | 非技术用户 | 本地桌面 |
   404|| **Managed Agents** | 外包公司 | SaaS 开发者 | 云端 |
   405|
   406|三款产品递进互补，非替代关系。
   407|
   408|---
   409|
   410|## 选择决策指南
   411|
   412|1. **任务结构有多复杂？**
   413|   - 简单线性 → Sequential Flow
   414|   - 需要协调多种工具 → Operator
   415|   - 大量并行独立任务 → Split-and-Merge
   416|   - 需要多专业知识 → Agent Teams
   417|   - 成熟可重复 → Headless
   418|
   419|2. **黄金法则：比你认为需要的更简单开始。** 一个稳定运行的 Sequential Flow 比偶尔惊艳但会意外失败的 Agent Teams 有价值得多。
   420|
   421|## 相关链接
   422|
   423|- 5种模式详解: https://www.mindstudio.ai/blog/claude-code-5-workflow-patterns-explained
   424|- 实战指南: https://popularaitools.ai/blog/claude-code-workflow-patterns-agentic-guide-2026
   425|- Operator实战案例: https://futuresales.tw/articles/claude-operator-workflow/
   426|- Anthropic Agent三件套: https://www.xmsumi.com/detail/2972
   427|- Claude Code autonomous agent: https://www.sitepoint.com/claude-code-as-an-autonomous-agent-advanced-workflows-2026/
   428|