---
id: cmp8w7ycm0006okil7zo726bf
title: Prisma ORM 使用指南
type: concept
tags:

created: 2026-05-16T22:03:36.742Z
updated: 2026-05-27T07:27:43.164Z
---

# Prisma ORM 使用指南

Prisma 是下一代 TypeScript ORM，提供类型安全的数据库访问。

## 核心概念

> [!note] Prisma 工作流
> Schema 定义 → 生成客户端 → 类型安全的数据库操作

```
schema.prisma → prisma generate → PrismaClient → 应用代码
```

## Schema 定义

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  tags      String[] // SQLite 数组
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## CRUD 操作

### 创建

```typescript
const user = await prisma.user.create({
  data: {
    name: '张三',
    email: 'zhangsan@example.com',
    posts: {
      create: {
        title: '第一篇文章',
        content: 'Hello World',
      }
    }
  }
})
```

### 查询

```typescript
// 查询单条
const user = await prisma.user.findUnique({
  where: { email: 'zhangsan@example.com' },
  include: { posts: { orderBy: { createdAt: 'desc' } } }
})

// 条件查询
const users = await prisma.user.findMany({
  where: {
    name: { contains: '张' },
    posts: { some: { title: { startsWith: 'AI' } } }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0
})
```

### 更新

```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: {
    name: '新名字',
    posts: {
      updateMany: {
        where: { published: false },
        data: { published: true }
      }
    }
  }
})
```

### 删除

```typescript
// 级联删除
await prisma.user.delete({
  where: { id: userId }
  // posts 会因为 onDelete: Cascade 自动删除
})
```

## 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name add_user_avatar

# 重置数据库（开发环境）
npx prisma migrate reset

# 生产环境同步
npx prisma db push
```

> [!warning] 生产环境注意
> `prisma migrate reset` 会删除所有数据！生产环境请使用 `prisma db push` 或 `prisma migrate deploy`。

## 性能优化

1. **select 只查需要的字段**：避免 `findMany` 无 select
2. **include 控制关联深度**：避免 N+1 查询
3. **分页**：使用 `cursor` 分页（性能优于 skip/take）
4. **事务**：多个操作用 `prisma.$transaction()`
5. **连接池**：配置合理的 connection_limit