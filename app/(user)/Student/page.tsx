
import { logout } from '@/app/ServerActions/auth/login'

const student = () => {
  return (
    <div>student
      <button onClick={logout}>logout</button>
    </div>
  )
}

export default student