'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Save, X, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { MarkdownRenderer } from '@/components/wiki/markdown-renderer'
import type { WikiPage } from '@/types/wiki'

// Dynamic import MDXEditor (client-only component)
const MdxEditorWrapper = dynamic(
  () => import('@/components/wiki/mdx-editor-wrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[300px] border border-border rounded-lg">
        <span className="text-sm text-muted-foreground">加载编辑器...</span>
      </div>
    ),
  }
)

interface PageEditProps {
  page?: WikiPage | null
  onSave: (data: { title: string; content: string; pageType: string; tags: string[] }) => void
  onCancel: () => void
  loading?: boolean
}

export function PageEdit({ page, onSave, onCancel, loading }: PageEditProps) {
  const [title, setTitle] = useState(page?.title || '')
  const [content, setContent] = useState(page?.content || '')
  const [pageType, setPageType] = useState(page?.pageType || 'concept')
  const [tagsStr, setTagsStr] = useState(page?.tags?.join(', ') || '')
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  const handleSave = useCallback(() => {
    if (!title.trim() || !content.trim()) return
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ title: title.trim(), content: content.trim(), pageType, tags })
  }, [title, content, pageType, tagsStr, onSave])

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }, [handleSave])

  return (
    <div className="max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {page ? '编辑页面' : '新建页面'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={onCancel}>
            <X className="size-3.5" />
            取消
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="page-title" className="text-sm font-medium">
            页面标题
          </Label>
          <Input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入页面标题..."
            className="h-10"
          />
        </div>

        {/* Page type + Tags row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">页面类型</Label>
            <Select value={pageType} onValueChange={setPageType}>
              <SelectTrigger className="h-10 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entity">实体 (Entity)</SelectItem>
                <SelectItem value="concept">概念 (Concept)</SelectItem>
                <SelectItem value="summary">摘要 (Summary)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="page-tags" className="text-sm font-medium">
              标签 <span className="text-muted-foreground font-normal">（逗号分隔）</span>
            </Label>
            <Input
              id="page-tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="例如: 人工智能, 机器学习"
              className="h-10"
            />
          </div>
        </div>

        <Separator />

        {/* Content with Edit/Preview toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              内容 <span className="text-muted-foreground font-normal">（Markdown 格式）</span>
            </Label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === 'edit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="size-3" />
                编辑
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="size-3" />
                预览
              </button>
            </div>
          </div>

          {viewMode === 'edit' ? (
            <MdxEditorWrapper
              markdown={content}
              onChange={setContent}
              placeholder="# 标题&#10;&#10;在此输入 Markdown 内容...&#10;&#10;支持 Callout: > [!tip] 内容&#10;支持图表: ```mermaid"
            />
          ) : (
            <div className="border border-border rounded-lg p-4 min-h-[300px] bg-background">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
            className="gap-1.5"
          >
            <Save className="size-3.5" />
            {loading ? '保存中...' : '保存'}
          </Button>
          <span className="text-xs text-muted-foreground">Ctrl+S 快速保存</span>
        </div>
      </div>
    </div>
  )
}
