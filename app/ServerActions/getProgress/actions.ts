"use server";

import { requireRoleForAction } from "@/lib/auth/require-role";

import {
  getStudentBatchMonthProgress,
  getStudentMonthProgress,
  getBatchStudentsMonthProgress,
} from "./services";

import type {
  GetStudentBatchMonthProgressInput,
  GetStudentMonthProgressInput,
  GetBatchStudentsMonthProgressInput,
} from "./types";

export async function fetchStudentBatchMonthProgress(
  input: GetStudentBatchMonthProgressInput
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
    "STUDENT",
  ]);

  return getStudentBatchMonthProgress(input);
}

export async function fetchStudentMonthProgress(
  input: GetStudentMonthProgressInput
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
    "STUDENT",
  ]);

  return getStudentMonthProgress(input);
}

export async function fetchBatchStudentsMonthProgress(
  input: GetBatchStudentsMonthProgressInput
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
    "STUDENT",
  ]);

  return getBatchStudentsMonthProgress(input);
}