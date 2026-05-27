---
id: cmpnqrx1i000ql9x7ju2svh2z
title: "飞书 CLI（Lark CLI）— 飞书官方命令行工具"
type: concept
tags:
  - ["cli", "ai-agent", "飞书", "lark", "开源工具"]
created: 2026-05-27T07:27:43.111Z
updated: 2026-05-27T07:27:43.111Z
---

# 飞书 CLI（Lark CLI）— 飞书官方命令行工具

> 飞书官方开源的命令行工具，让人类和 AI Agent 都能在终端直接操作飞书。覆盖 18 个业务域、200+ 命令、26 个 AI Agent Skills。

- **仓库**：https://github.com/larksuite/cli
- **协议**：MIT
- **语言**：Go
- **安装**：`npx @larksuite/cli@latest install`
- **官网**：https://www.feishu.cn/feishu-cli
- **文档站**：https://feishu-cli.com/zh

## 基本信息

| 项目 | 数据 |
|------|------|
| 全名 | larksuite/cli |
| 协议 | MIT |
| 语言 | Go（>=1.23） |
| npm 包 | @larksuite/cli |
| 覆盖业务域 | 18 个 |
| 命令数 | 200+ |
| Agent Skills | 26 个 |
| API 覆盖 | 2500+（通用调用层） |

## 安装与快速开始

```bash
# 安装（二选一）
npx @larksuite/cli@latest install     # npm 推荐
# 或从源码：git clone + make install（需 Go 1.23+ 和 Python 3）

# 配置应用凭证（浏览器完成）
lark-cli config init

# OAuth 登录授权
lark-cli auth login --recommend

# 验证
lark-cli auth status

# 测试
lark-cli calendar +agenda
```

AI Agent 安装时使用 `--no-wait` 参数非阻塞获取授权 URL，发给用户在浏览器完成。

## 核心能力（18 个业务域）

| 领域 | 能力 |
|------|------|
| 💬 即时通讯 | 发送/回复消息、群聊管理、消息搜索、上传下载文件 |
| 📄 云文档 | 创建/读取/更新/搜索文档（基于 Markdown） |
| 📝 Markdown | Drive 中原生 `.md` 文件的创建、读取、局部 patch、覆盖更新 |
| 📊 多维表格 | 数据表、字段、记录、视图、仪表盘、自动化流程、数据聚合分析 |
| 📈 电子表格 | CRUD、追加、查找、导出 |
| 📅 日历 | 日程 CRUD、忙闲查询、时间建议、会议室查找、回复邀请 |
| 📧 邮箱 | 浏览/搜索/阅读邮件、发送/回复/转发、草稿管理、监听新邮件 |
| ✅ 任务 | 任务/子任务/清单/提醒/成员分配 |
| ✍️ 审批 | 查询/同意/拒绝/转交审批、撤回与抄送 |
| 🎯 OKR | 查询/创建/更新 OKR、目标/关键结果/对齐/指标管理 |
| 📚 知识库 | 知识空间、节点、文档管理 |
| 🎥 视频会议 | 搜索会议记录、查询纪要/逐字稿 |
| 🕐 考勤 | 查询个人考勤打卡记录 |
| 🖼️ 幻灯片 | 演示文稿 CRUD、幻灯片页面管理 |
| 👤 通讯录 | 按姓名/邮箱/手机号搜索用户、获取用户信息 |
| 📁 云空间 | 上传/下载文件、搜索文档与知识库、管理评论 |
| 🎨 画板 | 画板/图表 DSL 渲染 |
| 🔗 应用 | 开发/部署 HTML、Web 页面和应用 |

## 三层命令架构

飞书 CLI 提供三种粒度的调用方式，从人机友好到全 API 覆盖：

### 第 1 层：快捷命令（Shortcuts）

`+` 前缀，内置智能默认值、表格输出和 dry-run 预览，适合人类和 AI Agent 日常使用：

