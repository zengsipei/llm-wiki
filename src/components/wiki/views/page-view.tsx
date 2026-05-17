'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Edit, Trash2, Tag, Clock, ArrowLeft, Link2, ArrowUp, List, ChevronRight } from 'lucide-react'
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

// ============ TOC: Fixed Light Bar + Fixed Floating Panel ============

function TocSidebar({
  items,
  activeIndex,
  readProgress,
  onItemClick,
}: {
  items: TocItem[]
  activeIndex: number
  readProgress: number // 0..1
  onItemClick: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [panelHovered, setPanelHovered] = useState(false)
  const activeListRef = useRef<HTMLDivElement>(null)
  const total = items.length

  // Auto-scroll active item into view when panel opens
  useEffect(() => {
    if (!panelHovered || !activeListRef.current || activeIndex < 0) return
    // Use requestAnimationFrame to ensure DOM is ready after panel becomes visible
    const raf = requestAnimationFrame(() => {
      const activeEl = activeListRef.current?.querySelector(`[data-toc-index="${activeIndex}"]`)
      if (activeEl) {
        const container = activeListRef.current
        const elTop = (activeEl as HTMLElement).offsetTop
        const elHeight = (activeEl as HTMLElement).offsetHeight
        const scrollTop = container.scrollTop
        const viewHeight = container.clientHeight
        // Scroll if the active element is outside the visible area
        if (elTop < scrollTop || elTop + elHeight > scrollTop + viewHeight) {
          container.scrollTo({ top: elTop - viewHeight / 3, behavior: 'smooth' })
        }
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [panelHovered, activeIndex])

  const showPanel = hovered || panelHovered

  return (
    <>
      {/* === Fixed Light Bar (right edge of viewport) === */}
      <div
        className="hidden lg:block fixed right-0 z-30"
        style={{ top: '4rem', width: '36px', height: 'calc(100vh - 5rem)' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-full flex flex-col items-center px-2 pt-3 pb-3">
          {/* Track */}
          <div className="relative w-[3px] flex-1 rounded-full bg-border/40">
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 w-full rounded-full bg-primary/25 transition-[height] duration-200 ease-out"
              style={{ height: `${Math.max(4, readProgress * 100)}%` }}
            />
            {/* Active dot */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[9px] h-[9px] rounded-full bg-primary ring-2 ring-primary/20 transition-[top] duration-200 ease-out"
              style={{ top: `${readProgress * 100}%`, marginTop: '-5px' }}
            />
          </div>
          {/* TOC icon at bottom */}
          <div className="mt-1.5 p-1 rounded text-muted-foreground/50">
            <List className="size-3" />
          </div>
        </div>
      </div>

      {/* === Fixed Floating Panel (hover) === */}
      <div
        className={`hidden lg:block fixed z-40 w-72 bg-popover border border-border rounded-xl shadow-2xl shadow-black/8 overflow-hidden transition-all duration-150 ease-out ${
          showPanel
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-[0.97] pointer-events-none'
        }`}
        style={{
          right: '40px',
          top: '4.5rem',
          maxHeight: 'calc(100vh - 6rem)',
        }}
        onMouseEnter={() => setPanelHovered(true)}
        onMouseLeave={() => setPanelHovered(false)}
      >
        {/* Panel header */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/30 border-b border-border/50">
          <List className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground tracking-wider">目录</span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/60">{total} 项</span>
        </div>

        {/* Scrollable heading list */}
        <div
          ref={activeListRef}
          className="overflow-y-auto py-1.5 px-1"
          style={{ maxHeight: 'calc(100vh - 10rem)' }}
        >
          {items.map((item, idx) => {
            const isActive = idx === activeIndex
            const indent = (item.level - 2) * 12
            return (
              <button
                key={item.id}
                data-toc-index={idx}
                onClick={() => onItemClick(item.id)}
                className={`flex items-center gap-1 w-full text-left text-[13px] py-[5px] px-2 rounded-md transition-colors duration-100 truncate ${
                  isActive
                    ? 'text-primary font-medium bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                style={{ paddingLeft: `${indent + 8}px` }}
              >
                {isActive && <ChevronRight className="size-2.5 shrink-0 text-primary" strokeWidth={3} />}
                {!isActive && <span className="w-2.5 shrink-0" />}
                <span className="truncate">{item.text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
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
  const headingIds = useMemo(() => tocItems.map((item) => item.id), [tocItems])

  // Scroll tracking state
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(-1)
  const [readProgress, setReadProgress] = useState(0)

  // Unified scroll handler: progress + active heading + sticky bar + back-to-top
  useEffect(() => {
    const mainEl = document.querySelector('main') as HTMLElement | null
    if (!mainEl) return

    const handleScroll = () => {
      const scrollTop = mainEl.scrollTop || 0
      const scrollHeight = mainEl.scrollHeight || 1
      const clientHeight = mainEl.clientHeight || 1

      // Reading progress (0..1)
      const maxScroll = scrollHeight - clientHeight
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0
      setReadProgress(progress)

      // UI toggles
      setShowStickyBar(scrollTop > 160)
      setShowBackToTop(scrollTop > 300)

      // Find active heading: last heading whose top is above viewport top + 80px
      if (tocItems.length > 0) {
        const viewportTop = mainEl.getBoundingClientRect().top + 80
        let activeIdx = -1
        for (let i = 0; i < tocItems.length; i++) {
          const el = document.getElementById(tocItems[i].id)
          if (el && el.getBoundingClientRect().top <= viewportTop) {
            activeIdx = i
          }
        }
        // Default to first heading if scrolled but none in active zone yet
        if (activeIdx < 0 && scrollTop > 10) activeIdx = 0
        setActiveHeadingIndex(activeIdx)
      }
    }

    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    // Initial calculation
    // Small delay to ensure headings are rendered
    const initTimer = setTimeout(() => handleScroll(), 200)

    return () => {
      mainEl.removeEventListener('scroll', handleScroll)
      clearTimeout(initTimer)
    }
  }, [tocItems])

  const getScrollContainer = useCallback((): HTMLElement | null => {
    return document.querySelector('main')
  }, [])

  const handleTocClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      // scroll-margin-top (80px) on headings ensures the heading is not hidden behind the sticky bar
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

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

      {/* ===== Content area (full width, no TOC in flow) ===== */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
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
          <MarkdownRenderer content={page.content} headingIds={headingIds} />
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

      {/* ===== Fixed TOC: Light bar + floating panel (outside scroll flow) ===== */}
      {tocItems.length > 0 && (
        <TocSidebar
          items={tocItems}
          activeIndex={activeHeadingIndex}
          readProgress={readProgress}
          onItemClick={handleTocClick}
        />
      )}

      {/* ===== Back to Top Button ===== */}
      <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
    </div>
  )
}
