---
id: c4a667e7-1fb6-4667-bd55-09ca3f042eff
title: Cursor Debug 模式
type: concept
tags:

created: 2026-06-01T08:52:57.726Z
updated: 2026-06-01T10:37:42.939Z
---

---
source_type: chat
date: 2026-05-05
topic: Cursor Debug 模式 — AI 辅助调试功能
tags: [工具, Cursor, 调试, IDE, AI辅助]
---

# Cursor Debug 模式

## 概述

Cursor 的 debug 模式是 IDE 原生调试能力与 AI 辅助的结合，核心目标是让调试过程不脱离编码上下文。

## 核心功能

### 1. 内联调试（Inline Debug）

选中报错代码 → `Ctrl+K` → 输入报错信息，Cursor 直接分析上下文给出修复，不需要切换到聊天窗口。

适用场景：单点报错、明显 bug、快速修复。

### 2. 终端报错一键修复

终端出现报错时，报错信息旁会出现 **"Fix with AI"** 按钮，点击后 Cursor 自动：
- 读取完整堆栈信息
- 关联相关源文件
- 给出修复方案（通常 1-3 个选项）

适用场景：运行时错误、依赖问题、配置错误。

### 3. 条件断点 + AI 解释

在断点处右键 → **"Explain this breakpoint"**，AI 解释：
- 为什么停在这里
- 当前变量状态
- 下一步建议（continue / step over / step into）

适用场景：复杂逻辑调试、不熟悉的代码库。

### 4. Watch 变量 AI 解读

Debug 面板 Variables 区域，右键变量 → **"Explain value"**，AI 解释：
- 变量的当前值和类型
- 在上下文中的含义
- 是否有异常

适用场景：复杂对象状态分析、内存问题排查。

## 与 WorkBuddy 的对比

| 功能 | Cursor | WorkBuddy (wb) |
|------|--------|-----------------|
| 内联修复 | ✅ 选中即修，无感集成 | 需描述问题，手动触发 |
| 终端报错捕获 | ✅ 自动检测终端输出 | 需手动粘贴报错信息 |
| 断点 AI 解释 | ✅ IDE 调试器深度集成 | ❌ 无 IDE 集成 |
| Watch 变量解读 | ✅ 调试器变量面板集成 | ❌ 无调试器访问 |
| 上下文理解 | 当前文件 + 打开的文件 | 全工作区 + 持久记忆 |
| 多轮调试对话 | ✅ 聊天面板持久 | ✅ 会话内持久 |

## 局限性

- **上下文窗口有限**：只能看当前打开的文件，不能跨项目理解
- **无持久记忆**：每次对话独立，不积累调试经验
- **不能执行命令**：AI 给出的修复方案需要手动 apply，不能自动运行测试验证
- **只支持 Cursor 编辑器**：绑定在 IDE 内，不能独立使用

## 与 Graphify / GitNexus 的关系

- **Cursor Debug**：实时调试辅助，聚焦"当前报错"
- **GitNexus**：代码库索引，聚焦"全局影响分析"（改这个函数会影响哪些地方）
- **Graphify**：知识图谱，聚焦"概念连接"（这个函数和哪些设计模式/模块相关）

三者互补：GitNexus 告诉你 impact，Cursor 帮你快速修，Graphify 帮你理解为什么这么设计。

## 来源

- 实测观察
- Cursor 官方文档：https://docs.cursor.com