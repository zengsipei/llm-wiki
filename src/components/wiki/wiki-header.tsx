'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface WikiHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearch: () => void
  onToggleSidebar: () => void
}

export function WikiHeader({
  searchQuery,
  onSearchChange,
  onSearch,
  onToggleSidebar,
}: WikiHeaderProps) {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
      <div className="flex items-center gap-3 h-full px-4">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onToggleSidebar}
        >
          <Search className="size-4" />
          <span className="sr-only">打开菜单</span>
        </Button>

        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="搜索知识库..."
            className="pl-9 pr-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted"
              onClick={() => onSearchChange('')}
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs hidden sm:flex"
          onClick={onSearch}
        >
          搜索
        </Button>
      </div>
    </header>
  )
}
