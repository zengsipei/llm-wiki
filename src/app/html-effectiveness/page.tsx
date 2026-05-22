'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Code,
  Palette,
  Box,
  Zap,
  PenTool,
  Presentation,
  BookOpen,
  FileBarChart,
  Settings,
  LayoutGrid,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// Demo data from thariqs.github.io/html-effectiveness/
interface Demo {
  id: number
  filename: string
  title: string
  titleCn: string
  desc: string
  descCn: string
  category: CategoryKey
}

type CategoryKey =
  | 'exploration'
  | 'code-review'
  | 'design'
  | 'prototyping'
  | 'illustrations'
  | 'decks'
  | 'research'
  | 'reports'
  | 'editors'

interface Category {
  key: CategoryKey
  label: string
  labelCn: string
  icon: React.ReactNode
  intro: string
  introCn: string
}

const categories: Category[] = [
  {
    key: 'exploration',
    label: 'Exploration & Planning',
    labelCn: '探索与规划',
    icon: <Search className="size-4" />,
    intro: 'When you\'re not sure what you want yet. Ask the agent to fan out across several directions.',
    introCn: '当你还不确定要什么的时候。让 Agent 向多个方向展开，并排展示供你挑选，而不是读三段顺序文本。',
  },
  {
    key: 'code-review',
    label: 'Code Review & Understanding',
    labelCn: '代码审查与理解',
    icon: <Code className="size-4" />,
    intro: 'Diffs and call-graphs are spatial information; markdown flattens them.',
    introCn: 'Diff 和调用图是空间信息，Markdown 会把它们压平。让 Agent 渲染标注过的 diff，画出模块依赖关系。',
  },
  {
    key: 'design',
    label: 'Design',
    labelCn: '设计',
    icon: <Palette className="size-4" />,
    intro: 'HTML is the medium your design system ships in.',
    introCn: 'HTML 就是你的设计系统交付的媒介。色板变成可点击的色块，组件变成展示页。',
  },
  {
    key: 'prototyping',
    label: 'Prototyping',
    labelCn: '原型开发',
    icon: <Box className="size-4" />,
    intro: 'Motion and interaction can\'t be described, only felt.',
    introCn: '动效和交互无法被描述，只能被感受。一个真正的缓动曲线比一段文字说明更有说服力。',
  },
  {
    key: 'illustrations',
    label: 'Illustrations & Diagrams',
    labelCn: '图表与插图',
    icon: <PenTool className="size-4" />,
    intro: 'Inline SVG gives the agent a real pen.',
    introCn: '内嵌 SVG 给了 Agent 一支真正的画笔。可以画出博客文章配图和流程图。',
  },
  {
    key: 'decks',
    label: 'Decks',
    labelCn: '演示文稿',
    icon: <Presentation className="size-4" />,
    intro: 'A handful of section tags and twenty lines of JS is a slide deck.',
    introCn: '几个 section 标签加二十行 JS 就是一份幻灯片。不需要 Keynote，不需要导出。',
  },
  {
    key: 'research',
    label: 'Research & Learning',
    labelCn: '研究与学习',
    icon: <BookOpen className="size-4" />,
    intro: 'An explainer with collapsible sections and tabbed code samples reads very differently.',
    introCn: '带折叠段落、Tab 代码示例和侧边栏术语表的解释器，和线性文本的阅读体验完全不同。',
  },
  {
    key: 'reports',
    label: 'Reports',
    labelCn: '报告',
    icon: <FileBarChart className="size-4" />,
    intro: 'Recurring documents benefit most from a bit of structure and color.',
    introCn: '周期性文档（周报、事故分析）最能从结构和色彩中受益。一个小图表和彩色时间线就能改变一切。',
  },
  {
    key: 'editors',
    label: 'Custom Editing Interfaces',
    labelCn: '自定义编辑器',
    icon: <Settings className="size-4" />,
    intro: 'Sometimes it\'s hard to describe what you want in a text box.',
    introCn: '有时候很难用文字描述你想要什么。让 Agent 为你生成一个专用编辑器，拖拽、调参、一键导出。',
  },
]

