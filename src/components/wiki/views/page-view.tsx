'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Edit, Trash2, Tag, Clock, ArrowLeft, Link2, ArrowUp, List, ChevronRight, Sparkles, Maximize2, Minimize2, Loader2, History, ChevronDown } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import type { WikiPage } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'

// ============ Widget Types ============

interface WidgetInfo {
  filename: string
  url: string
  generatedAt: string
}

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
// Skips lines inside code blocks (triple backtick fences)
function extractTocItems(content: string): TocItem[] {
  const items: TocItem[] = []
  const lines = content.split('\n')
  let counter = 0
  let inCodeBlock = false

  for (const line of lines) {
    // Toggle code block state on fenced code blocks
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    // Skip lines inside code blocks
    if (inCodeBlock) continue

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
  const [isOpen, setIsOpen] = useState(false)
  const activeListRef = useRef<HTMLDivElement>(null)
  const total = items.length

  // Auto-scroll active item into view when panel opens
  useEffect(() => {
    if (!isOpen || !activeListRef.current || activeIndex < 0) return
    const raf = requestAnimationFrame(() => {
      const activeEl = activeListRef.current?.querySelector(`[data-toc-index="${activeIndex}"]`)
      if (activeEl) {
        const container = activeListRef.current
        const elTop = (activeEl as HTMLElement).offsetTop
        const elHeight = (activeEl as HTMLElement).offsetHeight
        const scrollTop = container.scrollTop
        const viewHeight = container.clientHeight
        if (elTop < scrollTop || elTop + elHeight > scrollTop + viewHeight) {
          container.scrollTo({ top: elTop - viewHeight / 3, behavior: 'smooth' })
        }
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [isOpen, activeIndex])

  // Single container wrapping both bar and panel.
  // Width expands from 36px (bar only) to 328px (bar + gap + panel) when open,
  // so the mouse can travel seamlessly between bar ↔ panel with zero dead zone.
  // No timers needed — mouseLeave only fires when leaving the entire area.
  const panelW = 288 // w-72
  const panelR = 40  // right offset

  return (
    <div
      className="hidden lg:block fixed z-30 cursor-default"
      style={{
        right: 0,
        top: '4rem',
        width: isOpen ? panelW + panelR : 36,
        height: 'calc(100vh - 5rem)',
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Light Bar (right edge) */}
      <div className="absolute right-0 top-0 h-full w-9 flex flex-col items-center px-2 pt-3 pb-3">
        <div className="relative w-[3px] flex-1 rounded-full bg-border/40">
          <div
            className="absolute top-0 left-0 w-full rounded-full bg-primary/25 transition-[height] duration-200 ease-out"
            style={{ height: `${Math.max(4, readProgress * 100)}%` }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[9px] h-[9px] rounded-full bg-primary ring-2 ring-primary/20 transition-[top] duration-200 ease-out"
            style={{ top: `${readProgress * 100}%`, marginTop: '-5px' }}
          />
        </div>
        <div className="mt-1.5 p-1 rounded text-muted-foreground/50">
          <List className="size-3" />
        </div>
      </div>

      {/* Floating Panel */}
      <div
        className={`absolute w-72 bg-popover border border-border rounded-xl shadow-2xl shadow-black/8 overflow-hidden transition-[opacity,transform] duration-200 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-[0.97] pointer-events-none'
        }`}
        style={{
          right: `${panelR}px`,
          top: '0.5rem',
          maxHeight: 'calc(100vh - 6rem)',
        }}
      >
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/30 border-b border-border/50">
          <List className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground tracking-wider">目录</span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/60">{total} 项</span>
        </div>

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

// ============ Widget Panel Component ============

function WidgetPanel({ pageId }: { pageId: string }) {
  const [widgets, setWidgets] = useState<WidgetInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState(0)
  const [activeWidget, setActiveWidget] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hint, setHint] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch existing widgets
  const fetchWidgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/wiki/${pageId}/widgets`)
      const data = await res.json()
      if (data.widgets) {
        setWidgets(data.widgets)
        // Auto-select the latest widget
        if (data.widgets.length > 0 && !activeWidget) {
          setActiveWidget(data.widgets[0].url)
        }
      }
    } catch {
      // silently fail
    }
  }, [pageId, activeWidget])

  useEffect(() => {
    fetchWidgets()
  }, [fetchWidgets])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGenerateProgress(0)

    // Animated progress: 0→30% in 2s, 30→70% in 10s, 70→90% in 20s, then slow to 95%
    let progress = 0
    progressTimerRef.current = setInterval(() => {
      progress += progress < 30 ? 2 : progress < 70 ? 1 : progress < 90 ? 0.3 : 0.05
      if (progress > 95) progress = 95
      setGenerateProgress(Math.min(progress, 95))
    }, 100)

    try {
      const body: { hint?: string } = {}
      if (hint.trim()) body.hint = hint.trim()

      const res = await fetch(`/api/wiki/${pageId}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setGenerateProgress(100)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '生成失败')
      }

      const data = await res.json()
      if (data.widget) {
        toast({ title: 'Widget 生成成功', description: `已生成: ${data.widget.filename}` })
        setActiveWidget(data.widget.url)
        setHint('')
        await fetchWidgets()
      }
    } catch (err) {
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setGenerating(false)
      setGenerateProgress(0)
    }
  }, [pageId, hint, fetchWidgets])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const fullscreenContainer = isFullscreen
    ? 'fixed inset-0 z-50 bg-background'
    : ''
  const fullscreenIframe = isFullscreen
    ? 'w-full h-full border-0'
    : 'w-full border border-border rounded-lg'

  return (
    <div className={`my-6 ${fullscreenContainer}`}>
      {/* Widget Header */}
      <div className={`flex items-center justify-between mb-3 ${isFullscreen ? 'p-4 border-b' : ''}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">知识组件</span>
          {widgets.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
              {widgets.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {activeWidget && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={isFullscreen ? '退出全屏' : '全屏预览'}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className={`flex gap-3 ${isFullscreen ? 'h-[calc(100vh-4rem)] flex-col lg:flex-row p-4' : 'flex-col'}`}>
        {/* Sidebar: Generate + Widget list */}
        <div className={`flex-shrink-0 ${isFullscreen ? 'lg:w-64 overflow-y-auto' : 'mb-3'}`}>
          {/* Generate input */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={hint}
                onChange={e => setHint(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="生成提示（可选，如：流程图、交互演示）"
                className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                size="sm"
                className="h-8 px-3 gap-1 text-xs"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <><Loader2 className="size-3 animate-spin" />生成中</>
                ) : (
                  <><Sparkles className="size-3" />生成</>
                )}
              </Button>
            </div>
          </div>

          {/* Widget list */}
          {widgets.length > 0 && (
            <div className={`flex flex-row ${isFullscreen ? 'lg:flex-col' : ''} gap-1.5 overflow-x-auto lg:overflow-x-visible`}>
              {widgets.map((w, idx) => (
                <button
                  key={w.filename}
                  onClick={() => setActiveWidget(w.url)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors shrink-0 ${
                    activeWidget === w.url
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  {w.generatedAt && (
                    <span className="opacity-60">
                      {new Date(w.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Widget Preview */}
        <div className={`flex-1 min-h-0 ${isFullscreen ? 'min-h-0' : ''}`}>
          {activeWidget && !generating ? (
            <iframe
              ref={iframeRef}
              src={activeWidget}
              className={fullscreenIframe}
              style={{ minHeight: isFullscreen ? '100%' : '360px', maxHeight: isFullscreen ? '100%' : '600px' }}
              sandbox="allow-scripts allow-same-origin"
              title="Widget Preview"
            />
          ) : generating ? (
            /* Generating progress view */
            <div className="flex items-center justify-center rounded-lg border border-border/60 bg-background" style={{ minHeight: '360px' }}>
              <div className="text-center p-8 max-w-xs w-full">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
                    <circle
                      cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - generateProgress / 100)}`}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-300 ease-out"
                    />
                  </svg>
                  <Sparkles className="absolute inset-0 m-auto size-5 text-primary animate-pulse" />
                </div>
                <p className="text-sm font-medium mb-2">
                  {generateProgress < 20 ? '正在分析页面内容...' : generateProgress < 50 ? '正在设计交互组件...' : generateProgress < 80 ? '正在生成 HTML 代码...' : '即将完成...'}
                </p>
                <p className="text-xs text-muted-foreground/60 mb-4">
                  AI 正在为这个页面创建知识组件，通常需要 30~60 秒
                </p>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${generateProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/40 mt-2 tabular-nums">{Math.round(generateProgress)}%</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20" style={{ minHeight: '360px' }}>
              <div className="text-center p-6">
                <Sparkles className="size-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">暂无知识组件</p>
                <p className="text-xs text-muted-foreground/60">点击「生成」让 AI 为本页面创建交互式组件</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          title="关闭全屏"
        >
          <Minimize2 className="size-4" />
        </button>
      )}
    </div>
  )
}

// ============ Page History Component ============

function PageHistory({ pageId }: { pageId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [commits, setCommits] = useState<Array<{
    hash: string
    fullHash: string
    author: string
    date: string
    message: string
  }>>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wiki/${pageId}/history`)
      const data = await res.json()
      if (data.commits) {
        setCommits(data.commits)
        setLoaded(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [pageId, loaded])

  const handleToggle = useCallback(() => {
    if (!expanded && !loaded) {
      fetchHistory()
    }
    setExpanded(prev => !prev)
  }, [expanded, loaded, fetchHistory])

  return (
    <div className="my-4">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="size-3.5" />
        <span>版本历史</span>
        {loading && <Loader2 className="size-3 animate-spin" />}
        <ChevronDown className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-2 ml-5 border-l-2 border-border pl-4 space-y-2">
          {commits.length === 0 && !loading ? (
            <p className="text-xs text-muted-foreground py-2">暂无版本记录</p>
          ) : (
            commits.map((c, idx) => (
              <div key={c.fullHash || idx} className="flex items-start gap-2 text-xs py-1">
                <code className="shrink-0 px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {c.hash}
                </code>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground/80 truncate">{c.message}</p>
                  <p className="text-muted-foreground/60 mt-0.5">
                    {c.author} · {c.date ? new Date(c.date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
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

  // Helper: get element's scroll-content offset relative to <main>
  // offsetTop/offsetParent is unreliable when <main> lacks position:relative.
  // This getBoundingClientRect formula is mathematically invariant to scroll.
  const getContentOffset = useCallback((el: HTMLElement, mainEl: HTMLElement): number => {
    return el.getBoundingClientRect().top - mainEl.getBoundingClientRect().top + mainEl.scrollTop
  }, [])

  // Unified scroll handler (rAF-throttled):
  // progress + sticky bar + back-to-top + active heading (zread-style)
  useEffect(() => {
    const mainEl = document.querySelector('main') as HTMLElement | null
    if (!mainEl) return

    // Pre-collect heading offsets relative to mainEl's scroll content
    const headingOffsets: number[] = []
    for (const item of tocItems) {
      const el = document.getElementById(item.id)
      if (el) headingOffsets.push(getContentOffset(el, mainEl))
    }

    let rafId = 0

    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const scrollTop = mainEl.scrollTop || 0
        const scrollHeight = mainEl.scrollHeight || 1
        const clientHeight = mainEl.clientHeight || 1

        // Reading progress (0..1)
        const maxScroll = scrollHeight - clientHeight
        setReadProgress(maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0)

        // UI toggles
        setShowStickyBar(scrollTop > 160)
        setShowBackToTop(scrollTop > 300)

        // Active heading: first heading visible below the sticky bar
        if (headingOffsets.length > 0) {
          const stickyBarH = 48
          let activeIdx = -1
          for (let i = 0; i < headingOffsets.length; i++) {
            if (headingOffsets[i] >= scrollTop + stickyBarH) {
              activeIdx = i
              break
            }
          }
          // All headings scrolled past → use the last one
          if (activeIdx < 0) activeIdx = headingOffsets.length - 1
          setActiveHeadingIndex(activeIdx)
        }
      })
    }

    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    const initTimer = setTimeout(handleScroll, 250)

    return () => {
      mainEl.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
      clearTimeout(initTimer)
    }
  }, [tocItems, getContentOffset])

  const getScrollContainer = useCallback((): HTMLElement | null => {
    return document.querySelector('main')
  }, [])

  const handleTocClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    const mainEl = getScrollContainer()
    if (el && mainEl) {
      const offset = getContentOffset(el, mainEl)
      const stickyBarH = 48
      mainEl.scrollTo({ top: Math.max(0, offset - stickyBarH), behavior: 'smooth' })
    }
  }, [getScrollContainer, getContentOffset])

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

        {/* Widget Panel */}
        <WidgetPanel pageId={page.id} />

        {/* Version History */}
        <PageHistory pageId={page.id} />

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
