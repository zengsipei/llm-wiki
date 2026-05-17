'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Edit, Trash2, Tag, Clock, ArrowLeft, Link2, ArrowUp, List } from 'lucide-react'
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

// ============ Types ============

interface TocItem {
  id: string
  text: string
  level: number
}

interface PageViewProps {
  page: WikiPage
  allPages: WikiPage[]
  onEdit: () => void
  onDelete: () => void
  onNavigateToPage: (id: string) => void
  onBack: () => void
}

// ============ Helpers ============

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

// Extract headings from markdown content for TOC
function extractTocItems(content: string): TocItem[] {
  const items: TocItem[] = []
  const lines = content.split('\n')
  let counter = 0

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const text = match[2].replace(/[*_`~\[\]()]/g, '').trim()
      if (text) {
        counter++
        const id = `heading-${counter}`
        items.push({ id, text, level })
      }
    }
  }

  return items
}

// ============ TOC Component ============

function TableOfContents({
  items,
  activeId,
  onItemClick,
}: {
  items: TocItem[]
  activeId: string | null
  onItemClick: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <nav className="space-y-0.5">
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-border/50">
        <List className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">目录</span>
      </div>
      {items.map((item) => {
        const isActive = item.id === activeId
        const indent = (item.level - 2) * 14 // h2 = 0, h3 = 14, h4 = 28
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`block w-full text-left text-[13px] py-1.5 px-2.5 rounded-md transition-all duration-200 truncate ${
              isActive
                ? 'text-primary font-medium bg-primary/8 border-l-2 border-primary pl-2'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-l-2 border-transparent'
            }`}
            style={{ paddingLeft: `${indent + 10}px` }}
          >
            {item.text}
          </button>
        )
      })}
    </nav>
  )
}

// ============ Back to Top Button ============

function BackToTopButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 z-50 size-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center transition-all duration-300 hover:bg-primary/90 hover:scale-110 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      title="回到顶部"
      aria-label="回到顶部"
    >
      <ArrowUp className="size-5" strokeWidth={2.5} />
    </button>
  )
}

// ============ Main Component ============

export function PageView({ page, allPages, onEdit, onDelete, onNavigateToPage, onBack }: PageViewProps) {
  const backlinkPages = allPages.filter((p) => page.backlinks.includes(p.id))
  const tocItems = useMemo(() => extractTocItems(page.content), [page.content])

  // Scroll tracking state
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [tocCollapsed, setTocCollapsed] = useState(false)

  // Heading ID counter — used by custom heading components
  // We don't inject HTML into markdown; instead, heading components set IDs directly
  const headingCounterRef = React.useRef(0)
  // Reset counter when content changes
  useEffect(() => {
    headingCounterRef.current = 0
  }, [page.content])

  const nextHeadingId = useCallback(() => {
    headingCounterRef.current++
    return `heading-${headingCounterRef.current}`
  }, [])

  // Scroll handler — listen on the <main> scroll container
  useEffect(() => {
    const mainEl = document.querySelector('main') as HTMLElement | null
    if (!mainEl) return

    const handleScroll = () => {
      const scrollTop = mainEl.scrollTop || 0
      setShowStickyBar(scrollTop > 160)
      setShowBackToTop(scrollTop > 300)
    }

    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    // Initial check in case already scrolled
    handleScroll()

    return () => {
      mainEl.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (tocItems.length === 0) return

    const rootEl = document.querySelector('main') || null

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting from top
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // Pick the one closest to the top
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveHeadingId(visible[0].target.id)
        }
      },
      {
        root: rootEl,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0.1,
      }
    )

    let count = 0
    for (const item of tocItems) {
      const el = document.getElementById(item.id)
      if (el) {
        observer.observe(el)
        count++
      }
    }

    return () => observer.disconnect()
  }, [tocItems])

  const getScrollContainer = useCallback((): HTMLElement | null => {
    return document.querySelector('main')
  }, [])

  const handleTocClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    const mainEl = getScrollContainer()
    if (el && mainEl) {
      const mainTop = mainEl.getBoundingClientRect().top
      const elTop = el.getBoundingClientRect().top + mainEl.scrollTop - mainTop - 72
      mainEl.scrollTo({ top: elTop, behavior: 'smooth' })
    }
  }, [getScrollContainer])

  const scrollToTop = useCallback(() => {
    const mainEl = getScrollContainer()
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [getScrollContainer])

  return (
    <div>
      {/* ===== Sticky Action Bar (appears on scroll) ===== */}
      <div
        className={`sticky top-0 z-30 transition-all duration-300 bg-background/80 backdrop-blur-sm border-b ${
          showStickyBar
            ? 'opacity-100 -translate-y-0 border-border'
            : 'opacity-0 -translate-y-full border-transparent pointer-events-none'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs shrink-0" onClick={onBack}>
              <ArrowLeft className="size-3" />
              返回
            </Button>
            <span className="text-sm font-medium truncate">{page.title}</span>
            <Badge variant="outline" className={`${PAGE_TYPE_COLORS[page.pageType]} text-[10px] h-5 px-1.5 shrink-0`}>
              {PAGE_TYPE_LABELS[page.pageType]}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={onEdit}>
              <Edit className="size-3" />
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
              删除
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Content + TOC Layout ===== */}
      <div className="flex gap-8 max-w-5xl mx-auto px-6 pb-16">
        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Header section (scrolls away) */}
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
            <MarkdownRenderer content={page.content} nextHeadingId={nextHeadingId} />
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

        {/* ===== TOC Sidebar (desktop only) ===== */}
        {tocItems.length > 0 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-none pr-2">
              {/* Toggle button */}
              <button
                onClick={() => setTocCollapsed(!tocCollapsed)}
                className="flex items-center justify-between w-full mb-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="font-semibold uppercase tracking-wider">目录</span>
                <span className="text-[10px]">{tocCollapsed ? '+' : '−'}</span>
              </button>
              {!tocCollapsed && (
                <TableOfContents
                  items={tocItems}
                  activeId={activeHeadingId}
                  onItemClick={handleTocClick}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ===== Back to Top Button ===== */}
      <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
    </div>
  )
}
