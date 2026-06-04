---
id: cmpyz15dq001jlm53j7q1xjy8
title: RAG 检索增强生成
type: concept
tags:

created: 2026-06-04T04:04:18.687Z
updated: 2026-06-04T04:04:18.687Z
---

# RAG 检索增强生成

RAG（Retrieval-Augmented Generation）通过检索外部知识来增强 LLM 的回答质量，是当前企业级 AI 应用的主流架构。

## 为什么需要 RAG

> [!note] LLM 的局限
> LLM 的知识有截止日期，且无法访问企业内部数据。RAG 通过检索实时数据来解决这两个问题。

| 问题 | 仅用 LLM | LLM + RAG |
|------|---------|-----------|
| 知识过时 | ❌ 无法获取最新信息 | ✅ 检索最新文档 |
| 私有数据 | ❌ 无法访问 | ✅ 检索内部知识库 |
| 可信度 | ⚠️ 可能幻觉 | ✅ 有来源引用 |
| 成本 | ❌ 全量微调昂贵 | ✅ 按需检索便宜 |

## 架构流程

```
用户问题 → 向量化 → 相似度检索 → 重排序 → 上下文组装 → LLM 生成 → 回答
```

### 1. 文档切分（Chunking）

```python
# 固定长度切分
chunks = text_splitter.split_text(
    document,
    chunk_size=500,
    chunk_overlap=50  # 重叠避免信息丢失
)
```

> [!tip] 切分策略选择
> - 语义切分：按段落/标题切分，保持语义完整（推荐）
> - 固定长度：简单但对语义不友好
> - 递归切分：先按大块再细分，平衡粒度和上下文

### 2. 向量化（Embedding）

| 模型 | 维度 | 特点 |
|------|------|------|
| text-embedding-3-large | 3072 | OpenAI 最佳 |
| text-embedding-3-small | 1536 | 性价比高 |
| bge-large-zh | 1024 | 中文效果优秀 |
| m3e-base | 768 | 开源中文模型 |

### 3. 检索与重排序

```python
# 1. 向量检索 Top-K
results = vector_store.similarity_search(query, k=20)

# 2. 重排序（Cross-Encoder）
reranked = reranker.rank(query, results, top_k=5)

# 3. 组装上下文
context = "\n\n".join([r.text for r in reranked])
```

### 4. 生成回答

```python
prompt = f"""基于以下资料回答问题：
{context}

问题：{query}
如果资料中没有相关信息，请明确说明。"""
```

## 优化策略

### 查询改写
用户的问题可能不够精确，先让 LLM 改写查询：

```
原始: "怎么做"
改写: "如何在 Next.js 中实现 RAG 系统"
```

### 混合检索
向量检索 + 关键词检索（BM25），互补优势：

```python
vector_results = embedding_search(query, top_k=10)
bm25_results = keyword_search(query, top_k=10)
# 合并去重
final_results = merge_and_rerank(vector_results, bm25_results)
```

## 评估指标

| 指标 | 说明 |
|------|------|
| Faithfulness | 回答是否忠于检索到的文档 |
| Answer Relevancy | 回答与问题的相关度 |
| Context Precision | 检索到的上下文精确度 |
| Context Recall | 检索到的上下文覆盖率 |