---
id: cmpnqrx37001el9x72xhaghlw
title: rtk-ai/rtk — Rust Token Killer
type: concept
tags:

created: 2026-06-01T08:52:57.845Z
updated: 2026-06-01T10:37:22.458Z
---

---
source_url: https://github.com/rtk-ai/rtk
ingested: 2026-05-14
sha256: e97ed6b9134de9e1e1da834043db7ebc2464f367dcab6c1b2cbf4b00a97a726d
---

# rtk-ai/rtk — Rust Token Killer

> 高性能 CLI 代理，减少 LLM token 消耗 60-90%。单个 Rust 二进制，零依赖，<10ms 开销。

## 基本信息（GitHub API, 2026-05-14）

| 项目 | 数据 |
|------|------|
| 全名 | rtk-ai/rtk |
| Stars | 47,271 |
| Forks | 2,862 |
| Open Issues | 904 |
| Language | Rust |
| License | Apache-2.0 |
| Default Branch | develop |
| 创建时间 | 2026-01-22 |
| 最近推送 | 2026-05-13 |
| 官网 | https://www.rtk-ai.app |
| 仓库大小 | 4192 KB |
| 订阅者 | 116 |
| Community Health | 75/100 |

## 核心功能

rtk 拦截并压缩 CLI 命令输出再送给 LLM。四大策略：
1. Smart Filtering — 去噪（注释、空行、样板）
2. Grouping — 聚合（按目录/类型归组）
3. Truncation — 截断冗余
4. Deduplication — 去重重复日志

## Token 节省估算（30 分钟 Claude Code 会话）

| 操作 | 标准输出 | rtk 后 | 节省率 |
|------|---------|--------|--------|
| ls/tree | 2,000 | 400 | 80% |
| cat/read | 40,000 | 12,000 | 70% |
| grep/rg | 16,000 | 3,200 | 80% |
| git status | 3,000 | 600 | 80% |
| git add/commit/push | 1,600 | 120 | 92% |
| cargo test / npm test | 25,000 | 2,500 | 90% |
| **总计** | **~118K** | **~24K** | **~80%** |

## 支持 13 种 AI 编码工具

Claude Code, GitHub Copilot, Cursor, Gemini CLI, Codex, Windsurf, Cline/Roo Code, OpenCode, OpenClaw, **Hermes**, Mistral Vibe (planned), Kilo Code, Google Antigravity。

Hermes 集成方式: `rtk init --agent hermes` → Python 插件适配器（通过 `rtk rewrite` 进行 terminal command mutation）。

## 覆盖 100+ 命令

文件操作（ls/read/find/grep/diff）、Git 全套、GitHub CLI、测试框架（Jest/Vitest/pytest/cargo test/go test/rspec）、构建/lint（ESLint/tsc/cargo clippy/ruff）、包管理器（pnpm/pip/bundle）、AWS CLI、Docker/K8s、JSON/日志处理等。

## 安装

```bash
brew install rtk                    # Homebrew
curl -fsSL https://.../install.sh | sh  # 一键安装
cargo install --git https://github.com/rtk-ai/rtk  # Cargo
```

## 核心团队

- Patrick Szymkowiak — Founder
- Florian Bruniaux — Core contributor
- Adrien Eppling — Core contributor

## 当前开发版

dev-0.40.0-rc.215 (2026-05-11)，支持 macOS (arm64/x64)、Linux (arm64/x64 musl)、Windows (x64) + deb/rpm 包。

## 隐私和遥测

遥测默认关闭，需显式 opt-in（GDPR 合规）。收集匿名聚合数据用于改进产品。

## Topics

agentic-coding, ai-coding, anthropic, claude-code, cli, command-line-tool, cost-reduction, developer-tools, llm, open-source, productivity, rust, token-optimization