const demos: Demo[] = [
  {
    id: 1, filename: '01-exploration-code-approaches.html',
    title: 'Three code approaches', titleCn: '三种代码方案对比',
    desc: 'Side-by-side comparison of three ways to solve the same problem.',
    descCn: '三种方案解决同一问题的并排对比，含优劣分析和代码片段。',
    category: 'exploration',
  },
  {
    id: 2, filename: '02-exploration-visual-designs.html',
    title: 'Visual design directions', titleCn: '视觉设计方向',
    desc: 'Layout and palette options rendered live.',
    descCn: '布局和配色方案的实时渲染展示，直接看效果而非想象。',
    category: 'exploration',
  },
  {
    id: 16, filename: '16-implementation-plan.html',
    title: 'Implementation plan', titleCn: '实施计划',
    desc: 'Milestones, data-flow diagram, mockups, and a risk table.',
    descCn: '里程碑、数据流图、内嵌原型和风险表——完整的实施计划。',
    category: 'exploration',
  },
  {
    id: 3, filename: '03-code-review-pr.html',
    title: 'Annotated pull request', titleCn: '标注式 PR 审查',
    desc: 'A diff with margin notes, severity tags and jump links.',
    descCn: '带边注、严重性标签和跳转链接的 Diff 审查报告。',
    category: 'code-review',
  },
  {
    id: 17, filename: '17-pr-writeup.html',
    title: 'PR writeup for reviewers', titleCn: 'PR 变更说明',
    desc: 'Motivation, before/after, and a file-by-file tour.',
    descCn: '动机、变更前后对比和逐文件说明。',
    category: 'code-review',
  },
  {
    id: 4, filename: '04-code-understanding.html',
    title: 'Module map', titleCn: '模块地图',
    desc: 'An unfamiliar package drawn as boxes and arrows.',
    descCn: '不熟悉的包被画成方框和箭头，高亮关键路径。',
    category: 'code-review',
  },
  {
    id: 5, filename: '05-design-system.html',
    title: 'Living design system', titleCn: '活的设计系统',
    desc: 'Colors, type scale and spacing tokens rendered as swatches.',
    descCn: '色板、字号和间距令牌渲染为可直接复用的色块。',
    category: 'design',
  },
  {
    id: 6, filename: '06-component-variants.html',
    title: 'Component variants', titleCn: '组件变体',
    desc: 'Every size, state and intent on one sheet.',
    descCn: '一个组件在所有尺寸、状态和意图下的完整展示。',
    category: 'design',
  },
  {
    id: 7, filename: '07-prototype-animation.html',
    title: 'Animation sandbox', titleCn: '动画沙盒',
    desc: 'The transition in isolation with sliders for duration and easing.',
    descCn: '隔离的过渡动画，可用滑块调节时长和缓动函数。',
    category: 'prototyping',
  },
  {
    id: 8, filename: '08-prototype-interaction.html',
    title: 'Clickable flow', titleCn: '可点击流程',
    desc: 'Four screens linked together for interaction testing.',
    descCn: '四个页面链接在一起，足够体验交互是否正确。',
    category: 'prototyping',
  },
  {
    id: 10, filename: '10-svg-illustrations.html',
    title: 'SVG figure sheet', titleCn: 'SVG 插图纸',
    desc: 'Diagrams for a blog post, drawn inline and copyable.',
    descCn: '博客文章配图，内联绘制，可逐个复制。',
    category: 'illustrations',
  },
  {
    id: 13, filename: '13-flowchart-diagram.html',
    title: 'Annotated flowchart', titleCn: '标注式流程图',
    desc: 'A deploy pipeline as a real flowchart with clickable steps.',
    descCn: '部署流水线流程图，每个步骤可点击查看详情。',
    category: 'illustrations',
  },
  {
    id: 9, filename: '09-slide-deck.html',
    title: 'Arrow-key slide deck', titleCn: '键盘导航幻灯片',
    desc: 'A presentation as one HTML file with keyboard navigation.',
    descCn: '一个 HTML 文件的演示文稿，支持键盘左右导航。',
    category: 'decks',
  },
  {
    id: 14, filename: '14-research-feature-explainer.html',
    title: 'How a feature works', titleCn: '特性工作原理',
    desc: 'TL;DR box, collapsible steps, tabbed config, and FAQ.',
    descCn: '摘要框、可折叠步骤、Tab 配置示例和 FAQ。',
    category: 'research',
  },
  {
    id: 15, filename: '15-research-concept-explainer.html',
    title: 'Concept explainer', titleCn: '概念解释器',
    desc: 'Consistent hashing taught with a live ring and hover glossary.',
    descCn: '一致性哈希教学——可操作的哈希环、对比表和悬停术语表。',
    category: 'research',
  },
  {
    id: 11, filename: '11-status-report.html',
    title: 'Weekly status', titleCn: '周报状态',
    desc: 'What shipped, what slipped, and a small chart.',
    descCn: '已完成事项、延期事项和一个小图表。',
    category: 'reports',
  },
  {
    id: 12, filename: '12-incident-report.html',
    title: 'Incident timeline', titleCn: '事故时间线',
    desc: 'A post-mortem with minute-by-minute timeline and follow-ups.',
    descCn: '事后分析报告，含逐分钟时间线和后续行动清单。',
    category: 'reports',
  },
  {
    id: 18, filename: '18-editor-triage-board.html',
    title: 'Ticket triage board', titleCn: '工单分类看板',
    desc: 'Drag tickets across columns, export as markdown.',
    descCn: '拖拽工单分类，一键导出为 Markdown。',
    category: 'editors',
  },
  {
    id: 19, filename: '19-editor-feature-flags.html',
    title: 'Feature flags editor', titleCn: '功能开关编辑器',
    desc: 'Toggle and configure feature flags visually.',
    descCn: '可视化地开关和配置功能开关。',
    category: 'editors',
  },
  {
    id: 20, filename: '20-editor-color-picker.html',
    title: 'Color picker tool', titleCn: '颜色选择工具',
    desc: 'A self-contained color tool with multiple color spaces.',
    descCn: '支持多种色彩空间的独立颜色工具。',
    category: 'editors',
  },
]

