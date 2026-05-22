'use client'

import React, { useCallback, useRef } from 'react'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import {
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CodeToggle,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  CreateLink,
  DiffSourceToggleWrapper,
  UndoRedo,
} from '@mdxeditor/editor'

interface MdxEditorWrapperProps {
  markdown: string
  onChange: (markdown: string) => void
  placeholder?: string
}

export default function MdxEditorWrapper({ markdown, onChange, placeholder }: MdxEditorWrapperProps) {
  const editorRef = useRef<MDXEditorMethods>(null)

  const handleChange = useCallback((md: string) => {
    onChange(md)
  }, [onChange])

  return (
    <div className="mdx-editor-wrapper border border-border rounded-lg overflow-hidden [&_.mdxeditor]:bg-background [&_.mdxeditor]:text-foreground [&_.cm-editor]:!bg-[#1e1e2e] [&_.cm-editor]:text-[#cdd6f4] [&_.cm-gutters]:!bg-[#181825] [&_.cm-activeLineGutter]:!bg-[#1e1e2e]">
      <MDXEditor
        ref={editorRef}
        markdown={markdown}
        onChange={handleChange}
        contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none focus:outline-none px-4 py-3 min-h-[300px]"
        className="mdxeditor-light"
        placeholder={placeholder || '开始编辑 Markdown 内容...'}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30">
                <UndoRedo />
                <div className="w-px h-5 bg-border mx-1" />
                <BoldItalicUnderlineToggles />
                <div className="w-px h-5 bg-border mx-1" />
                <BlockTypeSelect />
                <div className="w-px h-5 bg-border mx-1" />
                <ListsToggle />
                <CodeToggle />
                <InsertThematicBreak />
                <InsertCodeBlock />
                <InsertTable />
                <CreateLink />
                <div className="w-px h-5 bg-border mx-1" />
                <DiffSourceToggleWrapper>
                  <UndoRedo />
                </DiffSourceToggleWrapper>
              </div>
            ),
          }),
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: 'JavaScript',
              javascript: 'JavaScript',
              ts: 'TypeScript',
              typescript: 'TypeScript',
              python: 'Python',
              html: 'HTML',
              css: 'CSS',
              json: 'JSON',
              bash: 'Bash',
              shell: 'Shell',
              mermaid: 'Mermaid',
              sql: 'SQL',
              go: 'Go',
              rust: 'Rust',
            },
          }),
          diffSourcePlugin({ viewMode: 'source', diffMarkdown: '' }),
        ]}
      />
    </div>
  )
}
