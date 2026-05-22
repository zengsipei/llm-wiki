import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import ZAI from 'z-ai-web-dev-sdk'

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

const INGEST_SYSTEM_PROMPT = `You are an expert knowledge management assistant. Your job is to analyze documents and extract structured wiki pages from them.

Given a document, you must:
1. Identify the main topics, key entities (people, organizations, technologies, places), and important concepts.
2. Create wiki pages for each significant topic found. Each page should have:
   - A clear, concise title
   - Rich Markdown content explaining the topic (use headings, bullet points, bold text where appropriate)
   - A pageType: "entity" for specific named things (people, orgs, tools), "concept" for abstract ideas/methods, or "summary" for overview pages
   - Relevant tags (2-5 tags per page)
3. Identify cross-references: for each page, list the IDs/titles of other pages it references. We'll resolve these after creation.

IMPORTANT RULES:
- Create at least 2 pages but no more than 15 pages from a document.
- Each page's content should be 100-500 words in Markdown format.
- Be thorough but concise.
- Output ONLY valid JSON, no markdown wrapping, no explanation outside the JSON.

OUTPUT FORMAT (return ONLY this JSON):
{
  "pages": [
    {
      "title": "Page Title",
      "content": "# Page Title\\n\\nMarkdown content here...",
      "pageType": "entity|concept|summary",
      "tags": ["tag1", "tag2", "tag3"],
      "crossReferences": ["Title of Another Page", "Title of Yet Another Page"]
    }
  ]
}`

// POST /api/wiki/ingest — Ingest a document and generate wiki pages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, sourceType } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Step 1: Create Source record with status "pending"
    const source = await db.source.create({
      data: {
        title,
        content,
        sourceType: sourceType || 'manual',
        status: 'pending',
      },
    })

    // Step 2: Call GLM to analyze the document
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: INGEST_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this document and generate wiki pages:\n\nTitle: ${title}\n\nContent:\n${content}`,
        },
      ],
    })

    const rawResponse = completion.choices?.[0]?.message?.content || ''
    let parsedResponse: { pages: Array<{
      title: string
      content: string
      pageType: string
      tags: string[]
      crossReferences?: string[]
    }> }

    // Try to parse the JSON from GLM response
    try {
      // Strip markdown code fences if present
      const cleaned = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsedResponse = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse GLM response:', rawResponse)
      return NextResponse.json(
        {
          error: 'Failed to parse AI response',
          rawResponse,
        },
        { status: 500 }
      )
    }

    const generatedPages = parsedResponse.pages || []

    if (generatedPages.length === 0) {
      // Update source status
      await db.source.update({
        where: { id: source.id },
        data: { status: 'processed' },
      })

      return NextResponse.json({
        message: 'No wiki pages could be extracted from this document',
        pages: [],
      })
    }

    // Step 3: Create WikiPage records
    const createdPages = []
    for (const pageData of generatedPages) {
      const page = await db.wikiPage.create({
        data: {
          title: pageData.title,
          content: pageData.content,
          pageType: pageData.pageType || 'concept',
          tags: JSON.stringify(pageData.tags || []),
          backlinks: '[]',
          sourceId: source.id,
        },
      })

      // Sync to .md file (fire-and-forget)
      try {
        syncToMd({
          id: page.id,
          title: page.title,
          content: page.content,
          pageType: page.pageType,
          tags: page.tags,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        })
      } catch (err) {
        console.error(`[sync] Failed to write .md for ${page.title}:`, err)
      }

      createdPages.push({ ...page, crossReferences: pageData.crossReferences || [] })
    }

    // Step 4: Resolve cross-references (match titles to IDs)
    for (const createdPage of createdPages) {
      const refIds: string[] = []
      for (const refTitle of createdPage.crossReferences) {
        const matchedPage = createdPages.find(
          (p) => p.title.toLowerCase() === refTitle.toLowerCase()
        )
        if (matchedPage) {
          refIds.push(matchedPage.id)
        }
      }

      if (refIds.length > 0) {
        await db.wikiPage.update({
          where: { id: createdPage.id },
          data: { backlinks: JSON.stringify(refIds) },
        })
      }
    }

    // Step 5: Update Source status to "processed"
    await db.source.update({
      where: { id: source.id },
      data: { status: 'processed' },
    })

    // Step 6: Create ActivityLog
    await db.activityLog.create({
      data: {
        actionType: 'ingest',
        summary: `Ingested document "${title}" and generated ${createdPages.length} wiki pages`,
        relatedPages: JSON.stringify(createdPages.map((p) => p.id)),
        sourceId: source.id,
      },
    })

    // Fetch the final pages with resolved backlinks
    const finalPages = await db.wikiPage.findMany({
      where: { sourceId: source.id },
    })

    return NextResponse.json({
      message: `Successfully processed document and created ${createdPages.length} wiki pages`,
      sourceId: source.id,
      pages: finalPages.map((page) => ({
        ...page,
        tags: parseJsonArray(page.tags),
        backlinks: parseJsonArray(page.backlinks),
      })),
    })
  } catch (error) {
    console.error('Error ingesting document:', error)
    return NextResponse.json(
      { error: 'Failed to ingest document' },
      { status: 500 }
    )
  }
}

// Sync a page to its .md file in wiki-content/
function syncToMd(page: { id: string; title: string; content: string; pageType: string; tags: string; createdAt: Date | string; updatedAt: Date | string }) {
  try {
    mkdirSync(CONTENT_DIR, { recursive: true })
  } catch { /* already exists */ }

  const slug = page.title
    .toLowerCase()
    .replace(/[\s（）()【】[\]]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled'

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
  console.log(`[sync] Ingested .md for: ${page.title}`)
}