const categoryColors: Record<CategoryKey, string> = {
  'exploration': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'code-review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'design': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  'prototyping': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'illustrations': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'decks': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'research': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'reports': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'editors': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

const categoryBorderColors: Record<CategoryKey, string> = {
  'exploration': 'border-blue-200 hover:border-blue-400',
  'code-review': 'border-amber-200 hover:border-amber-400',
  'design': 'border-pink-200 hover:border-pink-400',
  'prototyping': 'border-purple-200 hover:border-purple-400',
  'illustrations': 'border-emerald-200 hover:border-emerald-400',
  'decks': 'border-cyan-200 hover:border-cyan-400',
  'research': 'border-indigo-200 hover:border-indigo-400',
  'reports': 'border-orange-200 hover:border-orange-400',
  'editors': 'border-rose-200 hover:border-rose-400',
}

export default function HtmlEffectivenessPage() {
  const [filter, setFilter] = useState<CategoryKey | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredDemos = demos.filter((demo) => {
    const matchCategory = filter === 'all' || demo.category === filter
    const matchSearch =
      !searchQuery.trim() ||
      demo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.titleCn.includes(searchQuery) ||
      demo.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.descCn.includes(searchQuery)
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="size-3.5" />
                Wiki
              </Button>
            </Link>
            <div className="hidden sm:block w-px h-5 bg-border" />
            <h1 className="hidden sm:block text-sm font-semibold">
              HTML Effectiveness
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-40 sm:w-56 pl-8 text-xs"
              />
            </div>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0 rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="max-w-2xl">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-3">
            Companion to the blog post
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            The Unreasonable{' '}
            <span className="text-primary italic">Effectiveness</span> of HTML
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            20 个自包含的 HTML 文件，Agent 用它们替代了一整面 Markdown 墙。
            每一个都把「你会扫一眼就关掉」的文档变成了「你真的会看」的交互页面。
            直接在浏览器中打开即可体验。
          </p>
        </div>

        {/* Source badge */}
        <div className="flex items-center gap-2 mt-5">
          <Badge variant="outline" className="text-xs gap-1">
            <ExternalLink className="size-3" />
            原始来源
          </Badge>
          <a
            href="https://thariqs.github.io/html-effectiveness/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            thariqs.github.io/html-effectiveness
          </a>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter('all')}
          >
            全部 ({demos.length})
          </Button>
          {categories.map((cat) => {
            const count = demos.filter((d) => d.category === cat.key).length
            return (
              <Button
                key={cat.key}
                variant={filter === cat.key ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setFilter(cat.key)}
              >
                {cat.icon}
                {cat.labelCn}
                <span className="text-muted-foreground">({count})</span>
              </Button>
            )
          })}
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {viewMode === 'grid' ? (
          <div className="space-y-10">
            {(filter === 'all' ? categories : categories.filter((c) => c.key === filter)).map(
              (cat) => {
                const catDemos = filteredDemos.filter((d) => d.category === cat.key)
                if (catDemos.length === 0) return null
                return (
                  <section key={cat.key}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-primary font-semibold">
                        {String(categories.indexOf(cat) + 1).padStart(2, '0')}
                      </span>
                      <h2 className="text-lg font-semibold">{cat.labelCn}</h2>
                      <Badge variant="outline" className="text-[10px]">
                        {catDemos.length} demos
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 ml-9 max-w-lg">
                      {cat.introCn}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catDemos.map((demo) => (
                        <DemoCard key={demo.id} demo={demo} />
                      ))}
                    </div>
                  </section>
                )
              }
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDemos.map((demo) => (
              <DemoListItem key={demo.id} demo={demo} />
            ))}
          </div>
        )}

        {filteredDemos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">没有找到匹配的 demo</p>
          </div>
        )}
      </main>
    </div>
  )
}

