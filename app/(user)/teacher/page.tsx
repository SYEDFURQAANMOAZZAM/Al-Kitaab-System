import AuthVerify from '@/app/ServerActions/auth/authVerify'

export default async function Admin() {
  const user=await AuthVerify("TEACHER")

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
    </div>
  )
}
