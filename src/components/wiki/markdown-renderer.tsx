'use client'

import React, { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Check, Copy, Terminal } from 'lucide-react'

// Markdown renderer with GFM support + syntax highlighting + copy button
interface MarkdownRendererProps {
  content: string
  nextHeadingId?: () => string
}

// Extract plain text from React children (strip HTML tags)
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement).props.children)
  }
  return ''
}

export function MarkdownRenderer({ content, nextHeadingId }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">暂无内容</p>
  }

  // Create heading components that assign sequential IDs
  const createHeadingComponent = (Tag: 'h1' | 'h2' | 'h3' | 'h4', className: string) => {
    const HeadingComponent = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => {
      const id = nextHeadingId ? nextHeadingId() : undefined
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
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-muted-foreground/30 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = extractText(children)

            // Block code with syntax highlighting
            if (match && match[1]) {
              return <CodeBlock language={match[1]} code={codeString} />
            }

            // Block code without language (indented or bare ``` blocks)
            if (!className) {
              // Check if this is inside a <pre> — ReactMarkdown passes <code> inside <pre> for fenced blocks
              // We handle it in the `pre` component instead
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
            // If children already contains a SyntaxHighlighter (from code handler), render as-is
            // Otherwise, render as a plain code block
            const child = React.Children.toArray(children)[0]
            if (React.isValidElement(child) && child.type === CodeBlock) {
              return (
                <div className="not-prose my-4 rounded-lg overflow-hidden border border-border/60">
                  {child}
                </div>
              )
            }

            // Fallback for bare code blocks (no language specified)
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
          // GFM table support
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto not-prose">
              <table className="w-full text-sm border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/30">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold whitespace-nowrap">
              {children}
            </th>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Standalone code block component with syntax highlighting + copy button
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
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

  // Normalize language names
  const displayLang = language === 'text' ? '' : language

  return (
    <div className="relative group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#282c34] border-b border-[#3e4451]">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-[#636d83]" />
          <span className="text-xs font-medium text-[#636d83] uppercase tracking-wider">
            {displayLang || 'code'}
          </span>
        </div>
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

      {/* Code area */}
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
  )
}
