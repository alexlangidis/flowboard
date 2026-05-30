import { createFileRoute } from '@tanstack/react-router'

import { ResetPasswordForm } from '@/features/auth/components/auth-forms'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordForm,
})
