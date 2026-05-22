'use client'

import React, { useState, useCallback, useRef, useEffect, useId } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy, Terminal, Play, ExternalLink, Loader2, AlertTriangle, Info, Lightbulb, AlertCircle, XCircle } from 'lucide-react'

// ============ Types ============

interface MarkdownRendererProps {
  content: string
  headingIds?: string[]
}

// ============ Callout Types ============

type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'info'

interface CalloutConfig {
  label: string
  icon: React.ElementType
  bgClass: string
  borderClass: string
  textClass: string
  iconClass: string
}

const CALLOUT_CONFIG: Record<CalloutType, CalloutConfig> = {
  note: {
    label: 'Note',
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-l-blue-500 dark:border-l-blue-400',
    textClass: 'text-blue-900 dark:text-blue-100',
    iconClass: 'text-blue-500 dark:text-blue-400',
  },
  tip: {
    label: 'Tip',
    icon: Lightbulb,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-l-emerald-500 dark:border-l-emerald-400',
    textClass: 'text-emerald-900 dark:text-emerald-100',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
  },
  important: {
    label: 'Important',
    icon: AlertCircle,
    bgClass: 'bg-purple-50 dark:bg-purple-950/30',
    borderClass: 'border-l-purple-500 dark:border-l-purple-400',
    textClass: 'text-purple-900 dark:text-purple-100',
    iconClass: 'text-purple-500 dark:text-purple-400',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-l-amber-500 dark:border-l-amber-400',
    textClass: 'text-amber-900 dark:text-amber-100',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  caution: {
    label: 'Caution',
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-l-red-500 dark:border-l-red-400',
    textClass: 'text-red-900 dark:text-red-100',
    iconClass: 'text-red-500 dark:text-red-400',
  },
  info: {
    label: 'Info',
    icon: Info,
    bgClass: 'bg-sky-50 dark:bg-sky-950/30',
    borderClass: 'border-l-sky-500 dark:border-l-sky-400',
    textClass: 'text-sky-900 dark:text-sky-100',
    iconClass: 'text-sky-500 dark:text-sky-400',
  },
}

// Parse callout syntax: > [!type] Title\n> Content
function parseCallout(text: string): { type: CalloutType; title: string; content: string } | null {
  const match = text.match(/^\[!(\w+)\]\s*(.*)\n([\s\S]*)$/)
  if (!match) return null

  const type = match[1].toLowerCase() as CalloutType
  if (!CALLOUT_CONFIG[type]) return null

  return {
    type,
    title: match[2].trim() || CALLOUT_CONFIG[type].label,
    content: match[3].trim(),
  }
}

// ============ Callout Component ============

function CalloutBlock({ type, title, children }: { type: CalloutType; title: string; children: React.ReactNode }) {
  const config = CALLOUT_CONFIG[type]
  const Icon = config.icon

  return (
    <div className={`my-4 not-prose rounded-lg border-l-4 p-4 ${config.bgClass} ${config.borderClass}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`size-4 shrink-0 ${config.iconClass}`} />
        <span className={`text-sm font-semibold ${config.textClass}`}>{title}</span>
      </div>
      <div className={`text-sm leading-relaxed ${config.textClass}`}>
        {children}
      </div>
    </div>
  )
}

// ============ Mermaid Component ============

function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    let cancelled = false

    async function renderMermaid() {
      try {
        setLoading(true)
        setError('')

        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: "'Noto Sans SC', 'Inter', system-ui, sans-serif",
          fontSize: 14,
        })

        // Sanitize: remove any HTML tags from the code to prevent injection
        const sanitized = code.replace(/<[^>]*>/g, '')

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id.replace(/:/g, '-')}`, sanitized)

        if (!cancelled) {
          setSvg(renderedSvg)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Mermaid render failed')
          setLoading(false)
        }
      }
    }

    renderMermaid()

    return () => {
      cancelled = true
      // Clean up any mermaid-created elements
      const el = document.getElementById(`mermaid-${id.replace(/:/g, '-')}`)
      if (el) el.remove()
      const svgEl = document.getElementById(`dmermaid-${id.replace(/:/g, '-')}`)
      if (svgEl) svgEl.remove()
    }
  }, [code, id])

  if (loading) {
    return (
      <div className="my-4 not-prose flex items-center justify-center p-8 rounded-lg border border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>渲染图表中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-4 not-prose p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <div className="flex items-center gap-2 text-sm text-destructive mb-2">
          <AlertCircle className="size-4" />
          <span className="font-medium">图表渲染失败</span>
        </div>
        <pre className="text-xs text-destructive/70 overflow-x-auto">{error}</pre>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer">查看原始代码</summary>
          <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">{code}</pre>
        </details>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-4 not-prose flex justify-center p-4 rounded-lg border border-border/60 bg-muted/20 overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

// ============ Interactive Code Preview ============

function CodePreviewModal({
  code,
  language,
  onClose,
}: {
  code: string
  language: string
  onClose: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewId = useId()

  useEffect(() => {
    if (!iframeRef.current) return

    const htmlContent = language === 'html'
      ? code
      : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;}</style>
</head>
<body>
<script>${code}<\/script>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    iframeRef.current.src = url

    return () => URL.revokeObjectURL(url)
  }, [code, language, previewId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl border w-[90vw] max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Play className="size-4 text-emerald-500" />
            <span>代码预览</span>
            <span className="text-xs text-muted-foreground ml-2">({language})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (iframeRef.current?.src) {
                  window.open(iframeRef.current.src, '_blank')
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="size-3" />
              新窗口打开
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
          />
        </div>
      </div>
    </div>
  )
}

// ============ Code Block Component ============

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  const displayLang = language === 'text' ? '' : language
  const isRunnable = ['html', 'javascript', 'js'].includes(language)
  const isMermaid = language === 'mermaid'

  // Mermaid code blocks render as SVG diagrams
  if (isMermaid) {
    return <MermaidDiagram code={code} />
  }

  return (
    <>
      <div className="relative group">
        <div className="flex items-center justify-between px-4 py-2 bg-[#282c34] border-b border-[#3e4451]">
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-[#636d83]" />
            <span className="text-xs font-medium text-[#636d83] uppercase tracking-wider">
              {displayLang || 'code'}
            </span>
            {isRunnable && (
              <span className="text-[10px] text-[#636d83]/60 ml-1">（可运行）</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isRunnable && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#636d83] hover:text-emerald-400 hover:bg-[#3e4451] transition-colors"
                title="运行预览"
              >
                <Play className="size-3.5" />
                <span>运行</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#636d83] hover:text-[#abb2bf] hover:bg-[#3e4451] transition-colors"
              title={copied ? '已复制' : '复制代码'}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>复制</span>
                </>
              )}
            </button>
          </div>
        </div>

        <SyntaxHighlighter
          language={displayLang || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            background: '#282c34',
            borderRadius: 0,
          }}
          showLineNumbers={code.split('\n').length > 3}
          lineNumberStyle={{
            color: '#4b5263',
            fontSize: '0.75rem',
            minWidth: '2.5em',
            paddingRight: '1em',
            userSelect: 'none',
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {showPreview && (
        <CodePreviewModal
          code={code}
          language={language}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}

// ============ Helpers ============

// Extract plain text from React children (strip HTML tags)
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText(((children as React.ReactElement).props as Record<string, unknown>).children as React.ReactNode)
  }
  return ''
}

// ============ Main MarkdownRenderer ============

export function MarkdownRenderer({ content, headingIds }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">暂无内容</p>
  }

  // Index into headingIds — resets synchronously when headingIds changes
  const headingIndexRef = useRef(0)
  headingIndexRef.current = 0

  // Create heading components that assign IDs from the headingIds array
  const createHeadingComponent = (Tag: 'h1' | 'h2' | 'h3' | 'h4', className: string) => {
    const HeadingComponent = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = headingIds ? headingIds[headingIndexRef.current] : undefined
      headingIndexRef.current++
      return (
        <Tag id={id} className={className} {...props}>
          {children}
        </Tag>
      )
    }
    HeadingComponent.displayName = Tag.toUpperCase()
    return HeadingComponent
  }

  const H1 = createHeadingComponent('h1', 'text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border first:mt-0')
  const H2 = createHeadingComponent('h2', 'text-xl font-semibold mt-6 mb-3 pb-1 border-b border-border/50')
  const H3 = createHeadingComponent('h3', 'text-lg font-semibold mt-5 mb-2')
  const H4 = createHeadingComponent('h4', 'text-base font-semibold mt-4 mb-2')

  return (
    <div className="markdown-content prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: H1,
          h2: H2,
          h3: H3,
          h4: H4,
          p: ({ children }) => (
            <p className="my-3 leading-7 text-sm text-foreground/90">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 ml-6 list-disc space-y-1.5 text-sm text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-6 list-decimal space-y-1.5 text-sm text-foreground/90">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),
          // Enhanced blockquote with callout support
          blockquote: ({ children, ...props }) => {
            // Try to extract callout from children
            const childArray = React.Children.toArray(children)
            if (childArray.length > 0) {
              const firstChild = childArray[0]
              if (React.isValidElement(firstChild) && firstChild.type === 'p') {
                const textContent = extractText((firstChild.props as { children?: React.ReactNode }).children)
                const callout = parseCallout(textContent)
                if (callout) {
                  // Extract the content part after the callout header
                  const contentChildren = childArray.slice(1)
                  // If there's only the first <p>, extract content from it
                  const bodyContent = contentChildren.length > 0
                    ? contentChildren
                    : null
                  return (
                    <CalloutBlock type={callout.type} title={callout.title}>
                      {bodyContent || (
                        <p className="m-0 leading-relaxed">{callout.content}</p>
                      )}
                    </CalloutBlock>
                  )
                }
              }
            }

            // Default blockquote styling
            return (
              <blockquote
                className="my-4 pl-4 border-l-4 border-muted-foreground/30 text-muted-foreground italic"
                {...props}
              >
                {children}
              </blockquote>
            )
          },
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = extractText(children)

            if (match && match[1]) {
              return <CodeBlock language={match[1]} code={codeString} />
            }

            if (!className) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <code className={`${className} text-sm font-mono`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => {
            const child = React.Children.toArray(children)[0]
            if (React.isValidElement(child) && child.type === CodeBlock) {
              return (
                <div className="not-prose my-4 rounded-lg overflow-hidden border border-border/60">
                  {child}
                </div>
              )
            }

            // Check for MermaidBlock or CalloutBlock
            if (React.isValidElement(child) && (child.type === MermaidDiagram || child.type === CalloutBlock)) {
              return <>{child}</>
            }

            const text = extractText(children)
            return (
              <div className="not-prose my-4 rounded-lg overflow-hidden border border-border/60">
                <CodeBlock language="text" code={text} />
              </div>
            )
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-6 border-border" />
          ),
          // Enhanced table: card wrapper for small tables, responsive scroll for large ones
          table: ({ children }) => {
            return (
              <div className="my-4 not-prose overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm border-collapse">
                  {children}
                </table>
              </div>
            )
          },
          thead: ({ children }) => (
            <thead className="bg-muted/40">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/50 px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
              {children}
            </th>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/20 transition-colors border-b border-border/50 last:border-b-0">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="border border-border/50 px-3 py-2.5 text-sm">
              {children}
            </td>
          ),
          // Enhanced img: rounded with shadow
          img: ({ src, alt, ...props }) => (
            <span className="block my-4 not-prose">
              <img
                src={src}
                alt={alt || ''}
                className="rounded-lg border border-border/60 shadow-sm max-w-full h-auto"
                loading="lazy"
                {...props}
              />
              {alt && (
                <span className="block text-center text-xs text-muted-foreground mt-2">{alt}</span>
              )}
            </span>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
