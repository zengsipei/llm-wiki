"use client";

import type { DemoConfig } from "@/data/portfolio";

interface DemoDashboardProps {
  config?: DemoConfig;
}

function methodBadge(method: string) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700",
    POST: "bg-blue-100 text-blue-700",
    PUT: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
    INFO: "bg-stone-100 text-stone-600",
    WARN: "bg-amber-100 text-amber-700",
    ERROR: "bg-red-100 text-red-700",
  };
  return colors[method] || "bg-stone-100 text-stone-600";
}

function statusDot(status: number) {
  if (status >= 200 && status < 300) return "bg-emerald-500";
  if (status >= 300 && status < 400) return "bg-blue-500";
  if (status >= 400 && status < 500) return "bg-amber-500";
  return "bg-red-500";
}

export default function DemoDashboard({ config }: DemoDashboardProps) {
  const stats = config?.stats || [];
  const logs = config?.recentLogs || [];
  const title = config?.title || "监控面板";

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted font-medium">{title}</span>
      </div>

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-stone-200 p-4"
            >
              <p className="text-xs text-muted mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              {stat.trend && (
                <p className={`text-xs mt-1 ${
                  stat.trend.startsWith("+") || stat.trend === "正常"
                    ? "text-emerald-600"
                    : stat.trend.startsWith("-")
                    ? "text-emerald-600"
                    : stat.trend === "注意"
                    ? "text-amber-600"
                    : "text-muted"
                }`}>
                  {stat.trend}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log list */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-muted">
            实时日志
          </div>
          <div className="divide-y divide-stone-100">
            {logs.map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-stone-50/50 transition-colors"
              >
                <span className="text-stone-400 font-mono shrink-0">{log.time}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${methodBadge(log.method)}`}>
                  {log.method}
                </span>
                <span className="text-foreground/80 truncate flex-1">{log.path}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(log.status)}`} />
                  <span className="text-muted">{log.duration}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
