---
id: cmpgyj6eg000corxt5yw66opp
title: Supabase vs Firebase
type: concept
tags:

created: 2026-05-22T13:51:40.435Z
updated: 2026-05-22T14:36:56.659Z
---

# Supabase vs Firebase

## Supabase

- **定位：** 开源 Firebase 替代品
- **数据库：** PostgreSQL（完整 SQL 支持）
- **认证：** 邮箱/密码、OAuth（Google/GitHub 等）、手机号、Magic Link
- **实时订阅：** 基于 PostgreSQL WAL 的 Realtime
- **存储：** S3 兼容的 Object Storage
- **Edge Functions：** Deno 运行时，TypeScript 原生
- **API：** 自动生成 REST（PostgREST）和 GraphQL
- **Row Level Security (RLS)：** PostgreSQL 原生行级安全策略
- **开源：** 可自托管，社区活跃
- **定价：** 免费层 generous（500MB 数据库、1GB 存储、5GB 带宽）

## Firebase

- **定位：** Google 的 BaaS 平台
- **数据库：** Firestore（NoSQL 文档型）/ Realtime Database（JSON 树）
- **认证：** 邮箱/密码、OAuth、手机号、匿名、自定义 token
- **实时订阅：** Firestore 原生实时监听（snapshots）
- **存储：** Cloud Storage for Firebase
- **Cloud Functions：** Node.js / Python（Google Cloud Functions）
- **API：** SDK 驱动，无自动 REST（需 Functions 暴露）
- **安全规则：** 自定义规则语言（非 SQL 标准）
- **闭源：** Google 托管，不可自托管
- **生态：** 与 Google Cloud 深度集成（Analytics、AdMob、Crashlytics 等）
- **定价：** 免费层（Spark），按用量计费（Blaze）

## 核心对比

| 维度 | Supabase | Firebase |
|------|----------|----------|
| 数据库 | PostgreSQL (SQL) | Firestore (NoSQL) |
| 自托管 | 支持 | 不支持 |
| 实时 | PostgreSQL Realtime | Firestore Snapshots |
| 安全模型 | RLS (SQL) | 规则语言 (JSON) |
| 函数运行时 | Deno/TypeScript | Node.js/Python |
| 自动 REST API | PostgREST | 需手动建 |
| 关系查询 | SQL JOIN 原生支持 | 有限（需手动归一化） |
| 生态深度 | 独立项目 | Google Cloud 全家桶 |
| 迁移成本 | 低（标准 SQL） | 高（绑定 Google 生态） |

## 选型建议

- **选 Supabase：** 需要关系型数据、复杂查询、数据可控性、自托管、标准 SQL
- **选 Firebase：** 已在 Google 生态、需要快速原型、离线优先、简单文档存储