function DemoCard({ demo }: { demo: Demo }) {
  const cat = categories.find((c) => c.key === demo.category)!
  return (
    <a
      href={`/html-effectiveness-demos/${demo.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${categoryBorderColors[demo.category]}`}
    >
      {/* Thumbnail placeholder */}
      <div className={`rounded-lg h-28 mb-3 flex items-center justify-center ${categoryColors[demo.category].split(' ')[0]}`}>
        <div className="text-3xl opacity-40">{cat.icon}</div>
      </div>
      {/* Body */}
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="outline" className="text-[10px] gap-1">
          {cat.icon}
          {cat.labelCn}
        </Badge>
        <span className="text-[10px] font-mono text-muted-foreground">
          #{String(demo.id).padStart(2, '0')}
        </span>
      </div>
      <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
        {demo.titleCn}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {demo.descCn}
      </p>
      <div className="mt-3 pt-2 border-t flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[70%]">
          {demo.filename}
        </span>
        <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </a>
  )
}

function DemoListItem({ demo }: { demo: Demo }) {
  const cat = categories.find((c) => c.key === demo.category)!
  return (
    <a
      href={`/html-effectiveness-demos/${demo.filename}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent"
    >
      <div className={`rounded-md w-10 h-10 flex items-center justify-center shrink-0 ${categoryColors[demo.category]}`}>
        <div className="text-lg opacity-60">{cat.icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium group-hover:text-primary transition-colors">
            {demo.titleCn}
          </span>
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            #{String(demo.id).padStart(2, '0')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{demo.descCn}</p>
      </div>
      <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </a>
  )
}
