import AuthVerify from '@/app/ServerActions/auth/authVerify'

const page = async() => {
  const user=await AuthVerify();
  return (
    <div>page</div>
  )
}

export default page