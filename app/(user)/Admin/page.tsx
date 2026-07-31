import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { redirect } from 'next/navigation'

export default async function Admin() {
  const user=await AuthVerify()

  return (redirect("/Admin/dashboard"))}