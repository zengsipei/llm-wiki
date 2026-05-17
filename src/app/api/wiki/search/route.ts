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

// GET /api/wiki/search?q=term — Search wiki pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      )
    }

    const pages = await db.wikiPage.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
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

    return NextResponse.json({ pages: parsed, total: parsed.length })
  } catch (error) {
    console.error('Error searching wiki pages:', error)
    return NextResponse.json(
      { error: 'Failed to search wiki pages' },
      { status: 500 }
    )
  }
}
