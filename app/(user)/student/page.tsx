import AuthVerify from '@/app/ServerActions/auth/authVerify'
import { redirect } from 'next/navigation'

export default async function Student() {
  await AuthVerify("STUDENT")

  return (redirect("/student/dashboard"))}
