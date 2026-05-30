import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards'

type SearchResult = {
  id: string
  boardId: string
  description: string
  label: string
}

export function AppSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const boardsQuery = useBoardsQuery()
  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return (boardsQuery.data?.data.boards ?? [])
      .filter((board) =>
        [board.name, board.description ?? '', board.workspaceName]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 5)
      .map((board) => ({
        id: `board-${board.id}`,
        boardId: board.id,
        description: board.workspaceName,
        label: board.name,
      }))
  }, [boardsQuery.data, normalizedQuery])
  const showResults = isFocused && normalizedQuery.length > 0

  async function goToResult(result: SearchResult) {
    setQuery('')
    setIsFocused(false)
    await navigate({
      to: '/boards/$boardId',
      params: { boardId: result.boardId },
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (results[0]) {
      await goToResult(results[0])
    }
  }

  return (
    <form
      className="relative ml-auto hidden w-full max-w-md md:block"
      role="search"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        className="h-8 rounded-lg border-border/70 bg-muted/40 pl-8"
        placeholder="Search boards"
        value={query}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('')
            setIsFocused(false)
          }
        }}
      />

      {showResults && (
        <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto p-1">
              {results.map((result) => (
                <Link
                  key={result.id}
                  to="/boards/$boardId"
                  params={{ boardId: result.boardId }}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onClick={() => {
                    setQuery('')
                    setIsFocused(false)
                  }}
                >
                  <LayoutDashboard
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {result.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {result.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matching boards found.
            </div>
          )}
        </div>
      )}
    </form>
  )
}
