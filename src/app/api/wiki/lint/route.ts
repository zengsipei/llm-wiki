import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

const LINT_SYSTEM_PROMPT = `You are a knowledge base health checker. You are given the titles and content summaries of all wiki pages in a knowledge base.

Your job is to analyze the wiki and identify issues. Check for:

1. **Contradictions**: Pages that contain conflicting information
2. **Stale Pages**: Pages that reference outdated information or seem incomplete
3. **Orphan Pages**: Pages that have no backlinks/cross-references to or from other pages
4. **Missing Pages**: Topics that are referenced but don't have their own page
5. **Missing Cross-References**: Pages that mention topics covered by other pages but don't link to them
6. **Duplicate Content**: Pages that significantly overlap in content

For each issue, provide:
- severity: "high", "medium", or "low"
- type: one of the categories above
- description: a clear description of the issue
- affectedPages: array of page titles affected
- suggestion: how to fix the issue

Output ONLY valid JSON:
{
  "summary": "Overall health assessment in 2-3 sentences",
  "score": 85,
  "issues": [
    {
      "severity": "high|medium|low",
      "type": "contradiction|stale|orphan|missing|cross_reference|duplicate",
      "description": "...",
      "affectedPages": ["Page Title 1"],
      "suggestion": "..."
    }
  ],
  "stats": {
    "totalPages": 10,
    "issuesFound": 3,
    "highSeverity": 1,
    "mediumSeverity": 1,
    "lowSeverity": 1
  }
}`

// POST /api/wiki/lint — Lint/health check the wiki
export async function POST(_request: NextRequest) {
  try {
    // Step 1: Get all WikiPages
    const pages = await db.wikiPage.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    if (pages.length === 0) {
      await db.activityLog.create({
        data: {
          actionType: 'lint',
          summary: 'Lint check: No pages in wiki to analyze',
          relatedPages: '[]',
        },
      })

      return NextResponse.json({
        message: 'No pages found in the wiki',
        summary: 'The wiki is empty. Ingest some documents first.',
        score: null,
        issues: [],
        stats: { totalPages: 0, issuesFound: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
      })
    }

    // Step 2: Build a summary of all pages for GLM
    const pagesSummary = pages
      .map((page, index) => {
        // Parse backlinks to get referenced page IDs
        let referencedTitles: string[] = []
        try {
          const backlinkIds = JSON.parse(page.backlinks || '[]')
          referencedTitles = backlinkIds
            .map((id: string) => {
              const ref = pages.find((p) => p.id === id)
              return ref ? ref.title : null
            })
            .filter(Boolean) as string[]
        } catch {
          // ignore
        }

        let tags: string[] = []
        try {
          tags = JSON.parse(page.tags || '[]')
        } catch {
          // ignore
        }

        return `[Page ${index + 1}]
Title: ${page.title}
Type: ${page.pageType}
Tags: ${tags.join(', ')}
Cross-references to: ${referencedTitles.join(', ') || 'None'}
Content preview: ${page.content.substring(0, 400)}...
---
Last updated: ${page.updatedAt.toISOString()}`
      })
      .join('\n\n')

    // Step 3: Send to GLM for analysis
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: LINT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following wiki knowledge base (${pages.length} pages):\n\n${pagesSummary}`,
        },
      ],
    })

    const rawResponse = completion.choices?.[0]?.message?.content || ''

    let lintReport
    try {
      const cleaned = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      lintReport = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse lint response:', rawResponse)
      lintReport = {
        summary: 'Unable to parse AI lint analysis. Raw response available in logs.',
        score: null,
        issues: [],
        stats: { totalPages: pages.length, issuesFound: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
        rawResponse,
      }
    }

    // Step 4: Create ActivityLog
    const issueCount = lintReport.issues?.length || 0
    await db.activityLog.create({
      data: {
        actionType: 'lint',
        summary: `Lint check: ${pages.length} pages analyzed, ${issueCount} issues found (score: ${lintReport.score || 'N/A'})`,
        relatedPages: JSON.stringify(pages.map((p) => p.id)),
      },
    })

    return NextResponse.json({
      ...lintReport,
      analyzedAt: new Date().toISOString(),
      stats: {
        ...lintReport.stats,
        totalPages: pages.length,
      },
    })
  } catch (error) {
    console.error('Error running lint check:', error)
    return NextResponse.json(
      { error: 'Failed to run lint check' },
      { status: 500 }
    )
  }
}