```bash
lark-cli calendar +agenda                                          # 查看今日日程
lark-cli im +messages-send --chat-id "oc_xxx" --text "Hello"      # 发消息
lark-cli docs +create --doc-format markdown --content $'# 标题\n内容'  # 创建文档
```

### 第 2 层：API 命令

从飞书 OAPI 元数据自动生成，100+ 精选命令与平台端点一一对应：

```bash
lark-cli calendar calendars list
lark-cli calendar events instance_view --params '{"calendar_id":"primary","start_time":"1700000000","end_time":"1700086400"}'
```

### 第 3 层：通用 API 调用

直接调用任意飞书开放平台端点，覆盖 2500+ API：

```bash
lark-cli api GET /open-apis/calendar/v4/calendars
lark-cli api POST /open-apis/im/v1/messages --params '{"receive_id_type":"chat_id"}' --data '{"receive_id":"oc_xxx","msg_type":"text","content":"{\"text\":\"Hello\"}"}'
```

## 26 个 AI Agent Skills

飞书 CLI 原生为 AI Agent 设计，内置 26 个开箱即用的 Skills，适配 Claude Code、Cursor、Trae 等主流 AI 工具：

| Skill | 说明 |
|-------|------|
| `lark-shared` | 应用配置、认证登录、身份切换、权限管理、安全规则（所有 skill 自动加载） |
| `lark-calendar` | 日历日程 CRUD、议程查看、忙闲查询、时间建议、会议室查找 |
| `lark-im` | 发送/回复消息、群聊管理、消息搜索、上传下载文件、表情回复 |
| `lark-doc` | 创建/读取/更新/搜索文档（Markdown） |
| `lark-drive` | 上传/下载文件，管理权限与评论 |
| `lark-markdown` | Drive 中原生 Markdown 文件的创建/读取/局部 patch/覆盖更新 |
| `lark-sheets` | 电子表格 CRUD/追加/查找/导出 |
| `lark-base` | 多维表格、字段、记录、视图、仪表盘、数据聚合分析 |
| `lark-task` | 任务/任务清单/子任务/提醒/成员分配 |
| `lark-mail` | 邮件收发/草稿管理/监听新邮件 |
| `lark-contact` | 按姓名/邮箱/手机号搜索用户 |
| `lark-wiki` | 知识空间、节点、文档 |
| `lark-event` | 实时事件订阅（WebSocket），正则路由，Agent 友好格式 |
| `lark-slides` | 演示文稿 CRUD、幻灯片页面管理 |
| `lark-vc` | 搜索会议记录、查询纪要产物（总结/待办/逐字稿） |
| `lark-whiteboard` | 画板/图表 DSL 渲染 |
| `lark-minutes` | 妙记元数据与 AI 产物，上传音视频生成妙记 |
| `lark-attendance` | 查询个人考勤打卡记录 |
| `lark-approval` | 审批查询/同意/拒绝/转交/撤回/抄送 |
| `lark-okr` | OKR 查询/创建/更新/对齐/指标管理 |
| `lark-openapi-explorer` | 从官方文档探索底层 API |
| `lark-skill-maker` | 自定义 skill 创建框架 |
| `lark-workflow-meeting-summary` | 工作流：会议纪要汇总与结构化报告 |
| `lark-workflow-standup-report` | 工作流：日程待办摘要 |

安装 skills：

```bash
npx skills add larksuite/cli -y -g
```

## AI 友好特性

### 输出格式

```bash
--format json      # 完整 JSON 响应（默认）
--format pretty    # 人性化格式输出
--format table     # 易读表格
--format ndjson    # 换行分隔 JSON（管道友好）
--format csv       # 逗号分隔值
```

### 分页控制

```bash
--page-all         # 自动翻页获取所有数据
--page-limit 5     # 最多获取 5 页
--page-delay 500   # 每页请求间隔 500ms
```

### Dry Run 预览

对可能产生副作用的命令先用 `--dry-run` 预览请求，不实际执行：

