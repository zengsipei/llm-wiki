"use client";

import type { DemoConfig } from "@/data/portfolio";

interface DemoTimelineProps {
  config?: DemoConfig;
}

export default function DemoTimeline({ config }: DemoTimelineProps) {
  const title = config?.title || "时间线";
  const events = config?.events || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted font-medium">{title}</span>
      </div>

      {events.length > 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-stone-200" />

            <div className="flex flex-col gap-5">
              {events.map((event, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute left-[-21px] top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-white" />

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted bg-stone-100 px-2 py-0.5 rounded">
                        {event.date}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {event.title}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {event.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-sm text-muted">
          暂无记录
        </div>
      )}
    </div>
  );
}
