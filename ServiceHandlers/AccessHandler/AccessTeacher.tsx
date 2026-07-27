'use client'

import {TeacherPermitAccess,TeacherDenyAccess} from '@/app/ServerActions/access/teacheraccess'
import { ButtonShadcn } from '@/components/button'

type AccessGrantProps = {
  teacherId: string
}

export function AccessgrantTeacher({teacherId}:AccessGrantProps){
    return(
    <form action={()=>TeacherPermitAccess(teacherId)}>
        <ButtonShadcn variant="outline" type='submit'>Grant Access</ButtonShadcn>
    </form>
    )
} 

export function AccessdenyTeacher({teacherId}:AccessGrantProps){
    return(
    <form action={()=>TeacherDenyAccess(teacherId)}>
        <ButtonShadcn variant="outline" type='submit'>Deny Access</ButtonShadcn>
    </form>
    )
} 