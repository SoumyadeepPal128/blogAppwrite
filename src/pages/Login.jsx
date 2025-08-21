import React from 'react'
import { Login as loginComponent } from '../components'
function Login() {
  console.log("LOGIN pressed");
  
  return (
    <div className='py-8'>
        <loginComponent />
    </div>
  )
}

export default Login