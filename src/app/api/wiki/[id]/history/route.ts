import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, extname } from 'path'

// GET /api/wiki/[id]/history — Get Git commit history for a wiki page's .md file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Resolve page ID to .md filename via the database
    const { db } = await import('@/lib/db')
    const page = await db.wikiPage.findUnique({ where: { id } })
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const slug = page.title
      .toLowerCase()
      .replace(/[\s（）()【】[\]]+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80) || 'untitled'

    const mdPath = resolve(process.cwd(), `wiki-content/${slug}.md`)
    if (!existsSync(mdPath)) {
      return NextResponse.json({ error: 'Markdown file not found', slug }, { status: 404 })
    }

    // Check if git is available
    const projectRoot = process.cwd()
    const gitDir = resolve(projectRoot, '.git')
    if (!existsSync(gitDir)) {
      return NextResponse.json({ error: 'Not a Git repository' }, { status: 500 })
    }

    // Get git log for this file
    const logFormat = '%H|%an|%ae|%at|%s' // hash, author name, email, timestamp, subject
    const relPath = `wiki-content/${slug}.md`

    const gitLog = execSync(
      `git log --format="${logFormat}" --follow -- "${relPath}" 2>/dev/null || echo ""`,
      { cwd: projectRoot, encoding: 'utf-8', timeout: 10000 }
    ).trim()

    if (!gitLog) {
      return NextResponse.json({
        pageId: id,
        pageTitle: page.title,
        slug,
        commits: [],
      })
    }

    const commits = gitLog.split('\n').map(line => {
      const [hash, author, email, timestamp, subject] = line.split('|')
      return {
        hash: hash?.substring(0, 8) || '',
        fullHash: hash || '',
        author: author || '',
        email: email || '',
        date: timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : '',
        message: subject || '',
      }
    }).filter(c => c.hash)

    return NextResponse.json({
      pageId: id,
      pageTitle: page.title,
      slug,
      commitCount: commits.length,
      commits,
    })
  } catch (error) {
    console.error('Error getting page history:', error)
    return NextResponse.json(
      { error: 'Failed to get page history' },
      { status: 500 }
    )
  }
}
