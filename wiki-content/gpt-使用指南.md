---
id: cmpyz15cx000zlm53bc0eqszk
title: GPT 使用指南
type: entity
tags:

created: 2026-06-04T04:04:18.658Z
updated: 2026-06-04T04:04:18.658Z
---

# GPT 使用指南

全面介绍 OpenAI GPT 系列模型的使用方法、最佳实践和高级技巧。

## 模型概览

| 模型 | 特点 | 上下文窗口 | 适用场景 |
|------|------|-----------|---------|
| GPT-4o | 多模态、速度快 | 128K tokens | 通用对话、图片理解 |
| GPT-4o-mini | 轻量、低成本 | 128K tokens | 简单任务、批量处理 |
| GPT-4 Turbo | 长文本、功能全 | 128K tokens | 复杂推理、长文档 |
| o1/o3 | 推理能力强 | 200K tokens | 数学、编程、科学问题 |
| o4-mini | 轻量推理 | 200K tokens | 中等复杂度推理 |

## System Prompt 设计

System Prompt 是控制 GPT 行为的核心工具：

> [!tip] System Prompt 核心原则
> 1. 明确角色定位和行为边界
> 2. 定义输出格式（JSON/Markdown/纯文本）
> 3. 给出 few-shot 示例
> 4. 设置约束和禁止事项

```json
{
  "role": "system",
  "content": "你是一个技术文档助手。规则：\n1. 回答使用中文\n2. 代码示例必须可运行\n3. 引用来源时标注出处\n4. 不确定时明确告知"
}
```

## Function Calling

GPT 的 Function Calling 能力让模型能够调用外部工具：

```python
import openai

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_wiki",
            "description": "搜索知识库",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"}
                },
                "required": ["query"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "帮我搜索关于 RAG 的内容"}],
    tools=tools,
    tool_choice="auto"
)
```

## 多模态使用

GPT-4o 支持图片输入，可以直接分析截图、图表：

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "分析这张图片中的数据趋势"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            ]
        }
    ]
)
```

## 成本优化策略

> [!important] 成本控制
> GPT-4o 的成本约为 GPT-4 的 1/2，GPT-4o-mini 仅为 GPT-4 的 1/10。合理选择模型可以显著降低成本。

1. **分级路由**：简单任务用 mini，复杂任务用 4o
2. **缓存策略**：重复使用 system prompt 时利用 prompt caching
3. **批处理**：使用 Batch API 降低 50% 成本
4. **上下文控制**：避免传入过多无关上下文

## 常见问题

### 输出被截断
增加 `max_tokens` 参数，或使用 `max_completion_tokens`（新版 API）。

### 幻觉问题
- 使用 temperature=0 减少随机性
- 在 prompt 中明确"如果不确定，请说不知道"
- 通过 RAG 提供事实依据

### 速率限制
- 使用指数退避重试
- 申请更高的 rate limit
- 使用 Batch API 做非实时任务

## 相关页面

- [[Claude 使用指南]] — Anthropic Claude 的使用方法和技巧
- [[Gemini 使用指南]] — Google Gemini 的使用指南
- [[AI 模型提供商对比]] — GPT/Claude/Gemini 三大提供商横向对比
- [[Anthropic Claude Prompting Best Practices]] — Claude 专属提示工程最佳实践
- [[Prompt Engineering 最佳实践]] — 通用提示工程技巧
- [[System Prompt 设计指南]] — System Prompt 设计方法论
- [[LLM 评测方法]] — LLM 系统评测方法
- [[Function Calling 实践指南]] — Function Calling 实现指南