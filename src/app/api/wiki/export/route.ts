import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import JSZip from 'jszip'

// Helper: parse JSON array string safely
function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Helper: convert title to slug format
function toSlug(title: string): string {
  return title
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Helper: escape YAML special characters
function escapeYaml(str: string): string {
  if (/[:"'\{\}\[\],&*?|>!%@`#\\]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return str
}

// GET /api/wiki/export?type=markdown|graph
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    const pages = await db.wikiPage.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        source: {
          select: { id: true, title: true },
        },
      },
    })

    const parsedPages = pages.map((page) => ({
      ...page,
      tags: parseJsonArray(page.tags),
      backlinks: parseJsonArray(page.backlinks),
    }))

    if (type === 'markdown') {
      return handleMarkdownExport(parsedPages)
    } else if (type === 'graph') {
      return handleGraphExport(parsedPages)
    } else {
      return NextResponse.json(
        { error: 'Invalid export type. Use "markdown" or "graph".' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error exporting wiki data:', error)
    return NextResponse.json(
      { error: 'Failed to export wiki data' },
      { status: 500 }
    )
  }
}

async function handleMarkdownExport(
  pages: {
    id: string
    title: string
    content: string
    pageType: string
    tags: string[]
    backlinks: string[]
    createdAt: Date
    updatedAt: Date
  }[]
) {
  const zip = new JSZip()

  // Create a title->id lookup map for wikilinks
  const titleToId = new Map<string, string>()
  const idToTitle = new Map<string, string>()
  for (const page of pages) {
    titleToId.set(page.title, page.id)
    idToTitle.set(page.id, page.title)
  }

  // Track used filenames to avoid collisions
  const usedFilenames = new Map<string, number>()

  for (const page of pages) {
    let slug = toSlug(page.title)
    if (!slug) slug = `page-${page.id.substring(0, 8)}`

    // Handle filename collisions
    if (usedFilenames.has(slug)) {
      usedFilenames.set(slug, (usedFilenames.get(slug) || 0) + 1)
      slug = `${slug}-${usedFilenames.get(slug)}`
    } else {
      usedFilenames.set(slug, 1)
    }

    // Build YAML frontmatter
    const frontmatterTags = page.tags.map((t) => `  - ${escapeYaml(t)}`).join('\n')
    const frontmatter = [
      '---',
      `title: ${escapeYaml(page.title)}`,
      `type: ${page.pageType}`,
      `tags:`,
      ...page.tags.map((t) => `  - ${escapeYaml(t)}`),
      `created: ${page.createdAt.toISOString().split('T')[0]}`,
      `updated: ${page.updatedAt.toISOString().split('T')[0]}`,
      '---',
      '',
    ].join('\n')

    // Process content: replace backlink IDs with [[wikilinks]]
    let content = page.content
    if (page.backlinks.length > 0) {
      // Find IDs in the content and replace with wikilinks
      // Look for patterns like page titles or IDs that match backlink pages
      for (const backlinkId of page.backlinks) {
        const linkedTitle = idToTitle.get(backlinkId)
        if (linkedTitle) {
          // Replace the title with [[wikilink]] format
          // Use word boundary aware replacement
          const escapedTitle = linkedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(`(?<!\\[\\[)\\b${escapedTitle}\\b(?!\\]\\])`, 'g')
          content = content.replace(regex, `[[${linkedTitle}]]`)
        }
      }
    }

    const fullContent = frontmatter + content
    zip.file(`${slug}.md`, fullContent)
  }

  // Add a vault metadata file
  const vaultMeta = [
    '# LLM Wiki Export',
    '',
    `Exported on: ${new Date().toISOString()}`,
    `Total pages: ${pages.length}`,
    '',
    'This vault is compatible with Obsidian and other markdown-based tools.',
    'Use the [[wikilinks]] to navigate between connected pages.',
  ].join('\n')
  zip.file('README.md', vaultMeta)

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="llm-wiki-vault-${new Date().toISOString().split('T')[0]}.zip"`,
    },
  })
}

async function handleGraphExport(
  pages: {
    id: string
    title: string
    content: string
    pageType: string
    tags: string[]
    backlinks: string[]
    createdAt: Date
    updatedAt: Date
  }[]
) {
  // Build nodes
  const nodes = pages.map((page) => ({
    id: page.id,
    title: page.title,
    type: page.pageType,
    tags: page.tags,
  }))

  // Build edges from backlinks and shared tags
  const edgeSet = new Set<string>()
  const edges: { source: string; target: string; label: string }[] = []

  // Edges from backlinks
  for (const page of pages) {
    for (const backlinkId of page.backlinks) {
      const edgeKey = [page.id, backlinkId].sort().join('---')
      if (!edgeSet.has(edgeKey)) {
        // Check if the backlinked page actually exists
        const exists = pages.some((p) => p.id === backlinkId)
        if (exists) {
          edgeSet.add(edgeKey)
          edges.push({
            source: page.id,
            target: backlinkId,
            label: 'backlink',
          })
        }
      }
    }
  }

  // Edges from shared tags
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const sharedTags = pages[i].tags.filter((t) => pages[j].tags.includes(t))
      if (sharedTags.length > 0) {
        const edgeKey = [pages[i].id, pages[j].id].sort().join('---')
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey)
          edges.push({
            source: pages[i].id,
            target: pages[j].id,
            label: `shared: ${sharedTags.join(', ')}`,
          })
        }
      }
    }
  }

  const graphData = {
    nodes,
    edges,
    metadata: {
      exportedAt: new Date().toISOString(),
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  }

  return NextResponse.json(graphData, {
    headers: {
      'Content-Disposition': `attachment; filename="llm-wiki-graph-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
