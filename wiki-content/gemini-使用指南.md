---
id: cmpgzafeg0007orunkjn7lsfz
title: Gemini 使用指南
type: entity
tags:

created: 2026-05-22T13:51:40.408Z
updated: 2026-05-22T14:36:56.615Z
---

# Gemini 使用指南

Google Gemini 系列模型的使用方法和最佳实践。

## 模型概览

| 模型 | 上下文窗口 | 特点 |
|------|-----------|------|
| Gemini 2.5 Pro | 1M tokens | 前沿推理、代码生成 |
| Gemini 2.5 Flash | 1M tokens | 速度快、成本低 |
| Gemini 2.0 Flash | 1M tokens | 多模态、高性价比 |

> [!note] 100 万 token 上下文
> Gemini 的最大亮点是 100 万 token 的上下文窗口，可以一次性处理完整代码仓库或长文档。

## 多模态能力

Gemini 原生支持文本、图片、音频、视频和代码输入：

```python
import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.5-pro')

response = model.generate_content([
    "分析这段视频的内容",
    genai.types.GenerationConfig(temperature=0.7)
])
```

## Grounding 搜索增强

> [!tip] Grounding with Google Search
> Gemini 支持 Grounding 功能，可以实时搜索互联网来增强回答的准确性。

```python
response = model.generate_content(
    "2024年最新的 AI 模型有哪些？",
    tools="google_search_retrieval"
)
```

## 结构化输出

Gemini 支持以 JSON Schema 约束输出格式：

```python
import json

response_schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "steps": {
            "type": "array",
            "items": {"type": "string"}
        }
    }
}

response = model.generate_content(
    "创建一个部署计划",
    generation_config={
        "response_mime_type": "application/json",
        "response_schema": response_schema
    }
)
```

## 与 GPT 的对比

| 维度 | GPT-4o | Gemini 2.5 Pro |
|------|--------|---------------|
| 上下文窗口 | 128K | 1M |
| 多模态 | 图片+文本 | 图片+音频+视频 |
| 搜索增强 | 需插件 | 原生支持 |
| 价格 | 中等 | 较低 |
| 推理能力 | 强 | 强（尤其数学） |
| 代码生成 | 优秀 | 优秀 |

## 使用技巧

1. **长文档处理**：充分利用 1M 上下文，一次传入完整文档
2. **多轮对话**：使用 `chat` 模式维持上下文连续性
3. **安全过滤**：通过 `safety_settings` 调整内容过滤级别
4. **温度设置**：创意任务用 0.9，精确任务用 0.1