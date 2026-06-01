'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Menu, FileText, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { WikiSidebar } from '@/components/wiki/wiki-sidebar'
import { WikiHeader } from '@/components/wiki/wiki-header'
import { PageView } from '@/components/wiki/views/page-view'
import { PageEdit } from '@/components/wiki/views/page-edit'
import { IngestView } from '@/components/wiki/views/ingest-view'
import { QueryView } from '@/components/wiki/views/query-view'
import { LintView } from '@/components/wiki/views/lint-view'
import { LogsView } from '@/components/wiki/views/logs-view'
import { ExportView } from '@/components/wiki/views/export-view'
import type { WikiPage, ActivityLog, ActiveTab, QueryResult, LintReport } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'

export default function WikiPage() {
  // === State ===
  const [pages, setPages] = useState<WikiPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('view')
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WikiPage[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  // Derived state
  const selectedPage = pages.find((p) => p.id === selectedPageId) || null
  const displayPages = searchResults !== null ? searchResults : pages

  // === Data Fetching ===
  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/wiki')
      const data = await res.json()
      if (data.pages) {
        setPages(data.pages)
      }
    } catch {
      // silently fail on first load
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/wiki/logs')
      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPages(), fetchLogs()])
      setLoading(false)
    }
    init()
  }, [fetchPages, fetchLogs])

  // === Actions ===
  const handleSelectPage = (id: string) => {
    setSelectedPageId(id)
    setActiveTab('view')
    setSearchResults(null)
    setSearchQuery('')
  }

  const handleBack = () => {
    setSelectedPageId(null)
  }

  const handleCreateNew = () => {
    setSelectedPageId(null)
    setActiveTab('edit')
  }

  const handleSavePage = async (data: {
    title: string
    content: string
    pageType: string
    tags: string[]
  }) => {
    try {
      if (selectedPageId) {
        // Update existing page
        const res = await fetch(`/api/wiki/${selectedPageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '保存失败')
        }
        const result = await res.json()
        if (result.page) {
          setPages((prev) =>
            prev.map((p) => (p.id === selectedPageId ? result.page : p))
          )
          setSelectedPageId(selectedPageId)
          setActiveTab('view')
          toast({ title: '保存成功', description: `页面「${data.title}」已更新` })
        }
      } else {
        // Create new page
        const res = await fetch('/api/wiki', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || '创建失败')
        }
        const result = await res.json()
        const newPage = result
        setPages((prev) => [newPage, ...prev])
        setSelectedPageId(newPage.id)
        setActiveTab('view')
        toast({ title: '创建成功', description: `页面「${data.title}」已创建` })
      }
      fetchLogs()
    } catch (err) {
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePage = async () => {
    if (!selectedPageId) return
    try {
      const res = await fetch(`/api/wiki/${selectedPageId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '删除失败')
      }
      setPages((prev) => prev.filter((p) => p.id !== selectedPageId))
      setSelectedPageId(null)
      setActiveTab('view')
      toast({ title: '删除成功', description: '页面已被删除' })
      fetchLogs()
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      })
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    try {
      const res = await fetch(`/api/wiki/search?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      if (data.pages) {
        setSearchResults(data.pages)
        setSelectedPageId(null)
        setActiveTab('view')
        toast({
          title: '搜索完成',
          description: `找到 ${data.total} 个结果`,
        })
      }
    } catch {
      toast({
        title: '搜索失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleQuery = async (question: string): Promise<QueryResult | null> => {
    const res = await fetch('/api/wiki/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || '查询失败')
    }
    fetchLogs()
    return { answer: data.answer, sources: data.sources || [] }
  }

  const handleLint = async (): Promise<LintReport | null> => {
    try {
      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '检查失败')
      }
      fetchLogs()
      fetchPages()
      return data
    } catch (err: any) {
      // Network errors / timeout / DNS failure etc.
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('网络错误：无法连接到服务，请检查网络或稍后重试')
      }
      throw err
    }
  }

  const handleIngestDone = async () => {
    await fetchPages()
    await fetchLogs()
    toast({ title: '摄入完成', description: '知识页面已更新' })
  }

  // Watch ingestView to refresh pages after ingest completes
  useEffect(() => {
    if (activeTab === 'ingest') {
      // Already in ingest tab, the component handles it
    }
  }, [activeTab])

  // === Render ===
  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Separator />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      )
    }

    // Show search results when active
    if (searchResults !== null && activeTab === 'view' && !selectedPageId) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              搜索结果: &quot;{searchQuery}&quot;
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSearchResults(null)
                setSearchQuery('')
              }}
            >
              清除搜索
            </Button>
          </div>
          {searchResults.length === 0 ? (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-8 text-center">
                <FileText className="size-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">未找到匹配的页面</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {searchResults.map((p) => (
                <Card
                  key={p.id}
                  className="border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPageId(p.id)
                    setSearchResults(null)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.title}</span>
                      <Badge variant="outline" className={PAGE_TYPE_COLORS[p.pageType]}>
                        {PAGE_TYPE_LABELS[p.pageType]}
                      </Badge>
                    </div>
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {p.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {p.content.substring(0, 200)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    }

    switch (activeTab) {
      case 'view':
        if (selectedPage) {
          return (
            <PageView
              page={selectedPage}
              allPages={pages}
              onEdit={() => setActiveTab('edit')}
              onDelete={handleDeletePage}
              onNavigateToPage={handleSelectPage}
              onBack={handleBack}
            />
          )
        }
        // Default: no page selected, show welcome or page list
        if (pages.length > 0) {
          return (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">所有页面</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleCreateNew}
                >
                  <Plus className="size-3.5" />
                  新建页面
                </Button>
              </div>
              <div className="space-y-2">
                {pages.map((p) => (
                  <Card
                    key={p.id}
                    className="border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectPage(p.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{p.title}</span>
                        <Badge variant="outline" className={PAGE_TYPE_COLORS[p.pageType]}>
                          {PAGE_TYPE_LABELS[p.pageType]}
                        </Badge>
                      </div>
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {p.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.content.substring(0, 200)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        }
        return (
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-12 text-center">
                <div className="size-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="size-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">欢迎使用 LLM Wiki</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  这是一个基于 AI 的智能知识库系统。你可以摄入文档，自动生成知识页面，并进行知识问答。
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    className="gap-2"
                    onClick={() => setActiveTab('ingest')}
                  >
                    <Plus className="size-4" />
                    开始摄入文档
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleCreateNew}
                  >
                    手动创建页面
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'edit':
        return (
          <PageEdit
            page={selectedPage}
            onSave={handleSavePage}
            onCancel={() => {
              setActiveTab('view')
              if (!selectedPageId) handleBack()
            }}
          />
        )

      case 'ingest':
        return <IngestView onIngest={async () => {}} loading={false} />

      case 'query':
        return <QueryView onQuery={handleQuery} onSelectPage={handleSelectPage} />

      case 'lint':
        return <LintView onLint={handleLint} />

      case 'logs':
        return <LogsView logs={logs} onSelectPage={handleSelectPage} />

      case 'export':
        return <ExportView pages={pages} />

      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <WikiHeader
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q)
          if (!q.trim()) setSearchResults(null)
        }}
        onSearch={handleSearch}
        onToggleSidebar={() => setSidebarMobileOpen(true)}
      />

      {/* Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <WikiSidebar
          pages={displayPages}
          selectedPageId={selectedPageId}
          activeTab={activeTab}
          logsCount={logs.length}
          onSelectPage={handleSelectPage}
          onSetActiveTab={(tab) => {
            setActiveTab(tab)
            if (tab === 'view' && !selectedPageId) {
              // stay on list view
            }
          }}
          onCreateNew={handleCreateNew}
          isMobileOpen={sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 pb-16">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
