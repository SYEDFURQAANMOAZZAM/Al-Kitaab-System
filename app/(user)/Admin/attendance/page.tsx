import AuthVerify from '@/app/ServerActions/auth/authVerify'
const page = async() => {
  await AuthVerify("ADMIN");
  return (
    <div>page</div>
  )
}

export default page
