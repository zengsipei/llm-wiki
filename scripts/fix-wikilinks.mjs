#!/usr/bin/env node
/**
 * fix-wikilinks.mjs
 * Fix all broken wikilinks across all .md files in wiki-content/
 *
 * Wikilinks use display-title format like `[[Claude 使用指南]]`
 * but actual files use slug filenames like `claude-使用指南.md`.
 * This script replaces ALL broken `[[display-title]]` with correct `[[slug]]`.
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const WIKI_DIR = join(process.cwd(), 'wiki-content');

// Mapping of broken display-title → correct slug (inside [[...]] brackets)
const replacements = [
  // Items 1-45: wikilink redirects (sorted by length descending to prevent partial matches)
  ['[[Hermes Agent 中的 Operator 模式：三维框架与 Claude Code 的深度对比]]', '[[hermes-agent-中的-operator-模式三维框架与-claude-code-的深度对比]]'],
  ['[[The Unreasonable Effectiveness of HTML]]', '[[the-unreasonable-effectiveness-of-html-html-的不合理有效性]]'],
  ['[[Windsurf Codemaps — AI 注释的代码结构地图]]', '[[windsurf-codemaps-ai-注释的代码结构地图]]'],
  ['[[mindfold-ai/Trellis — AI Coding Agent Harness]]', '[[mindfold-aitrellis-ai-coding-agent-harness]]'],
  ['[[Plannotator — AI Agent 的交互式计划与代码审查工具]]', '[[plannotator-交互式计划与代码审查]]'],
  ['[[Agentation — AI 编码 Agent 的视觉反馈工具]]', '[[agentation-ai-编码-agent-的视觉反馈工具]]'],
  ['[[Claude Code Dynamic Workflows（动态工作流）]]', '[[claude-code-dynamic-workflows-动态工作流]]'],
  ['[[Anthropic Claude Prompting Best Practices]]', '[[anthropic-claude-prompting-best-practices]]'],
  ['[[GSAP (GreenSock Animation Platform)]]', '[[gsap-greensock-animation-platform]]'],
  ['[[Google Stitch 2.0 - AI UI 设计工具]]', '[[google-stitch-20-ai-ui-设计工具]]'],
  ['[[Hapi - 手机远程控制 AI Coding Agent]]', '[[hapi-手机远程控制ai-coding-agent]]'],
  ['[[Kami - AI 文档排版设计系统]]', '[[kami-ai文档排版设计系统]]'],
  ['[[Graphify - 给人看的双链知识图谱]]', '[[graphify-给人看的双链知识图谱]]'],
  ['[[飞书 CLI（Lark CLI）— 飞书官方命令行工具]]', '[[feishu-cli-飞书命令行工具]]'],
  ['[[三个极简Agent开源项目——从骨架到工程化]]', '[[三个极简agent开源项目研究]]'],
  ['[[Claude Code Operator 模式与 5 种 Agentic 工作流]]', '[[claude-code-operator模式与5种agentic工作流]]'],
  ['[[Claude Code Operator模式与5种Agentic工作流]]', '[[claude-code-operator模式与5种agentic工作流]]'],
  ['[[Codex CLI /goal 命令（v0.128.0+）]]', '[[codex-cli-goal-命令-v01280]]'],
  ['[[Codex CLI /goal 命令]]', '[[codex-cli-goal-命令-v01280]]'],
  ['[[AI Agent 输出格式研究]]', '[[ai-agent-输出格式研究]]'],
  ['[[AI 编程工具对比]]', '[[ai-编程工具对比]]'],
  ['[[AI 模型提供商对比]]', '[[ai-模型提供商对比]]'],
  ['[[Agent 架构设计模式]]', '[[agent-架构设计模式]]'],
  ['[[Claude 使用指南]]', '[[claude-使用指南]]'],
  ['[[Claude.md 内容筛选原则]]', '[[claudemd-内容筛选原则]]'],
  ['[[Cursor Debug 模式]]', '[[cursor-debug-模式]]'],
  ['[[Function Calling 实践指南]]', '[[function-calling-实践指南]]'],
  ['[[Gemini 使用指南]]', '[[gemini-使用指南]]'],
  ['[[GPT 使用指南]]', '[[gpt-使用指南]]'],
  ['[[LLM Wiki 入门指南]]', '[[llm-wiki-入门指南]]'],
  ['[[LLM 评测方法]]', '[[llm-评测方法]]'],
  ['[[Markdown 进阶语法]]', '[[markdown-进阶语法]]'],
  ['[[Markdown 语法速查]]', '[[markdown-语法速查]]'],
  ['[[Markdown 渲染增强演示]]', '[[markdown-渲染增强演示]]'],
  ['[[Next.js 最佳实践]]', '[[nextjs-最佳实践]]'],
  ['[[Next.js 技术栈速查]]', '[[nextjs-技术栈速查]]'],
  ['[[Open Design]]', '[[open-design]]'],
  ['[[Prisma ORM 使用指南]]', '[[prisma-orm-使用指南]]'],
  ['[[Prompt Engineering 最佳实践]]', '[[prompt-engineering-最佳实践]]'],
  ['[[RAG 检索增强生成]]', '[[rag-检索增强生成]]'],
  ['[[RAG vs LLM Wiki 对比分析]]', '[[rag-vs-llm-wiki-对比分析]]'],
  ['[[Supabase vs Firebase]]', '[[supabase-vs-firebase]]'],
  ['[[System Prompt 设计指南]]', '[[system-prompt-设计指南]]'],
  ['[[Tailwind CSS 实战技巧]]', '[[tailwindcss-实战技巧]]'],
  ['[[暗壳AI - 室内AI设计平台]]', '[[暗壳ai-室内ai设计平台]]'],
];

// Items 46-47: broken links referencing non-existent pages → convert to plain text
const plainTextReplacements = [
  ['[[双向链接]]', '双向链接'],
  ['[[页面标题]]', '页面标题'],
];

// Combine all replacements; wikilink replacements are already sorted by length desc
// Plain text replacements are short so they won't conflict
const allReplacements = [...replacements, ...plainTextReplacements];

// Collect all .md files (not in subdirectories, only top-level wiki-content)
const files = readdirSync(WIKI_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => join(WIKI_DIR, f));

let totalReplacements = 0;
const perFileStats = {};

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf-8');
  let fileChanges = 0;

  for (const [from, to] of allReplacements) {
    // Use global replace - count occurrences
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);
    if (matches) {
      const count = matches.length;
      content = content.replace(regex, to);
      fileChanges += count;
    }
  }

  if (fileChanges > 0) {
    writeFileSync(filePath, content, 'utf-8');
    perFileStats[basename(filePath)] = fileChanges;
    totalReplacements += fileChanges;
  }
}

console.log('=== Wikilink Fix Results ===\n');
console.log(`Total replacements: ${totalReplacements}`);
console.log(`Files modified: ${Object.keys(perFileStats).length}\n`);
console.log('Per-file breakdown:');
for (const [file, count] of Object.entries(perFileStats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${file}: ${count} replacement(s)`);
}

console.log('\n✅ Done.');
