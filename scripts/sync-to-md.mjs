// Sync: SQLite database → .md files
// Run: node scripts/sync-to-md.mjs
// Exports all WikiPages from the database to wiki-content/*.md files.
// Call this after creating/editing pages via the web UI.
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[\s（）()【】[\]]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled';
}

function formatTags(tagsStr) {
  try {
    const arr = JSON.parse(tagsStr);
    return arr.map(t => `  - ${t}`).join('\n');
  } catch {
    return `  - ${tagsStr}`;
  }
}

async function main() {
  mkdirSync(CONTENT_DIR, { recursive: true });
  const pages = await prisma.wikiPage.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`Exporting ${pages.length} pages to wiki-content/`);

  for (const page of pages) {
    const slug = slugify(page.title);
    const filePath = resolve(CONTENT_DIR, `${slug}.md`);
    const frontmatter = [
      `---`,
      `id: ${page.id}`,
      `title: ${page.title}`,
      `type: ${page.pageType}`,
      `tags:`,
      formatTags(page.tags),
      `created: ${page.createdAt.toISOString()}`,
      `updated: ${page.updatedAt.toISOString()}`,
      `---`,
    ].join('\n');

    const md = `${frontmatter}\n\n${page.content}`;
    writeFileSync(filePath, md, 'utf-8');
    console.log(`  ${slug}.md ← ${page.title}`);
  }

  console.log(`\nDone: ${pages.length} files exported`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
