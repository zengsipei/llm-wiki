---
id: cmq0fbqe00017ncklr7ncac1x
title: Kami - AI 文档排版设计系统
type: concept
tags:

created: 2026-06-05T04:28:12.505Z
updated: 2026-06-05T04:28:12.576Z
---

---
source_type: chat
date: 2026-06-03
topic: Kami 文档排版设计系统调研
tags: [工具, AI, 设计, 文档, 排版, Claude Code, Skill, 开源, Tw93, CJK]
---

# Kami - AI 文档排版设计系统

## 概述

Kami（紙，かみ）是独立开发者 [Tw93](https://tw93.fun) 打造的 AI 文档排版设计系统，以 Claude Code Skill 形式存在。它为 AI Agent 提供一套"约束语言"，使 Claude 输出的文档始终保持一致的杂志级排版风格——暖纸色画布、单 accent 色、衬线体层次、编辑式留白。

一句话：**好内容值得好纸张。**

| 项目 | 说明 |
|------|------|
| **GitHub** | [tw93/Kami](https://github.com/tw93/Kami) |
| **官网** | [kami.tw93.fun](https://kami.tw93.fun) |
| **作者** | Tw93（独立产品工程师，Rust/Swift/Shell） |
| **版本** | v1.5.0（2026.05） |
| **许可** | 开源 |

## 设计语言

Kami 的设计哲学极度克制：

| 属性 | 值 | 说明 |
|------|-----|------|
| 画布色 | `#f5f4ed` | 暖羊皮纸，不是纯白 |
| Accent | `#1B365D` | 深藏蓝，唯一强调色 |
| 主字体 | Charter（EN）/ 仓角简楷（CN）/ 游明朝（JA）/ 思源宋体 K（KO） | 衬线体优先 |
| 辅助字体 | 无 | 单字体策略，Serif 即 Sans |
| 风格 | 编辑式留白、杂志排版感 | 一张纸一个声调 |

> [!note] 单 Accent 约束
> 全局只用一个强调色，避免了 AI 生成文档时常见的"彩虹色"问题。所有标题、链接、图表、强调元素都共用 `#1B365D`。

## 9 种文档模板

| 模板 | 用途 | 典型场景 |
|------|------|----------|
| **One-Pager** | 一页纸 | 产品介绍、Pitch、公司简介 |
| **Long Doc** | 长文档 | 研究报告、技术文档 |
| **Letter** | 正式信件 | 商务函、推荐信 |
| **Portfolio** | 作品集 | 项目展示、个人主页 |
| **Resume** | 简历 | 求职 CV |
| **Slides** | 幻灯片 | 演讲 Deck |
| **Equity Report** | 财报分析 | 股票分析、季度报告 |
| **Changelog** | 更新日志 | 产品版本变更 |
| **Landing Page** | 落地页（v1.5 新增） | 产品官网 |

另外支持 **14 种内联 SVG 图表类型**，可在文档中嵌入数据可视化。

## 多语言支持

| 语言 | 优先级 | 字体 |
|------|--------|------|
| English | 一等 | Charter |
| 简体中文 | 一等 | 仓角简楷（TsangerJinKai02） |
| 日本語 | 二等（best-effort） | 游明朝 |
| 한국어 | 二等（best-effort） | 思源宋体 K |

CJK 字体加载策略：本地文件 → jsDelivr CDN → `ensure-fonts.sh` 三级回退。

## 使用方式

### Claude Code（推荐）

```bash
npx skills add tw93/kami -a claude-code -g -y
```

### Claude Code 插件市场（v2.1.142+）

```bash
/plugin marketplace add tw93/kami
/plugin install kami@kami
```

### 通用 Agent（Codex / OpenCode / Cursor Agent 等）

```bash
npx skills add tw93/kami -a '*' -g -y
```

### Claude Desktop

从 GitHub Releases 下载 `kami.zip`，在 Skills 设置中上传（无需解压）。

### 品牌定制

创建 `~/.config/kami/brand.md` 配置个人身份、品牌色、语言、语调等。Kami 将其作为最低优先级上下文，仅在请求模糊时应用，且可被具体文档需求覆盖。

## 技术实现

- 本质是一个 **SKILL.md**（Claude Code Skill 格式）
- 输出 HTML，可导出 PDF / PNG / 可编辑 PPTX
- 每种模板 = 一组排版规则 + CSS 约束
- Landing Page 模板附带 5 个 `.example` 文件（vercel/sitemap/robots/llms/llms-full），支持多语言部署
- Skill 会根据自然语言请求自动触发，无需斜杠命令

## Tw93 工具生态

Kami 是 Tw93 三部曲之一：

| 项目 | 日语 | 用途 |
|------|------|------|
| [Kaku](https://github.com/tw93/Kaku) | 書く | 代码编辑器（Rust/Swift） |
| [Waza](https://github.com/tw93/Waza) | 技 | 习惯养成工具（Rust） |
| [Kami](https://github.com/tw93/Kami) | 紙 | 文档排版设计系统 |

其他知名作品：**MiaoYan**（喵言笔记）、**Mole**（macOS 效率工具）、**Pake**（网页打包原生 App）。

## 与 Open Design 对比

> [!tip] 定位差异
> Kami 只做文档排版（Skill 级），[[Open Design]] 做全设计系统（平台级）。两者互补而非竞争。

| 维度 | Kami | Open Design |
|------|------|-------------|
| 形态 | 单个 SKILL.md 文件 | 完整平台（Next.js + Daemon） |
| 定位 | 文档排版 | 全设计系统（Deck + Design System + Prototype） |
| 产出 | HTML 文档 → PDF/PNG/PPTX | HTML/PDF/PPTX/ZIP |
| 安装复杂度 | 一条命令 | Docker 或 pnpm 完整部署 |
| Agent 兼容 | Claude Code / Codex / OpenCode / Cursor | 16+ Agent CLI + BYOK API |
| 品牌系统 | brand.md 简单配置 | DESIGN.md 9段式规范 |
| 设计工具 | 无 | 132+ Skill |
| 设计范围 | 文档 | UI / Deck / Prototype / Design System |

## 相关页面

- [[Open Design]] — 全设计系统平台，Kami 的互补品：Open Design 做 UI/Deck/Design System，Kami 做文档排版
- [[GSAP (GreenSock Animation Platform)]] — 落地页动画方案，Kami 的 Landing Page 模板可配合 GSAP 使用
- [[Claude 使用指南]] — Kami 最推荐的宿主 Agent，Claude Code 装上 Kami 后文档输出质量大幅提升
- [[AI 编程工具对比]] — Kami 可配合多种 Coding Agent 使用（Claude Code / Codex / Cursor Agent / Gemini / OpenCode）
- [[Claude Code Operator模式与5种Agentic工作流]] — Kami 作为 Claude Code 的 Skill，可在 Operator 模式下使用
- [[Codex CLI /goal 命令（v0.128.0+）]] — Kami 也支持 Codex Agent，通用 Skill 安装方式
- [[Gemini 使用指南]] — Kami 同样支持 Gemini CLI
- [[Google Stitch 2.0 - AI UI 设计工具]] — 同为 AI 设计工具，但 Stitch 做网页 UI，Kami 做文档排版
- [[暗壳AI - 室内AI设计平台]] — 同为 AI 设计工具，暗壳做室内设计，Kami 做文档设计