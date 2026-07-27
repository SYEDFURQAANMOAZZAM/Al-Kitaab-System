import { Access, Role } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as z from 'zod'
 
export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.email({ error: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { error: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { error: 'Contain at least one letter.' })
    .regex(/[0-9]/, { error: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      error: 'Contain at least one special character.',
    })
    .trim(),
  role: z.enum(Role),
  isaccess: z.enum(Access)
})

export const LoginValidation = async(formData:FormData)=>{

 const email = formData.get('email') as string
  const password = formData.get('password') as string
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Invalid credentials' }
  }
  
  const valid = await bcrypt.compare(password, user.password)
  

  if (!valid) return { error: 'Invalid credentials' }
}

 
export type FormStateRegister =
  | {
      errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        role?: string[];
        isaccess?: string[];
      }
      message?: string
    }
  | undefined

export type FormStateLogin =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined