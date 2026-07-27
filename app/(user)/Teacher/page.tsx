import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { logout } from '@/app/ServerActions/auth/login'
import { redirect } from 'next/navigation'

export default async function Admin() {
  const user=await AuthVerify()

  return (
    <div>
      <h1>Welcome, {user.isaccess}</h1>
      <button onClick={logout}>logout</button>
    </div>
  )
}