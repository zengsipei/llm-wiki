// Example seed script for LLM Wiki
// Run: node scripts/seed-example.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const page = await prisma.wikiPage.create({
    data: {
      title: "示例知识页面",
      content: "# 示例\n\n这是一个示例知识页面。",
      pageType: "concept",
      tags: JSON.stringify(["示例", "测试"]),
      backlinks: '[]',
    }
  });
  console.log(`Created: ${page.title}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
