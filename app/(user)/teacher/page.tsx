import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { redirect } from 'next/navigation'

export default async function Teacher() {
  await AuthVerify("TEACHER")

  return (redirect("/teacher/dashboard"))}
