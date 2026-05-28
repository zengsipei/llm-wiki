'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Download,
  BookOpen,
  MessageSquare,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface InterviewFile {
  id: string
  title: string
  subtitle: string
  description: string
  filename: string
  icon: React.ReactNode
  color: string
  borderColor: string
}

const files: InterviewFile[] = [
  {
    id: 'transcript',
    title: '面试实录',
    subtitle: '完整原文对话',
    description:
      '基于 Matt Pocock grill-me 风格的 Socratic 面试完整记录。包含 Q1~Q10 全部问答 + 面试官总评，共 10 个问题，覆盖项目架构、分布式系统、支付设计、异步队列、技术决策等核心话题。',
    filename: 'interview-full.md',
    icon: <MessageSquare className="size-5" />,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'stories',
    title: '面试故事库',
    subtitle: 'STAR 格式拆解',
    description:
      '将面试中的 9 个核心经验整理为 STAR 格式故事。涵盖快照队列、K8s Pod 架构、PHP-Go 协作、支付双保障、异步队列、技术决策等，可直接用于面试准备。',
    filename: 'stories.md',
    icon: <BookOpen className="size-5" />,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
  },
]

export default function InterviewPage() {
  const [markdownContent, setMarkdownContent] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMarkdown = async (filename: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/${filename}`)
      if (res.ok) {
        const text = await res.text()
        setMarkdownContent(text)
        setActiveFile(filename)
      }
    } catch {
      // silent fail
    }
    setLoading(false)
  }

  const handleBack = () => {
    setActiveFile(null)
    setMarkdownContent(null)
  }

  // Simple markdown to HTML conversion
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n')
    const html: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent: string[] = []
    let codeLang = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          html.push(
            <pre key={`code-${i}`} className="bg-muted rounded-lg p-4 overflow-x-auto text-xs my-4 font-mono">
              <code>{codeContent.join('\n')}</code>
            </pre>
          )
          codeContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
          codeLang = line.slice(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeContent.push(line)
        continue
      }

      // Empty lines
      if (line.trim() === '') {
        continue
      }

      // Horizontal rules
      if (line.trim() === '---') {
        html.push(<Separator key={`hr-${i}`} className="my-6" />)
        continue
      }

      // Headers
      if (line.startsWith('## ')) {
        html.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold mt-8 mb-3 flex items-center gap-2">
            {line.slice(3)}
          </h2>
        )
        continue
      }
      if (line.startsWith('# ')) {
        html.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold mt-6 mb-4">
            {line.slice(2)}
          </h1>
        )
        continue
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        html.push(
          <blockquote key={`bq-${i}`} className="border-l-3 border-primary/30 pl-4 my-3 text-sm text-muted-foreground italic">
            {renderInlineMarkdown(line.slice(2))}
          </blockquote>
        )
        continue
      }

      // List items
      if (line.match(/^\d+\.\s/) || line.startsWith('- ')) {
        const indent = line.match(/^(\s*)/)?.[1].length || 0
        const content = line.replace(/^\s*\d+\.\s/, '').replace(/^\s*-\s/, '')
        html.push(
          <li
            key={`li-${i}`}
            className="text-sm leading-relaxed ml-4 my-1 list-disc marker:text-muted-foreground"
            style={{ marginLeft: `${Math.min(indent * 8 + 16, 64)}px` }}
          >
            {renderInlineMarkdown(content)}
          </li>
        )
        continue
      }

      // Regular paragraphs
      html.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed my-2">
          {renderInlineMarkdown(line)}
        </p>
      )
    }

    return html
  }

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Bold
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <strong key={idx} className="font-semibold">
          {part}
        </strong>
      ) : (
        part
      )
    )
  }

  // Reader view
  if (activeFile && markdownContent) {
    const fileInfo = files.find((f) => f.filename === activeFile)
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={handleBack}>
                <ArrowLeft className="size-3.5" />
                返回
              </Button>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {fileInfo?.title}
              </span>
            </div>
            <a
              href={`/${activeFile}`}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Download className="size-3" />
                下载源文件
              </Button>
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">{renderMarkdown(markdownContent)}</main>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="size-3.5" />
              Wiki
            </Button>
          </Link>
          <div className="w-px h-5 bg-border" />
          <h1 className="text-sm font-semibold">面试准备</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
        {/* Intro */}
        <div className="mb-8">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
            Interview Preparation
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            面试<span className="text-primary">准备</span>资料
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            基于 2026-05-26 的一场 grill-me 风格深度技术面试整理。包含完整面试实录和 STAR
            格式故事库，用于面试前的回顾和准备。
          </p>
        </div>

        <Separator className="mb-8" />

        {/* File cards */}
        <div className="space-y-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className={`group border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${file.borderColor}`}
              onClick={() => fetchMarkdown(file.filename)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl w-12 h-12 flex items-center justify-center shrink-0 ${file.color}`}>
                    {file.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold">{file.title}</h2>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {file.subtitle}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      {file.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {file.filename}
                      </span>
                      <span className="text-[10px] text-primary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        点击阅读 <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground animate-pulse">加载中...</p>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 rounded-lg bg-muted/30 border p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="font-medium text-foreground/70">说明：</strong>
            这些文件存放在 <code className="text-[10px] bg-muted px-1 py-0.5 rounded">public/</code>{' '}
            目录下，同时也在 <code className="text-[10px] bg-muted px-1 py-0.5 rounded">download/</code>{' '}
            目录有备份。后续如需保留，建议迁移到独立路由管理。
          </p>
        </div>
      </main>
    </div>
  )
}
