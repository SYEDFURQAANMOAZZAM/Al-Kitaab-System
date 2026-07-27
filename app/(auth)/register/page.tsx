'use client'

import { useActionState } from 'react'
import { register } from '@/app/ServerActions/auth/register'

export default function SignupForm() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <form action={action} >
      {/* Name */}
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          placeholder="Name"
        />

        {state?.errors?.name && (
          <p>{state.errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
        />

        {state?.errors?.email && (
          <p>{state.errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
        />

        {state?.errors?.password && (
          <div>
            <p>Password must:</p>
            <ul>
              {state.errors.password.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Role */}
      <div>
        <label htmlFor="role">Role</label>

        <select
          id="role"
          name="role"
        >
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>

        {state?.errors?.role && (
          <p>{state.errors.role[0]}</p>
        )}
      </div>

      {/* Access */}
      <div>
        <label htmlFor="isaccess">Access</label>

        <select
          id="isaccess"
          name="isaccess"
        >
          <option value="YES">YES</option>
          <option value="NO">NO</option>
        </select>

        {state?.errors?.isaccess && (
          <p>{state.errors.isaccess[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending}
      >
        {pending ? 'Signing Up...' : 'Sign Up'}
      </button>
    </form>
  )
}