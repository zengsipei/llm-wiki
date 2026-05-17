'use client'

import React from 'react'
import { BookOpen, Plus, MessageSquare, ShieldCheck, Clock, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { WikiPage, ActiveTab } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'

interface WikiSidebarProps {
  pages: WikiPage[]
  selectedPageId: string | null
  activeTab: ActiveTab
  logsCount: number
  onSelectPage: (id: string) => void
  onSetActiveTab: (tab: ActiveTab) => void
  onCreateNew: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

const navItems: { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = []

export function WikiSidebar({
  pages,
  selectedPageId,
  activeTab,
  logsCount,
  onSelectPage,
  onSetActiveTab,
  onCreateNew,
  isMobileOpen,
  onCloseMobile,
}: WikiSidebarProps) {
  // Group pages by type
  const groupedPages = {
    entity: pages.filter((p) => p.pageType === 'entity'),
    concept: pages.filter((p) => p.pageType === 'concept'),
    summary: pages.filter((p) => p.pageType === 'summary'),
  }

  const navButtons: { tab: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { tab: 'view', label: '页面浏览', icon: <FileText className="size-4" /> },
    { tab: 'ingest', label: '文档摄入', icon: <Plus className="size-4" /> },
    { tab: 'query', label: '知识问答', icon: <MessageSquare className="size-4" /> },
    { tab: 'lint', label: '健康检查', icon: <ShieldCheck className="size-4" /> },
    { tab: 'logs', label: '操作日志', icon: <Clock className="size-4" />, badge: logsCount },
    { tab: 'export', label: '导出', icon: <Download className="size-4" /> },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Title */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">LLM Wiki</h1>
            <p className="text-xs text-muted-foreground">智能知识库</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation Buttons */}
      <div className="p-3 space-y-1">
        {navButtons.map((item) => (
          <Button
            key={item.tab}
            variant={activeTab === item.tab ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2.5 h-9 px-3 text-sm font-medium transition-colors',
              activeTab === item.tab && 'bg-secondary text-secondary-foreground shadow-sm'
            )}
            onClick={() => {
              onSetActiveTab(item.tab)
              onCloseMobile()
            }}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-5 min-w-5 justify-center">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Page List */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            知识页面
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              onCreateNew()
              onCloseMobile()
            }}
          >
            <Plus className="size-3.5 mr-1" />
            新建
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-2.5rem)] px-2">
          {(['entity', 'concept', 'summary'] as const).map((type) => {
            const typePages = groupedPages[type]
            if (typePages.length === 0) return null
            return (
              <div key={type} className="mb-2">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border',
                      PAGE_TYPE_COLORS[type]
                    )}
                  >
                    {PAGE_TYPE_LABELS[type]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{typePages.length}</span>
                </div>
                {typePages.map((page) => (
                  <button
                    key={page.id}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors truncate',
                      'hover:bg-accent hover:text-accent-foreground',
                      selectedPageId === page.id && activeTab === 'view'
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground/80'
                    )}
                    onClick={() => {
                      onSelectPage(page.id)
                      onSetActiveTab('view')
                      onCloseMobile()
                    }}
                  >
                    <span className="truncate block">{page.title}</span>
                  </button>
                ))}
              </div>
            )
          })}
          {pages.length === 0 && (
            <div className="text-center py-8 px-4">
              <FileText className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">暂无页面</p>
              <p className="text-[10px] text-muted-foreground mt-1">点击上方「文档摄入」开始</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer */}
      <Separator />
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          共 {pages.length} 个页面
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[280px] flex-col border-r bg-sidebar/50 h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-background border-r shadow-xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
