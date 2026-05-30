import { createFileRoute } from '@tanstack/react-router'

import { SignUpForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/register')({
  component: SignUpForm,
})
