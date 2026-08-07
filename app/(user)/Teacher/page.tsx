import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { logout } from '@/app/ServerActions/auth/login'

export default async function Admin() {
  const user=await AuthVerify()

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>logout</button>
    </div>
  )
}
