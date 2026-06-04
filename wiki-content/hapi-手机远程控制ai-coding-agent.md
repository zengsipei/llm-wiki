---
id: cmpyz15d10013lm53j811qwh9
title: Hapi - 手机远程控制 AI Coding Agent
type: concept
tags:

created: 2026-06-03T16:20:00.000Z
updated: 2026-06-03T16:20:00.000Z
---

---
source_type: chat
date: 2026-06-03
topic: Hapi 手机远程控制 AI Coding Agent 调研
tags: [工具, AI, Agent, 开源, Claude Code, Codex, 远程控制, Telegram, Tw93, KernelSU]
---

# Hapi - 手机远程控制 AI Coding Agent

## 概述

Hapi 是 [tiann](https://github.com/tiann)（KernelSU 作者）开发的手机远程控制工具，让你离开电脑后仍能用手机监控和操控正在运行的 AI Coding Agent（Claude Code、Codex、Cursor Agent、Gemini CLI、OpenCode）。核心价值是**远程权限审批**——Agent 请求读写文件时，手机上实时通知并审批。

一句话：**vibe coding anytime, anywhere.**

| 项目 | 说明 |
|------|------|
| **GitHub** | [tiann/hapi](https://github.com/tiann/hapi) |
| **作者** | tiann（Android 圈知名开发者，KernelSU 作者） |
| **定位** | Happy 的本地优先开源替代 |
| **npm** | `@twsxtd/hapi` |
| **许可** | 开源 |

## 架构（三组件）

```
你的电脑
├── HAPI CLI    ←── 包装 AI Agent（Claude Code / Codex 等）
├── HAPI Hub    ←── 中心服务（Socket.IO + SQLite + REST API）
└── Web App     ←── 内嵌 React PWA 前端
        │
        │ localhost:3006（可选 Tunnel 暴露到公网）
        ▼
   你的手机
   ├── Telegram Mini App
   └── PWA / 浏览器
```

### 组件详解

| 组件 | 技术 | 职责 |
|------|------|------|
| **HAPI CLI** | Node.js | 包装 AI Agent，管理会话，转发消息/权限请求，提供 MCP 工具 |
| **HAPI Hub** | Node.js + Express + Socket.IO + SQLite | 中心服务，HTTP API + Socket.IO 双向通信 + SSE 推送 |
| **Web App** | React PWA | 手机界面，会话列表/聊天/权限审批/文件浏览/远程启动 |
| **Telegram Bot** | Telegram Bot API | 通知推送 + Mini App 操作 |
| **Tunnel** | Cloudflare Tunnel / ngrok | 可选，将 Hub 暴露到公网 |

## 核心功能

| 功能 | 说明 |
|------|------|
| **远程发消息** | 手机上给 Agent 发指令，等同于终端操作 |
| **权限审批** | Agent 请求文件操作/命令执行时，手机实时通知，一键审批或拒绝 |
| **会话管理** | 查看所有活跃和历史编码会话 |
| **文件浏览** | 手机上浏览项目文件和 git diff |
| **远程启动** | 从手机远程启动新的 Agent 会话 |
| **Telegram 集成** | Bot 通知 + Telegram Mini App 内操作 |
| **端到端加密** | WireGuard + TLS 加密通信 |

## 支持的 AI Agent

| 命令 | Agent |
|------|-------|
| `hapi` | Claude Code |
| `hapi codex` | OpenAI Codex CLI |
| `hapi cursor` | Cursor Agent |
| `hapi gemini` | Google Gemini CLI |
| `hapi opencode` | OpenCode |

## 数据流

### 权限审批流
```
Agent 请求权限 → CLI 转发 Hub → 通知手机（SSE + Telegram）
→ 用户审批 → Hub 回传 CLI → Agent 继续/停止
```

### 消息流
```
用户（手机）──发送消息──→ Hub ──Socket.IO──→ CLI
                                    ↓
                              Agent 处理
                                    ↓
用户（手机）←──SSE 推送──── Hub ←──流式响应──── CLI
```

## 安装使用

```bash
# 安装 CLI
npm install -g @twsxtd/hapi
# 或 Homebrew
brew install tiann/tap/hapi

# 启动 Hub（首次运行生成 access token）
hapi hub --relay

# 启动 Agent 会话
hapi              # Claude Code
hapi codex        # Codex
hapi cursor       # Cursor Agent
hapi gemini       # Gemini

# 手机打开终端显示的 URL 或扫二维码
# 输入 access token 登录
```

> [!tip] 后台运行
> `hapi runner start` 可以启动后台服务，支持远程通过手机 spawn 新的 Agent 会话。

## 与 Happy 对比

| 维度 | Hapi | Happy |
|------|------|-------|
| 定位 | 本地优先，开源 | 云服务（Cursor 官方） |
| 自托管 | 是，跑在自己机器上 | 否，Cursor 托管 |
| 支持的 Agent | Claude Code / Codex / Gemini / Cursor / OpenCode（5种） | 仅 Cursor Agent |
| Telegram | 支持（Bot + Mini App） | 不支持 |
| 费用 | 免费 | 需 Cursor 订阅 |
| 加密 | WireGuard + TLS 端到端 | Cursor 基础设施 |
| 远程启动 | 支持从手机启动新会话 | 不支持 |

## 适用场景

- 人在外面，电脑上 Claude Code 还在跑长任务，需要远程查看进度和审批权限
- 团队协作：多人通过手机审批各自 Agent 的操作权限
- AI Agent 自动化：Agent 在后台持续工作，人手机上随时接管
- 夜间任务：睡前启动 Agent 任务，手机收到权限通知后起床审批或拒绝

## 作者背景

tiann 是 Android 社区知名开发者：
- **KernelSU** — 基于 Kernel 的 Android Root 方案，GitHub 40k+ Stars
- Hapi 是其 2026 年新作，聚焦 AI Coding Agent 远程控制场景
- 技术栈：Rust / Android / Node.js

## 相关页面

- [[Claude 使用指南]] — Hapi 最常用的宿主 Agent，Claude Code 远程控制是核心场景
- [[Claude Code Operator模式与5种Agentic工作流]] — Hapi 可在 Operator 模式下远程审批 Agent 权限
- [[Codex CLI /goal 命令（v0.128.0+）]] — Hapi 同样支持 Codex Agent 的远程控制
- [[Gemini 使用指南]] — Hapi 也支持 Gemini CLI 的远程操控
- [[AI 编程工具对比]] — Hapi 可配合多种 Coding Agent 使用，是该对比的运维工具补充
- [[Kami - AI 文档排版设计系统]] — 同为独立开发者工具生态：Kami 作者 Tw93 和 Hapi 作者 tiann 都在 AI Agent 工具领域活跃， Kami 做文档排版，Hapi 做远程控制
- [[Plannotator — AI Agent 的交互式计划与代码审查工具]] — 同为 Agent 辅助工具，Plannotator 做计划/审查，Hapi 做远程控制
- [[mindfold-ai/Trellis — AI Coding Agent Harness]] — 同为 Agent 编排工具，Trellis 做本地 harness，Hapi 做远程控制
