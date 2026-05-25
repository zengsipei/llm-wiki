import { experiences } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";

export default function ExperienceSection() {
  return (
    <section id="experience" className="section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            工作经历
          </h2>
          <p className="text-center text-muted mb-10">
            一步一个脚印，在实战中成长
          </p>
        </FadeIn>

        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-stone-300" />

          <div className="flex flex-col gap-10">
            {experiences.map((exp, i) => (
              <FadeIn key={exp.company} delay={i * 0.15}>
                <div className="relative">
                  {/* Dot */}
                  <div className="timeline-dot" />

                  <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-stone-100 card-hover">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
                      <h3 className="text-lg font-bold text-foreground">
                        {exp.company}
                      </h3>
                      <span className="text-sm text-muted whitespace-nowrap">
                        {exp.period}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-primary mb-3">
                      {exp.role}
                    </p>

                    <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                      {exp.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
