import { createFileRoute } from '@tanstack/react-router'

import { redirectAuthenticatedUser } from '@/features/auth/api/route-guards'
import { SignInForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/login')({
  beforeLoad: redirectAuthenticatedUser,
  component: SignInForm,
})
