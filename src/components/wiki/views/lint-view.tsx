'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { LintReport } from '@/types/wiki'
import { ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS, SEVERITY_COLORS } from '@/types/wiki'

interface LintViewProps {
  onLint: () => Promise<LintReport | null>
}

const SEVERITY_ICONS = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
}

export function LintView({ onLint }: LintViewProps) {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<LintReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLint = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await onLint()
      if (result) {
        setReport(result)
      } else {
        setError('未获取到检查结果')
      }
    } catch (err: any) {
      setError(err?.message || '检查失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-5" />
          健康检查
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI 将分析知识库的完整性，检测矛盾、过时、孤立等问题
        </p>
      </div>

      {/* Lint button */}
      <Button
        onClick={handleLint}
        disabled={loading}
        className="gap-2 mb-8"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            检查中...
          </>
        ) : (
          <>
            <ShieldAlert className="size-4" />
            开始检查
          </>
        )}
      </Button>

      {/* Report */}
      {report && (
        <>
          {/* Score */}
          {report.score !== null && (
            <Card className="mb-6 border-0 bg-muted/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${
                      report.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                      report.score >= 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {report.score}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">健康评分</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground/80">{report.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {report.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card className="bg-muted/30 border-0">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">{report.stats.totalPages}</div>
                  <div className="text-[10px] text-muted-foreground">总页面数</div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/10 border-0">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {report.stats.highSeverity}
                  </div>
                  <div className="text-[10px] text-muted-foreground">严重问题</div>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-900/10 border-0">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {report.stats.mediumSeverity}
                  </div>
                  <div className="text-[10px] text-muted-foreground">中等问题</div>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-0">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {report.stats.lowSeverity}
                  </div>
                  <div className="text-[10px] text-muted-foreground">轻微问题</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state */}
          {report.message && report.issues.length === 0 && (
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">{report.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Issues */}
          {report.issues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                发现 {report.issues.length} 个问题
              </h3>
              {report.issues.map((issue, i) => {
                const SeverityIcon = SEVERITY_ICONS[issue.severity] || Info
                return (
                  <Card key={i} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <SeverityIcon className={`size-5 mt-0.5 shrink-0 ${SEVERITY_COLORS[issue.severity]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="outline" className={ISSUE_TYPE_COLORS[issue.type]}>
                              {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${SEVERITY_COLORS[issue.severity]}`}
                            >
                              {issue.severity === 'high' ? '严重' : issue.severity === 'medium' ? '中等' : '轻微'}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/90 mb-2">{issue.description}</p>
                          {issue.affectedPages.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {issue.affectedPages.map((page) => (
                                <Badge key={page} variant="secondary" className="text-[10px] h-5 px-1.5">
                                  {page}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {issue.suggestion && (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="font-medium shrink-0">建议:</span>
                              <span>{issue.suggestion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Empty state before lint */}
      {!report && !loading && !error && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">尚未执行健康检查</p>
            <p className="text-xs text-muted-foreground/60">点击上方按钮开始分析知识库</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mt-4">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
