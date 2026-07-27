'use client'

import { useActionState } from 'react'
import { login } from '@/app/ServerActions/auth/login'
import Link from "next/link"
import { register } from 'module'

export default function Page() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <>
    <div>
      <form action={action}>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
        />

        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
        />

        <button type="submit" disabled={pending}>
          {pending ? 'Logging in...' : 'Login'}
        </button>

        {state?.error && (
          <p style={{ color: 'red' }}>
            {state.error}
          </p>
        )}
      </form>
     
    </div>
    <Link href="/register">Register</Link>
  </>
    
  )
}


