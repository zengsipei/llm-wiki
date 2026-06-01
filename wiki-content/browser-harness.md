---
id: d9b144f3-f323-48bf-b77b-e72586277cf9
title: Browser Harness
type: concept
tags:

created: 2026-06-01T08:52:57.749Z
updated: 2026-06-01T10:37:42.948Z
---

---
source_type: manual
date: 2026-05-07
topic: Browser Harness
tags: [browser-harness, browser-use, CDP, browser-automation, AI-agent, self-healing, skill-system]
---

# Browser Harness

## 概览

- **仓库：** https://github.com/browser-use/browser-harness
- **组织：** browser-use（与 browser-use 主项目同一组织）
- **定位：** 自愈型（Self-healing）轻量浏览器控制框架，专为 LLM Agent 设计
- **语言：** Python 100%
- **核心代码：** ~1,000 行（最初发布时仅 592 行）
- **Stars：** 11.2k+（2026-05）
- **许可证：** MIT
- **标语：** "You will never use the browser again."

## 核心创新

### 1. 极简架构（"反框架"设计）

browser-use 团队将数万行框架代码推倒重来，只保留：
- 一条直连 Chrome 的 WebSocket 连接
- 4 个核心文件/目录的扁平结构
- 直接暴露 CDP（Chrome DevTools Protocol），无中间抽象层

移除了传统框架的元素提取器、DOM 索引器、点击包装器等。

### 2. 自愈机制（Self-healing）

- Agent 运行时遇到缺失功能 → 自行编写代码并保存到 `agent_helpers.py`
- 每次运行积累改进，harness 越用越强
- 与传统 try-catch-retry 不同：让 AI 成为问题解决者，而非预设逻辑的调用者

### 3. Skill 系统（技能自生成）

- Agent 在执行任务中发现**非显而易见的操作方法**时，自动生成 Skill 文件
- 包含选择器、操作流程、边缘情况处理
- 后续遇到相同网站/任务直接复用，无需重新探索
- 支持 Domain Skills：按网站域名自动加载（`BH_DOMAIN_SKILLS=1`）
- 社区可通过 PR 贡献 domain skills（已有 GitHub、LinkedIn、Amazon 等）

### 4. 坐标优先（Coordinate-First）

- 颠覆 20 年浏览器自动化依赖 DOM 结构的范式
- 采用屏幕坐标定位作为主要交互方式
- AI 像人类一样"看图操作"，不依赖 CSS 选择器 / XPath

### 5. 核心与可变代码分离

```
src/browser_harness/    # 受保护的核心包（不可被 Agent 修改）
agent-workspace/
  ├── agent_helpers.py  # Agent 可自由修改的辅助代码
  └── domain-skills/    # Agent 可编辑的领域技能
```

- 基础设施层（CDP Daemon）必须 100% 稳定
- AI 操作层允许犯错、自由探索
- "手可以犯错，心脏不能停"

### 6. CDP Daemon（心跳守护者）

- 维持与 Chrome 的稳定 WebSocket 连接
- 自动重连、心跳保活、连接状态管理

## 使用方式

### 安装（两步）

在 Claude Code 或 Codex 中粘贴：
```
Set up https://github.com/browser-use/browser-harness for me.
Read `install.md` and follow the steps to install browser-harness and connect it to my browser.
```

Agent 会自动打开 `chrome://inspect/#remote-debugging`，用户需：
1. 勾选允许 Agent 连接浏览器
2. Chrome 144+ 需点击"允许"远程调试弹窗

### Browser Use Cloud（免费层）

- 3 个并发浏览器
- 代理 / 验证码自动解决 / 隐身模式 / 子 Agent / 无头部署
- 无需信用卡

## 与 browser-use 主项目对比

| 维度 | browser-use | browser-harness |
|------|-------------|-----------------|
| 定位 | 完整浏览器自动化框架/库 | 轻量自愈型控制线束 |
| 复杂度 | 功能丰富的完整库 | ~1k 行极简核心 |
| 自由度 | 框架约束内的自动化 | Agent 完全自由控制 |
| 自愈能力 | 框架级 | Agent 级（自己写代码） |
| Skill | 预设 | Agent 自生成 |

## 相关页面

- [[Obscura - Rust 无头浏览器引擎]] — Rust 实现的轻量无头浏览器引擎，可作为 CDP 底层替代
- [[Pretext - 纯 JS 文本测量库]] — 同为 Claude Code 生态发现的高性能工具
- [[Agent 架构设计模式]] — Browser Harness 是 Agent 工具设计原则的实践案例
- [[HereOS — GUI 交互驱动的 Agent]] — GUI 交互驱动的 Agent 模式

## 技术栈

| 层面 | 技术 |
|------|------|
| 语言 | Python |
| 浏览器通信 | Chrome DevTools Protocol (CDP) |
| 连接方式 | WebSocket |
| 包管理 | pyproject.toml |
| 目标 LLM | Claude Code、Codex (OpenAI) |
| 云服务 | Browser Use Cloud |

## 设计哲学启示

1. **少即是多**：去除不必要抽象，反而给 AI 更大自由度
2. **Agent 即开发者**：Agent 不只是使用者，更是 contributor，执行中同时改进工具
3. **Bitter Lesson**：让 Agent 自己学习和积累，而非人工预设所有规则
4. **社区技能生态**：去中心化的知识共享，类似"插件市场"