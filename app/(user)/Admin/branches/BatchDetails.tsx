"use client";

import { useState, useTransition } from "react";
import { getBatchMembers } from "@/app/ServerActions/getGroups/getBatchMembers";

import {
  ChevronDown,
  MoreVertical,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";

type StudentMember = {
  id: string;
  name: string | null;
  attendance: number;
  progress: number;
};

type TeacherMember = {
  id: string;
  name: string | null;
  attendance: number;
};

type BatchMembers = {
  teachers: TeacherMember[];
  students: StudentMember[];
};

type BatchDetailsProps = {
  batchId: string;
  studentCount: number;
  teacherCount: number;
};

function MemberActions({
  member,
}: {
  member: {
    id: string;
    name: string | null;
  };
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Actions for ${
          member.name ?? "member"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          View Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          Performance
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive">
          Remove from Batch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* =========================================================
   Attendance
========================================================= */

function AttendanceBar({
  value,
}: {
  value: number;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Progress
        value={value}
        className="h-2 flex-1"
      />

      <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-700">
        {value}%
      </span>
    </div>
  );
}

/* =========================================================
   Student List
========================================================= */

function StudentList({
  students,
}: {
  students: StudentMember[];
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-5 text-center">
        <p className="text-sm text-muted-foreground">
          No students assigned to this batch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <div
          key={student.id}
          className="
            rounded-lg border bg-white
            p-3
            sm:px-4 sm:py-3
          "
        >
          {/* Student header */}

          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-slate-800">
              {student.name ?? "Unnamed"}
            </p>

            <MemberActions member={student} />
          </div>

          {/* Metrics */}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {/* Attendance */}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Attendance
                </span>

                <span className="text-xs font-semibold text-slate-700">
                  {student.attendance}%
                </span>
              </div>

              <Progress
                value={student.attendance}
                className="h-2"
              />
            </div>

            {/* Progress */}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Progress
                </span>

                <span className="text-xs font-semibold text-slate-700">
                  {student.progress}%
                </span>
              </div>

              <Progress
                value={student.progress}
                className="h-2"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   Teacher List
========================================================= */

function TeacherList({
  teachers,
}: {
  teachers: TeacherMember[];
}) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-5 text-center">
        <p className="text-sm text-muted-foreground">
          No teachers assigned to this batch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teachers.map((teacher) => (
        <div
          key={teacher.id}
          className="
            rounded-lg border bg-white
            p-3
            sm:px-4 sm:py-3
          "
        >
          {/* Header */}

          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-slate-800">
              {teacher.name ?? "Unnamed"}
            </p>

            <MemberActions member={teacher} />
          </div>

          {/* Attendance */}

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Attendance
              </span>

              <span className="text-xs font-semibold text-slate-700">
                {teacher.attendance}%
              </span>
            </div>

            <Progress
              value={teacher.attendance}
              className="h-2"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   Member Section
========================================================= */

function MemberSection({
  title,
  count,
  open,
  onToggle,
  children,
  pending,
  loaded,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  pending: boolean;
  loaded: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center">
        {/* Expand */}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="
            flex min-w-0 flex-1
            items-center gap-3
            px-4 py-3.5
            text-left
            hover:bg-slate-50
          "
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />

          <span className="font-medium text-slate-800">
            {title}
          </span>

          <span className="text-xs text-muted-foreground">
            {count}
          </span>
        </button>

        {/* Add */}

        <button
          type="button"
          className="
            mr-3 flex shrink-0
            items-center gap-1.5
            rounded-lg border
            px-3 py-1.5
            text-xs font-medium
            text-slate-700
            hover:bg-slate-50
            sm:text-sm
          "
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {open && (
        <div className="border-t bg-slate-50/60 p-3 sm:p-4">
          {pending && !loaded ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Loading {title.toLowerCase()}...
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Batch Details
========================================================= */

export default function BatchDetails({
  batchId,
  studentCount,
  teacherCount,
}: BatchDetailsProps) {
  const [teachersOpen, setTeachersOpen] =
    useState(false);

  const [studentsOpen, setStudentsOpen] =
    useState(false);

  const [members, setMembers] =
    useState<BatchMembers | null>(null);

  const [pending, startTransition] =
    useTransition();

  const loadMembers = () => {
    if (members || pending) {
      return;
    }

    startTransition(async () => {
      const data =
        await getBatchMembers(batchId);

      setMembers(data);
    });
  };

  const toggleTeachers = () => {
    setTeachersOpen((value) => !value);
    loadMembers();
  };

  const toggleStudents = () => {
    setStudentsOpen((value) => !value);
    loadMembers();
  };

  return (
    <div className="space-y-3">
      {/* =====================================================
          Teachers
      ===================================================== */}

      <MemberSection
        title="Teachers"
        count={teacherCount}
        open={teachersOpen}
        onToggle={toggleTeachers}
        pending={pending}
        loaded={!!members}
      >
        <TeacherList
          teachers={members?.teachers ?? []}
        />
      </MemberSection>

      {/* =====================================================
          Students
      ===================================================== */}

      <MemberSection
        title="Students"
        count={studentCount}
        open={studentsOpen}
        onToggle={toggleStudents}
        pending={pending}
        loaded={!!members}
      >
        <StudentList
          students={members?.students ?? []}
        />
      </MemberSection>
    </div>
  );
}