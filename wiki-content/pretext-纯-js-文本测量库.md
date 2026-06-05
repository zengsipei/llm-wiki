---
id: cmq0fbqej001knckli11pi9y6
title: "Pretext - 纯 JS 文本测量库"
type: concept
tags:

created: 2026-06-05T04:28:12.523Z
updated: 2026-06-05T04:28:12.523Z
---

1|---
     2|source_type: chat
     3|date: 2026-05-05
     4|topic: Pretext - 纯 JS 文本测量库（自适应文字宽度）
     5|tags: [工具, JavaScript, 排版, 性能优化, 文本测量]
     6|---
     7|
     8|# Pretext - 纯 JS 文本测量库
     9|
    10|## 概述
    11|
    12|Cheng Lou（前 React 核心成员）开发的纯 TypeScript 文本测量库，绕过浏览器 layout reflow，用纯算术计算文本高度和布局，比 DOM 测量快 300-600 倍。Gzip 后仅 5KB。
    13|
    14|## 核心原理（两阶段设计）
    15|
    16|### 01. `prepare()` — 一次性字体分析（1-5ms，只跑一次）
    17|1. CSS white-space 规范化
    18|2. 用 `Intl.Segmenter` 做 Unicode 分词（正确处理 CJK、泰语、阿拉伯 RTL）
    19|3. Canvas `measureText` 测量每个字符段宽度并缓存
    20|
    21|### 02. `layout()` — 纯算术计算（~0.0002ms/次）
    22|1. 遍历缓存的字符段宽度
    23|2. 按 `maxWidth` 决定换行位置
    24|3. 计算行数和总高度
    25|4. 零 DOM 触碰，可在 Web Worker / Node.js 运行
    26|
    27|## 性能数据
    28|
    29|| 方案 | 速度 | 精度 |
    30||------|------|------|
    31|| DOM 测量 (getBoundingClientRect) | 慢（500 块需 15-30ms + 触发 reflow） | 高 |
    32|| Pretext | **0.0002ms/次**，500 块仅 0.05ms，零 reflow | 高 |
    33|| Canvas.measureText 原始调用 | 快，但需自行实现换行算法 | 中 |
    34|| HarfBuzz (WASM) | 中 | 最高（包体大） |
    35|
    36|## 适用场景
    37|
    38|| 场景 | 说明 |
    39||------|------|
    40|| 虚拟滚动 | 渲染前精确预知每条消息高度，零误差 |
    41|| 防止 CLS (Layout Shift) | SSR 阶段提前计算布局，CLS 指标归零 |
    42|| Canvas/WebGL 渲染 | 脱离 DOM 精确排版，支持 60fps 文字动画 |
    43|| 瀑布流布局 | 不依赖 DOM 测量即可计算卡片高度 |
    44|| 障碍物感知文字排版 | 文字实时绕任意形状流动，60fps 重排 |
    45|| SVG/服务端渲染 | 配合 opentype.js 将文本转为 SVG 路径，零字体依赖 |
    46|
    47|## API 示例
    48|
    49|```typescript
    50|import { prepare, layout } from '@chenglou/pretext';
    51|
    52|// 第一步：一次性分析（1-5ms，只跑一次）
    53|const prepared = await prepare('Hello, 世界 🌍', '16px Inter');
    54|
    55|// 第二步：按容器宽度计算高度（0.0002ms，随时调用）
    56|const { height, lineCount } = layout(prepared, 300);
    57|```
    58|
    59|## 安装
    60|
    61|```bash
    62|npm install @chenglou/pretext
    63|```
    64|
    65|支持 ESM / CJS，浏览器、Node.js、Web Worker 均可运行。
    66|
    67|## 文本支持
    68|
    69|- ✅ CJK 中日韩混排（逐字换行）
    70|- ✅ Emoji（Unicode 序列、肤色修饰符、ZWJ 序列，Safari 有校准）
    71|- ✅ BiDi 双向文本（RTL 阿拉伯文、希伯来文）
    72|- ✅ 无空格语言（泰语等，通过 Intl.Segmenter 分词）
    73|- ✅ 软连字符 `&shy;`
    74|- ✅ 富文本内联元素混排
    75|
    76|## 已知限制
    77|
    78|- 依赖 Canvas API，无 Canvas 环境无法运行
    79|- Web Font 需确保 `font-display: block` 或在 `font.load()` resolve 后调用
    80|- 当前仅支持 `white-space: normal` + `word-break: normal` + `overflow-wrap: break-word`，不支持 `pre-wrap`
    81|
    82|## 与其他工具关系
    83|
    84|- **vs DOM 测量**：Pretext 零 reflow，适合高频调用场景
    85|- **vs Canvas.measureText**：Pretext 内置换行算法，直接给结果
    86|- **vs WorkBuddy 前端项目**：可用于笔记应用的虚拟滚动优化（我的笔记应用项目）
    87|
    88|## 来源
    89|
    90|- 官网：https://pretextjs.net/zh
    91|- GitHub：https://github.com/chenglou/pretext
    92|- 作者：Cheng Lou（前 React 核心团队，Midjourney 现任）
    93|- 社区：发布一周 GitHub 10k+ stars
    94|