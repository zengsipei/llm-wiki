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
// Helper: format a page response with parsed JSON fields
function formatPage(page: Record<string, unknown>) {
  return {
    ...page,
    tags: parseJsonArray(page.tags as string),
    backlinks: parseJsonArray(page.backlinks as string),
  }
}

// GET /api/wiki/[id] — Return a single wiki page by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const page = await db.wikiPage.findUnique({
      where: { id },
      include: {
        source: {
          select: { id: true, title: true, sourceType: true },
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ page: formatPage(page as unknown as Record<string, unknown>) })
  } catch (error) {
    console.error('Error fetching wiki page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wiki page' },
      { status: 500 }
    )
  }
}

// PUT /api/wiki/[id] — Update a wiki page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, pageType, tags } = body

    // Check page exists
    const existing = await db.wikiPage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    const updateData: {
      title?: string
      content?: string
      pageType?: string
      tags?: string
    } = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (pageType !== undefined) updateData.pageType = pageType
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)

    const page = await db.wikiPage.update({
      where: { id },
      data: updateData,
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        actionType: 'edit',
        summary: `Updated page: ${page.title}`,
        relatedPages: JSON.stringify([page.id]),
        pageId: page.id,
      },
    })

    return NextResponse.json({ page: formatPage(page as unknown as Record<string, unknown>) })
  } catch (error) {
    console.error('Error updating wiki page:', error)
    return NextResponse.json(
      { error: 'Failed to update wiki page' },
      { status: 500 }
    )
  }
}

// DELETE /api/wiki/[id] — Delete a wiki page
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    await db.wikiPage.delete({ where: { id } })

    // Log the activity
    await db.activityLog.create({
      data: {
        actionType: 'delete',
        summary: `Deleted page: ${page.title}`,
        relatedPages: JSON.stringify([page.id]),
      },
    })

    return NextResponse.json({ message: 'Page deleted successfully' })
  } catch (error) {
    console.error('Error deleting wiki page:', error)
    return NextResponse.json(
      { error: 'Failed to delete wiki page' },
      { status: 500 }
    )
  }
}
