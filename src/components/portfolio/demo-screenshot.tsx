"use client";

import type { DemoConfig } from "@/data/portfolio";

interface DemoScreenshotProps {
  config?: DemoConfig;
}

export default function DemoScreenshot({ config }: DemoScreenshotProps) {
  const title = config?.title || "项目截图";
  const screenshots = config?.screenshots || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted font-medium">{title}</span>
      </div>

      {screenshots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {screenshots.map((src, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} ${i + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          {/* Mock browser chrome */}
          <div className="border-b border-stone-200 px-4 py-2.5 bg-stone-50 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="flex-1 mx-4">
              <div className="bg-white rounded-md border border-stone-200 px-3 py-1 text-xs text-muted text-center">
                {title}
              </div>
            </div>
          </div>
          {/* Placeholder content */}
          <div className="p-6 sm:p-10 space-y-4">
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-4 bg-stone-100 rounded w-full" />
            <div className="h-4 bg-stone-100 rounded w-5/6" />
            <div className="h-4 bg-stone-100 rounded w-4/6" />
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="h-32 bg-stone-100 rounded-lg" />
              <div className="h-32 bg-stone-100 rounded-lg" />
            </div>
            <div className="flex gap-3 mt-4">
              <div className="h-8 bg-stone-200 rounded-lg w-20" />
              <div className="h-8 bg-stone-100 rounded-lg w-20" />
              <div className="h-8 bg-stone-100 rounded-lg w-20" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="h-48 bg-stone-100 rounded-lg" />
              <div className="h-48 bg-stone-100 rounded-lg" />
              <div className="h-48 bg-stone-100 rounded-lg" />
            </div>
          </div>
          {/* Placeholder hint */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 text-center">
            <p className="text-xs text-muted">截图占位 — 后续替换为实际项目截图</p>
          </div>
        </div>
      )}
    </div>
  );
}
