---
id: cmpgzafdu0000orunnbgtjg8p
title: Agent 架构设计模式
type: concept
tags:

created: 2026-05-22T13:51:40.387Z
updated: 2026-05-22T14:36:56.586Z
---

# Agent 架构设计模式

AI Agent 是能够自主感知、推理和行动的 AI 系统。本文总结主流的 Agent 架构设计模式。

## 核心组件

```
┌─────────────────────────────┐
│         AI Agent            │
│  ┌───────┐  ┌───────────┐  │
│  │ LLM   │  │  Memory   │  │
│  │ 推理引擎│  │ 上下文管理 │  │
│  └───┬───┘  └───────────┘  │
│      │                      │
│  ┌───▼─────────────────┐   │
│  │    Tool Registry     │   │
│  │ 搜索 / 代码 / API    │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

## ReAct 模式

Reasoning + Acting，最经典的 Agent 模式：

> [!note] ReAct 核心思想
> 模型交替进行"思考"和"行动"，每次行动后观察结果，再决定下一步。

```
Question: 用户注册页面报错 500

Thought: 需要先查看服务端日志
Action: run_command("tail -n 50 /var/log/app.log")
Observation: [ERROR] Database connection timeout

Thought: 数据库连接超时，检查连接池配置
Action: read_file("config/database.py")
Observation: pool_size=5, max_overflow=10

Thought: 连接池配置偏小，建议增大
Answer: 问题原因是数据库连接池过小导致高并发时超时。建议将 pool_size 从 5 增大到 20。
```

## Plan-and-Execute 模式

先规划再执行，适合复杂任务：

```python
async def plan_and_execute(task: str):
    # 1. 制定计划
    plan = await llm.generate(f"将以下任务分解为步骤:\n{task}")
    steps = parse_steps(plan)
    
    # 2. 逐步执行
    results = []
    for step in steps:
        result = await execute_step(step)
        results.append(result)
        
        # 3. 根据执行结果调整计划
        if result.needs_replan:
            plan = await llm.generate(f"根据执行结果调整计划:\n{result}")
            steps = parse_steps(plan)
    
    return results
```

> [!tip] 适用场景
> Plan-and-Execute 适合"有明确目标但路径不确定"的任务，如"重构认证模块"。

## Multi-Agent 模式

多个 Agent 协作完成复杂任务：

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 串行流水线 | Agent A → Agent B → Agent C | 文档处理管线 |
| 并行处理 | 多个 Agent 同时工作 | 多维度分析 |
| 辩论模式 | Agent 互相对抗评审 | 方案评审 |
| 层级管理 | Manager Agent 分配任务 | 复杂项目管理 |

### 示例：代码审查 Multi-Agent

```
User: 审查这段代码

Manager Agent: 
  → Security Agent: 检查安全漏洞
  → Performance Agent: 检查性能问题
  → Style Agent: 检查代码规范

Manager Agent: 汇总三个 Agent 的反馈，给出综合评价
```

## 记忆系统

| 类型 | 存储 | 保留时间 | 示例 |
|------|------|---------|------|
| Working Memory | 对话上下文 | 单次会话 | 当前对话历史 |
| Short-term | 向量数据库 | 数天/数周 | 最近操作记录 |
| Long-term | 知识库/文档 | 永久 | 项目文档、用户偏好 |

## 工具设计原则

1. **单一职责**：每个工具只做一件事
2. **清晰描述**：工具名称和描述要让 LLM 理解何时使用
3. **错误处理**：返回有意义的错误信息
4. **幂等性**：相同输入应返回相同结果
5. **安全边界**：限制工具的权限范围