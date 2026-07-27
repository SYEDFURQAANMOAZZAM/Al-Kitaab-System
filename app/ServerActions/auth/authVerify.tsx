import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'


export default async function AuthVerify() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  
  if(user.isaccess==="NO") redirect('/NotAccess')
  else

  return user
}