import {
  queryStudentBatchMonthProgress,
  queryStudentMonthProgress,
    queryBatchStudentsMonthProgress,
} from "./queries";

import type {
  GetStudentBatchMonthProgressInput,
  GetStudentMonthProgressInput,
  StudentBatchMonthProgressDay,
  StudentMonthProgressDay,
  BatchStudentMonthProgress,
  GetBatchStudentsMonthProgressInput
} from "./types";

function getDaysInMonth(year: number, month: number): Date[] {
  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  return Array.from(
    { length: daysInMonth },
    (_, index) =>
      new Date(
        Date.UTC(year, month - 1, index + 1)
      )
  );
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Student + Batch + Month
 *
 * Returns every calendar day in the month.
 *
 * If progress does not exist for a day:
 *
 * {
 *   date: ...,
 *   progress: null
 * }
 */
export async function getStudentBatchMonthProgress(
  input: GetStudentBatchMonthProgressInput
): Promise<StudentBatchMonthProgressDay[]> {
  const progresses =
    await queryStudentBatchMonthProgress(input);

  const progressByDate = new Map(
    progresses.map((progress) => [
      dateKey(progress.date),
      progress,
    ])
  );

  const days = getDaysInMonth(
    input.year,
    input.month
  );

  return days.map((date) => ({
    date,
    progress:
      progressByDate.get(dateKey(date)) ?? null,
  }));
}

/**
 * Student + Month
 *
 * Returns every calendar day in the month.
 *
 * Each day can contain progress from multiple batches.
 */
export async function getStudentMonthProgress(
  input: GetStudentMonthProgressInput
): Promise<StudentMonthProgressDay[]> {
  const progresses =
    await queryStudentMonthProgress(input);

  const progressesByDate = new Map<
    string,
    typeof progresses
  >();

  for (const progress of progresses) {
    const key = dateKey(progress.date);

    const existing =
      progressesByDate.get(key);

    if (existing) {
      existing.push(progress);
    } else {
      progressesByDate.set(key, [progress]);
    }
  }

  const days = getDaysInMonth(
    input.year,
    input.month
  );

  return days.map((date) => ({
    date,
    progresses:
      progressesByDate.get(dateKey(date)) ?? [],
  }));
}


export async function getBatchStudentsMonthProgress(
  input: GetBatchStudentsMonthProgressInput
): Promise<BatchStudentMonthProgress[]> {
  const progresses = await queryBatchStudentsMonthProgress(input);

  const days = getDaysInMonth(input.year, input.month);

  const studentsMap = new Map<
    string,
    {
      student: {
        id: string;
        userId: string;
        name: string;
      };
      progressByDate: Map<string, (typeof progresses)[number]>;
    }
  >();

  for (const progress of progresses) {
    let entry = studentsMap.get(progress.studentId);

    if (!entry) {
      entry = {
        student: {
          id: progress.student.id,
          userId: progress.student.userId,
          name: progress.student.user.name,
        },
        progressByDate: new Map(),
      };

      studentsMap.set(progress.studentId, entry);
    }

    entry.progressByDate.set(dateKey(progress.date), progress);
  }

  return Array.from(studentsMap.values())
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
    .map(({ student, progressByDate }) => ({
      student,
      days: days.map((date) => ({
        date,
        progress: progressByDate.get(dateKey(date)) ?? null,
      })),
    }));
}