---
id: cmpgyj6e20005orxtc40cibf0
title: Pretext - 纯 JS 文本测量库
type: concept
tags:

created: 2026-05-22T13:51:40.430Z
updated: 2026-05-22T14:36:56.650Z
---

# Pretext - 纯 JS 文本测量库

## 概述

Cheng Lou（前 React 核心成员）开发的纯 TypeScript 文本测量库，绕过浏览器 layout reflow，用纯算术计算文本高度和布局，比 DOM 测量快 300-600 倍。Gzip 后仅 5KB。

## 核心原理（两阶段设计）

### 01. `prepare()` — 一次性字体分析（1-5ms，只跑一次）
1. CSS white-space 规范化
2. 用 `Intl.Segmenter` 做 Unicode 分词（正确处理 CJK、泰语、阿拉伯 RTL）
3. Canvas `measureText` 测量每个字符段宽度并缓存

### 02. `layout()` — 纯算术计算（~0.0002ms/次）
1. 遍历缓存的字符段宽度
2. 按 `maxWidth` 决定换行位置
3. 计算行数和总高度
4. 零 DOM 触碰，可在 Web Worker / Node.js 运行

## 性能数据

| 方案 | 速度 | 精度 |
|------|------|------|
| DOM 测量 (getBoundingClientRect) | 慢（500 块需 15-30ms + 触发 reflow） | 高 |
| Pretext | **0.0002ms/次**，500 块仅 0.05ms，零 reflow | 高 |
| Canvas.measureText 原始调用 | 快，但需自行实现换行算法 | 中 |
| HarfBuzz (WASM) | 中 | 最高（包体大） |

## 适用场景

| 场景 | 说明 |
|------|------|
| 虚拟滚动 | 渲染前精确预知每条消息高度，零误差 |
| 防止 CLS (Layout Shift) | SSR 阶段提前计算布局，CLS 指标归零 |
| Canvas/WebGL 渲染 | 脱离 DOM 精确排版，支持 60fps 文字动画 |
| 瀑布流布局 | 不依赖 DOM 测量即可计算卡片高度 |
| 障碍物感知文字排版 | 文字实时绕任意形状流动，60fps 重排 |
| SVG/服务端渲染 | 配合 opentype.js 将文本转为 SVG 路径，零字体依赖 |

## API 示例

```typescript
import { prepare, layout } from '@chenglou/pretext';

// 第一步：一次性分析（1-5ms，只跑一次）
const prepared = await prepare('Hello, 世界 🌍', '16px Inter');

// 第二步：按容器宽度计算高度（0.0002ms，随时调用）
const { height, lineCount } = layout(prepared, 300);
```

## 安装

```bash
npm install @chenglou/pretext
```

支持 ESM / CJS，浏览器、Node.js、Web Worker 均可运行。

## 文本支持

- ✅ CJK 中日韩混排（逐字换行）
- ✅ Emoji（Unicode 序列、肤色修饰符、ZWJ 序列，Safari 有校准）
- ✅ BiDi 双向文本（RTL 阿拉伯文、希伯来文）
- ✅ 无空格语言（泰语等，通过 Intl.Segmenter 分词）
- ✅ 软连字符 `&shy;`
- ✅ 富文本内联元素混排

## 已知限制

- 依赖 Canvas API，无 Canvas 环境无法运行
- Web Font 需确保 `font-display: block` 或在 `font.load()` resolve 后调用
- 当前仅支持 `white-space: normal` + `word-break: normal` + `overflow-wrap: break-word`，不支持 `pre-wrap`

## 与其他工具关系

- **vs DOM 测量**：Pretext 零 reflow，适合高频调用场景
- **vs Canvas.measureText**：Pretext 内置换行算法，直接给结果
- **vs WorkBuddy 前端项目**：可用于笔记应用的虚拟滚动优化（我的笔记应用项目）

## 来源

- 官网：https://pretextjs.net/zh
- GitHub：https://github.com/chenglou/pretext
- 作者：Cheng Lou（前 React 核心团队，Midjourney 现任）
- 社区：发布一周 GitHub 10k+ stars