import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, type AnyRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Toaster } from 'sonner'

type AppProvidersProps = {
  router: AnyRouter
}

export function AppProviders({ router }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  )
}
