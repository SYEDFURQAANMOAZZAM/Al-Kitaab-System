"use client";

import { useState, useTransition } from "react";
import { getBatchMembers } from "@/app/ServerActions/getGroups/getBatchMembers";



import {
  ChevronDown,
} from "lucide-react";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

import { Progress } from "@/components/ui/progress";
import AddMemberButton from "./batchMembersActions.tsx/AddMemberButton";
import MemberActions from "./batchMembersActions.tsx/MemberActions";

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




/* =========================================================
   Student List
========================================================= */

function StudentList({
  students,
  batchId,
  onChanged,
}: {
  students: StudentMember[];
  batchId: string;
  onChanged: () => void;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-5 text-center">
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
            rounded-lg border bg-card
            p-3
            sm:px-4 sm:py-3
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-card-foreground">
              {student.name ?? "Unnamed"}
            </p>

            <MemberActions
              member={student}
              batchId={batchId}
              role="STUDENT"
              onChanged={onChanged}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Attendance
                </span>

                <span className="text-xs font-semibold text-foreground">
                  {student.attendance}%
                </span>
              </div>

              <Progress
                value={student.attendance}
                className="h-2"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Progress
                </span>

                <span className="text-xs font-semibold text-foreground">
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
  batchId,
  onChanged,
}: {
  teachers: TeacherMember[];
  batchId: string;
  onChanged: () => void;
}) {
  if (teachers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card p-5 text-center">
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
            rounded-lg border bg-card
            p-3
            sm:px-4 sm:py-3
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-medium text-card-foreground">
              {teacher.name ?? "Unnamed"}
            </p>

            <MemberActions
              member={teacher}
              batchId={batchId}
              role="TEACHER"
              onChanged={onChanged}
            />
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Attendance
              </span>

              <span className="text-xs font-semibold text-foreground">
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
  batchId,
  role,
  onMemberAdded,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  role: "STUDENT" | "TEACHER";
  batchId: string;
  pending: boolean;
  loaded: boolean;
  onMemberAdded: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
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
            hover:bg-accent
          "
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />

          <span className="font-medium text-card-foreground">
            {title}
          </span>

          <span className="text-xs text-muted-foreground">
            {count}
          </span>
        </button>

        {/* Add */}

        <AddMemberButton batchId={batchId} role={role} onAdded={onMemberAdded}/>
      </div>

      {open && (
        <div className="border-t bg-muted/60 p-3 sm:p-4">
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
    if (pending) {
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
        batchId={batchId}
        role="TEACHER"
        pending={pending}
        loaded={!!members}
        onMemberAdded={loadMembers}
      >
        <TeacherList
          teachers={members?.teachers ?? []}
          batchId={batchId}
          onChanged={loadMembers}
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
        role="STUDENT"
        batchId={batchId}
        pending={pending}
        loaded={!!members}
        onMemberAdded={loadMembers}
      >
        <StudentList
          students={members?.students ?? []}
          batchId={batchId}
          onChanged={loadMembers}

        />
      </MemberSection>
    </div>
  );
}