'use client'

import React, { useState, useMemo } from 'react'
import {
  Download,
  FileArchive,
  Share2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Link2,
  Tags,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import type { WikiPage } from '@/types/wiki'
import { PAGE_TYPE_LABELS, PAGE_TYPE_COLORS } from '@/types/wiki'
import { saveAs } from 'file-saver'

interface ExportViewProps {
  pages: WikiPage[]
}

interface GraphNode {
  id: string
  title: string
  type: string
  tags: string[]
}

interface GraphEdge {
  source: string
  target: string
  label: string
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: {
    exportedAt: string
    totalNodes: number
    totalEdges: number
  }
}

export function ExportView({ pages }: ExportViewProps) {
  const [exportingMarkdown, setExportingMarkdown] = useState(false)
  const [exportingGraph, setExportingGraph] = useState(false)
  const [markdownDone, setMarkdownDone] = useState(false)
  const [graphDone, setGraphDone] = useState(false)
  const [progress, setProgress] = useState(0)

  // Compute stats
  const stats = useMemo(() => {
    const totalTags = new Set<string>()
    const totalBacklinks = new Set<string>()
    let backlinkCount = 0

    for (const page of pages) {
      for (const tag of page.tags) totalTags.add(tag)
      for (const bl of page.backlinks) {
        totalBacklinks.add(bl)
        if (pages.some((p) => p.id === bl)) backlinkCount++
      }
    }

    // Count shared-tag edges
    let sharedTagEdges = 0
    for (let i = 0; i < pages.length; i++) {
      for (let j = i + 1; j < pages.length; j++) {
        const shared = pages[i].tags.filter((t) => pages[j].tags.includes(t))
        if (shared.length > 0) sharedTagEdges++
      }
    }

    return {
      totalPages: pages.length,
      totalTags: totalTags.size,
      backlinkConnections: backlinkCount,
      sharedTagConnections: sharedTagEdges,
      totalConnections: backlinkCount + sharedTagEdges,
    }
  }, [pages])

  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const page of pages) {
      counts[page.pageType] = (counts[page.pageType] || 0) + 1
    }
    return counts
  }, [pages])

  const handleExportMarkdown = async () => {
    if (pages.length === 0) {
      toast({
        title: '导出失败',
        description: '知识库中没有页面可以导出',
        variant: 'destructive',
      })
      return
    }

    setExportingMarkdown(true)
    setMarkdownDone(false)
    setProgress(10)

    try {
      setProgress(30)
      const res = await fetch('/api/wiki/export?type=markdown')
      setProgress(70)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '导出失败')
      }

      setProgress(90)
      const blob = await res.blob()
      const filename = `llm-wiki-vault-${new Date().toISOString().split('T')[0]}.zip`
      saveAs(blob, filename)
      setProgress(100)
      setMarkdownDone(true)

      toast({
        title: '导出成功',
        description: `已导出 ${pages.length} 个页面为 Markdown Vault`,
      })
    } catch (err) {
      toast({
        title: '导出失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setExportingMarkdown(false)
      setTimeout(() => {
        setProgress(0)
      }, 2000)
    }
  }

  const handleExportGraph = async () => {
    if (pages.length === 0) {
      toast({
        title: '导出失败',
        description: '知识库中没有页面可以导出',
        variant: 'destructive',
      })
      return
    }

    setExportingGraph(true)
    setGraphDone(false)

    try {
      const res = await fetch('/api/wiki/export?type=graph')

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '导出失败')
      }

      const data: GraphData = await res.json()

      // Download the JSON
      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const jsonFilename = `llm-wiki-graph-${new Date().toISOString().split('T')[0]}.json`
      saveAs(jsonBlob, jsonFilename)

      // Generate and download HTML visualization
      const htmlContent = generateGraphHTML(data)
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' })
      const htmlFilename = `llm-wiki-graph-view.html`
      saveAs(htmlBlob, htmlFilename)

      setGraphDone(true)

      toast({
        title: '导出成功',
        description: `已导出知识图谱 (JSON + HTML 可视化)`,
      })
    } catch (err) {
      toast({
        title: '导出失败',
        description: err instanceof Error ? err.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setExportingGraph(false)
    }
  }

  const generateGraphHTML = (data: GraphData): string => {
    const typeColors: Record<string, string> = {
      entity: '#f59e0b',
      concept: '#10b981',
      summary: '#8b5cf6',
    }

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LLM Wiki - Knowledge Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      overflow: hidden;
    }
    #header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
      padding: 16px 24px;
      background: linear-gradient(to bottom, #0f172a 60%, transparent);
      pointer-events: none;
    }
    #header h1 { font-size: 20px; font-weight: 700; }
    #header p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    #stats {
      position: absolute;
      top: 16px;
      right: 24px;
      z-index: 10;
      display: flex;
      gap: 12px;
    }
    .stat-pill {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.4);
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 12px;
      backdrop-filter: blur(8px);
    }
    .stat-pill strong { color: #e2e8f0; }
    #legend {
      position: absolute;
      bottom: 16px;
      left: 24px;
      z-index: 10;
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #94a3b8;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    #tooltip {
      position: absolute;
      z-index: 20;
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(71, 85, 105, 0.5);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      max-width: 240px;
      backdrop-filter: blur(8px);
    }
    #tooltip.visible { opacity: 1; }
    #tooltip .tt-title { font-weight: 600; margin-bottom: 4px; }
    #tooltip .tt-type { font-size: 11px; color: #94a3b8; }
    #tooltip .tt-tags { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
    #tooltip .tt-tag {
      background: rgba(71, 85, 105, 0.4);
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 10px;
    }
    #controls {
      position: absolute;
      bottom: 16px;
      right: 24px;
      z-index: 10;
      display: flex;
      gap: 8px;
    }
    #controls button {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.4);
      border-radius: 8px;
      padding: 8px 14px;
      color: #e2e8f0;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    #controls button:hover { background: rgba(51, 65, 85, 0.8); }
  </style>
