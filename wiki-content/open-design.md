---
id: cmpyz15dh001dlm534cjrdk08
title: Open Design
type: entity
tags:

created: 2026-06-04T04:04:18.677Z
updated: 2026-06-04T04:04:18.677Z
---

# Open Design

> **Claude Design 的开源替代品** — 本地优先、供应商无关的 AI 设计工作台，将现有编码 Agent 转变为设计引擎。

| 项目 | 说明 |
|------|------|
| **官网** | [open-design.ai](https://open-design.ai) |
| **GitHub** | [nexu-io/open-design](https://github.com/nexu-io/open-design) |
| **许可证** | Apache-2.0 |
| **版本** | 0.7.0 (0.8.0-preview 开发中) |
| **组织** | nexu-io |
| **热度** | 两周内 40k+ GitHub Stars |

## 核心理念

Open Design 遵循六大设计原则：

1. **不捆绑 Agent，你现有的就够好** — 自动检测 PATH 上的 16+ 编码 Agent CLI，无需安装新模型
2. **Skill 是文件，不是插件** — 放一个文件夹，重启 daemon，即可使用
3. **设计系统是可移植的 Markdown** — 9 段式 DESIGN.md，切换系统后下次渲染自动使用新 tokens
4. **交互式问卷防止 80% 的返工** — 生成任何像素前先弹出 Discovery 表单锁定需求
5. **Daemon 让 Agent 感觉本地化，因为它确实是** — 真实文件系统、真实工具、真实持久化
6. **Prompt 栈即产品** — 每一层（discovery、identity、DESIGN.md、SKILL.md、metadata、craft references）都可组合和编辑

## 架构

### 系统架构

```
┌────────────── 浏览器 (Next.js 16) ──────────────────┐
│  聊天 · 文件工作区 · iframe 预览 · 设置 · 导入     │
└──────┬──────────────────────────┬───────────────────┘
       │ /api/*                    │
       ▼                          ▼
┌──────────────────────┐   /api/proxy/{provider}/stream (SSE)
│  本地 Daemon         │   → 任意 OpenAI 兼容端点 (BYOK)
│  (Express + SQLite)  │       带 SSRF 防护
└──────┬───────────────┘
       │ spawn(cli, [...], { cwd: .od/projects/<id> })
       ▼
┌──────────────────────────────────────────────────────┐
│  claude · codex · devin · gemini · cursor-agent ·   │
│  qwen · copilot · hermes · kimi · deepseek ...      │
│  读取 SKILL.md + DESIGN.md → 写入 artifact 到磁盘   │
└──────────────────────────────────────────────────────┘
```

### 三种部署拓扑

| 拓扑 | 设置 | 能力 |
|------|------|------|
| **A — 全本地** | `pnpm tools-dev run web` | 完整：本地 daemon + 本地 Agent CLI + Web UI |
| **B — Vercel Web + 本地 Daemon** | `vercel deploy` + `od daemon --expose` | 完整：Web 在 CDN，Agent 本地运行通过隧道 |
| **C — Vercel Web + 直接 API** | `vercel deploy` + BYOK API Key | 降级：无 CLI、无文件系统、无 PPTX 导出 |

### Monorepo 结构

| 包 | 用途 |
|----|------|
| `apps/daemon` | 核心 Express 服务器、SQLite DB、Agent 适配器、Skill 注册、Prompt 组合 |
| `apps/web` | Next.js 16 App Router 前端 (React 18 + TypeScript) |
| `apps/desktop` | 可选 Electron 外壳 |
| `apps/landing-page` | Astro 静态站点 (open-design.ai) |
| `packages/contracts` | 共享 API 类型定义 |
| `packages/sidecar` | Sidecar IPC 实现 |
| `packages/plugin-runtime` | 插件执行运行时 |
| `skills/` | 132+ 技能目录 |
| `design-systems/` | 151+ DESIGN.md 文件 |

## Skill 系统

### 什么是 Skill

Skill 是设计能力的**原子单位** — 一个包含 `SKILL.md` + 可选 `assets/` + `references/` 的文件夹。

### SKILL.md Frontmatter

```yaml
---
name: magazine-web-ppt
description: 杂志风格水平滑动网页演示文稿
triggers:
  - "magazine deck"
  - "杂志风 PPT"
od:
  mode: deck | prototype | template | design-system
  preview:
    type: html | jsx | pptx | markdown
    entry: index.html
  design_system:
    requires: true
  inputs:
    - name: title
      type: string
      required: true
  parameters:
    - name: accent_hue
      type: hue
      default: 18
      range: [0, 360]
---
```

### Skill 模式

| 模式 | 用途 | 输出 |
|------|------|------|
| `prototype` | 单屏交互原型 | `index.html` / `Prototype.jsx` |
| `deck` | 多幻灯片演示 | `index.html` + `slides.json` |
| `template` | 预构建模板，Agent 个性化 | 填充后的副本 |
| `design-system` | 从输入生成 `DESIGN.md` | `DESIGN.md` |

### Skill 发现优先级

1. `./.claude/skills/` (最高 — 项目私有)
2. `./skills/` (中 — 项目提交)
3. `~/.claude/skills/` (低 — 用户全局)

目前内置 **132+ 技能**，覆盖设计、营销、运营、工程、产品、金融、HR、销售、个人等场景。

## 设计系统 (DESIGN.md)

### 9 段式 Schema

每个 `DESIGN.md` 遵循 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 规范：

```markdown
# Design System Inspired by {Brand}

## 1. Visual Theme & Atmosphere
## 2. Color Palette & Roles
## 3. Typography Rules
## 4. Component Stylings
## 5. Layout Principles
## 6. Depth & Elevation
## 7. Do's and Don'ts
## 8. Responsive Behavior
## 9. Agent Prompt Guide
```

目前内置 **151+ 设计系统**，涵盖 Linear、Stripe、Vercel、Airbnb、Tesla、Notion、Anthropic、Apple、Cursor、Supabase、Figma、GitHub、Discord、Spotify 等品牌。

## BYOK Agent 适配器

支持 16 个 CLI 适配器 + BYOK API 代理：

| 优先级 | Agent | 传输协议 |
|--------|-------|---------|
| P0 | Claude Code | `claude-stream-json` (JSONL) |
| P1 | Codex CLI | `json-event-stream` |
| P1 | Devin for Terminal | `acp-json-rpc` (ACP) |
| P1 | Cursor Agent | `json-event-stream` |
| P2 | Gemini CLI、OpenCode、Qwen、Copilot、Hermes、Kimi、Kiro 等 | 多种协议 |

BYOK API 代理支持：Anthropic、OpenAI、Azure OpenAI、Google Gemini、Ollama Cloud。带 SSRF 防护：允许回环 (Ollama, LM Studio)，拒绝私有/链路本地/CGNAT 地址。

## 核心功能

### 交互式 Discovery 表单

生成设计前弹出 `<question-form id="discovery">`，锁定：表面、受众、语调、品牌上下文、规模、约束。这实现了"初级设计师模式" — 批量提问、快速出样、低成本重定向。

### 视觉方向选择器

5 种精选视觉风格：Editorial Monocle、Modern Minimal、Warm Soft、Tech Utility、Brutalist Experimental。每种附带确定性 OKLch 调色板 + 字体栈。一键切换，无需模型自由发挥。

### 五维自评

哲学 (Philosophy)、层级 (Hierarchy)、细节 (Detail)、功能 (Function)、创新 (Innovation) — Agent 对自身产出打分。`critique` 技能产生结构化评分表。

### Anti-AI-Slop 清单

内置设计规则，防止常见 AI 设计缺陷（过度使用 `#6366f1`、过于对称的布局、渐变滥用等）。

### 媒体生成

- **gpt-image-2** (Azure/OpenAI) — 海报、头像、信息图
- **Seedance 2.0** (字节跳动) — 电影级文生视频
- **HyperFrames** — HTML→MP4 动态图形
- 93 个现成 prompt 模板

### 导出格式

HTML (自包含)、PDF (浏览器打印)、PPTX (Agent 驱动)、ZIP (归档)、Markdown。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 16 (App Router) + React 18 + TypeScript + Tailwind CSS |
| 后端 | Node.js ~24 + Express + better-sqlite3 |
| 桌面 | Electron (可选) |
| 着陆页 | Astro |
| 包管理 | pnpm 10.33.2 |
| 构建 | esbuild |
| 测试 | Vitest |
| 容器化 | Docker Compose + Helm Charts (K8s) |
| Nix | Flake 可用 |

## 安装使用

### 桌面应用 (无需构建)

从 [open-design.ai](https://open-design.ai/) 下载，支持 macOS (Apple Silicon + Intel)、Windows (x64)、Linux (AppImage)。

### Docker

```bash
git clone https://github.com/nexu-io/open-design.git
cd open-design/deploy
docker compose up -d
# 打开 http://localhost:7456
```

### 从源码

```bash
git clone https://github.com/nexu-io/open-design.git
cd open-design
corepack enable
pnpm install
pnpm tools-dev run web
```

## 与 Claude Design 对比

| 方面 | Claude Design | Open Design |
|------|--------------|-------------|
| 来源 | 闭源 | Apache-2.0 开源 |
| 部署 | 仅云端，付费 | 本地优先，可自托管 |
| Agent | 锁定 Anthropic 模型 | BYOK — 16+ CLI + 任意 OpenAI 兼容 API |
| 技能 | 仅 Anthropic 提供 | 132+ 可组合技能，用户可扩展 |
| 设计系统 | 仅 Anthropic 提供 | 151+ 可移植 DESIGN.md |
| 持久化 | 云端 | 本地 SQLite + 文件系统 |
| 导出 | 有限 | HTML/PDF/PPTX/ZIP/Markdown |
| Figma 导入 | 不支持 | 支持 |

## 相关项目

- [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — DESIGN.md 规范
- [Claude Design](https://claude.ai/design) — Anthropic 的闭源 AI 设计工具
- [Open CoDesign](https://github.com/nicepkg/open-codesign) — 类似概念的开源项目
- [huashu-design](https://github.com/huashu-design) — 初级设计师模式、五维评审的设计哲学来源
- [[Kami - AI 文档排版设计系统]] — 互补而非竞争：Open Design 做 UI/Deck/Design System，Kami 专注文档排版（一页纸/简历/长文档/幻灯片），极简 Skill 安装