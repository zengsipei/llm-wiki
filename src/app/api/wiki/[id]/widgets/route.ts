import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFileSync, readFileSync, readdirSync, mkdirSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { aiComplete } from '@/lib/ai-provider'

const WIDGETS_DIR = resolve(process.cwd(), 'wiki-content', 'widgets')

/**
 * Extract HTML from AI response, handling various wrapping formats:
 * - ```html ... ```
 * - ``` ... ```
 * - Text before/after the HTML
 * - Multiple code blocks (pick the one with <!DOCTYPE or <html)
 */
function extractHtml(raw: string): string | null {
  let text = raw.trim()

  // 1. Remove ALL markdown code fences (```...```)
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()

  // 2. Try to find <!DOCTYPE or <html tag and extract from there
  const doctypeIdx = text.search(/<!doctype\s+html/i)
  const htmlIdx = text.search(/<html[\s>]/i)

  let startIdx = -1
  if (doctypeIdx >= 0 && htmlIdx >= 0) {
    startIdx = Math.min(doctypeIdx, htmlIdx)
  } else if (doctypeIdx >= 0) {
    startIdx = doctypeIdx
  } else if (htmlIdx >= 0) {
    startIdx = htmlIdx
  }

  if (startIdx > 0) {
    text = text.substring(startIdx)
  }

  // 3. Validate we now have something HTML-like
  if (!text.match(/^\s*<!doctype/i) && !text.match(/^\s*<html/i)) {
    return null
  }

  return text.trim()
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

const WIDGET_SYSTEM_PROMPT = `You are an expert at creating interactive HTML knowledge widgets. Given a wiki page's content, you create a single self-contained HTML file that serves as an interactive visualization or demo.

RULES:
1. The output must be a COMPLETE, VALID HTML file (with <!DOCTYPE html>, <html>, <head>, <body>).
2. All CSS must be inline (in <style> tags) and all JS must be inline (in <script> tags).
3. The widget should be interactive — use buttons, sliders, drag-drop, animations, or user input.
4. Design for a 400-500px wide container; use modern CSS (flexbox, grid, transitions).
5. Use Chinese for all UI text since the wiki is in Chinese.
6. Make it visually appealing with good typography, colors, and spacing.
7. The widget must directly illustrate the core concept(s) of the page.
8. Do NOT use any external CDN or resource. Everything must be self-contained.
9. Add a subtle header with the widget title.
10. Do NOT include any explanation outside the HTML. Return ONLY the HTML code.

TYPES OF WIDGETS (pick the best fit):
- For concepts/methodologies: Interactive step-by-step flows, comparison tables with toggles
- For technical topics: Live code playgrounds, API visualizers, architecture diagrams
- For data/research: Interactive charts, sortable/filterable data tables
- For tutorials: Interactive quizzes, step-by-step guides with progress
- For AI/ML topics: Prompt testers, token visualizers, embedding space explorers

OUTPUT: Return ONLY the HTML code. No markdown fences, no explanation.`

// POST /api/wiki/[id]/widgets — Generate a widget for a wiki page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { hint } = body || {}

    // Fetch the page
    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Call AI to generate the widget
    const userPrompt = hint
      ? `Based on this wiki page, create an interactive HTML widget. Focus on: ${hint}\n\nPage title: ${page.title}\nPage type: ${page.pageType}\nTags: ${page.tags}\n\nContent:\n${page.content}`
      : `Based on this wiki page, create an interactive HTML widget.\n\nPage title: ${page.title}\nPage type: ${page.pageType}\nTags: ${page.tags}\n\nContent:\n${page.content}`

    const { content: rawHtml } = await aiComplete([
      { role: 'system', content: WIDGET_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.7 })

    // Clean up and extract HTML from AI response
    const html = extractHtml(rawHtml)

    if (!html) {
      console.error('[widget] Failed to extract valid HTML. Raw length:', rawHtml.length, 'Preview:', rawHtml.substring(0, 300))
      return NextResponse.json(
        { error: 'Widget generation failed: AI returned invalid content', rawPreview: rawHtml.substring(0, 200) },
        { status: 500 }
      )
    }

    // Save to file
    try {
      mkdirSync(WIDGETS_DIR, { recursive: true })
    } catch { /* exists */ }

    const slug = slugify(page.title)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const filePath = resolve(WIDGETS_DIR, `${slug}-${timestamp}.html`)

    // Add widget metadata as a comment
    const metadata = `<!-- Wiki Widget | Page: ${page.title} | Page ID: ${page.id} | Generated: ${new Date().toISOString()} -->\n`
    writeFileSync(filePath, metadata + html, 'utf-8')

    // Log activity
    await db.activityLog.create({
      data: {
        actionType: 'create',
        summary: `Generated widget for page: ${page.title}`,
        relatedPages: JSON.stringify([page.id]),
        pageId: page.id,
      },
    })

    const widgetFilename = `${slug}-${timestamp}.html`

    return NextResponse.json({
      message: 'Widget generated successfully',
      widget: {
        filename: widgetFilename,
        url: `/api/wiki/${id}/widgets/${widgetFilename}`,
        pageId: page.id,
        pageTitle: page.title,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating widget:', error)
    return NextResponse.json(
      { error: 'Failed to generate widget' },
      { status: 500 }
    )
  }
}

// GET /api/wiki/[id]/widgets — List and serve widgets for a page
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch the page to get the slug
    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const slug = slugify(page.title)

    // Find all widget files for this page
    let widgetFiles: string[] = []
    try {
      mkdirSync(WIDGETS_DIR, { recursive: true })
      const allFiles = readdirSync(WIDGETS_DIR)
        .filter(f => f.endsWith('.html'))
        .sort()
        .reverse()
      widgetFiles = allFiles.filter(f => f.startsWith(slug + '-'))
    } catch {
      // directory doesn't exist yet
    }

    const widgets = widgetFiles.map(filename => {
      // Extract timestamp from filename
      const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.html$/)
      const generatedAt = match ? match[2].replace(/-/g, (c, i) => i === 4 || i === 7 ? '-' : (i === 10 ? 'T' : ':')).replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') : ''
      return {
        filename,
        url: `/api/wiki/${id}/widgets/${filename}`,
        generatedAt,
      }
    })

    return NextResponse.json({ widgets, pageId: id, pageTitle: page.title })
  } catch (error) {
    console.error('Error listing widgets:', error)
    return NextResponse.json(
      { error: 'Failed to list widgets' },
      { status: 500 }
    )
  }
}
