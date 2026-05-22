#!/usr/bin/env node
// sync-from-md.mjs — Rebuild SQLite database from wiki-content/*.md files
// Usage: node scripts/sync-from-md.mjs [--force]
//
// This script reads all .md files from wiki-content/, parses their YAML frontmatter,
// and upserts them into the Prisma database. It's the "recovery" tool — if the
// database is lost or corrupted, just run this to rebuild from the Git-tracked .md files.
//
// Flags:
//   --force  Drop all existing WikiPage records before syncing (clean rebuild)

import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { resolve, extname } from 'path'

const prisma = new PrismaClient()
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content')

// Parse YAML frontmatter from a markdown file
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }

  const yaml = match[1]
  const body = match[2]

  const meta = {}
  let currentKey = null
  let inList = false
  let listItems = []

  for (const line of yaml.split('\n')) {
    // List item (starts with "  - ")
    if (/^\s{2}-\s+/.test(line)) {
      inList = true
      listItems.push(line.replace(/^\s{2}-\s+/, '').trim())
      continue
    }

    // End of list — flush
    if (inList && currentKey) {
      meta[currentKey] = listItems
      listItems = []
      inList = false
    }

    // Key: value
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (kvMatch) {
      const key = kvMatch[1].toLowerCase()
      let value = kvMatch[2].trim()
      // Strip quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      meta[key] = value
      currentKey = key
    }
  }

  // Flush remaining list
  if (inList && currentKey) {
    meta[currentKey] = listItems
  }

  return { meta, body: body.trim() }
}

async function main() {
  const forceMode = process.argv.includes('--force')

  if (forceMode) {
    console.log('[sync] Force mode: dropping all existing WikiPage records...')
    await prisma.activityLog.deleteMany()
    await prisma.wikiPage.deleteMany()
    await prisma.source.deleteMany()
    console.log('[sync] Database cleared.')
  }

  // Read all .md files
  const files = readdirSync(CONTENT_DIR)
    .filter(f => extname(f) === '.md' && !f.startsWith('README'))
    .sort()

  if (files.length === 0) {
    console.log('[sync] No .md files found in wiki-content/')
    return
  }

  console.log(`[sync] Found ${files.length} .md files`)

  let created = 0
  let updated = 0
  let skipped = 0

  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file)
    const raw = readFileSync(filePath, 'utf-8')
    const { meta, body } = parseFrontmatter(raw)

    const title = meta.title || file.replace('.md', '')
    const pageType = meta.type || 'concept'
    const tags = Array.isArray(meta.tags) ? meta.tags : []
    const pageId = meta.id || null

    // Check if page already exists (by id or title)
    let existing = null
    if (pageId) {
      existing = await prisma.wikiPage.findUnique({ where: { id: pageId } })
    }
    if (!existing) {
      existing = await prisma.wikiPage.findFirst({ where: { title } })
    }

    if (existing) {
      // Update existing page
      await prisma.wikiPage.update({
        where: { id: existing.id },
        data: {
          title,
          content: body,
          pageType,
          tags: JSON.stringify(tags),
          backlinks: JSON.stringify(existing.backlinks ? JSON.parse(existing.backlinks) : []),
        },
      })
      updated++
      console.log(`  [updated] ${title}`)
    } else {
      // Create new page
      await prisma.wikiPage.create({
        data: {
          id: pageId || undefined,
          title,
          content: body,
          pageType,
          tags: JSON.stringify(tags),
          backlinks: '[]',
        },
      })
      created++
      console.log(`  [created] ${title}`)
    }
  }

  console.log(`\n[sync] Done: ${created} created, ${updated} updated, ${skipped} skipped`)
  console.log(`[sync] Total pages in DB: ${await prisma.wikiPage.count()}`)
}

main()
  .catch(err => { console.error('[sync] Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
