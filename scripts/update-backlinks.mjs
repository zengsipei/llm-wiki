import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'

const prisma = new PrismaClient()
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content')

// Extract [[wiki-links]] from markdown content
function extractWikiLinks(content) {
  const links = []
  const regex = /\[\[([^\]]+)\]\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim())
  }
  return links
}

async function main() {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
  
  // Build title → id map from DB
  const dbPages = await prisma.wikiPage.findMany({
    select: { id: true, title: true }
  })
  const titleToId = {}
  dbPages.forEach(p => { titleToId[p.title] = p.id })
  
  // Parse all pages from files
  const filePages = []
  for (const f of files) {
    const content = readFileSync(resolve(CONTENT_DIR, f), 'utf8')
    const titleMatch = content.match(/^title:\s*(.+)$/m)
    const idMatch = content.match(/^id:\s*(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : ''
    const id = idMatch ? idMatch[1].trim() : ''
    if (!title || !id) continue
    const linkedTitles = extractWikiLinks(content)
    filePages.push({ id, title, linkedTitles })
  }
  
  // Build backlinks: for each page, collect IDs of pages that link to it
  const backlinksMap = {} // pageId → [pageId, ...]
  for (const fp of filePages) {
    for (const linkedTitle of fp.linkedTitles) {
      const targetId = titleToId[linkedTitle] || titleToId[linkedTitle.replace(/ — /g, ' - ')]
      if (targetId && targetId !== fp.id) {
        if (!backlinksMap[targetId]) backlinksMap[targetId] = []
        if (!backlinksMap[targetId].includes(fp.id)) {
          backlinksMap[targetId].push(fp.id)
        }
      }
    }
  }
  
  // Update DB
  let updated = 0
  for (const [pageId, backlinkIds] of Object.entries(backlinksMap)) {
    await prisma.wikiPage.update({
      where: { id: pageId },
      data: { backlinks: JSON.stringify(backlinkIds) }
    })
    updated++
  }
  
  console.log(`Updated backlinks for ${updated} pages`)
  console.log(`Total pages with backlinks: ${Object.keys(backlinksMap).length}/${dbPages.length}`)
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
