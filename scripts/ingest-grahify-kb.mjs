#!/usr/bin/env node
// ingest-grahify-kb.mjs — 摄入 grahify-kb/raw/articles/ 下的原始文件到 Wiki
// Usage: node scripts/ingest-grahify-kb.mjs
//
// 读取 /tmp/grahify-kb/raw/articles/*.md，解析双层 frontmatter，
// 转换为 wiki-content 格式（单层 frontmatter + 纯 Markdown body），
// 同时写入 .md 文件和数据库。

import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()
const RAW_DIR = '/tmp/grahify-kb/raw/articles'
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content')

// Parse the outer frontmatter (grahify-kb metadata)
function parseOuterFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { outerMeta: {}, remaining: content }

  const yaml = match[1]
  const remaining = match[2]
  const meta = {}

  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (kvMatch) {
      meta[kvMatch[1].toLowerCase()] = kvMatch[2].trim()
    }
  }

  return { outerMeta: meta, remaining }
}

// Parse the inner frontmatter (actual article metadata)
function parseInnerFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const yaml = match[1]
  const body = match[2]
  const meta = {}

  let currentKey = null
  let inList = false
  let listItems = []

  for (const line of yaml.split('\n')) {
    if (/^\s{2}-\s+/.test(line)) {
      inList = true
      listItems.push(line.replace(/^\s{2}-\s+/, '').trim())
      continue
    }

    if (inList && currentKey) {
      meta[currentKey] = listItems
      listItems = []
      inList = false
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase()
      let value = kvMatch[2].trim()
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      meta[key] = value
      currentKey = key
    }
  }

  if (inList && currentKey) {
    meta[currentKey] = listItems
  }

  return { meta, body: body.trim() }
}

// Extract title from body (first # heading)
function extractTitleFromBody(body) {
  const match = body.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

// Generate wiki-content slug from title
function titleToSlug(title) {
  return title
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

// Deduplicate: skip if wiki-content already has a file with same title
function getExistingTitles() {
  const files = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('README'))
  const titles = new Set()
  for (const file of files) {
    try {
      const raw = readFileSync(resolve(CONTENT_DIR, file), 'utf-8')
      const match = raw.match(/^---\n[\s\S]*?\ntitle:\s*"?([^"\n]+)"?\n[\s\S]*?\n---/)
      if (match) titles.add(match[1].trim())
    } catch {}
  }
  return titles
}

async function main() {
  const files = readdirSync(RAW_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()

  if (files.length === 0) {
    console.log('[ingest] No .md files found in raw/articles/')
    return
  }

  console.log(`[ingest] Found ${files.length} articles in grahify-kb/raw/articles/`)

  const existingTitles = getExistingTitles()
  console.log(`[ingest] Existing wiki titles: ${existingTitles.size}`)

  let created = 0
  let skipped = 0

  for (const file of files) {
    const raw = readFileSync(resolve(RAW_DIR, file), 'utf-8')

    // Step 1: Parse outer grahify-kb frontmatter
    const { outerMeta, remaining } = parseOuterFrontmatter(raw)

    // Step 2: Parse inner article frontmatter
    const { meta, body } = parseInnerFrontmatter(remaining)

    // Step 3: Determine title
    const title = meta.title || extractTitleFromBody(body) || file.replace('.md', '')

    // Skip if already exists
    if (existingTitles.has(title)) {
      console.log(`  [skip] "${title}" — already exists in wiki`)
      skipped++
      continue
    }

    // Step 4: Determine metadata
    const date = meta.date || outerMeta.ingested || file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '2026-05-05'
    const pageType = 'concept'
    const tags = Array.isArray(meta.tags) ? meta.tags : []
    const source = meta.source_type || meta.source || 'grahify-kb'
    const topic = meta.topic || ''

    // Add source tag if not present
    if (!tags.includes('grahify-kb') && !tags.includes('grahify-kb')) {
      tags.push('grahify-kb')
    }

    // Step 5: Generate wiki-content .md file
    const pageId = randomUUID()
    const slug = titleToSlug(title)
    const mdContent = `---
id: ${pageId}
title: "${title}"
type: ${pageType}
tags: [${tags.map(t => `"${t}"`).join(', ')}]
created: ${date}
updated: ${date}
source: ${source}
---

${body}`

    const mdPath = resolve(CONTENT_DIR, `${slug}.md`)
    writeFileSync(mdPath, mdContent, 'utf-8')
    existingTitles.add(title)

    // Step 6: Write to database
    await prisma.wikiPage.create({
      data: {
        id: pageId,
        title,
        content: body,
        pageType,
        tags: JSON.stringify(tags),
        backlinks: '[]',
      },
    })

    // Step 7: Log activity
    await prisma.activityLog.create({
      data: {
        actionType: 'ingest',
        summary: `摄入 grahify-kb 文章: ${title}`,
        relatedPages: JSON.stringify([pageId]),
      },
    })

    created++
    console.log(`  [created] "${title}" → ${slug}.md`)
  }

  console.log(`\n[ingest] Done: ${created} created, ${skipped} skipped`)
  console.log(`[ingest] Total pages in DB: ${await prisma.wikiPage.count()}`)
}

main()
  .catch(err => { console.error('[ingest] Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
