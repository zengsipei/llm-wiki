---
id: 6bbdbfd9-9cb4-4d8b-8869-806fadbd18c1
title: "Obscura - Rust 无头浏览器引擎"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-01T08:52:57.732Z
updated: 2026-06-01T08:52:57.732Z
---

---
source_type: chat
date: 2026-05-05
topic: Obscura - Rust 无头浏览器引擎（AI Agent + 爬虫）
tags: [工具, 浏览器, Rust, 无头浏览器, AI-Agent, 爬虫, 反检测]
---

# Obscura - Rust 无头浏览器引擎

## 概述

Obscura 是用 Rust 编写的开源无头浏览器引擎，专为 AI Agent 自动化和大规模网页爬取设计。内置 V8 引擎运行真实 JavaScript，完整支持 Chrome DevTools Protocol (CDP)，可作为 Puppeteer/Playwright 的轻量替代。

核心卖点：内存 30MB（比 Chrome 降 85%）、页面加载 51ms、二进制 70MB、无需外部依赖。

## 技术栈

- **语言**：Rust
- **JS 引擎**：V8
- **协议**：Chrome DevTools Protocol (CDP)
- **平台**：Linux (x86_64)、macOS (Apple Silicon/Intel)、Windows
- **协议**：Apache 2.0

## 性能对比（vs Headless Chrome）

| 指标 | Obscura | Headless Chrome |
|------|---------|-----------------|
| 内存占用 | 30 MB | 200+ MB |
| 二进制大小 | 70 MB | 300+ MB |
| 页面加载 | 51-85 ms | ~500 ms |
| 启动时间 | 即时 | ~2s |
| 反检测 | 内置 stealth 模式 | 无 |

## 核心功能

### Stealth 反检测模式
- 会话级指纹随机化（GPU、屏幕、画布、音频、电池）
- 真实 UserAgent（Chrome 145 高熵值）
- `event.isTrusted = true` 事件伪装
- `Function.prototype.toString()` → `[native code]` 原生函数伪装
- 3,520 个追踪域名屏蔽（分析、广告、遥测、指纹脚本）

### CLI 命令
```bash
obscura fetch <URL> --dump html          # 获取渲染后页面
obscura fetch <URL> --eval "doc.title"   # 执行 JS
obscura serve --port 9222 --stealth      # 启动 CDP 服务器
obscura scrape url1 url2 --concurrency 25 # 并行爬取
```

### Puppeteer/Playwright 兼容
启动 CDP 服务器后，可直接用 `puppeteer-core` 或 `playwright-core` 连接：
```javascript
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser',
});
```

### CDP API 覆盖
Target、Page、Runtime、DOM、Network、Fetch、Storage、Input、LP（DOM 转 Markdown）

## 适用场景

- AI Agent 自动化：为 LLM agent 提供网页交互能力
- 大规模爬虫：轻量设计 + 并行处理，适合高频爬取
- 自动化测试：替代 Chrome，更快的测试执行
- 反检测爬虫：内置 stealth 绕过反爬机制

## 与其他工具的关系

- **vs Playwright/Puppeteer**：Obscura 是底层引擎替代，不是上层 API 替代（通过 CDP 兼容）
- **vs WorkBuddy agent-browser**：agent-browser 基于 Playwright，理论上可替换底层为 Obscura
- **vs Headless Chrome**：更轻、更快、内置反检测，但 CDP 覆盖范围可能不如 Chrome 完整

## 项目数据

- GitHub: https://github.com/h4ckf0r0day/obscura
- Stars: 10.2k
- License: Apache 2.0
