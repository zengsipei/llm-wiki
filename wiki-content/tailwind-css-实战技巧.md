---
id: cmpv130k60000mbc5hxsbb79i
title: Tailwind CSS 实战技巧
type: concept
tags:

created: 2026-06-01T09:50:40.278Z
updated: 2026-06-01T10:37:22.463Z
---

# Tailwind CSS 实战技巧

Tailwind CSS 4 的实战经验和高级用法。

## 核心理念

> [!note] Utility-First
> Tailwind 的核心理念是"原子化 CSS"——通过组合小的工具类来构建任意设计，而不是预先定义组件样式。

## 常用模式

### 响应式设计

```html
<!-- 移动端单列，桌面端双列 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

### 暗色模式

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  自动适配明暗主题
</div>
```

> [!tip] Tailwind 4 暗色模式
> Tailwind 4 使用 `@custom-variant dark (&:is(.dark *));` 定义暗色模式，通过 CSS 类 `.dark` 控制。

### 动画

```html
<!-- 淡入 -->
<div class="animate-in fade-in duration-300">淡入</div>

<!-- 自定义过渡 -->
<button class="transition-all duration-200 hover:scale-105 active:scale-95">
  点击缩放
</button>

<!-- 毛玻璃效果 -->
<div class="backdrop-blur-md bg-white/30 border border-white/20 rounded-xl">
  毛玻璃卡片
</div>
```

## 组件模式

### 卡片

```html
<div class="rounded-xl border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
  <h3 class="text-lg font-semibold mb-2">卡片标题</h3>
  <p class="text-sm text-muted-foreground">卡片内容</p>
</div>
```

### 表单输入

```html
<input 
  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
         ring-offset-background placeholder:text-muted-foreground 
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
/>
```

## 性能优化

1. **JIT 模式**（默认开启）：只生成用到的 CSS
2. **Purge 无用样式**：生产构建自动清理
3. **避免任意值滥用**：`w-[137px]` 会生成额外的 CSS
4. **使用 @apply 复用**：将重复组合提取到组件类

### Typography 插件

```html
<article class="prose dark:prose-invert max-w-none">
  <h1>文章标题</h1>
  <p>正文内容，自动排版。</p>
</article>
```

## 与 shadcn/ui 配合

> [!important] shadcn/ui 是组件库，不是依赖
> shadcn/ui 的组件代码直接复制到项目中，可以自由修改。

```bash
# 添加组件
npx shadcn@latest add button card dialog

# 组件文件在 components/ui/ 下
# 可以自由修改样式和行为
```