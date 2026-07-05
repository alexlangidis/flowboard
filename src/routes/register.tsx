import { createFileRoute } from '@tanstack/react-router'

import { redirectAuthenticatedUser } from '@/features/auth/api/route-guards'
import { SignUpForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/register')({
  beforeLoad: redirectAuthenticatedUser,
  component: SignUpForm,
})
