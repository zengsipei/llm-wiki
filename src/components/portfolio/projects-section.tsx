"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { projects } from "@/data/portfolio";
import type { Project } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";
import { ExternalLink } from "lucide-react";
import ProjectDetail from "@/components/portfolio/project-detail";

export default function ProjectsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("project");
  const [animated, setAnimated] = useState(false);

  const selected: Project | undefined = slug
    ? projects.find((p) => p.slug === slug)
    : undefined;

  // Scroll to top on detail view
  useEffect(() => {
    if (selected) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      setAnimated(false);
      requestAnimationFrame(() => setAnimated(true));
    }
  }, [selected]);

  function openProject(project: Project) {
    router.push(`#projects?project=${project.slug}`, { scroll: false });
  }

  function goBack() {
    router.push("#projects", { scroll: false });
    // Scroll back to projects section
    setTimeout(() => {
      const el = document.getElementById("projects");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  // Detail view
  if (selected) {
    return (
      <section id="projects" className="section bg-white min-h-screen">
        {animated && (
          <ProjectDetail project={selected} onBack={goBack} />
        )}
      </section>
    );
  }

  // Grid view
  return (
    <section id="projects" className="section bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            项目作品
          </h2>
          <p className="text-center text-muted mb-10">
            做过的东西，不高大上但够实用
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {projects.map((project, i) => (
            <FadeIn key={project.slug} delay={i * 0.08}>
              <div
                onClick={() => openProject(project)}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 card-hover h-full flex flex-col cursor-pointer group"
              >
                {/* Gradient banner */}
                <div
                  className={`h-32 bg-gradient-to-br ${project.gradient} flex items-center justify-center relative`}
                >
                  <span className="text-white/90 text-lg font-bold px-4 text-center">
                    {project.name}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-3 py-1 rounded-full">
                      查看详情
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    {project.name}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-primary transition-colors"
                        aria-label="GitHub"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Demo hint */}
                  {project.demoType && (
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5 text-xs text-primary font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      包含可交互 Demo
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
