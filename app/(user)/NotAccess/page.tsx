import React from 'react'
import { logout } from '@/app/ServerActions/auth/login'

const NotAccess = () => {
  return (
    <div>NotAccess
      <button onClick={logout}>logout</button>
    </div>
  )
}

export default NotAccess