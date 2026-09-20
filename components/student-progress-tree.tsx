"use client";

import { useState } from "react";

import type {
  StudentProgressData,
  StudentProgressNode,
  StudentSubjectProgress,
} from "@/app/ServerActions/progress/get-students-progress";

type Props = {
  students: StudentProgressData[];
};

/* =========================================================
   SHARED UI
========================================================= */

function Percentage({
  percentage,
}: {
  percentage: number;
}) {
  return (
    <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
      {percentage}%
    </span>
  );
}

function ProgressBar({
  percentage,
}: {
  percentage: number;
}) {
  const value = Math.min(100, Math.max(0, percentage));

  return (
    <div className="hidden w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ExpandButton({
  expanded,
  onClick,
  label,
  size = "size-7",
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
  size?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex ${size} shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`}
      aria-label={label}
    >
      <span
        className={`text-xs transition-transform ${
          expanded ? "rotate-90" : ""
        }`}
      >
        ▶
      </span>
    </button>
  );
}

/* =========================================================
   TOC NODE
========================================================= */

function TreeNode({
  node,
  level,
}: {
  node: StudentProgressNode;
  level: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        style={{
          paddingLeft: `${level * 20 + 8}px`,
        }}
      >
        {hasChildren ? (
          <ExpandButton
            expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            label={expanded ? "Collapse" : "Expand"}
            size="size-6"
          />
        ) : (
          <span className="size-6 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {node.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {node.completed} / {node.total} completed
          </p>
        </div>

        <ProgressBar percentage={node.percentage} />

        <Percentage percentage={node.percentage} />
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUBJECT
========================================================= */

function SubjectRow({
  subject,
}: {
  subject: StudentSubjectProgress;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t">
      <div className="flex min-h-12 items-center gap-2 px-3 sm:px-4">
        <ExpandButton
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          label={expanded ? "Collapse subject" : "Expand subject"}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {subject.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {subject.completed} / {subject.total} completed
          </p>
        </div>

        <ProgressBar percentage={subject.percentage} />

        <Percentage percentage={subject.percentage} />
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 py-1">
          {subject.children.length > 0 ? (
            subject.children.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                level={1}
              />
            ))
          ) : (
            <p className="px-12 py-4 text-sm text-muted-foreground">
              No TOC items found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STUDENT
========================================================= */

function StudentRow({
  student,
}: {
  student: StudentProgressData;
}) {
  const [expanded, setExpanded] = useState(false);

  /*
   * These values come from the normalized tracking data
   * returned by the server action.
   *
   * Do NOT calculate them from Progress.learnings here.
   */
  const totalLeaves = student.subjects.reduce(
    (total, subject) => total + subject.total,
    0,
  );

  const completedLeaves = student.subjects.reduce(
    (total, subject) => total + subject.completed,
    0,
  );

  const percentage =
    totalLeaves === 0
      ? 0
      : Number(
          ((completedLeaves / totalLeaves) * 100).toFixed(2),
        );

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* Student header */}
      <div className="flex min-h-14 items-center gap-2 px-3 sm:px-4">
        <ExpandButton
          expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          label={expanded ? "Collapse student" : "Expand student"}
          size="size-8"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {student.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {completedLeaves} / {totalLeaves} completed
          </p>
        </div>

        <ProgressBar percentage={percentage} />

        <Percentage percentage={percentage} />
      </div>

      {/* Subjects */}
      {expanded && (
        <div className="border-t">
          {student.subjects.length > 0 ? (
            student.subjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
              />
            ))
          ) : (
            <p className="px-14 py-4 text-sm text-muted-foreground">
              No subjects assigned.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export function StudentProgressTree({
  students,
}: Props) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredStudents =
    normalizedSearch.length === 0
      ? students
      : students.filter((student) =>
          student.name
            .toLowerCase()
            .includes(normalizedSearch),
        );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search students..."
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">
        {filteredStudents.length}{" "}
        {filteredStudents.length === 1
          ? "student"
          : "students"}
      </div>

      {/* Students */}
      <div className="space-y-2">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
            />
          ))
        ) : (
          <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
            No students found.
          </div>
        )}
      </div>
    </div>
  );
}