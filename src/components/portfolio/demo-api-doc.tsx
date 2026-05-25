"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { DemoConfig } from "@/data/portfolio";

interface DemoApiDocProps {
  config?: DemoConfig;
}

function methodColor(method: string) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-100 text-emerald-700 border-emerald-200",
    POST: "bg-blue-100 text-blue-700 border-blue-200",
    PUT: "bg-amber-100 text-amber-700 border-amber-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
    PATCH: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return colors[method] || "bg-stone-100 text-stone-700 border-stone-200";
}

export default function DemoApiDoc({ config }: DemoApiDocProps) {
  const endpoints = config?.endpoints || [];
  const title = config?.title || "API 接口文档";
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-stone-200">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-muted font-medium">{title}</span>
      </div>

      <div className="divide-y divide-stone-200">
        {endpoints.map((ep, i) => (
          <div key={i}>
            {/* Endpoint header */}
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors text-left"
            >
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${methodColor(ep.method)}`}>
                {ep.method}
              </span>
              <span className="text-sm font-mono text-foreground/90 flex-1">{ep.path}</span>
              <span className="text-xs text-muted hidden sm:block">{ep.description}</span>
              <ChevronRight
                size={14}
                className={`text-stone-400 transition-transform ${expanded === i ? "rotate-90" : ""}`}
              />
            </button>

            {/* Expanded details */}
            {expanded === i && (
              <div className="px-4 pb-4 ml-[4.5rem]">
                <p className="text-sm text-foreground/80 mb-3 sm:hidden">{ep.description}</p>
                {ep.params && ep.params.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted mb-2">请求参数</p>
                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-stone-50">
                            <th className="px-3 py-2 text-left font-semibold text-muted">参数名</th>
                            <th className="px-3 py-2 text-left font-semibold text-muted">类型</th>
                            <th className="px-3 py-2 text-left font-semibold text-muted">必填</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p, j) => (
                            <tr key={j} className="border-t border-stone-100">
                              <td className="px-3 py-2 font-mono text-foreground">{p.name}</td>
                              <td className="px-3 py-2 text-muted">{p.type}</td>
                              <td className="px-3 py-2">
                                {p.required ? (
                                  <span className="text-red-500 font-medium">是</span>
                                ) : (
                                  <span className="text-muted">否</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {(!ep.params || ep.params.length === 0) && (
                  <p className="text-xs text-muted">无请求参数</p>
                )}
              </div>
            )}
          </div>
        ))}

        {endpoints.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            暂无接口文档
          </div>
        )}
      </div>
    </div>
  );
}
