import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Eye,
  EyeOff,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MessageSquare,
  Sparkles,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PublicNav } from '@/components/layout/public-nav'
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
import {
  prefetchCurrentUser,
} from '@/features/auth/api/auth-api'
import { authClient } from '@/lib/auth-client'

type AuthResult = {
  error?: {
    message?: string
  } | null
}

type EmailOtpAuthClient = {
  emailOtp: {
    verifyEmail: (input: { email: string; otp: string }) => Promise<AuthResult>
  }
}

const demoCredentials = {
  email: 'demo@flowboard.app',
  password: 'demo-password',
} as const

function getErrorMessage(result: AuthResult, fallback: string) {
  return result.error?.message ?? fallback
}

function getCaughtErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function shouldOfferVerification(error: string | null) {
  return /verify|verification|verified/i.test(error ?? '')
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
    <>
      <PublicNav />
      <section className="grid min-h-[calc(100svh-4rem)] items-center gap-8 py-8 lg:grid-cols-[1fr_25rem] lg:py-12">
        <div className="hidden min-w-0 flex-col gap-6 lg:flex">
          <div className="max-w-xl">
            <div className="flex w-fit items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
              Built for focused project work
            </div>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-balance">
              Turn scattered tasks into clear visual boards.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Sign in to manage workspaces, boards, lists, and cards from one
              quiet workspace built for day-to-day execution.
            </p>
          </div>

          <div className="grid max-w-xl gap-3 sm:grid-cols-3">
            {authBenefits.map((benefit) => (
              <div
                key={benefit.label}
                className="rounded-xl border bg-background p-3 shadow-sm"
              >
                <benefit.icon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <p className="mt-3 text-sm font-medium">{benefit.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-xl rounded-2xl border bg-background p-4 shadow-2xl shadow-foreground/10">
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Launch board</p>
                  <p className="text-xs text-muted-foreground">
                    Product workspace
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                5 cards
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {authPreviewLists.map((list) => (
                <div
                  key={list.title}
                  className="rounded-xl bg-muted/60 p-3 ring-1 ring-border"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold">
                      {list.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {list.cards.length}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {list.cards.map((card) => (
                      <div
                        key={card}
                        className="rounded-lg bg-background p-2 text-xs font-medium shadow-sm ring-1 ring-border"
                      >
                        <span className="mb-2 block h-1 w-10 rounded-full bg-primary/70" />
                        {card}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-sm shadow-xl shadow-foreground/5 lg:mx-0">
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
    </>
  )
}

const authBenefits = [
  {
    label: 'Boards',
    description: 'Group project work into focused spaces.',
    icon: Columns3,
  },
  {
    label: 'Cards',
    description: 'Track tasks from idea to done.',
    icon: CheckCircle2,
  },
  {
    label: 'Updates',
    description: 'Keep context visible while work moves.',
    icon: MessageSquare,
  },
]

const authPreviewLists = [
  { title: 'Plan', cards: ['Scope release', 'Write checklist'] },
  { title: 'Doing', cards: ['Review board flow', 'Ship auth'] },
  { title: 'Done', cards: ['Create workspace'] },
]

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

function PasswordInput({
  id,
  autoComplete,
  value,
  onChange,
  disabled,
  leadingIcon = 'lock',
}: {
  id: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  leadingIcon?: 'key' | 'lock'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = isVisible ? EyeOff : Eye
  const LeadingIcon = leadingIcon === 'key' ? KeyRound : Lock

  return (
    <div className="relative">
      <LeadingIcon className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
      <Input
        id={id}
        className="pr-9 pl-8"
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={autoComplete === 'new-password' ? 8 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        disabled={disabled}
      />
      <Button
        className="absolute top-0 right-0 text-muted-foreground hover:text-foreground"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        onClick={() => setIsVisible((current) => !current)}
        disabled={disabled}
      >
        <Icon />
      </Button>
    </div>
  )
}

function ResendVerificationButton({
  email,
  onError,
  onSuccess,
}: {
  email: string
  onError: (message: string) => void
  onSuccess: (message: string) => void
}) {
  const [isSending, setIsSending] = useState(false)

  async function handleResend() {
    if (!email) {
      onError('Enter your email first.')
      return
    }

    setIsSending(true)

    try {
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: window.location.origin,
      })

      if (result.error) {
        onError(getErrorMessage(result, 'Unable to send verification email.'))
        return
      }

      onSuccess('Verification email sent. Check your inbox.')
    } catch (error) {
      onError(
        getCaughtErrorMessage(error, 'Unable to send verification email.'),
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      className="w-full"
      type="button"
      variant="outline"
      onClick={handleResend}
      disabled={isSending}
    >
      {isSending ? 'Sending verification' : 'Resend verification email'}
      <Mail />
    </Button>
  )
}

function VerifyEmailCodeForm({
  email,
  onError,
  onSuccess,
  onVerified,
}: {
  email: string
  onError: (message: string) => void
  onSuccess: (message: string) => void
  onVerified: () => Promise<void> | void
}) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  async function handleVerify() {
    if (!email) {
      onError('Enter your email first.')
      return
    }

    setIsVerifying(true)

    try {
      const result = await (
        authClient as unknown as EmailOtpAuthClient
      ).emailOtp.verifyEmail({
        email,
        otp: code,
      })

      if (result.error) {
        onError(getErrorMessage(result, 'Unable to verify email.'))
        return
      }

      onSuccess('Email verified.')
      await onVerified()
    } catch (error) {
      onError(getCaughtErrorMessage(error, 'Unable to verify email.'))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="verification-code">Verification code</Label>
        <Input
          id="verification-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
      </div>
      <Button
        className="w-full"
        type="button"
        disabled={isVerifying}
        onClick={handleVerify}
      >
        {isVerifying ? 'Verifying' : 'Verify email'}
        <ArrowRight />
      </Button>
    </div>
  )
}

export function SignInForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canVerifyEmail = shouldOfferVerification(error)

  async function completeSignIn() {
    await prefetchCurrentUser(queryClient)
    await navigate({ to: '/dashboard' })
  }

  async function signInWithCredentials(
    nextEmail: string,
    nextPassword: string,
  ) {
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const result = await authClient.signIn.email({
        email: nextEmail,
        password: nextPassword,
      })

      if (result.error) {
        setError(getErrorMessage(result, 'Unable to sign in.'))
        return
      }

      await completeSignIn()
    } catch (error) {
      setError(getCaughtErrorMessage(error, 'Unable to sign in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function signInAfterVerification() {
    setError(null)
    const result = await authClient.signIn.email({
      email,
      password,
    })

    if (result.error) {
      setError(getErrorMessage(result, 'Email verified. Sign in again.'))
      return
    }

    await completeSignIn()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signInWithCredentials(email, password)
  }

  async function handleDemoSignIn() {
    await signInWithCredentials(
      demoCredentials.email,
      demoCredentials.password,
    )
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
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in' : 'Sign in'}
          <ArrowRight />
        </Button>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Demo account</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {demoCredentials.email}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleDemoSignIn()}
              disabled={isSubmitting}
            >
              Use demo
            </Button>
          </div>
        </div>
        {shouldOfferVerification(error) ? (
          <ResendVerificationButton
            email={email}
            onError={setError}
            onSuccess={setSuccess}
          />
        ) : null}
        {canVerifyEmail ? (
          <VerifyEmailCodeForm
            email={email}
            onError={setError}
            onSuccess={setSuccess}
            onVerified={signInAfterVerification}
          />
        ) : null}
      </form>
    </AuthShell>
  )
}

export function SignUpForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canVerifyEmail = Boolean(success)

  async function signInAfterVerification() {
    setError(null)
    const result = await authClient.signIn.email({
      email,
      password,
    })

    if (result.error) {
      setError(getErrorMessage(result, 'Email verified. Sign in again.'))
      return
    }

    await prefetchCurrentUser(queryClient)
    await navigate({ to: '/dashboard' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
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

      if (result.data?.user && !result.data.user.emailVerified) {
        setSuccess('Account created. Check your email to verify before login.')
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
        {success ? (
          <StatusMessage tone="success">{success}</StatusMessage>
        ) : null}
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
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating' : 'Create account'}
          <ArrowRight />
        </Button>
        {success ? (
          <ResendVerificationButton
            email={email}
            onError={setError}
            onSuccess={setSuccess}
          />
        ) : null}
        {canVerifyEmail ? (
          <VerifyEmailCodeForm
            email={email}
            onError={setError}
            onSuccess={setSuccess}
            onVerified={signInAfterVerification}
          />
        ) : null}
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
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            disabled={!token}
            leadingIcon="key"
          />
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
