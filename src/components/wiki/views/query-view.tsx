'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageSquare, BookOpen, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MarkdownRenderer } from '@/components/wiki/markdown-renderer'
import type { WikiPage, QueryResult } from '@/types/wiki'

interface QueryViewProps {
  onQuery: (question: string) => Promise<QueryResult | null>
  onSelectPage: (id: string) => void
}

interface QueryHistoryItem {
  question: string
  result: QueryResult
  timestamp: Date
}

export function QueryView({ onQuery, onSelectPage }: QueryViewProps) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentResult, history])

  const handleSubmit = async () => {
    if (!question.trim() || loading) return
    setError(null)
    setLoading(true)
    setCurrentResult(null)

    try {
      const result = await onQuery(question.trim())
      if (result) {
        setCurrentResult(result)
        setHistory((prev) =>
          [{ question: question.trim(), result, timestamp: new Date() }, ...prev].slice(0, 5)
        )
      }
    } catch {
      setError('查询失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="size-5" />
          知识问答
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          向知识库提问，AI 将从已有页面中检索相关内容并生成回答
        </p>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              历史记录
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setHistory([])}
            >
              <RotateCcw className="size-3" />
              清除
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item, i) => (
              <button
                key={i}
                className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors text-foreground/80 hover:text-foreground truncate max-w-[200px]"
                onClick={() => {
                  setQuestion(item.question)
                  setCurrentResult(item.result)
                }}
              >
                {item.question}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator className="mb-6" />

      {/* Question input */}
      <div className="mb-6">
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="输入你的问题... (按 Enter 提交)"
            className="min-h-[80px] pr-14 resize-none text-sm leading-6"
            disabled={loading}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-9 w-9 rounded-lg"
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <Card className="bg-muted/30 border-0 mb-6">
          <CardContent className="p-6 flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">AI 正在检索知识库并生成回答...</span>
          </CardContent>
        </Card>
      )}

      {/* Answer */}
      {currentResult && !loading && (
        <Card className="border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="size-4 text-primary" />
              <span className="text-sm font-semibold">回答</span>
            </div>
            <div className="mb-4">
              <MarkdownRenderer content={currentResult.answer} />
            </div>

            {/* Sources */}
            {currentResult.sources.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="size-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    参考来源
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {currentResult.sources.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {currentResult.sources.map((source) => (
                    <button
                      key={source.id}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border bg-background/50 hover:bg-accent transition-colors"
                      onClick={() => onSelectPage(source.id)}
                    >
                      <BookOpen className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{source.title}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
