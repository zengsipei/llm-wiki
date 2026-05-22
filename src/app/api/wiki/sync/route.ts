import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

// POST /api/wiki/sync — Sync .md files from wiki-content/ to the database
// This is the "auto-sync" endpoint: call it when .md files are edited externally
export async function POST() {
  try {
    const { execSync: exec } = await import('child_process')
    const { resolve } = await import('path')

    // Run the sync-from-md script
    const scriptPath = resolve(process.cwd(), 'scripts', 'sync-from-md.mjs')
    if (!existsSync(scriptPath)) {
      return NextResponse.json({ error: 'Sync script not found' }, { status: 500 })
    }

    // Use --force mode to do a clean rebuild
    const output = execSync(`node "${scriptPath}" --force`, {
      cwd: process.cwd(),
      timeout: 30000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const pageCount = await db.wikiPage.count()

    return NextResponse.json({
      message: 'Sync completed',
      output: output.trim(),
      pageCount,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Sync failed'
    console.error('[sync] Error:', errorMessage)
    return NextResponse.json(
      { error: 'Sync failed', details: errorMessage },
      { status: 500 }
    )
  }
}
