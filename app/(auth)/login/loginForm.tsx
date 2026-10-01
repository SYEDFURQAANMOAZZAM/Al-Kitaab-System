
'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { login } from '@/app/ServerActions/auth/login'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/passwordInput'

export default function LoginForm({
  callbackUrl,
}: {
  callbackUrl: string
}) {
  const [state, action, pending] = useActionState(
    login,
    undefined
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-2 py-3 sm:px-4">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl border border-border bg-card shadow-xl">
          <CardContent className="p-5 sm:p-8">

            {/* Header */}
            <div className="mb-7 flex flex-col items-center text-center">
              {/* Light theme logo */}
              <Image
                src="/lightThemeLogo.jpeg"
                alt="AlKitaab Academy"
                width={900}
                height={900}
                priority
                className="mb-4 block h-24 w-24 object-contain dark:hidden sm:h-28 sm:w-28"
              />

              {/* Dark theme logo */}
              <Image
                src="/darkThemeLogo.png"
                alt="AlKitaab Academy"
                width={900}
                height={900}
                priority
                className="mb-4 hidden h-24 w-24 object-contain dark:block sm:h-28 sm:w-28"
              />

              <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                AlKitaab Academy
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to continue
              </p>
            </div>

            {/* Form */}
            <form action={action} className="space-y-5">
              <input
                type="hidden"
                name="callbackUrl"
                value={callbackUrl}
              />

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  className="h-11 rounded-lg"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>

                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-lg"
                />
              </div>

              {/* Error */}
              {state?.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {state.error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-lg text-base font-semibold"
              >
                {pending ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need an account? Contact your administrator.
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
