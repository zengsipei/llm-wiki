import { skillGroups } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";
import type { Skill } from "@/data/portfolio";

function SkillTag({ skill }: { skill: Skill }) {
  if (skill.level === "主力") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
        {skill.name}
      </span>
    );
  }
  if (skill.level === "常用") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
        {skill.name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-stone-100 text-muted border border-stone-200">
      {skill.name}
    </span>
  );
}

export default function SkillsSection() {
  return (
    <section id="skills" className="section bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            技术栈
          </h2>
          <p className="text-center text-muted mb-10">
            9年积累，后端为主，逐步拓展全栈
          </p>
        </FadeIn>

        <div className="flex flex-col gap-8">
          {skillGroups.map((group, i) => (
            <FadeIn key={group.category} delay={i * 0.1}>
              <div>
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <SkillTag key={skill.name} skill={skill} />
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Legend */}
        <FadeIn delay={0.5}>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary" />
              主力
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary/10 border border-primary/20" />
              常用
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-stone-100 border border-stone-200" />
              了解
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