</head>
<body>
  <div id="header">
    <h1>LLM Wiki Knowledge Graph</h1>
    <p>${data.metadata.exportedAt ? new Date(data.metadata.exportedAt).toLocaleString('zh-CN') : ''}</p>
  </div>
  <div id="stats">
    <div class="stat-pill"><strong>${data.metadata.totalNodes}</strong> pages</div>
    <div class="stat-pill"><strong>${data.metadata.totalEdges}</strong> connections</div>
  </div>
  <div id="legend">
    <div class="legend-item"><div class="legend-dot" style="background:${typeColors.entity}"></div>Entity</div>
    <div class="legend-item"><div class="legend-dot" style="background:${typeColors.concept}"></div>Concept</div>
    <div class="legend-item"><div class="legend-dot" style="background:${typeColors.summary}"></div>Summary</div>
  </div>
  <div id="tooltip"></div>
  <div id="controls">
    <button onclick="zoomIn()">Zoom +</button>
    <button onclick="zoomOut()">Zoom -</button>
    <button onclick="resetZoom()">Reset</button>
  </div>
  <svg id="graph"></svg>
  <script>
    const data = ${JSON.stringify(data)};

    const typeColors = ${JSON.stringify(typeColors)};
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('#graph')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    window.zoomIn = () => svg.transition().call(zoom.scaleBy, 1.3);
    window.zoomOut = () => svg.transition().call(zoom.scaleBy, 0.7);
    window.resetZoom = () => svg.transition().call(zoom.transform, d3.zoomIdentity);

    // Build simulation data
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    const links = data.edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({ source: e.source, target: e.target, label: e.label }));

    const link = g.append('g')
      .attr('stroke', 'rgba(71, 85, 105, 0.3)')
      .attr('stroke-width', 1)
      .selectAll('line')
      .data(links)
      .join('line');

    const node = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', d => Math.max(6, Math.min(16, 6 + d.tags.length * 1.5)))
      .attr('fill', d => typeColors[d.type] || '#64748b')
      .attr('stroke', d => typeColors[d.type] || '#64748b')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 3)
      .style('cursor', 'pointer');

    const label = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text(d => d.title)
      .attr('font-size', 10)
      .attr('fill', '#94a3b8')
      .attr('dx', d => Math.max(6, Math.min(16, 6 + d.tags.length * 1.5)) + 6)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 4px rgba(0,0,0,0.8)');

    // Tooltip
    const tooltip = document.getElementById('tooltip');
    node.on('mouseover', (event, d) => {
      const tagHtml = d.tags.map(t => '<span class="tt-tag">' + t + '</span>').join('');
      tooltip.innerHTML = '<div class="tt-title">' + d.title + '</div>'
        + '<div class="tt-type">' + d.type + '</div>'
        + (tagHtml ? '<div class="tt-tags">' + tagHtml + '</div>' : '');
      tooltip.classList.add('visible');
    })
    .on('mousemove', (event) => {
      tooltip.style.left = (event.pageX + 16) + 'px';
      tooltip.style.top = (event.pageY - 8) + 'px';
    })
    .on('mouseout', () => {
      tooltip.classList.remove('visible');
    });

    // Drag
    node.call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x; d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    );

    // Simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(6, Math.min(16, 6 + d.tags.length * 1.5)) + 20))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

    // Handle resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      svg.attr('width', w).attr('height', h);
      simulation.force('center', d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    });
  </script>
