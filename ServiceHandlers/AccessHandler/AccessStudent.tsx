'use client'

import {StudentPermitAccess,StudentDenyAccess} from '@/app/ServerActions/access/studentaccess'
import { ButtonShadcn } from '@/components/button'

type AccessGrantProps = {
  studentId: string
}

export function AccessgrantStudent({studentId}:AccessGrantProps){
    return(
    <form action={()=>StudentPermitAccess(studentId)}>
        <ButtonShadcn variant="outline" type='submit'>Grant Access</ButtonShadcn>
    </form>
    )
} 

export function AccessdenyStudent({studentId}:AccessGrantProps){
    return(
    <form action={()=>StudentDenyAccess(studentId)}>
        <ButtonShadcn variant="outline" type='submit'>Grant Access</ButtonShadcn>
    </form>
    )
} 