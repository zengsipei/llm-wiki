'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown renderer with GFM support (tables, strikethrough, task lists, etc.)
interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground italic">暂无内容</p>
  }

  return (
    <div className="markdown-content prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-8 mb-4 pb-2 border-b border-border first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 pb-1 border-b border-border/50">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-5 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mt-4 mb-2">{children}</h4>
          ),
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
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground/80" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={`${className} block text-sm font-mono`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="not-prose my-4 p-4 bg-muted/50 border border-border rounded-lg overflow-x-auto text-sm font-mono leading-6">
              {children}
            </pre>
          ),
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
          // GFM table support - wrapper for horizontal scroll
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
