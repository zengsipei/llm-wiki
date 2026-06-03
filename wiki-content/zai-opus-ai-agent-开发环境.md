---
id: cmpxnmh6t0000ya5dssxw6yvy
title: z.ai Opus — AI Agent 开发环境
type: concept
tags:

created: 2026-06-03T05:57:12.198Z
updated: 2026-06-03T06:10:40.677Z
---

# Opus 使用指南

Opus 是 z.ai 平台提供的 AI Agent 开发环境，基于强大的 LLM 模型，支持代码生成、文档处理、网页浏览等多种能力。本页面汇总了 Opus 的核心功能和最佳实践。

## 核心概念

### Agent 模式

Opus 的 Agent 模式是核心能力，它不仅能回答问题，还能自主完成复杂的多步骤任务：

- **代码开发**：理解项目结构，编写和修改代码文件
- **文档处理**：读取、分析和生成各种格式的文档
- **网页操作**：搜索网络、读取网页内容、截图分析
- **定时任务**：通过 cron 系统实现定时触发

### Session（会话）

每个用户与 Opus 的交互发生在一个 Session 中。Session 的特点：

- 有上下文长度限制，超长对话可能导致信息丢失
- Session 可以通过 session_id 标识
- 支持多渠道接入（微信、网页等）
- Session 状态是持久的，但上下文窗口有限

## 工具与能力

### Web Search（网络搜索）

通过 `z-ai-web-dev-sdk` 的 functions.invoke 调用 web_search：

```javascript
import ZAI from 'z-ai-web-dev-sdk'
const zai = await ZAI.create()
const result = await zai.functions.invoke('web_search', {
  query: '搜索内容',
  num: 10
})
```

### Page Reader（网页读取）

提取网页正文内容，自动去除广告和噪音：

```javascript
const result = await zai.functions.invoke('page_reader', {
  url: 'https://example.com'
})
```

### Image Generation（图像生成）

通过 CLI 或 SDK 生成图片：

```bash
z-ai-generate -p "描述" -o "./output.png" -s 1024x1024
```

### 定时任务（Cron）

支持多种调度模式：

- **Cron 表达式**：`0 0 9 * * ?`（每天9点）
- **固定间隔**：`fixed_rate`，单位秒
- **一次性任务**：指定具体时间

```json
{
  "kind": "cron",
  "expr": "0 0 8,10,12,14,16,18,20,22 * * ?",
  "tz": "Asia/Shanghai"
}
```

## 上下文管理

上下文是 Opus 中最需要关注的资源：

- 每次工具调用和响应都会消耗上下文
- 定时任务（cron）每次触发都会回到主 Session，消耗上下文
- 上下文耗尽后，早期对话内容会被压缩或丢失
- **最佳实践**：减少不必要的定时任务频率，避免在 cron 中做复杂操作

## 文件系统

所有文件操作应在项目目录下进行：

- 项目路径：`/home/z/my-project/`
- 输出路径：`/home/z/my-project/download/`
- 生成的文件（文档、图片等）保存到 download 目录供用户下载

## Skill 系统

Opus 支持通过 Skill 工具加载扩展能力：

- **docx/pdf/xlsx/ppt**：文档创建
- **charts**：图表生成
- **web-search/web-reader**：网络能力
- **VLM**：图像理解
- **ASR**：语音识别
- **fullstack-dev**：全栈开发

## 最佳实践

1. **任务分类**：先判断是文档生成、可视化还是 Web 开发，选择对应工具
2. **预规划**：复杂任务先创建 TODO 列表，逐步执行
3. **文件持久化**：重要内容写入文件而非仅存在于对话中
4. **Git 管理**：代码变更及时 commit 和 push
5. **错误处理**：工具超时 2 次以上主动告知用户重启 session

## 相关页面
- [[Claude 使用指南]] — Claude 使用指南
- [[AI 模型提供商对比]] — AI 模型提供商对比
- [[Prompt Engineering 最佳实践]] — Prompt Engineering 最佳实践