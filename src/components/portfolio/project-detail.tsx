"use client";

import { ArrowLeft, Target, Zap, FileText, Lightbulb, Monitor } from "lucide-react";
import type { Project } from "@/data/portfolio";
import FadeIn from "@/components/portfolio/fade-in";
import DemoTable from "@/components/portfolio/demo-table";
import DemoDashboard from "@/components/portfolio/demo-dashboard";
import DemoApiDoc from "@/components/portfolio/demo-api-doc";
import DemoScreenshot from "@/components/portfolio/demo-screenshot";
import DemoTimeline from "@/components/portfolio/demo-timeline";

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

function DemoRenderer({ project }: { project: Project }) {
  const { demoType, demoConfig } = project;
  if (!demoType) return null;

  switch (demoType) {
    case "table":
      return <DemoTable config={demoConfig} />;
    case "dashboard":
      return <DemoDashboard config={demoConfig} />;
    case "api-doc":
      return <DemoApiDoc config={demoConfig} />;
    case "screenshot":
      return <DemoScreenshot config={demoConfig} />;
    case "timeline":
      return <DemoTimeline config={demoConfig} />;
    default:
      return null;
  }
}

export default function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const hasContent =
    project.overview ||
    project.responsibilities ||
    project.highlights ||
    project.demoType ||
    project.note;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Back button */}
      <FadeIn>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          返回作品列表
        </button>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {project.name}
          </h1>
          {(project.period || project.role) && (
            <p className="text-sm text-muted mb-3">
              {[project.period, project.role].filter(Boolean).join(" · ")}
            </p>
          )}
          {project.tags && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-stone-100 text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {project.summary && (
            <p className="mt-3 text-sm text-foreground/80 italic">
              {project.summary}
            </p>
          )}
        </div>
      </FadeIn>

      {/* No detail content message */}
      {!hasContent && (
        <FadeIn delay={0.1}>
          <div className="bg-white rounded-xl border border-stone-200 p-10 text-center">
            <Monitor size={40} className="mx-auto mb-4 text-stone-300" />
            <p className="text-sm text-muted">
              详情内容待完善，后续补充项目概述、职责和技术亮点
            </p>
          </div>
        </FadeIn>
      )}

      {/* Live Demo */}
      {project.demoType && (
        <FadeIn delay={0.1}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Live Demo</h2>
              <span className="text-xs text-muted bg-stone-100 px-2 py-0.5 rounded">
                {project.demoConfig?.title || project.demoType}
              </span>
            </div>
            <DemoRenderer project={project} />
            <p className="text-xs text-stone-400 mt-2 text-center">
              以上为模拟数据，仅展示界面结构
            </p>
          </div>
        </FadeIn>
      )}

      {/* Overview */}
      {project.overview && (
        <FadeIn delay={0.15}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">项目概述</h2>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {project.overview}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Responsibilities */}
      {project.responsibilities && project.responsibilities.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">我的职责</h2>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
              <ul className="space-y-2">
                {project.responsibilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Highlights */}
      {project.highlights && project.highlights.length > 0 && (
        <FadeIn delay={0.25}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">技术亮点</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {project.highlights.map((hl, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-stone-200 p-4 card-hover"
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center text-white text-xs font-bold mb-3`}>
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {hl.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {hl.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Note */}
      {project.note && (
        <FadeIn delay={0.3}>
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">项目心得</h2>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 sm:p-6">
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                &ldquo;{project.note}&rdquo;
              </p>
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
