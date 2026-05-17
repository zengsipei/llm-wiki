'use client'

import React from 'react'
import {
  Clock,
  Upload,
  MessageSquare,
  ShieldCheck,
  Edit3,
  PlusCircle,
  Trash2,
  FileText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ActivityLog } from '@/types/wiki'
import {
  ACTION_TYPE_LABELS,
  ACTION_TYPE_COLORS,
} from '@/types/wiki'

interface LogsViewProps {
  logs: ActivityLog[]
  onSelectPage: (id: string) => void
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  ingest: <Upload className="size-4" />,
  query: <MessageSquare className="size-4" />,
  lint: <ShieldCheck className="size-4" />,
  edit: <Edit3 className="size-4" />,
  create: <PlusCircle className="size-4" />,
  delete: <Trash2 className="size-4" />,
}

export function LogsView({ logs, onSelectPage }: LogsViewProps) {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return '刚刚'
      if (diffMins < 60) return `${diffMins} 分钟前`
      if (diffHours < 24) return `${diffHours} 小时前`
      if (diffDays < 7) return `${diffDays} 天前`
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="size-5" />
            操作日志
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            最近的 {logs.length} 条操作记录
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {logs.length} 条
        </Badge>
      </div>

      {logs.length === 0 ? (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-8 text-center">
            <Clock className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">暂无操作记录</p>
            <p className="text-xs text-muted-foreground/60">操作记录将在你使用系统后出现</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-12 py-2 group">
                {/* Timeline dot */}
                <div
                  className={`absolute left-3 top-3.5 size-4 rounded-full ${ACTION_TYPE_COLORS[log.actionType] || 'bg-gray-400'} ring-4 ring-background`}
                />

                <Card className="bg-transparent border-0 hover:bg-muted/30 transition-colors cursor-default">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground">
                        {ACTION_ICONS[log.actionType] || <FileText className="size-4" />}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium">
                        {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">{log.summary}</p>

                    {/* Related source */}
                    {log.source && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">来源:</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          {log.source.title}
                        </Badge>
                      </div>
                    )}

                    {/* Related page */}
                    {log.page && (
                      <button
                        className="flex items-center gap-1.5 mt-1.5 group/page"
                        onClick={() => onSelectPage(log.page!.id)}
                      >
                        <span className="text-[10px] text-muted-foreground">页面:</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 group-hover/page:bg-accent transition-colors cursor-pointer"
                        >
                          {log.page.title}
                        </Badge>
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
