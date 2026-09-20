import LoginForm from "./loginForm"

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export default async function Page({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl ?? ''

  return <LoginForm callbackUrl={callbackUrl} />
}