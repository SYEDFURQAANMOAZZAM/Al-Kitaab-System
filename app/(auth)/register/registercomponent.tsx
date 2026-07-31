'use client'

import { use } from 'react'
import { useActionState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { register as registerAction } from '@/app/ServerActions/auth/register'
import { SignupFormSchema } from '@/app/ServerActions/auth/Validate'
import { BookOpen } from "lucide-react";

import { useEffect } from "react";

import { PasswordInput } from '@/components/passwordInput'

import { useWatch } from "react-hook-form";

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FormValues = {
  name: string
  email: string
  password: string
  confirmPassword:string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  isaccess: 'YES' | 'NO'
  batch: string
  branch: string
}

export default function SignupForm({
  batches,
  branches,
}: {
  batches: Promise<{ id: string; batchname: string }[]>
  branches: Promise<{ id: string; branchname: string }[]>
}) {
  const allBatches = use(batches)
  const allBranches = use(branches)

  const [state, action, pending] = useActionState(registerAction, undefined)
  const {
  register,
  setValue,
  trigger,
  formState: { errors, isValid },
} = useForm<FormValues>({
  resolver: zodResolver(SignupFormSchema),
  mode: "onChange",
});




  return (
    <div className="grid min-h-screen grid-cols-12 bg-slate-100 px-4 pt-10 pb-10">
    <Card className="
      col-span-12 col-start-0
      md:col-span-8 md:col-start-3
      lg:col-span-6 lg:col-start-4">
        
      <CardContent className="p-10">

        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-700 shadow-lg">
            <BookOpen className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900">
            AlKitaab Academy
          </h1>

          <p className="mt-2 text-slate-500">
            Create your account to continue
          </p>
        </div>


        <form action={action} className="space-y-8">

  
  <div className="grid gap-6">

    {/* Name */}
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="name" className="text-slate-700 font-medium">
        Full Name <span className="text-red-500">*</span>
      </Label>

      <Input
        id="name"
        {...register("name")}
        placeholder="Enter full name"
        className="h-12 rounded-xl border-slate-300"
      />

      {errors.name && (
        <p className="text-sm text-red-600">
          {errors.name.message}
        </p>
      )}
    </div>

    {/* Email */}
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="email" className="text-slate-700 font-medium">
        Email Address <span className="text-red-500">*</span>
      </Label>

      <Input
        id="email"
        type="email"
        {...register("email")}
        placeholder="example@alkitaab.com"
        className="h-12 rounded-xl border-slate-300"
      />

      {errors.email && (
        <p className="text-sm text-red-600">
          {errors.email.message}
        </p>
      )}
    </div>

    {/* Password */}
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="password" className="text-slate-700 font-medium">
        Password <span className="text-red-500">*</span>
      </Label>

      <PasswordInput
        id="password"
      
        {...register("password", {onChange: () => {trigger("confirmPassword");},})}
        placeholder="Enter your password"
        required
        className="border-slate-300"
      />

      {errors.password && (
        <p className="text-sm text-red-600">
          {errors.password.message}
        </p>
      )}
    </div>

    {/* Confirm Password */}
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
       Confirm Password <span className="text-red-500">*</span>
      </Label>

      <PasswordInput
        id="confirmPassword"
      
        {...register("confirmPassword")}
        placeholder="Confirm your password"
        required
        className="border-slate-300"
      />

      {errors.confirmPassword && (
        <p className="text-sm text-red-600">
          {errors.confirmPassword.message}
        </p>
      )}
    </div>


   <div className="grid grid-cols-2 gap-4">
    {/* Role */}
    <div className="space-y-2">
      <Label className="text-slate-700 font-medium">
        Role
      </Label>

      <Select
        onValueChange={(value) =>
          setValue("role", value as FormValues["role"], {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger className="h-12 rounded-xl border-slate-300">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ADMIN">Administrator</SelectItem>
          <SelectItem value="TEACHER">Teacher</SelectItem>
          <SelectItem value="STUDENT">Student</SelectItem>
        </SelectContent>
      </Select>

      <input type="hidden" {...register("role")} />

      {errors.role && (
        <p className="text-sm text-red-600">
          {errors.role.message}
        </p>
      )}
    </div>

    {/* Access */}
    <div className="space-y-2">
      <Label className="text-slate-700 font-medium">
        Account Access
      </Label>

      <Select
        onValueChange={(value) =>
          setValue("isaccess", value as FormValues["isaccess"], {
            shouldValidate: true,
          })
        }
      >
        <SelectTrigger className="h-12 rounded-xl border-slate-300">
          <SelectValue placeholder="Select access" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="YES">Enabled</SelectItem>
          <SelectItem value="NO">Disabled</SelectItem>
        </SelectContent>
      </Select>

      <input type="hidden" {...register("isaccess")} />

      {errors.isaccess && (
        <p className="text-sm text-red-600">
          {errors.isaccess.message}
        </p>
      )}
    </div>

    {/* Batch */}
    <div className="space-y-2">
      <Label className="text-slate-700 font-medium">
        Batch
      </Label>

      <Select
  onValueChange={(value) =>
    setValue("batch", value as FormValues["batch"], {
      shouldValidate: true,
    })
  }
>
  <SelectTrigger
    className="
      h-14 w-full
      rounded-xl
      border border-slate-300
      bg-white
      px-4
      text-base
      font-medium
      shadow-sm
      transition-all
      hover:border-emerald-500
      focus:ring-2
      focus:ring-emerald-500
      data-[state=open]:border-emerald-500
    "
  >
    <SelectValue placeholder="Select Batch" />
  </SelectTrigger>

  <SelectContent
    className="
      rounded-xl
      border border-slate-200
      bg-white
      p-2
      shadow-xl
    "
  >
    {allBatches.map((batch) => (
      <SelectItem
        key={batch.id}
        value={batch.batchname}
        className="
          min-h-12
          rounded-lg
          px-4
          py-3
          text-base
          leading-6
          cursor-pointer
          whitespace-normal
          break-words
          focus:bg-emerald-50
          focus:text-emerald-700
        "
      >
        {batch.batchname}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

      <input type="hidden" {...register("batch")} />

      {errors.batch && (
        <p className="text-sm text-red-600">
          {errors.batch.message}
        </p>
      )}
    </div>

    {/* Branch */}
    <div className="space-y-2">
      <Label className="text-slate-700 font-medium">
        Branch
      </Label>

      <Select
  onValueChange={(value) =>
    setValue("branch", value as FormValues["branch"], {
      shouldValidate: true,
    })
  }
>
  <SelectTrigger
    className="
      h-14 w-full
      rounded-xl
      border border-slate-300
      bg-white
      px-4
      text-base
      font-medium
      shadow-sm
      transition-all
      hover:border-emerald-500
      focus:ring-2
      focus:ring-emerald-500
      data-[state=open]:border-emerald-500
    "
  >
    <SelectValue placeholder="Select Branch" />
  </SelectTrigger>

  <SelectContent
    className="
      rounded-xl
      border border-slate-200
      bg-white
      p-2
      shadow-xl
    "
  >
    {allBranches.map((branch) => (
      <SelectItem
        key={branch.id}
        value={branch.branchname}
        className="
          min-h-12
          rounded-lg
          px-4
          py-3
          text-base
          leading-6
          cursor-pointer
          whitespace-normal
          break-words
          focus:bg-emerald-50
          focus:text-emerald-700
        "
      >
        {branch.branchname}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

      <input type="hidden" {...register("branch")} />

      {errors.branch && (
        <p className="text-sm text-red-600">
          {errors.branch.message}
        </p>
      )}
    </div>

  </div>

  {state?.errors && (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      {Object.entries(state.errors).map(([key, value]) => (
        <p key={key} className="text-sm text-red-700">
          {Array.isArray(value) ? value[0] : value}
        </p>
      ))}
    </div>
  )}
 </div>
  <Button
    type="submit"
    disabled={!isValid || pending}
    className="h-12 w-full rounded-xl bg-emerald-700 text-base font-semibold hover:bg-emerald-800"
  >
    {pending ? "Creating Account..." : "Create Account"}
  </Button>

</form>

           </CardContent>
    </Card>
  </div>
  )
}