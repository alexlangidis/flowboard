import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'

import { useLoginMutation } from '@/features/auth/hooks/use-auth-mutations'
import {
  loginSchema,
  type LoginInput,
} from '@/features/auth/schemas/auth-schemas'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [values, setValues] = useState<LoginInput>({ email: '', password: '' })
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = loginSchema.safeParse(values)

    if (!result.success) {
      setErrors({
        email: result.error.flatten().fieldErrors.email?.[0],
        password: result.error.flatten().fieldErrors.password?.[0],
      })
      return
    }

    setErrors({})

    try {
      await loginMutation.mutateAsync(result.data)
      toast.success('Signed in successfully.')
      await navigate({ to: '/dashboard' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <section className="grid min-h-[calc(100svh-3.5rem)] items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden max-w-xl flex-col gap-6 lg:flex">
        <Link to="/" className="flex w-fit items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            FlowBoard
          </span>
        </Link>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Get back to the boards that move work forward.
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Sign in to manage workspaces, favorite boards, lists, and cards from
            one focused app shell.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          {['Persistent boards', 'Workspace access', 'Fast card updates'].map(
            (item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                <span>{item}</span>
              </div>
            ),
          )}
        </div>
      </div>

      <Card className="mx-auto w-full max-w-md shadow-xl shadow-foreground/5">
        <CardHeader className="gap-2">
          <div className="mb-2 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LayoutDashboard aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">FlowBoard</span>
          </div>
          <CardTitle className="text-2xl">Sign in to FlowBoard</CardTitle>
          <CardDescription>Access your boards and workspaces.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
                <FieldError>{errors.email}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
                <FieldError>{errors.password}</FieldError>
              </Field>
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New to FlowBoard?{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
