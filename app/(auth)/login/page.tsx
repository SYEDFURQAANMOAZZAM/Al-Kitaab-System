'use client'

import { useActionState } from 'react'
import { login } from '@/app/ServerActions/auth/login'
import { BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PasswordInput } from '@/components/passwordInput'

export default function Page() {
 
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="grid min-h-screen grid-cols-12 bg-background px-4 py-12">

      <div className="col-span-10 col-start-2 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4">

        <Card className="rounded-3xl border border-border bg-card shadow-2xl">
          <CardContent className="p-10">

            {/* Header */}
            <div className="mb-10 flex flex-col items-center">

              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>

              <h1 className="text-3xl font-bold text-card-foreground">
                AlKitaab Academy
              </h1>

              <p className="mt-2 text-muted-foreground">
                Sign in to continue
              </p>

            </div>

            {/* Form */}
            <form action={action} className="space-y-6">

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-medium text-foreground"
                >
                  Email Address
                </Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="h-12 rounded-xl border-input"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="font-medium text-foreground"
                >
                  Password
                </Label>

                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  className="border-input"
                 />

              </div>

              {state?.error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {state.error}
                </div>
              )}
              

              <Button
                type="submit"
                disabled={pending}
                className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {pending ? 'Signing In...' : 'Sign In'}
              </Button>

            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Need an account? Contact your administrator.
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  )
}
