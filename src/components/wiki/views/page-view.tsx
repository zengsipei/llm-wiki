'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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

// ============ TOC Sidebar: Light Bar + Floating Panel ============

function TocSidebar({
  items,
  activeId,
  onItemClick,
}: {
  items: TocItem[]
  activeId: string | null
  onItemClick: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const activeIndex = useMemo(
    () => items.findIndex((item) => item.id === activeId),
    [items, activeId]
  )
  const total = items.length
  // Calculate progress: position of the active heading indicator on the bar
  const progress = total > 1 ? (activeIndex >= 0 ? activeIndex / (total - 1) : 0) : 0

  return (
    <div
      className="hidden lg:block relative"
      style={{ width: '40px', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* === Light bar (always visible) === */}
      <div className="sticky top-16 h-[calc(100vh-5rem)] flex flex-col items-center pt-4 pb-4">
        {/* Track */}
        <div className="relative w-[3px] flex-1 rounded-full bg-border/60 overflow-visible">
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 w-full rounded-full bg-primary/20 transition-all duration-300 ease-out"
            style={{ height: `${Math.max(6, progress * 100)}%` }}
          />
          {/* Active dot */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] transition-all duration-300 ease-out"
            style={{ top: `${progress * 100}%`, marginTop: '-5px' }}
          />
        </div>
        {/* TOC icon at bottom */}
        <button
          className="mt-2 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          title="目录"
        >
          <List className="size-3.5" />
        </button>
      </div>

      {/* === Floating panel (hover) === */}
      <div
        className={`absolute right-0 top-0 z-40 w-64 max-h-[calc(100vh-3rem)] bg-popover border border-border rounded-xl shadow-2xl shadow-black/10 overflow-hidden transition-all duration-200 origin-top-right ${
          hovered
            ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-x-1 pointer-events-none'
        }`}
        style={{ marginTop: '4rem' }}
      >
        {/* Panel header */}
        <div className="sticky top-0 z-10 flex items-center gap-1.5 px-4 py-3 bg-popover/95 backdrop-blur-sm border-b border-border/50">
          <List className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">目录</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{total} 项</span>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto max-h-[calc(100vh-8rem)] py-1 px-1.5 scrollbar-thin">
          {items.map((item) => {
            const isActive = item.id === activeId
            const indent = (item.level - 2) * 14
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`flex items-center gap-1.5 w-full text-left text-[13px] py-[6px] px-2.5 rounded-md transition-all duration-150 truncate ${
                  isActive
                    ? 'text-primary font-medium bg-primary/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                style={{ paddingLeft: `${indent + 10}px` }}
              >
                {isActive && <ChevronRight className="size-3 shrink-0 text-primary" strokeWidth={3} />}
                {!isActive && <span className="w-3 shrink-0" />}
                <span className="truncate">{item.text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
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
  // Derive heading IDs from TOC items — guaranteed to match extractTocItems
  const headingIds = useMemo(() => tocItems.map((item) => item.id), [tocItems])

  // Scroll tracking state
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

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
    handleScroll()

    return () => {
      mainEl.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // IntersectionObserver for active heading tracking
  // Use a short delay to ensure heading DOM elements are rendered
  useEffect(() => {
    if (tocItems.length === 0) return

    const rootEl = document.querySelector('main') || null

    // Delay to ensure MarkdownRenderer has rendered headings with IDs
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting)
          if (visible.length > 0) {
            visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
            setActiveHeadingId(visible[0].target.id)
          }
        },
        {
          root: rootEl,
          rootMargin: '-60px 0px -75% 0px',
          threshold: 0.1,
        }
      )

      let observed = 0
      for (const item of tocItems) {
        const el = document.getElementById(item.id)
        if (el) {
          observer.observe(el)
          observed++
        }
      }

      // Store observer for cleanup
      return () => observer.disconnect()
    }, 150)

    return () => clearTimeout(timer)
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
      <div className="flex max-w-5xl mx-auto px-6 pb-16">
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

        {/* ===== TOC Sidebar: Light bar + floating panel ===== */}
        {tocItems.length > 0 && (
          <TocSidebar
            items={tocItems}
            activeId={activeHeadingId}
            onItemClick={handleTocClick}
          />
        )}
      </div>

      {/* ===== Back to Top Button ===== */}
      <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
    </div>
  )
}