```bash
lark-cli im +messages-send --chat-id oc_xxx --text "hello" --dry-run
```

### Schema 自省

查看任意 API 方法的参数、请求体、响应结构：

```bash
lark-cli schema                              # 列出所有 schema
lark-cli schema calendar.events.instance_view  # 查看具体方法
```

### 身份切换

以用户或机器人身份执行命令：

```bash
lark-cli calendar +agenda --as user
lark-cli im +messages-send --as bot --chat-id "oc_xxx" --text "Hello"
```

### 认证相关

```bash
lark-cli auth login                          # 交互式登录
lark-cli auth login --domain calendar,task    # 按域筛选权限
lark-cli auth login --recommend               # 推荐的自动审批 scopes
lark-cli auth login --no-wait                 # Agent 模式：非阻塞，返回 URL
lark-cli auth login --device-code             # 恢复轮询
lark-cli auth status                         # 查看登录状态
lark-cli auth check                          # 校验指定 scope
lark-cli auth scopes                         # 列出所有可用 scope
lark-cli auth list                           # 列出已认证用户
lark-cli auth logout                         # 登出
```

## 安全与风险

官方明确提醒以下风险：

1. **模型幻觉**：AI Agent 可能误操作（发错消息、删错文档）
2. **执行不可控**：Agent 以用户身份操作，授权范围内无二次确认
3. **提示词注入**：恶意输入可能操纵 Agent 执行非预期操作
4. **数据泄露**：建议作为私人助手使用，不要拉入群聊

内置安全保护：输入防注入、终端输出净化、OS 原生密钥链存储凭证。

## 社区生态

- 开源一个月 star 破万
- 社区贡献了 Web 智能工作台版本（多用户授权平台）
- 第三方 MCP 服务器集成（cso1z/feishu-mcp）
- 第三方 feishu-cli（riba2534/feishu-cli）— 独立社区实现，主打 Markdown ↔ 飞书文档双向转换
- 飞书项目（Meegle）有独立 CLI：eegle-cli

## 相关工具对比

| 工具 | 定位 | 特点 |
|------|------|------|
| **larksuite/cli（官方）** | 完整飞书操作 CLI | 200+ 命令、26 Skills、官方维护 |
| **riba2534/feishu-cli** | 社区版飞书 CLI |主打 Markdown ↔ 飞书文档双向无损转换 |
| **cso1z/feishu-mcp** | MCP 服务器 | 支持 MCP 协议 + 独立 CLI 工具 |
| **eegle-cli** | 飞书项目管理 | 管理工作项/排期/数据，需单独安装 |

## 使用场景示例

### AI Agent 自动发送日报

```bash
# Claude Code / Cursor 等调用
lark-cli im +messages-send \
  --chat-id "oc_xxx" \
  --text "今日完成：1. 完成用户模块重构 2. 修复3个bug\n明日计划：1. 开始支付模块开发"
```

### 查询并汇总本周日程

```bash
lark-cli calendar +agenda --format json --page-all
```

### 批量创建任务

```bash
lark-cli task task create --name "完成设计稿" --due-date "2026-05-30"
lark-cli task task create --name "代码评审" --due-date "2026-05-28"
```

### Markdown 文档写入飞书

```bash
lark-cli markdown create --folder-token "fld_xxx" --title "技术方案" --content-file ./proposal.md
```

### 监听新邮件（实时事件）

```bash
lark-cli event subscribe --pattern "mail:new" --format ndjson
```

## 相关链接

- GitHub 仓库：https://github.com/larksuite/cli
- 官方网站：https://www.feishu.cn/feishu-cli
- 文档站：https://feishu-cli.com/zh
- 安装指南：https://www.feishu.cn/content/article/7623291503305083853
- 社区版 CLI：https://github.com/riba2534/feishu-cli
- MCP 集成：https://github.com/cso1z/feishu-mcp
- 飞书项目 CLI：https://github.com/larksuite/meegle-cli