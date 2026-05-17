import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: parse JSON array string safely
function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
