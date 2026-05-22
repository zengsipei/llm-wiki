#!/usr/bin/env node
// fix-grahify-titles.mjs — 修复 grahify-kb 摄入文件的标题
// 问题是双层 frontmatter 中内层有行号前缀，导致解析失败
// 修复方式：从 topic 字段或 body 的 # heading 中提取标题

import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

const prisma = new PrismaClient()
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content')

// Fix titles in wiki-content .md files
function fixTitles() {
  const files = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('README'))
    .sort()

  const fixes = []

  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file)
    const raw = readFileSync(filePath, 'utf-8')

    // Parse frontmatter
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) continue

    const yaml = match[1]
    const body = match[2]

    // Extract current title
    const titleMatch = yaml.match(/^title:\s*"?([^"\n]+)"?\s*$/m)
    if (!titleMatch) continue

    const currentTitle = titleMatch[1].trim()

    // Skip if title looks good (not a date-filename pattern)
    if (!/^\d{4}-\d{2}-\d{2}-/.test(currentTitle) && currentTitle.length > 5) continue

    // Try to extract title from body
    // First: look for a # heading in body (after stripping line number prefixes)
    const bodyClean = body.replace(/^\s*\d+\|/gm, '')
    const headingMatch = bodyClean.match(/^#\s+(.+)$/m)

    // Second: look for topic in the body (original grahify-kb metadata)
    const topicMatch = bodyClean.match(/topic:\s*(.+)/)

    let newTitle = headingMatch
      ? headingMatch[1].trim()
      : topicMatch
        ? topicMatch[1].trim()
        : null

    if (!newTitle || newTitle === currentTitle) continue

    // Update the .md file
    const newYaml = yaml.replace(
      /^title:\s*".*?"$/m,
      `title: "${newTitle}"`
    )
    writeFileSync(filePath, `---\n${newYaml}\n---\n${body}`, 'utf-8')

    fixes.push({ file, oldTitle: currentTitle, newTitle })
    console.log(`  [fix] "${currentTitle}" → "${newTitle}"`)
  }

  return fixes
}

// Update database titles to match .md files
async function syncDbTitles() {
  const pages = await prisma.wikiPage.findMany({
    where: {
      OR: [
        { title: { startsWith: '2026-05-05-' } },
        { title: { startsWith: '2026-05-06-' } },
        { title: { startsWith: '2026-05-07-' } },
        { title: { startsWith: '2026-05-14-' } },
        { title: 'grill-me-skill' },
        { title: { startsWith: 'rtk-' } },
        { title: { startsWith: 'mindfold-' } },
        { title: { startsWith: 'Hermes Agent' } },
      ],
    },
  })

  for (const page of pages) {
    // Find corresponding .md file
    const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const raw = readFileSync(resolve(CONTENT_DIR, file), 'utf-8')
      const idMatch = raw.match(/^id:\s*([a-f0-9-]+)\s*$/m)
      if (idMatch && idMatch[1] === page.id) {
        const titleMatch = raw.match(/^title:\s*"?([^"\n]+)"?\s*$/m)
        if (titleMatch && titleMatch[1].trim() !== page.title) {
          const newTitle = titleMatch[1].trim()
          await prisma.wikiPage.update({
            where: { id: page.id },
            data: { title: newTitle },
          })
          console.log(`  [db] "${page.title}" → "${newTitle}"`)
        }
        break
      }
    }
  }
}

async function main() {
  console.log('[fix] Checking grahify-kb article titles...\n')

  console.log('--- Fixing .md file titles ---')
  const fixes = fixTitles()
  console.log(`\n[fix] Fixed ${fixes.length} titles in .md files`)

  console.log('\n--- Syncing database titles ---')
  await syncDbTitles()

  console.log(`\n[fix] Total pages in DB: ${await prisma.wikiPage.count()}`)
}

main()
  .catch(err => { console.error('[fix] Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
