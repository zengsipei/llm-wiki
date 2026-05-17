'use client'

import React from 'react'
import { Edit, Trash2, Tag, Clock, ArrowLeft, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MarkdownRenderer } from '@/components/wiki/markdown-renderer'
import type { WikiPage } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'

interface PageViewProps {
  page: WikiPage
  allPages: WikiPage[]
  onEdit: () => void
  onDelete: () => void
  onNavigateToPage: (id: string) => void
  onBack: () => void
}

export function PageView({ page, allPages, onEdit, onDelete, onNavigateToPage, onBack }: PageViewProps) {
  const backlinkPages = allPages.filter((p) => page.backlinks.includes(p.id))
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
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
      {/* Back button and actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-sm" onClick={onBack}>
          <ArrowLeft className="size-3.5" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-sm" onClick={onEdit}>
            <Edit className="size-3.5" />
            编辑
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-sm text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除页面「{page.title}」吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-white hover:bg-destructive/90">
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-2xl font-bold tracking-tight">{page.title}</h2>
          <Badge variant="outline" className={PAGE_TYPE_COLORS[page.pageType]}>
            {PAGE_TYPE_LABELS[page.pageType]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            创建: {formatTime(page.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            更新: {formatTime(page.updatedAt)}
          </span>
        </div>
      </div>

      {/* Tags */}
      {page.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          <Tag className="size-3.5 text-muted-foreground" />
          {page.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs h-6 px-2">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="mb-6" />

      {/* Content */}
      <CardContent className="p-0">
        <MarkdownRenderer content={page.content} />
      </CardContent>

      {/* Source */}
      {page.source && (
        <>
          <Separator className="my-6" />
          <div className="text-xs text-muted-foreground">
            来源: <span className="font-medium text-foreground/80">{page.source.title}</span>
          </div>
        </>
      )}

      {/* Backlinks */}
      {backlinkPages.length > 0 && (
        <>
          <Separator className="my-6" />
          <Card className="bg-muted/30 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">相关页面</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {backlinkPages.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {backlinkPages.map((bp) => (
                  <button
                    key={bp.id}
                    className="text-xs px-2.5 py-1 rounded-md bg-background border hover:bg-accent transition-colors text-foreground/80 hover:text-foreground"
                    onClick={() => onNavigateToPage(bp.id)}
                  >
                    {bp.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
