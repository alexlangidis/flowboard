import { createFileRoute } from '@tanstack/react-router'

import { ForgotPasswordForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordForm,
})