</body>
</html>`
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Download className="size-5" />
          数据导出
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          将知识库导出为 Obsidian 兼容的 Markdown Vault 或知识图谱
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.totalPages}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">总页面数</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Tags className="size-3.5 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.totalTags}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">标签总数</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Link2 className="size-3.5 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.backlinkConnections}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">反向链接</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BarChart3 className="size-3.5 text-muted-foreground" />
              <span className="text-lg font-bold">{stats.totalConnections}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">总连接数</div>
          </CardContent>
        </Card>
      </div>

      {/* Type breakdown */}
      {Object.keys(typeBreakdown).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(typeBreakdown).map(([type, count]) => (
            <Badge key={type} variant="outline" className={PAGE_TYPE_COLORS[type]}>
              {PAGE_TYPE_LABELS[type]}: {count}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="mb-8" />

      {/* Export Options */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Markdown Export Card */}
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileArchive className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Markdown Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>导出所有页面为独立的 .md 文件，组成 Obsidian 兼容的 Vault：</p>
              <ul className="list-disc list-inside text-xs space-y-1 ml-1">
                <li>YAML frontmatter（标题、类型、标签、日期）</li>
                <li><code className="text-xs bg-muted px-1 py-0.5 rounded">[[wikilinks]]</code> 交叉引用格式</li>
                <li>页面标题作为文件名（slug 格式）</li>
                <li>打包为 .zip 压缩文件下载</li>
              </ul>
            </div>
            {progress > 0 && progress < 100 && (
              <Progress value={progress} className="h-1.5" />
            )}
            <Button
              onClick={handleExportMarkdown}
              disabled={exportingMarkdown || pages.length === 0}
              className="w-full gap-2"
              variant={markdownDone ? 'outline' : 'default'}
            >
              {exportingMarkdown ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  导出中...
                </>
              ) : markdownDone ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  导出完成
                </>
              ) : (
                <>
                  <FileArchive className="size-4" />
                  导出 Markdown Vault
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Graph Export Card */}
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="size-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Share2 className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              Knowledge Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>导出知识图谱数据及可视化页面：</p>
              <ul className="list-disc list-inside text-xs space-y-1 ml-1">
                <li>graph.json — 图结构数据（节点、边、元数据）</li>
                <li>HTML 可视化 — D3.js 力导向图，可离线浏览</li>
                <li>节点 = 页面，边 = 反向链接 + 共享标签</li>
                <li>支持缩放、拖拽、悬停查看详情</li>
              </ul>
            </div>
            <Button
              onClick={handleExportGraph}
              disabled={exportingGraph || pages.length === 0}
              className="w-full gap-2"
              variant={graphDone ? 'outline' : 'default'}
            >
              {exportingGraph ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  生成中...
                </>
              ) : graphDone ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  导出完成
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  导出知识图谱
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <Card className="border-0 bg-muted/30 mt-6">
          <CardContent className="p-8 text-center">
            <AlertCircle className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">知识库为空</p>
            <p className="text-xs text-muted-foreground/60">
              请先通过「文档摄入」添加页面后再导出
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
