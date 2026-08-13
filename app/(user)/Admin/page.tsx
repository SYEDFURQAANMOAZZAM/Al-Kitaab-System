import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { redirect } from 'next/navigation'

export default async function Admin() {
  await AuthVerify("ADMIN")

  return (redirect("/Admin/dashboard"))}
