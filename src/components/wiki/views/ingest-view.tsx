'use client'

import React, { useState } from 'react'
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { WikiPage } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'

interface IngestViewProps {
  onIngest: (data: { title: string; content: string; sourceType: string }) => Promise<void>
  loading: boolean
}

export function IngestView({ onIngest, loading }: IngestViewProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceType, setSourceType] = useState('manual')
  const [result, setResult] = useState<WikiPage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    setError(null)
    setResult(null)

    try {
      // We'll capture result through a modified callback
      const response = await fetch('/api/wiki/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          sourceType,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || '摄入失败')
        return
      }
      setResult(data.pages || [])
    } catch {
      setError('网络错误，请重试')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Upload className="size-5" />
          文档摄入
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          将文档内容提交给 AI，自动解析并生成结构化的知识页面
        </p>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="ingest-title" className="text-sm font-medium">
            文档标题
          </Label>
          <Input
            id="ingest-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如: 机器学习入门教程"
            className="h-10"
            disabled={loading}
          />
        </div>

        {/* Source Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">来源类型</Label>
          <Select value={sourceType} onValueChange={setSourceType} disabled={loading}>
            <SelectTrigger className="h-10 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">手动输入</SelectItem>
              <SelectItem value="file">文件上传</SelectItem>
              <SelectItem value="web">网页抓取</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="ingest-content" className="text-sm font-medium">
            文档内容
          </Label>
          <Textarea
            id="ingest-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此粘贴文档内容...&#10;&#10;AI 将分析内容并自动生成多个知识页面。支持各类文本格式。"
            className="min-h-[300px] text-sm leading-6 resize-y"
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !content.trim()}
          className="gap-2"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              AI 分析中...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              开始摄入
            </>
          )}
        </Button>
      </div>

      {/* Success result */}
      {result && result.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <h3 className="text-lg font-semibold">
              成功生成 {result.length} 个知识页面
            </h3>
          </div>
          <div className="grid gap-3">
            {result.map((p) => (
              <Card key={p.id} className="bg-muted/30 border hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{p.title}</span>
                    <Badge variant="outline" className={PAGE_TYPE_COLORS[p.pageType]}>
                      {PAGE_TYPE_LABELS[p.pageType]}
                    </Badge>
                  </div>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {p.content.substring(0, 150)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <>
          <Separator className="my-8" />
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm text-destructive font-medium">错误: {error}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
