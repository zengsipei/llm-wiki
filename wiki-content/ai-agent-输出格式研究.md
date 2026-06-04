---
id: cmpyz15c9000glm53dbr7rwxr
title: AI Agent 输出格式研究
type: concept
tags:

created: 2026-06-04T04:04:18.634Z
updated: 2026-06-04T04:04:18.634Z
---

# AI Agent 输出格式研究

> 人类理解不是线性的。它是空间的、交互的、视觉的。

## 核心问题

传统 AI 输出是纯文本（Markdown），这是线性的一维格式。但人类认知是二维的、交互的、视觉的。这造成了 AI 输出与人类理解之间的结构性错配。

## Markdown 的局限

Markdown 是「可浏览文本」的格式，它的局限性在于：

- **空间信息缺失**：无法并排对比，无法精确控制布局
- **交互性为零**：静态文本，无法折叠、切换、调参
- **可视化受限**：依赖外部工具（Mermaid、PlantUML）绘制图表
- **表格表达力弱**：只能做简单行列，无法做复杂对比矩阵

## HTML 的优势

HTML 作为 AI 输出格式，能解决上述所有问题：

### 空间信息

- 并排对比（三列卡片 vs 三段文字）
- 网格布局、侧边栏、分层嵌套
- 信息密度和可读性成倍提升

### 交互性

- 折叠/展开（`<details>`）
- 悬停提示、Tab 切换
- 实时计算（滑块、颜色选择器）
- 可拖拽排序

### 可视化

- 内嵌 SVG 绘制流程图、架构图
- CSS 动画实现过渡效果
- 数据可视化无需依赖外部库

### 零门槛分发

- 一个 HTML 文件 = 一个网页
- 双击即可打开，无需服务器
- 通过任何通讯工具发送，任何人都能看

## 九大适用场景

1. **探索与规划**：并排方案对比，快速决策
2. **代码审查**：Diff 高亮 + 行号 + 评论 + 风险标注
3. **设计系统**：色板色块、组件展示、排版规范
4. **原型开发**：可交互原型、动画沙盒
5. **图表插图**：内嵌 SVG 矢量图
6. **演示文稿**：CSS scroll-snap 幻灯片
7. **研究与学习**：可调参数可视化、交互式解释器
8. **报告**：时间线、进度条、结构化信息
9. **自定义编辑器**：专用工具（看板、Feature Flag）

## 设计原则

### 自包含

每个 HTML 文件完全独立：CSS 在 `<style>` 标签，JS 在 `<script>` 标签，数据内嵌。不依赖外部 CDN 或框架。

### 零依赖

不使用 React、Tailwind 或任何 npm 包。纯 HTML + CSS + 原生 JS。永远不会因版本升级失效。

### 浏览器直接打开

双击文件即可使用，这是最低的技术门槛。

## 闭环工作流

HTML 输出实现了真正的**人机协作闭环**：

1. **Agent 输出**：生成 HTML 文件（如 PR 审查报告）
2. **人类调整**：在浏览器中查看、修改
3. **再输入 Agent**：将修改后的内容反馈给 AI 继续优化

这个闭环在纯 Markdown 模式下无法实现。

## 参考来源

- [The Unreasonable Effectiveness of HTML](https://thariqs.github.io/html-effectiveness/) — Anthropic 工程师 Thariq 的博文及 20 个 Demo
- [Claude Artifacts](https://docs.anthropic.com/en/docs/build-with-claude/artifacts) — Claude 的 Artifact 功能