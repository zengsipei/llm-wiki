import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// Helper: parse JSON array string safely
function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const QUERY_SYSTEM_PROMPT = `You are a knowledgeable wiki assistant. You are given a question and a set of relevant wiki pages as context. 

Your job is to:
1. Answer the question based primarily on the provided context
2. If the context doesn't fully answer the question, say so clearly and provide what you can
3. Reference which pages you used as sources
4. Be concise but thorough

Output ONLY valid JSON in this format:
{
  "answer": "Your detailed answer here...",
  "sources": [
    {"id": "page_id_1", "title": "Page Title 1", "relevance": "brief explanation of why this page is relevant"}
  ]
}`

// POST /api/wiki/query — Query the wiki with a question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question } = body

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'A question string is required' },
        { status: 400 }
      )
    }

    // Step 1: Extract keywords from the question for search
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
      'through', 'after', 'over', 'between', 'out', 'against', 'during',
      'without', 'before', 'under', 'around', 'among', 'and', 'or', 'but',
      'not', 'no', 'what', 'how', 'why', 'who', 'when', 'where', 'which',
      'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my',
      'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
      'they', 'them', 'their', 'tell', 'explain', 'describe', 'define',
    ])

    const keywords = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 1 && !stopWords.has(word))

    // Step 2: Search for relevant pages using Prisma contains
    let relevantPages
    if (keywords.length === 0) {
      // If no keywords extracted, get the most recent pages
      relevantPages = await db.wikiPage.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
    } else {
      // Build OR conditions for each keyword
      const conditions = keywords.map((keyword: string) => ({
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      }))

      relevantPages = await db.wikiPage.findMany({
        where: { OR: conditions },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
    }

    if (relevantPages.length === 0) {
      // Log the query even if no results
      await db.activityLog.create({
        data: {
          actionType: 'query',
          summary: `Query: "${question}" — No matching pages found`,
          relatedPages: '[]',
        },
      })

      return NextResponse.json({
        answer: 'No relevant wiki pages were found for your question. Try ingesting some documents first.',
        sources: [],
      })
    }

    // Step 3: Build context from relevant pages
    const context = relevantPages
      .map(
        (page, index) =>
          `[Page ${index + 1}] Title: ${page.title}\nType: ${page.pageType}\nContent:\n${page.content.substring(0, 1000)}`
      )
      .join('\n\n---\n\n')

    // Step 4: Send to GLM with question + context
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: QUERY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${question}\n\nRelevant wiki pages:\n\n${context}`,
        },
      ],
    })

    const rawResponse = completion.choices?.[0]?.message?.content || ''

    let parsedResponse: { answer: string; sources: Array<{ id: string; title: string; relevance?: string }> }
    try {
      const cleaned = rawResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsedResponse = JSON.parse(cleaned)
    } catch {
      // If parsing fails, use the raw text as the answer
      parsedResponse = {
        answer: rawResponse,
        sources: relevantPages.map((p) => ({ id: p.id, title: p.title })),
      }
    }

    // Step 5: Create ActivityLog
    await db.activityLog.create({
      data: {
        actionType: 'query',
        summary: `Query: "${question}" — Found ${relevantPages.length} relevant pages`,
        relatedPages: JSON.stringify(relevantPages.map((p) => p.id)),
      },
    })

    return NextResponse.json({
      answer: parsedResponse.answer,
      sources: parsedResponse.sources.map((s) => ({
        id: s.id,
        title: s.title,
      })),
    })
  } catch (error) {
    console.error('Error querying wiki:', error)
    return NextResponse.json(
      { error: 'Failed to query wiki' },
      { status: 500 }
    )
  }
}
