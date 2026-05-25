'use client'

import dynamic from 'next/dynamic'

const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
)

/**
 * Agentation 视觉反馈工具
 * 让用户在页面上点击元素添加批注，生成结构化 Markdown 输出，
 * 可直接粘贴给 AI 编码代理（Claude、Cursor 等）使用。
 *
 * 仅在开发环境加载，不影响生产构建。
 * @see https://github.com/benjitaylor/agentation
 */
export function AgentationWrapper() {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Agentation
      onCopy={(markdown: string) => {
        console.log('[Agentation] Copied annotations:', markdown)
      }}
      onSubmit={(output: string, annotations: any[]) => {
        console.log('[Agentation] Submitted:', { output, annotationCount: annotations.length })
      }}
    />
  )
}
