---
id: cmpyz15c4000clm53hiu8uc8d
title: "Supabase vs Firebase"
type: concept
tags:
  - ["grahify-kb"]
created: 2026-06-04T04:04:18.629Z
updated: 2026-06-04T04:04:18.629Z
---

1|---
     2|source_type: manual
     3|date: 2026-05-07
     4|topic: Supabase vs Firebase
     5|tags: [supabase, firebase, BaaS, database, backend, comparison]
     6|---
     7|
     8|# Supabase vs Firebase
     9|
    10|## Supabase
    11|
    12|- **定位：** 开源 Firebase 替代品
    13|- **数据库：** PostgreSQL（完整 SQL 支持）
    14|- **认证：** 邮箱/密码、OAuth（Google/GitHub 等）、手机号、Magic Link
    15|- **实时订阅：** 基于 PostgreSQL WAL 的 Realtime
    16|- **存储：** S3 兼容的 Object Storage
    17|- **Edge Functions：** Deno 运行时，TypeScript 原生
    18|- **API：** 自动生成 REST（PostgREST）和 GraphQL
    19|- **Row Level Security (RLS)：** PostgreSQL 原生行级安全策略
    20|- **开源：** 可自托管，社区活跃
    21|- **定价：** 免费层 generous（500MB 数据库、1GB 存储、5GB 带宽）
    22|
    23|## Firebase
    24|
    25|- **定位：** Google 的 BaaS 平台
    26|- **数据库：** Firestore（NoSQL 文档型）/ Realtime Database（JSON 树）
    27|- **认证：** 邮箱/密码、OAuth、手机号、匿名、自定义 token
    28|- **实时订阅：** Firestore 原生实时监听（snapshots）
    29|- **存储：** Cloud Storage for Firebase
    30|- **Cloud Functions：** Node.js / Python（Google Cloud Functions）
    31|- **API：** SDK 驱动，无自动 REST（需 Functions 暴露）
    32|- **安全规则：** 自定义规则语言（非 SQL 标准）
    33|- **闭源：** Google 托管，不可自托管
    34|- **生态：** 与 Google Cloud 深度集成（Analytics、AdMob、Crashlytics 等）
    35|- **定价：** 免费层（Spark），按用量计费（Blaze）
    36|
    37|## 核心对比
    38|
    39|| 维度 | Supabase | Firebase |
    40||------|----------|----------|
    41|| 数据库 | PostgreSQL (SQL) | Firestore (NoSQL) |
    42|| 自托管 | 支持 | 不支持 |
    43|| 实时 | PostgreSQL Realtime | Firestore Snapshots |
    44|| 安全模型 | RLS (SQL) | 规则语言 (JSON) |
    45|| 函数运行时 | Deno/TypeScript | Node.js/Python |
    46|| 自动 REST API | PostgREST | 需手动建 |
    47|| 关系查询 | SQL JOIN 原生支持 | 有限（需手动归一化） |
    48|| 生态深度 | 独立项目 | Google Cloud 全家桶 |
    49|| 迁移成本 | 低（标准 SQL） | 高（绑定 Google 生态） |
    50|
    51|## 选型建议
    52|
    53|- **选 Supabase：** 需要关系型数据、复杂查询、数据可控性、自托管、标准 SQL
    54|- **选 Firebase：** 已在 Google 生态、需要快速原型、离线优先、简单文档存储
    55|