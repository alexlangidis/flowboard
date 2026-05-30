import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, KeyRound, Lock, Mail, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

type AuthResult = {
  error?: {
    message?: string
  } | null
}

function getErrorMessage(result: AuthResult, fallback: string) {
  return result.error?.message ?? fallback
}

function getCaughtErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <section className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </section>
  )
}

function StatusMessage({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: ReactNode
}) {
  return (
    <p
      className={
        tone === 'error'
          ? 'rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300'
      }
    >
      {children}
    </p>
  )
}

export function SignInForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(getErrorMessage(result, 'Unable to sign in.'))
        return
      }

      await navigate({ to: '/dashboard' })
    } catch (error) {
      setError(getCaughtErrorMessage(error, 'Unable to sign in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Use your Flowboard account to continue."
      footer={
        <span>
          No account?{' '}
          <Link
            className="font-medium text-foreground underline"
            to="/register"
          >
            Create one
          </Link>
        </span>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="email"
              className="pl-8"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              to="/forgot-password"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="password"
              className="pl-8"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
          <ArrowRight />
        </Button>
      </form>
    </AuthShell>
  )
}

export function SignUpForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (result.error) {
        setError(getErrorMessage(result, 'Unable to create account.'))
        return
      }

      await navigate({ to: '/dashboard' })
    } catch (error) {
      setError(getCaughtErrorMessage(error, 'Unable to create account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      description="Set up your Flowboard account."
      footer={
        <span>
          Already registered?{' '}
          <Link className="font-medium text-foreground underline" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="name"
              className="pl-8"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="email"
              className="pl-8"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="password"
              className="pl-8"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating' : 'Create account'}
          <ArrowRight />
        </Button>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
        fetchOptions: { throw: true },
      })

      setSuccess(
        'If this email is registered in Neon Auth, a reset email will be sent.',
      )
    } catch (error) {
      setError(getCaughtErrorMessage(error, 'Unable to send reset email.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      description="Request a secure reset link from Neon Auth."
      footer={
        <Link className="font-medium text-foreground underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        {success ? (
          <StatusMessage tone="success">{success}</StatusMessage>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="email"
              className="pl-8"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending' : 'Send reset link'}
          <Mail />
        </Button>
      </form>
    </AuthShell>
  )
}

export function ResetPasswordForm() {
  const navigate = useNavigate()
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get('token') ?? '',
    [],
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    token ? null : 'Reset token is missing from the link.',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setError('Reset token is missing from the link.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (result.error) {
        setError(getErrorMessage(result, 'Unable to reset password.'))
        return
      }

      await navigate({ to: '/login' })
    } catch (error) {
      setError(getCaughtErrorMessage(error, 'Unable to reset password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Choose password"
      description="Finish the reset from your email link."
      footer={
        <Link className="font-medium text-foreground underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        <div className="grid gap-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="password"
              className="pl-8"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={!token}
            />
          </div>
        </div>
        <Button
          className="w-full"
          type="submit"
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? 'Saving' : 'Save password'}
          <ArrowRight />
        </Button>
      </form>
    </AuthShell>
  )
}
