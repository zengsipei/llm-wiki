// Sync: .md files → SQLite database
// Run: node scripts/sync-from-md.mjs
// Reads all wiki-content/*.md files and upserts them into the database.
// This is the REBUILD script — use it when the DB is lost or corrupted.
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';

const prisma = new PrismaClient();
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content');

function parseFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const fm = match[1];
  const content = match[2].trim();
  const meta = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  // Parse tags from YAML-like list
  if (meta.tags) {
    try {
      // Handle "  - tag1\n  - tag2" format
      const tagLines = meta.tags.split('\n').map(l => l.replace(/^[\s-]*"/, '').replace(/"$/, '').trim()).filter(Boolean);
      meta.tags = JSON.stringify(tagLines);
    } catch {
      meta.tags = meta.tags;
    }
  }
  return { ...meta, content };
}

async function main() {
  // Quick check: if DB already has data, skip sync
  const count = await prisma.wikiPage.count();
  if (count > 0) {
    console.log(`DB already has ${count} records, skipping sync.`);
    return;
  }
  console.log('DB is empty, restoring from .md files...');

  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} .md files in wiki-content/`);

  let created = 0, updated = 0;

  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file);
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) {
      console.log(`  SKIP ${file}: no frontmatter`);
      continue;
    }

    const { id, title, type, tags, content, created: createdAt, updated: updatedAt } = parsed;
    if (!title) {
      console.log(`  SKIP ${file}: no title`);
      continue;
    }

    const existing = id ? await prisma.wikiPage.findUnique({ where: { id } }) : null;

    if (existing) {
      await prisma.wikiPage.update({
        where: { id: existing.id },
        data: {
          title,
          content,
          pageType: type || 'concept',
          tags: tags || '[]',
        },
      });
      updated++;
      console.log(`  UPD ${file} → ${title}`);
    } else {
      await prisma.wikiPage.create({
        data: {
          id: id || undefined,
          title,
          content,
          pageType: type || 'concept',
          tags: tags || '[]',
          backlinks: '[]',
        },
      });
      created++;
      console.log(`  NEW ${file} → ${title}`);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
