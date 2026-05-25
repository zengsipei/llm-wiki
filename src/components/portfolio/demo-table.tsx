"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { DemoConfig } from "@/data/portfolio";

interface DemoTableProps {
  config?: DemoConfig;
}

const PAGE_SIZE = 5;

export default function DemoTable({ config }: DemoTableProps) {
  const title = config?.title;
  const columns = config?.columns || [];
  const rows = config?.rows || [];
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const filtered = search
    ? rows.filter((r) =>
        Object.values(r)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : rows;

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp = String(av).localeCompare(String(bv), "zh-CN", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function statusColor(status: string | number) {
    const s = String(status);
    if (s.includes("已") || s === "200") return "text-emerald-600 bg-emerald-50";
    if (s.includes("待") || s === "201") return "text-amber-600 bg-amber-50";
    if (s.includes("取消") || s.includes("超时")) return "text-red-600 bg-red-50";
    return "text-stone-600 bg-stone-50";
  }

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-muted font-medium">{title || "数据列表"}</span>
        </div>
        <input
          type="text"
          placeholder="搜索..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="text-xs px-3 py-1.5 rounded-md border border-stone-200 bg-white text-foreground placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-primary/30 w-32"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-100/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-muted whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown size={12} className={sortKey === col.key ? "text-primary" : "text-stone-300"} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={i}
                className="border-t border-stone-100 hover:bg-white/60 transition-colors cursor-default"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                    {col.key === "status" ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(row[col.key])}`}>
                        {row[col.key]}
                      </span>
                    ) : (
                      <span className="text-foreground/80">{row[col.key]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-stone-200 text-xs text-muted">
        <span>
          共 {filtered.length} 条，第 {page + 1}/{totalPages} 页
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
