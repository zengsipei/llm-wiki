const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ log: ['error'] });

const crossRefs = {
  "Agent 架构设计模式": ["三个极简Agent开源项目——从骨架到工程化", "Claude Code Operator模式与5种Agentic工作流", "Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比", "mindfold-ai/Trellis — AI Coding Agent Harness", "AI Agent 输出格式研究"],
  "Agentation — AI 编码 Agent 的视觉反馈工具": ["Plannotator — AI Agent 的交互式计划与代码审查工具", "Browser Harness", "Claude Code Operator模式与5种Agentic工作流", "AI 编程工具对比"],
  "AI Agent 输出格式研究": ["The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）", "Agent 架构设计模式", "Claude Code Operator模式与5种Agentic工作流", "知识库架构设计"],
  "AI 安全与对齐": ["LLM 评测方法", "System Prompt 设计指南", "Prompt Engineering 最佳实践", "Claude 使用指南", "Claude.md 内容筛选原则"],
  "AI 绘画工具对比": ["AI 编程工具对比", "Google Stitch 2.0 - AI UI 设计工具", "暗壳AI - 室内AI设计平台"],
  "AI 编程工具对比": ["Claude 使用指南", "GPT 使用指南", "Gemini 使用指南", "Cursor Debug 模式", "rtk-ai/rtk — Rust Token Killer"],
  "Claude.md 内容筛选原则": ["System Prompt 设计指南", "Claude 使用指南", "Prompt Engineering 最佳实践", "知识管理系统设计", "Anthropic Claude Prompting Best Practices"],
  "Claude 使用指南": ["GPT 使用指南", "Gemini 使用指南", "Prompt Engineering 最佳实践", "System Prompt 设计指南", "Anthropic Claude Prompting Best Practices"],
  "Function Calling 实践指南": ["Agent 架构设计模式", "Claude 使用指南", "GPT 使用指南", "rtk-ai/rtk — Rust Token Killer"],
  "Gemini 使用指南": ["Claude 使用指南", "GPT 使用指南", "AI 编程工具对比", "Prompt Engineering 最佳实践"],
  "Git 工作流最佳实践": ["GitNexus - 给 Agent 用的仓库索引", "Windsurf Codemaps — AI 注释的代码结构地图", "AI 编程工具对比"],
  "GPT 使用指南": ["Claude 使用指南", "Gemini 使用指南", "Prompt Engineering 最佳实践", "System Prompt 设计指南", "Function Calling 实践指南"],
  "grill-me-skill": ["Plannotator — AI Agent 的交互式计划与代码审查工具", "Claude Code Operator模式与5种Agentic工作流", "Anthropic Claude Prompting Best Practices", "Agentation — AI 编码 Agent 的视觉反馈工具"],
  "Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比": ["Claude Code Operator模式与5种Agentic工作流", "Agent 架构设计模式", "mindfold-ai/Trellis — AI Coding Agent Harness", "三个极简Agent开源项目——从骨架到工程化"],
  "LLM Wiki 入门指南": ["知识管理系统设计", "知识库架构设计", "RAG vs LLM Wiki 对比分析", "个人知识管理方法论"],
  "LLM 评测方法": ["AI 安全与对齐", "Claude 使用指南", "GPT 使用指南", "Prompt Engineering 最佳实践", "RAG 检索增强生成"],
  "Markdown 渲染增强演示": ["Markdown 进阶语法", "Markdown 语法速查", "知识库架构设计"],
  "Markdown 语法速查": ["Markdown 进阶语法", "Markdown 渲染增强演示"],
  "Markdown 进阶语法": ["Markdown 语法速查", "Markdown 渲染增强演示", "知识管理系统设计"],
  "mindfold-ai/Trellis — AI Coding Agent Harness": ["Agent 架构设计模式", "Claude Code Operator模式与5种Agentic工作流", "Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比", "AI 编程工具对比"],
  "Next.js 技术栈速查": ["Next.js 最佳实践", "Tailwind CSS 实战技巧", "Prisma ORM 使用指南"],
  "Next.js 最佳实践": ["Next.js 技术栈速查", "Tailwind CSS 实战技巧", "Prisma ORM 使用指南", "知识库架构设计"],
  "Open Design": ["The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）", "AI 编程工具对比", "Google Stitch 2.0 - AI UI 设计工具", "Claude Code Operator模式与5种Agentic工作流"],
  "Opus 使用指南": ["Claude 使用指南", "Prompt Engineering 最佳实践", "Anthropic Claude Prompting Best Practices", "Claude Code Operator模式与5种Agentic工作流"],
  "Plannotator — AI Agent 的交互式计划与代码审查工具": ["Agentation — AI 编码 Agent 的视觉反馈工具", "Claude Code Operator模式与5种Agentic工作流", "grill-me-skill", "AI 编程工具对比"],
  "Prisma ORM 使用指南": ["Next.js 技术栈速查", "Next.js 最佳实践", "Supabase vs Firebase"],
  "Prompt Engineering 最佳实践": ["System Prompt 设计指南", "Claude 使用指南", "Anthropic Claude Prompting Best Practices", "Claude.md 内容筛选原则"],
  "RAG vs LLM Wiki 对比分析": ["RAG 检索增强生成", "向量数据库入门", "LLM Wiki 入门指南", "知识库架构设计"],
  "RAG 检索增强生成": ["向量数据库入门", "RAG vs LLM Wiki 对比分析", "LLM 评测方法"],
  "rtk-ai/rtk — Rust Token Killer": ["AI 编程工具对比", "Claude Code Operator模式与5种Agentic工作流", "Function Calling 实践指南"],
  "System Prompt 设计指南": ["Prompt Engineering 最佳实践", "Claude 使用指南", "Anthropic Claude Prompting Best Practices", "Claude.md 内容筛选原则"],
  "Tailwind CSS 实战技巧": ["Next.js 最佳实践", "Next.js 技术栈速查", "The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）"],
  "The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）": ["AI Agent 输出格式研究", "知识库架构设计", "Tailwind CSS 实战技巧", "Open Design"],
  "三个极简Agent开源项目——从骨架到工程化": ["Agent 架构设计模式", "Claude Code Operator模式与5种Agentic工作流", "Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比", "Browser Harness"],
  "个人知识管理方法论": ["知识管理系统设计", "LLM Wiki 入门指南", "RAG vs LLM Wiki 对比分析"],
  "向量数据库入门": ["RAG 检索增强生成", "RAG vs LLM Wiki 对比分析", "知识库架构设计"],
  "知识库架构设计": ["知识管理系统设计", "RAG vs LLM Wiki 对比分析", "The Unreasonable Effectiveness of HTML（HTML 的不合理有效性）", "Next.js 最佳实践"],
  "知识管理系统设计": ["知识库架构设计", "个人知识管理方法论", "LLM Wiki 入门指南", "Claude.md 内容筛选原则"],
  "示例知识页面": ["LLM Wiki 入门指南"],
  "Supabase vs Firebase": ["Prisma ORM 使用指南", "Next.js 技术栈速查"],
  "Codex CLI /goal 命令（v0.128.0+）": ["Claude Code Operator模式与5种Agentic工作流", "HereOS — GUI 交互驱动的 Agent", "AI 编程工具对比", "rtk-ai/rtk — Rust Token Killer"],
  "Obscura - Rust 无头浏览器引擎": ["Browser Harness", "三个极简Agent开源项目——从骨架到工程化"],
  "Pretext - 纯 JS 文本测量库": ["Tailwind CSS 实战技巧", "Next.js 最佳实践"],
  "Claude Code Operator模式与5种Agentic工作流": ["Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比", "Agent 架构设计模式", "三个极简Agent开源项目——从骨架到工程化", "mindfold-ai/Trellis — AI Coding Agent Harness", "HereOS — GUI 交互驱动的 Agent"],
  "GitNexus - 给 Agent 用的仓库索引": ["Graphify - 给人看的双链知识图谱", "Cursor Debug 模式", "Windsurf Codemaps — AI 注释的代码结构地图", "Browser Harness"],
  "Google Stitch 2.0 - AI UI 设计工具": ["Open Design", "AI 绘画工具对比", "暗壳AI - 室内AI设计平台"],
  "Windsurf Codemaps — AI 注释的代码结构地图": ["GitNexus - 给 Agent 用的仓库索引", "Cursor Debug 模式", "AI 编程工具对比"],
  "暗壳AI - 室内AI设计平台": ["AI 绘画工具对比", "Google Stitch 2.0 - AI UI 设计工具"],
  "Cursor Debug 模式": ["AI 编程工具对比", "GitNexus - 给 Agent 用的仓库索引", "Windsurf Codemaps — AI 注释的代码结构地图"],
  "HereOS — GUI 交互驱动的 Agent": ["Claude Code Operator模式与5种Agentic工作流", "Codex CLI /goal 命令（v0.128.0+）", "Agent 架构设计模式"],
  "Browser Harness": ["Obscura - Rust 无头浏览器引擎", "三个极简Agent开源项目——从骨架到工程化", "Claude Code Operator模式与5种Agentic工作流"],
  "Graphify - 给人看的双链知识图谱": ["知识管理系统设计", "GitNexus - 给 Agent 用的仓库索引", "LLM Wiki 入门指南", "个人知识管理方法论"],
  "Anthropic Claude Prompting Best Practices": ["Claude 使用指南", "Prompt Engineering 最佳实践", "System Prompt 设计指南", "Claude.md 内容筛选原则"],
  "飞书 CLI（Lark CLI）— 飞书官方命令行工具": ["Git 工作流最佳实践", "Claude Code Operator模式与5种Agentic工作流", "AI 编程工具对比"]
};

(async () => {
  const allPages = await db.wikiPage.findMany();
  console.log('Total pages:', allPages.length);

  const titleToId = new Map();
  allPages.forEach(p => titleToId.set(p.title.trim(), p.id));

  let updated = 0, notFound = [];
  for (const [title, refTitles] of Object.entries(crossRefs)) {
    const pageId = titleToId.get(title);
    if (!pageId) { notFound.push(title); continue; }
    const refIds = refTitles.map(t => titleToId.get(t)).filter(Boolean);
    if (refIds.length > 0) {
      await db.wikiPage.update({ where: { id: pageId }, data: { backlinks: JSON.stringify(refIds) } });
      updated++;
    }
  }
  console.log('Updated:', updated);
  console.log('Not found:', notFound.join(', ') || 'none');

  const withRefs = await db.wikiPage.count({ where: { backlinks: { not: '[]' } } });
  console.log('Pages with cross-refs:', withRefs, '/', allPages.length);
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
