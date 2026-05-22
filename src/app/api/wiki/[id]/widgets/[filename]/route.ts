import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const WIDGETS_DIR = resolve(process.cwd(), 'wiki-content', 'widgets')

// GET /api/wiki/[id]/widgets/[filename] — Serve a widget HTML file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { filename } = await params

    // Security: only allow .html files, no path traversal
    if (!filename.endsWith('.html') || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const filePath = resolve(WIDGETS_DIR, filename)

    // Ensure the resolved path is within WIDGETS_DIR
    if (!filePath.startsWith(WIDGETS_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    const html = readFileSync(filePath, 'utf-8')

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error serving widget:', error)
    return NextResponse.json(
      { error: 'Failed to serve widget' },
      { status: 500 }
    )
  }
}
