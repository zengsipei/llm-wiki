// Ingest grahify-kb articles into LLM Wiki
// Run: node scripts/ingest-grahify-kb.mjs
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const ARTICLES_DIR = join(process.cwd(), 'grahify-kb', 'raw', 'articles');

function parseArticle(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // Skip outer frontmatter (first --- block, lines before the line-numbered inner block)
  let startIdx = 0;
  if (lines[0] === '---') {
    // Find closing ---
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---' && !lines[i].match(/^\s+\d+\|/)) {
        startIdx = i + 1;
        break;
      }
    }
  }

  // Find inner frontmatter (line-numbered: "     1|---" to "     N|---")
  const innerFrontStart = startIdx;
  let innerFrontEnd = -1;
  for (let i = startIdx; i < lines.length; i++) {
    const match = lines[i].match(/^\s*\d+\|---\s*$/);
    if (match && i > startIdx) {
      innerFrontEnd = i;
      break;
    }
  }

  // Parse inner frontmatter
  const metadata = {};
  if (innerFrontEnd > innerFrontStart) {
    for (let i = innerFrontStart + 1; i < innerFrontEnd; i++) {
      const line = lines[i].replace(/^\s*\d+\|/, '').trim();
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) metadata[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }

  // Extract body (after inner frontmatter)
  const bodyLines = lines.slice(innerFrontEnd + 1).map(l => l.replace(/^\s*\d+\|/, ''));
  const body = bodyLines.join('\n').trim();

  // Extract title from first # heading in body
  const headingMatch = body.match(/^#\s+(.+)$/m);
  const title = headingMatch ? headingMatch[1].trim() : metadata.title || metadata.topic || 'Untitled';

  // Generate slug from filename
  const filename = filePath.split('/').pop().replace('.md', '');
  const datePrefix = filename.match(/^\d{4}-\d{2}-\d{2}-/)?.[0] || '';
  let slug = filename.replace(datePrefix, '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');

  // Extract tags
  let tags = [];
  if (metadata.tags) {
    tags = metadata.tags.replace(/^\[|\]$/g, '').split(',').map(t => t.trim());
  }

  // Determine category from tags
  let category = 'concept';
  const lowerTags = tags.map(t => t.toLowerCase());
  if (lowerTags.some(t => t.includes('claude') || t.includes('anthropic'))) category = 'entity';
  else if (lowerTags.some(t => t.includes('tool') || t.includes('sdk') || t.includes('library'))) category = 'tool';

  return {
    title,
    slug,
    content: body,
    pageType: category,
    tags: JSON.stringify(tags),
    backlinks: '[]',
    sourceUrl: metadata.source || '',
    date: metadata.date || '',
  };
}

async function main() {
  const files = readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md')).sort();
  console.log(`Found ${files.length} articles`);

  let created = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const filePath = join(ARTICLES_DIR, file);
      const article = parseArticle(filePath);

      // Check if page with same title already exists
      const existing = await prisma.wikiPage.findFirst({ where: { title: article.title } });
      if (existing) {
        console.log(`  SKIP (exists): ${article.title}`);
        continue;
      }

      const page = await prisma.wikiPage.create({
        data: {
          title: article.title,
          content: article.content,
          pageType: article.pageType,
          tags: article.tags,
          backlinks: article.backlinks,
        }
      });

      console.log(`  OK: ${article.title} → ${page.id}`);
      created++;
    } catch (err) {
      console.error(`  ERROR: ${file}: ${err.message}`);
      errors++;
    }
  }

  const total = await prisma.wikiPage.count();
  console.log(`\nDone! Created: ${created}, Errors: ${errors}, Total pages: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
