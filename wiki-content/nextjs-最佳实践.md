---
id: cmq0fbqea001encklafvjk961
title: Next.js 最佳实践
type: concept
tags:

created: 2026-06-05T04:28:12.515Z
updated: 2026-06-05T04:28:12.561Z
---

# Next.js 最佳实践

基于 Next.js 16 App Router 的开发最佳实践总结。

## App Router 核心概念

> [!note] App Router vs Pages Router
> Next.js 16 推荐使用 App Router（app/ 目录），支持 Server Components、Streaming、并行路由等现代特性。

```
app/
├── layout.tsx        # 根布局
├── page.tsx          # 首页
├── loading.tsx       # 加载状态
├── error.tsx         # 错误处理
├── not-found.tsx     # 404 页面
├── api/
│   └── route.ts      # API 路由
└── wiki/
    ├── [id]/
    │   └── page.tsx  # 动态路由
    └── page.tsx      # 列表页
```

## Server Components vs Client Components

| 特性 | Server Component | Client Component |
|------|-----------------|-----------------|
| 默认 | ✅ | 需加 'use client' |
| 直接访问数据库 | ✅ | ❌ |
| 使用 useState | ❌ | ✅ |
| 使用 useEffect | ❌ | ✅ |
| 事件处理 | ❌ | ✅ |
| SEO | ✅ | ❌ |

> [!tip] 何时使用 Client Component
> 只有在需要交互（用户输入、状态管理、浏览器 API）时才使用 'use client'。尽可能让组件保持在 Server 端。

## API Routes

```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const items = await db.item.findMany()
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const item = await db.item.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}
```

## 数据获取

### 服务端获取（推荐）

```typescript
// 默认就是 Server Component
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{JSON.stringify(data)}</div>
}
```

### 客户端获取

```typescript
'use client'
import { useState, useEffect } from 'react'

export function ClientPage() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
  return <div>{JSON.stringify(data)}</div>
}
```

## 性能优化

1. **图片优化**：使用 `next/image` 自动优化
2. **代码分割**：动态导入大型组件 `dynamic(() => import(...), { ssr: false })`
3. **并行路由**：使用 `Suspense` 并行加载多个数据
4. **缓存策略**：合理使用 `fetch` 的 `cache` 和 `revalidate` 选项
5. **Bundle 分析**：定期检查 `@next/bundle-analyzer`

## 部署

```bash
# 构建
npm run build

# 启动生产服务
npm run start

# 使用 PM2 持久化
pm2 start "npm run start" --name wiki
```