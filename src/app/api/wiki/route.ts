import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFileSync, unlinkSync } from 'fs'
import { resolve } from 'path'

const CONTENT_DIR = resolve(process.cwd(), 'wiki-content')

// Helper: parse JSON array string safely
function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Sync a single page to its .md file
function syncToMd(page: { id: string; title: string; content: string; pageType: string; tags: string; createdAt: Date | string; updatedAt: Date | string }) {
  const slug = slugify(page.title)
  const filePath = resolve(CONTENT_DIR, `${slug}.md`)

  const tagsStr = (() => {
    try {
      const arr = JSON.parse(page.tags)
      return arr.map((t: string) => `  - ${t}`).join('\n')
    } catch {
      return `  - ${page.tags}`
    }
  })()

  const frontmatter = [
    `---`,
    `id: ${page.id}`,
    `title: ${page.title}`,
    `type: ${page.pageType}`,
    `tags:`,
    tagsStr,
    `created: ${new Date(page.createdAt).toISOString()}`,
    `updated: ${new Date(page.updatedAt).toISOString()}`,
    `---`,
  ].join('\n')

  writeFileSync(filePath, `${frontmatter}\n\n${page.content}`, 'utf-8')
  return slug
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s（）()【】[\]]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled'
}

function deleteMdFile(title: string) {
  const slug = slugify(title)
  const filePath = resolve(CONTENT_DIR, `${slug}.md`)
  try { unlinkSync(filePath) } catch { /* ignore if not exists */ }
}

// GET /api/wiki — Return all wiki pages ordered by updatedAt desc
export async function GET() {
  try {
    const pages = await db.wikiPage.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        source: {
          select: { id: true, title: true },
        },
      },
    })

    const parsed = pages.map((page) => ({
      ...page,
      tags: parseJsonArray(page.tags),
      backlinks: parseJsonArray(page.backlinks),
    }))

    return NextResponse.json({ pages: parsed })
  } catch (error) {
    console.error('Error fetching wiki pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wiki pages' },
      { status: 500 }
    )
  }
}

// POST /api/wiki — Create a new wiki page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, pageType, tags } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const page = await db.wikiPage.create({
      data: {
        title,
        content,
        pageType: pageType || 'concept',
        tags: JSON.stringify(tags || []),
        backlinks: '[]',
      },
    })

    // Sync to .md file (fire-and-forget)
    try {
      syncToMd(page)
      console.log(`[sync] Created .md for: ${title}`)
    } catch (err) {
      console.error(`[sync] Failed to write .md for ${title}:`, err)
    }

    // Log the activity
    await db.activityLog.create({
      data: {
        actionType: 'create',
        summary: `Created page: ${title}`,
        relatedPages: JSON.stringify([page.id]),
        pageId: page.id,
      },
    })

    return NextResponse.json(
      {
        ...page,
        tags: parseJsonArray(page.tags),
        backlinks: parseJsonArray(page.backlinks),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating wiki page:', error)
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    )
  }
}
