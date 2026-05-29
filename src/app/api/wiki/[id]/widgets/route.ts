import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFileSync, readFileSync, readdirSync, mkdirSync, unlinkSync, existsSync } from 'fs'
import { resolve } from 'path'
import { aiComplete } from '@/lib/ai-provider'

const WIDGETS_DIR = resolve(process.cwd(), 'wiki-content', 'widgets')

// ============ In-memory task tracking ============
interface WidgetTask {
  status: 'pending' | 'generating' | 'done' | 'error'
  progress?: string
  widget?: { filename: string; url: string; generatedAt: string }
  error?: string
  createdAt: number
}

const tasks = new Map<string, WidgetTask>()

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Extract HTML from AI response, handling various wrapping formats.
 */
function extractHtml(raw: string): string | null {
  let text = raw.trim()

  // 1. Remove ALL markdown code fences
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

  // 3. Standard case
  if (text.match(/^\s*<!doctype/i) || text.match(/^\s*<html/i)) {
    return text.trim()
  }

  // 4. Fallback: HTML fragment — wrap in template
  const hasSubstantialHtml = /<(body|div|section|main|style|script|table|form|canvas|svg)[\s>]/i.test(text)
  if (hasSubstantialHtml) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${text}
</body>
</html>`.trim()
  }

  // 5. Last resort
  const headIdx = text.search(/<head[\s>]/i)
  const bodyIdx = text.search(/<body[\s>]/i)
  if (headIdx > 0 || bodyIdx > 0) {
    const extractFrom = headIdx > 0 && bodyIdx > 0 ? Math.min(headIdx, bodyIdx) : Math.max(headIdx, bodyIdx)
    const fragment = text.substring(extractFrom)
    if (/<\/html>/i.test(text)) {
      const endIdx = text.search(/<\/html>/i) + '</html>'.length
      return text.substring(extractFrom, endIdx).trim()
    }
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${fragment}
</body>
</html>`.trim()
  }

  return null
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

/**
 * Background task: generate widget (fire-and-forget from the request)
 */
async function runWidgetGeneration(taskId: string, pageId: string, hint: string) {
  const task = tasks.get(taskId)
  if (!task) return

  try {
    task.status = 'generating'
    task.progress = '正在分析页面内容...'

    const page = await db.wikiPage.findUnique({ where: { id: pageId } })
    if (!page) {
      task.status = 'error'
      task.error = 'Page not found'
      return
    }

    task.progress = '正在设计交互组件...'

    const userPrompt = hint
      ? `Based on this wiki page, create an interactive HTML widget. Focus on: ${hint}\n\nPage title: ${page.title}\nPage type: ${page.pageType}\nTags: ${page.tags}\n\nContent:\n${page.content}`
      : `Based on this wiki page, create an interactive HTML widget.\n\nPage title: ${page.title}\nPage type: ${page.pageType}\nTags: ${page.tags}\n\nContent:\n${page.content}`

    task.progress = '正在生成 HTML 代码...'

    const { content: rawHtml } = await aiComplete([
      { role: 'system', content: WIDGET_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.7 })

    const html = extractHtml(rawHtml)

    if (!html) {
      task.status = 'error'
      task.error = 'AI 返回的内容无法解析为有效 HTML'
      return
    }

    // Save to file
    try { mkdirSync(WIDGETS_DIR, { recursive: true }) } catch { /* exists */ }

    const slug = slugify(page.title)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const filePath = resolve(WIDGETS_DIR, `${slug}-${timestamp}.html`)

    const metadata = `<!-- Wiki Widget | Page: ${page.title} | Page ID: ${page.id} | Generated: ${new Date().toISOString()} -->\n`
    writeFileSync(filePath, metadata + html, 'utf-8')

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          actionType: 'create',
          summary: `Generated widget for page: ${page.title}`,
          relatedPages: JSON.stringify([page.id]),
          pageId: page.id,
        },
      })
    } catch { /* non-critical */ }

    const widgetFilename = `${slug}-${timestamp}.html`
    task.status = 'done'
    task.widget = {
      filename: widgetFilename,
      url: `/api/wiki/${pageId}/widgets/${widgetFilename}`,
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    task.status = 'error'
    task.error = error instanceof Error ? error.message : '生成失败'
  }
}

// Clean up old tasks (older than 5 minutes)
function cleanOldTasks() {
  const now = Date.now()
  for (const [id, task] of tasks) {
    if (now - task.createdAt > 5 * 60 * 1000) {
      tasks.delete(id)
    }
  }
}

// POST /api/wiki/[id]/widgets — Start async widget generation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  cleanOldTasks()

  try {
    const { id } = await params
    const body = await request.json()
    const { hint } = body || {}

    // Quick check: page exists?
    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Create task and start background generation
    const taskId = generateTaskId()
    tasks.set(taskId, {
      status: 'pending',
      progress: '准备中...',
      createdAt: Date.now(),
    })

    // Fire-and-forget: don't await
    runWidgetGeneration(taskId, id, hint?.trim() || '').catch(() => {})

    // Return immediately with task ID
    return NextResponse.json({
      message: 'Widget generation started',
      taskId,
    })
  } catch (error) {
    console.error('Error starting widget generation:', error)
    return NextResponse.json(
      { error: 'Failed to start widget generation' },
      { status: 500 }
    )
  }
}

// GET /api/wiki/[id]/widgets — List widgets, or poll task status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  cleanOldTasks()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task')

    // If task ID is provided, return task status
    if (taskId) {
      const task = tasks.get(taskId)
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json({ task })
    }

    // Otherwise, list widgets for the page
    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const slug = slugify(page.title)

    let widgetFiles: string[] = []
    try {
      mkdirSync(WIDGETS_DIR, { recursive: true })
      const allFiles = readdirSync(WIDGETS_DIR)
        .filter(f => f.endsWith('.html'))
        .sort()
        .reverse()
      widgetFiles = allFiles.filter(f => f.startsWith(slug + '-'))
    } catch { /* no dir yet */ }

    const widgets = widgetFiles.map(filename => {
      const match = filename.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.html$/)
      const generatedAt = match ? match[2].replace(/-/g, (_c, i) => i === 4 || i === 7 ? '-' : (i === 10 ? 'T' : ':')).replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') : ''
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
