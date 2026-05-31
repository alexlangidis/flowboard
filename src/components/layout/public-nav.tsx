import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/features/auth/api/auth-api'

export function PublicNav() {
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    staleTime: 30_000,
  })
  const currentUser = currentUserQuery.data?.data.user

  return (
    <header className="flex h-16 items-center justify-between gap-4">
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <LayoutDashboard aria-hidden="true" className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight">
          FlowBoard
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {currentUser ? (
          <Button size="sm" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              asChild
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Register</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
