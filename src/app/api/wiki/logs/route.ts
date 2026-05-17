import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: parse JSON array string safely
function parseJsonArray(str: string): string[] {
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// GET /api/wiki/logs — Return recent activity logs
export async function GET() {
  try {
    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        source: {
          select: { id: true, title: true },
        },
        page: {
          select: { id: true, title: true },
        },
      },
    })

    const parsed = logs.map((log) => ({
      ...log,
      relatedPages: parseJsonArray(log.relatedPages),
    }))

    return NextResponse.json({ logs: parsed })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
