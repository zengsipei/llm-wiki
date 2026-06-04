---
id: cmpyz15cs000ulm53se104a8r
title: Function Calling 实践指南
type: concept
tags:

created: 2026-06-04T04:04:18.653Z
updated: 2026-06-04T04:04:18.653Z
---

# Function Calling 实践指南

Function Calling（工具调用）是 LLM 与外部系统交互的核心机制，让 AI Agent 能够执行实际操作。

## 工作原理

```
用户输入 → LLM 判断需要调用工具 → 返回函数调用请求
→ 应用层执行函数 → 将结果返回给 LLM → LLM 生成最终回答
```

> [!note] 不是直接执行
> LLM 并不直接执行函数，而是输出一个"调用意图"。由应用层决定是否执行及如何执行。

## OpenAI Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如：北京、上海"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位"
                    }
                },
                "required": ["city"]
            }
        }
    }
]
```

## 最佳实践

### 工具描述要精确

> [!tip] 描述即行为
> 工具的 description 决定了 LLM 何时、如何使用它。模糊的描述会导致误调用。

```
❌ 差: "搜索功能"
✅ 好: "在知识库中搜索与关键词匹配的文档，返回标题和摘要"

❌ 差: "数据库操作"
✅ 好: "查询用户的订单列表，支持按时间范围和状态筛选"
```

### 参数设计原则

1. **用 enum 限制选择**：避免自由文本带来的歧义
2. **提供 description**：每个参数都应该有清晰的中文描述
3. **设置合理的 required**：只标记必需参数
4. **使用嵌套对象**：复杂参数用对象组织

### 错误处理

```python
def handle_tool_call(name: str, arguments: dict):
    try:
        result = execute_tool(name, arguments)
        return {"role": "tool", "content": json.dumps(result)}
    except PermissionError:
        return {"role": "tool", "content": json.dumps({
            "error": "权限不足，无法执行此操作"
        })}
    except Exception as e:
        return {"role": "tool", "content": json.dumps({
            "error": f"执行失败: {str(e)}"
        })}
```

> [!warning] 安全考量
> 永远不要将 Function Calling 直接暴露给终端用户。应该有一个中间层来验证和授权每次调用。

## 多轮工具调用

复杂任务可能需要多次工具调用：

```
用户: "帮我对比 Claude 和 GPT 的价格"

LLM: 调用 get_pricing("claude")
→ 结果: Claude 3.5 Sonnet $3/M input tokens

LLM: 调用 get_pricing("gpt")
→ 结果: GPT-4o $2.5/M input tokens

LLM: "根据查询结果，Claude 的输入价格略高于 GPT-4o..."
```

## 调试技巧

1. **日志记录**：记录每次 tool call 的输入和输出
2. **Mock 工具**：开发时用 mock 替代真实工具
3. **参数校验**：在执行前验证参数合法性
4. **超时设置**：每个工具调用应该有超时限制