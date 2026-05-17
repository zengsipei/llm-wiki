'use client'

import React, { useState } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { WikiPage } from '@/types/wiki'

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

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ title: title.trim(), content: content.trim(), pageType, tags })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {page ? '编辑页面' : '新建页面'}
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={onCancel}>
          <X className="size-3.5" />
          取消
        </Button>
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

        {/* Page type */}
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

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="page-tags" className="text-sm font-medium">
            标签 <span className="text-muted-foreground font-normal">（用逗号分隔）</span>
          </Label>
          <Input
            id="page-tags"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="例如: 人工智能, 机器学习, 深度学习"
            className="h-10"
          />
        </div>

        <Separator />

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="page-content" className="text-sm font-medium">
            内容 <span className="text-muted-foreground font-normal">（Markdown 格式）</span>
          </Label>
          <Textarea
            id="page-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# 标题&#10;&#10;在此输入 Markdown 内容..."
            className="min-h-[400px] font-mono text-sm leading-6 resize-y [font-variant-ligatures:none]"
          />
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
          <Button variant="outline" onClick={onCancel} className="gap-1.5">
            <X className="size-3.5" />
            取消
          </Button>
        </div>
      </div>
    </div>
  )
}
