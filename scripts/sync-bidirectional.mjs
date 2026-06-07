// Background bidirectional reconciliation: .md files ↔ SQLite database
// Spawned by sync-from-md.mjs during dev startup (non-blocking)
// Compares mtime to decide sync direction:
//   - md file newer → update DB
//   - DB record newer → write back to md
//   - Both same → skip
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, writeFileSync, statSync, utimesSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

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

async function reconcile() {
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const allPages = await prisma.wikiPage.findMany();

  const pageById = new Map(allPages.map(p => [p.id, p]));
  const pageByTitle = new Map(allPages.map(p => [p.title, p]));
  // Slug-based dedup map: slug -> first matching page
  const pageBySlug = new Map();
  for (const p of allPages) {
    const s = slugify(p.title);
    if (!pageBySlug.has(s)) pageBySlug.set(s, p);
  }
  let mdToDb = 0, dbToMd = 0, both = 0, skipped = 0;

  function contentHash(text) {
    return createHash('md5').update(text).digest('hex').slice(0, 12);
  }

  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file);
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed || !parsed.title) continue;

    const { id, title, type, tags, content } = parsed;
    const fileStat = statSync(filePath);
    const fileMtime = fileStat.mtimeMs;

    let dbPage = id ? pageById.get(id) : null;
    if (!dbPage) dbPage = pageByTitle.get(title);
    // Also check by slugified title (catches hyphenation variants)
    if (!dbPage) {
      const fileSlug = slugify(title);
      dbPage = pageBySlug.get(fileSlug);
    }

    if (!dbPage) {
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

    // Compare content hash first (cheap, avoids ping-pong)
    const mdHash = contentHash(content);
    const dbHash = contentHash(dbPage.content);
    if (mdHash === dbHash) {
      both++;
      continue; // Content identical — skip regardless of timestamps
    }

    const dbMtime = new Date(dbPage.updatedAt).getTime();

    if (fileMtime > dbMtime) {
      // md file is newer → update DB
      await prisma.wikiPage.update({
        where: { id: dbPage.id },
        data: { title, content, pageType: type || 'concept', tags: tags || '[]' },
      });
      mdToDb++;
      console.log(`[sync] md→DB UPD: ${title}`);
    } else {
      // DB is newer → write back to md and preserve mtime to avoid ping-pong
      const frontmatter = buildFrontmatter(dbPage);
      writeFileSync(filePath, `${frontmatter}\n\n${dbPage.content}`, 'utf-8');
      // Set file mtime to match DB updatedAt (prevents ping-pong)
      utimesSync(filePath, new Date(dbMtime), new Date(dbMtime));
      dbToMd++;
      console.log(`[sync] DB→md UPD: ${title}`);
    }
  }

  // Check for DB pages with no matching md file → export
  // Build maps: mdFileById (by frontmatter id), mdFileByTitle (by parsed title)
  const mdFileById = new Map();
  const mdFileByTitle = new Map();
  const mdFileBySlug = new Map();
  for (const file of files) {
    const filePath = resolve(CONTENT_DIR, file);
    const parsed = parseFrontmatter(readFileSync(filePath, 'utf-8'));
    if (parsed?.id) mdFileById.set(parsed.id, { file, parsed });
    if (parsed?.title) {
      mdFileByTitle.set(parsed.title, { file, parsed });
      const fileSlug = slugify(parsed.title);
      if (!mdFileBySlug.has(fileSlug)) mdFileBySlug.set(fileSlug, { file, parsed });
    }
  }

  for (const page of allPages) {
    // Skip if already matched by id, title, or slug
    if (mdFileById.has(page.id)) continue;
    if (mdFileByTitle.has(page.title)) continue;
    const pageSlug = slugify(page.title);
    if (mdFileBySlug.has(pageSlug)) continue;

    // Also skip if a file with same content hash already exists
    const pageContentHash = contentHash(page.content);
    let contentExists = false;
    for (const [, entry] of mdFileById) {
      if (contentHash(entry.parsed.content || '') === pageContentHash) {
        contentExists = true;
        break;
      }
    }
    if (contentExists) {
      skipped++;
      continue;
    }

    const slug = slugify(page.title);
    const filePath = resolve(CONTENT_DIR, `${slug}.md`);
    const frontmatter = buildFrontmatter(page);
    writeFileSync(filePath, `${frontmatter}\n\n${page.content}`, 'utf-8');
    // Set mtime to match DB updatedAt
    const dbMtime = new Date(page.updatedAt).getTime();
    utimesSync(filePath, new Date(dbMtime), new Date(dbMtime));
    dbToMd++;
    console.log(`[sync] DB→md NEW: ${page.title}`);
  }

  console.log(`[sync] Reconcile done: ${mdToDb} md→DB, ${dbToMd} DB→md, ${both} unchanged, ${skipped} skipped (slug dup)`);
}

reconcile().catch(err => console.error(`[sync] Reconcile failed:`, err)).finally(() => prisma.$disconnect());
