'use client'

import { useActionState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen, User, Mail, Phone, GraduationCap } from 'lucide-react'

import { register as registerAction } from '@/app/ServerActions/auth/register'
import { SignupFormSchema } from '@/app/ServerActions/auth/Validate'

import { PasswordInput } from '@/components/passwordInput'
import MultiSelect from '@/components/MultiSelect'

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
  phone: string
  password: string
  confirmPassword: string
  role: 'STUDENT'
  branchId: string
  batch: string[]
}

type Branch = {
  id: string
  name: string
  batches: {
    id: string
    name: string
  }[]
}

interface AdminRegisterStudentFormProps {
  branches: Branch[]
}

export default function AdminRegisterStudentForm({
  branches,
}: AdminRegisterStudentFormProps) {
  const [state, action, pending] = useActionState(registerAction, undefined)

  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(SignupFormSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'STUDENT',
      branchId: '',
      batch: [],
    },
  })

  const selectedBranchId = watch('branchId')
  const selectedBatch = watch('batch')

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId),
    [branches, selectedBranchId]
  )

  const batchOptions = useMemo(
    () =>
      (selectedBranch?.batches ?? []).map((batch) => ({
        label: batch.name,
        value: batch.id,
      })),
    [selectedBranch]
  )

  // Reset batches whenever the selected branch changes
  useEffect(() => {
    setValue('batch', [])
  }, [selectedBranchId, setValue])

  return (
    
      <Card className="col-span-12 overflow-visible border-slate-200 shadow-xl">
        <CardContent className="overflow-visible p-10">
          {/* Header */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-700 shadow-lg">
              <BookOpen className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Register New Student
            </h1>

            <p className="mt-2 text-slate-500">
              Fill in the student&apos;s details and assign one or more batches.
            </p>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              <GraduationCap className="h-3.5 w-3.5" />
              Role: Student
            </span>
          </div>

          <form action={action} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter full name"
                  className="h-12 rounded-xl border-slate-300 pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="student@alkitaab.com"
                    className="h-12 rounded-xl border-slate-300 pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="e.g. 9876543210"
                    className="h-12 rounded-xl border-slate-300 pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password <span className="text-red-500">*</span>
              </Label>
              <PasswordInput
                id="password"
                {...register('password', {
                  onChange: () => {
                    trigger('confirmPassword')
                  },
                })}
                placeholder="Enter password"
                required
                className="border-slate-300"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <PasswordInput
                id="confirmPassword"
                {...register('confirmPassword')}
                placeholder="Confirm password"
                required
                className="border-slate-300"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branchId" className="text-slate-700 font-medium">
                Branch <span className="text-red-500">*</span>
              </Label>

              <Select
                value={selectedBranchId}
                onValueChange={(value) =>
                  setValue('branchId', value ?? '', { shouldValidate: true })
                }
              >
                <SelectTrigger
                  id="branchId"
                  className="h-12 w-full rounded-xl border-slate-300 px-3 text-sm shadow-sm data-popup-open:rounded-b-none"
                >
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={-1}
                  className="max-h-60 rounded-t-none border-slate-300"
                >
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className="px-3 py-2.5">
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('branchId')} />

              {errors.branchId && (
                <p className="text-sm text-red-600">{errors.branchId.message}</p>
              )}
            </div>

            {/* Batch — depends on selected branch */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">
                Batch <span className="text-red-500">*</span>
              </Label>

              {selectedBranchId === '' ? (
                <p className="flex h-12 items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                  Please select a branch first.
                </p>
              ) : batchOptions.length === 0 ? (
                <p className="flex h-12 items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                  No batches available for this branch.
                </p>
              ) : (
                <MultiSelect
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={(values) =>
                    setValue('batch', values, { shouldValidate: true })
                  }
                />
              )}

              <input
                type="hidden"
                {...register('batch')}
                value={JSON.stringify(selectedBatch)}
              />
              {errors.batch && (
                <p className="text-sm text-red-600">
                  {errors.batch.message as string}
                </p>
              )}
            </div>

            {/* Role is fixed */}
            <input type="hidden" {...register('role')} value="STUDENT" />

            {state?.errors && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                {Object.entries(state.errors).map(([key, value]) => (
                  <p key={key} className="text-sm text-red-700 ">
                    {Array.isArray(value) ? value[0] : value}
                  </p>
                ))}
              </div>
            )}

            <Button
              type="submit"
              disabled={!isValid || pending}
              className="h-12 w-full rounded-xl bg-emerald-700 text-base font-semibold hover:bg-emerald-800"
            >
              {pending ? 'Creating Account...' : 'Create Student Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    
  )
}
