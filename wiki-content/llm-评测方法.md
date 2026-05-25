---
id: cmpgzafet000aorung7wggsrf
title: LLM 评测方法
type: concept
tags:

created: 2026-05-22T13:51:40.422Z
updated: 2026-05-22T14:36:56.634Z
---

# LLM 评测方法

如何科学地评估大语言模型的输出质量，选择最适合业务的模型。

## 评测维度

> [!important] 评测不是简单比较
> 好的评测需要根据实际业务场景设计，通用 benchmark 不能完全代表生产表现。

| 维度 | 说明 | 评测方式 |
|------|------|---------|
| 准确性 | 回答的正确性 | 标注数据集 |
| 相关性 | 是否切题 | 人工评分 + LLM-as-Judge |
| 完整性 | 是否充分回答 | Checklist 评分 |
| 一致性 | 多次回答是否稳定 | 多次采样对比 |
| 安全性 | 是否包含有害内容 | 红队测试 |
| 延迟 | 响应速度 | 首字延迟 + 完成延迟 |
| 成本 | Token 消耗 | 单位任务成本 |

## 常见 Benchmark

| Benchmark | 测试内容 | 分数范围 |
|-----------|---------|---------|
| MMLU | 57 个学科知识 | 0-100% |
| HumanEval | 代码生成 | Pass@k |
| MATH | 数学推理 | 0-100% |
| C-Eval | 中文综合能力 | 0-100% |
| GSM8K | 数学应用题 | 0-100% |
| MT-Bench | 多轮对话 | 1-10 分 |

## LLM-as-Judge

使用更强的模型（如 GPT-4o）来评判其他模型的输出：

```python
judge_prompt = """你是一个公正的评判者。请对比以下两个回答：

问题: {question}

回答 A: {answer_a}

回答 B: {answer_b}

评分维度（各 1-10 分）：
1. 准确性
2. 完整性
3. 可读性

请以 JSON 格式输出评分和理由。"""
```

> [!tip] 评判模型选择
> 评判模型应比被评判模型强。GPT-4o 评判 GPT-4o-mini 是合理的，但用 GPT-4o-mini 评判 GPT-4o 不合理。

## A/B 测试框架

```python
import random

def ab_test(model_a, model_b, test_cases, judge):
    results = {"a_wins": 0, "b_wins": 0, "ties": 0}
    
    for case in test_cases:
        answer_a = model_a.generate(case.prompt)
        answer_b = model_b.generate(case.prompt)
        
        winner = judge.compare(case.prompt, answer_a, answer_b)
        results[f"{winner}_wins"] += 1
    
    return results
```

## 生产环境评测

> [!warning] Benchmark vs 生产
> Benchmark 分数高不代表生产表现好。务必用真实业务数据进行评测。

1. **构建黄金数据集**：收集 100-500 个真实用户问题 + 标注答案
2. **自动化流水线**：CI/CD 集成评测，每次模型更新自动跑分
3. **用户反馈闭环**：点赞/点踩 → 标注 → 微调数据
4. **监控指标**：上线后持续跟踪回答质量、用户满意度