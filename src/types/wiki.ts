// Wiki page types
export interface WikiPage {
  id: string
  title: string
  content: string
  pageType: 'entity' | 'concept' | 'summary'
  tags: string[]
  backlinks: string[]
  sourceId: string | null
  source?: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

// Activity log types
export interface ActivityLog {
  id: string
  actionType: 'ingest' | 'query' | 'lint' | 'edit' | 'create' | 'delete'
  summary: string
  relatedPages: string[]
  createdAt: string
  sourceId: string | null
  source?: { id: string; title: string } | null
  pageId: string | null
  page?: { id: string; title: string } | null
}

// Lint report types
export interface LintIssue {
  severity: 'high' | 'medium' | 'low'
  type: 'contradiction' | 'stale' | 'orphan' | 'missing' | 'cross_reference' | 'duplicate'
  description: string
  affectedPages: string[]
  suggestion: string
}

export interface LintStats {
  totalPages: number
  issuesFound: number
  highSeverity: number
  mediumSeverity: number
  lowSeverity: number
}

export interface LintReport {
  summary: string
  score: number | null
  issues: LintIssue[]
  stats: LintStats
  analyzedAt?: string
  message?: string
}

// Query result types
export interface QuerySource {
  id: string
  title: string
  relevance?: string
}

export interface QueryResult {
  answer: string
  sources: QuerySource[]
}

// Ingest result types
export interface IngestResult {
  message: string
  sourceId?: string
  pages: WikiPage[]
}

// App tab types
export type ActiveTab = 'view' | 'edit' | 'ingest' | 'query' | 'lint' | 'logs' | 'export'

// Page type labels (Chinese)
export const PAGE_TYPE_LABELS: Record<string, string> = {
  entity: '实体',
  concept: '概念',
  summary: '摘要',
}

export const PAGE_TYPE_COLORS: Record<string, string> = {
  entity: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  concept: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  summary: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  ingest: '文档摄入',
  query: '知识问答',
  lint: '健康检查',
  edit: '编辑页面',
  create: '创建页面',
  delete: '删除页面',
}

export const ACTION_TYPE_COLORS: Record<string, string> = {
  ingest: 'bg-emerald-500',
  query: 'bg-amber-500',
  lint: 'bg-cyan-500',
  edit: 'bg-amber-400',
  create: 'bg-emerald-400',
  delete: 'bg-red-500',
}

export const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-emerald-600 dark:text-emerald-400',
}

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  contradiction: '矛盾',
  stale: '过时',
  orphan: '孤立',
  missing: '缺失',
  cross_reference: '交叉引用',
  duplicate: '重复',
}

export const ISSUE_TYPE_COLORS: Record<string, string> = {
  contradiction: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  stale: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  orphan: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  missing: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  cross_reference: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  duplicate: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
}
