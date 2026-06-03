---
id: cmpnqrx1p000tl9x7pxxx4azn
title: Git 工作流最佳实践
type: concept
tags:

created: 2026-06-01T08:52:57.792Z
updated: 2026-06-01T10:37:22.416Z
---

# Git 工作流最佳实践

团队协作中使用 Git 的最佳实践，涵盖分支管理、提交规范和常用技巧。

## 分支策略

### GitHub Flow（推荐小型团队）

```
main ──●────────●────────●───
         \      /          /
feature-A ●──●──/     merge/
              \          /
feature-B  ─────●────●──/
```

> [!tip] GitHub Flow 核心规则
> 1. main 分支始终可部署
> 2. 从 main 创建功能分支
> 3. 通过 Pull Request 合并
> 4. 合并后立即部署

### Git Flow（大型项目）

| 分支 | 用途 | 生命周期 |
|------|------|---------|
| main | 生产代码 | 永久 |
| develop | 开发集成 | 永久 |
| feature/* | 功能开发 | 临时 |
| release/* | 发布准备 | 临时 |
| hotfix/* | 紧急修复 | 临时 |

## Commit 规范

> [!important] Conventional Commits
> 使用约定式提交，让 Git 历史清晰可读。

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat: 添加用户登录功能 |
| fix | 修复 | fix: 修复首页加载白屏 |
| docs | 文档 | docs: 更新 API 文档 |
| style | 格式 | style: 格式化代码缩进 |
| refactor | 重构 | refactor: 重构数据库连接池 |
| perf | 性能 | perf: 优化查询速度 50% |
| test | 测试 | test: 添加登录模块单测 |
| chore | 杂项 | chore: 更新依赖版本 |

### 好的 Commit Message

```
feat(wiki): 添加 Markdown 渲染器 Callout 支持

- 支持 6 种 Callout 类型（note/tip/warning/caution/important/info）
- 自动解析 > [!type] 语法
- 适配明暗主题配色

Closes #123
```

## 常用操作

### 交互式 Rebase

```bash
git rebase -i HEAD~5  # 修改最近 5 次提交
# pick: 保留 | squash: 合并 | reword: 改写 | drop: 删除
```

### 暂存工作区

```bash
git stash          # 暂存当前修改
git stash pop      # 恢复暂存
git stash list     # 查看暂存列表
```

### 撤销操作

```bash
git checkout -- file   # 撤销工作区修改
git reset HEAD file    # 撤销暂存区修改
git reset --soft HEAD~1  # 撤销最近一次提交（保留修改）
```

## .gitignore 必备

```gitignore
# 依赖
node_modules/
.pnpm-store/

# 构建产物
.next/
dist/
build/

# 环境变量
.env
.env.local

# 数据库
*.db
*.db-journal

# IDE
.idea/
.vscode/
```

## 协作技巧

1. **经常 Pull**：保持与远程同步
2. **小步提交**：每次提交一个逻辑变更
3. **Code Review**：PR 必须经过审查
4. **保护分支**：main 分支设置保护规则
5. **CI/CD**：自动化测试和部署

## 相关页面
- [[grill-me-skill]]
