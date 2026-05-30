import { createFileRoute } from '@tanstack/react-router'

import { SignInForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/login')({
  component: SignInForm,
})
