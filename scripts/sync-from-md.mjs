// Bidirectional sync: .md files ↔ SQLite database
// Run: node scripts/sync-from-md.mjs [--full]
//   --full  Force full bidirectional reconciliation (ignore timestamps)
//
// Default behavior (dev startup):
//   1. If DB is empty → full restore from md files (fast path, blocks startup)
//   2. If DB has data → async background reconciliation (non-blocking)
//      - md file newer than DB record → update DB
//      - DB record newer than md file → write back to md
//      - Both same → skip
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();
const CONTENT_DIR = resolve(process.cwd(), 'wiki-content');
const FORCE_FULL = process.argv.includes('--full');

// --- Frontmatter helpers ---

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
  if (meta.tags) {
    try {
      const tagLines = meta.tags.split('\n').map(l => l.replace(/^[\s-]*"/, '').replace(/"$/, '').trim()).filter(Boolean);
      meta.tags = JSON.stringify(tagLines);
    } catch {
      meta.tags = meta.tags;
    }
  }
  return { ...meta, content };
}

function buildFrontmatter(page) {
  function formatTags(tagsStr) {
    try {
      return JSON.parse(tagsStr).map(t => `  - ${t}`).join('\n');
    } catch {
      return `  - ${tagsStr}`;
    }
  }
  return [
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
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[\s（）()【】[\]]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || 'untitled';
}

// --- Find md file by DB id or title ---

function findMdFile(page) {
  // 1. Try matching by id in frontmatter
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const raw = readFileSync(resolve(CONTENT_DIR, file), 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (parsed && parsed.id === page.id) return { file, raw, parsed };
  }
  // 2. Fallback: match by slugified title
  const slug = slugify(page.title);
  const fallback = `${slug}.md`;
  if (files.includes(fallback)) {
    const raw = readFileSync(resolve(CONTENT_DIR, fallback), 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (parsed) return { file: fallback, raw, parsed };
  }
  return null;
}

// --- Sync modes ---

// Fast path: DB is empty, restore everything from md (blocking)
async function fullRestore() {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  console.log(`[sync] DB is empty, restoring from ${files.length} .md files...`);

  let created = 0, skipped = 0;
  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file);
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed || !parsed.title) { skipped++; continue; }

    const { id, title, type, tags, content } = parsed;
    await prisma.wikiPage.upsert({
      where: { id: id || '__none__' },
      create: {
        id: id || undefined,
        title,
        content,
        pageType: type || 'concept',
        tags: tags || '[]',
        backlinks: '[]',
      },
      update: { title, content, pageType: type || 'concept', tags: tags || '[]' },
    });
    created++;
  }
  console.log(`[sync] Restore complete: ${created} synced, ${skipped} skipped`);
}

// Bidirectional reconciliation (async, non-blocking)
async function reconcile() {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const allPages = await prisma.wikiPage.findMany();

  const pageById = new Map(allPages.map(p => [p.id, p]));
  const pageByTitle = new Map(allPages.map(p => [p.title, p]));
  let mdToDb = 0, dbToMd = 0, both = 0;

  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file);
    const parsed = parseFrontmatter(readFileSync(filePath, 'utf-8'));
    if (!parsed || !parsed.title) continue;

    const { id, title, type, tags, content } = parsed;
    const fileStat = statSync(filePath);
    const fileMtime = fileStat.mtimeMs; // ms precision

    // Match by id first, then by title
    let dbPage = id ? pageById.get(id) : null;
    if (!dbPage) dbPage = pageByTitle.get(title);

    if (!dbPage) {
      // New md file not in DB → create (no id conflict possible)
      await prisma.wikiPage.create({
        data: {
          title,
          content,
          pageType: type || 'concept',
          tags: tags || '[]',
          backlinks: '[]',
        },
      });
      mdToDb++;
      console.log(`[sync] md→DB NEW: ${title}`);
      continue;
    }

    const dbMtime = new Date(dbPage.updatedAt).getTime();

    if (FORCE_FULL || fileMtime > dbMtime + 1000) {
      // md file is newer → update DB
      await prisma.wikiPage.update({
        where: { id: dbPage.id },
        data: { title, content, pageType: type || 'concept', tags: tags || '[]' },
      });
      mdToDb++;
      console.log(`[sync] md→DB UPD: ${title}`);
    } else if (dbMtime > fileMtime + 1000) {
      // DB is newer → write back to md
      const updatedPage = await prisma.wikiPage.findUnique({ where: { id: dbPage.id } });
      const frontmatter = buildFrontmatter(updatedPage);
      writeFileSync(filePath, `${frontmatter}\n\n${updatedPage.content}`, 'utf-8');
      dbToMd++;
      console.log(`[sync] DB→md UPD: ${title}`);
    } else {
      both++;
    }
  }

  // Check for DB pages with no matching md file → export
  const mdIds = new Set();
  for (const file of files) {
    const parsed = parseFrontmatter(readFileSync(resolve(CONTENT_DIR, file), 'utf-8'));
    if (parsed?.id) mdIds.add(parsed.id);
  }
  for (const page of allPages) {
    if (!mdIds.has(page.id)) {
      const slug = slugify(page.title);
      const filePath = resolve(CONTENT_DIR, `${slug}.md`);
      const frontmatter = buildFrontmatter(page);
      writeFileSync(filePath, `${frontmatter}\n\n${page.content}`, 'utf-8');
      dbToMd++;
      console.log(`[sync] DB→md NEW: ${page.title}`);
    }
  }

  console.log(`[sync] Reconcile done: ${mdToDb} md→DB, ${dbToMd} DB→md, ${both} unchanged`);
}

// --- Main ---

async function main() {
  const count = await prisma.wikiPage.count();

  if (count === 0) {
    // DB empty: full restore (blocking, must complete before dev starts)
    await fullRestore();
  } else if (FORCE_FULL) {
    // Force full reconciliation
    console.log(`[sync] DB has ${count} records, force reconciling...`);
    await reconcile();
  } else {
    // DB has data: spawn background reconcile (separate process to avoid Prisma disconnect)
    console.log(`[sync] DB has ${count} records, spawning background reconciliation...`);
    const { fork } = await import('child_process');
    const child = fork(resolve(import.meta.dirname || __dirname, 'sync-bidirectional.mjs'), [], {
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    child.unref(); // Don't wait for child
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
