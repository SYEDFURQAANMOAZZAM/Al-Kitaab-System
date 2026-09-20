"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible } from "@base-ui/react/collapsible";

import type {
  StudentTocReport,
  TocReportNode,
} from "./get-toc-completion-report";

/* -------------------------------------------------------------------------- */
/* Completion styles                                                          */
/* -------------------------------------------------------------------------- */

function getCompletionStyle(value: number) {
  /*
   * 0%
   * Completely untouched → normal theme
   */
  if (value === 0) {
    return {
      row: "",
      badge:
        "border-border/60 bg-background text-muted-foreground",
    };
  }

  /*
   * 1–24%
   * Very small progress → muted
   */
  if (value < 25) {
    return {
      row: "bg-muted/25",
      badge:
        "border-border/60 bg-muted text-muted-foreground",
    };
  }

  /*
   * 25–49%
   * Some progress → secondary
   */
  if (value < 50) {
    return {
      row: "bg-secondary/30",
      badge:
        "border-border/60 bg-secondary text-secondary-foreground",
    };
  }

  /*
   * 50–74%
   * Halfway → accent
   */
  if (value < 75) {
    return {
      row: "bg-accent/30",
      badge:
        "border-border/60 bg-accent text-accent-foreground",
    };
  }

  /*
   * 75–99%
   * Almost complete → subtle primary
   */
  if (value < 100) {
    return {
      row: "bg-primary/5",
      badge:
        "border-primary/20 bg-primary/10 text-primary",
    };
  }

  /*
   * 100%
   * Completely completed → clearly primary
   */
  return {
    row: "bg-primary/10",
    badge:
      "border-primary/30 bg-primary/15 text-primary",
  };
}

/* -------------------------------------------------------------------------- */
/* Percentage                                                                  */
/* -------------------------------------------------------------------------- */

function Percentage({ value }: { value: number }) {
  const style = getCompletionStyle(value);

  return (
    <span
      className={`
        shrink-0
        rounded-md
        border
        px-2
        py-0.5
        text-[11px]
        font-semibold
        tabular-nums
        transition-colors
        ${style.badge}
      `}
    >
      {value}%
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Chevron                                                                     */
/* -------------------------------------------------------------------------- */

function Chevron() {
  return (
    <ChevronRight
      className="
        size-4
        shrink-0
        text-muted-foreground
        transition-transform
        duration-200
        ease-out
        group-data-[panel-open]:rotate-90
        group-aria-expanded:rotate-90
      "
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                       */
/* -------------------------------------------------------------------------- */

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Collapsible.Panel
      className={`
        overflow-hidden
        data-[starting-style]:animate-accordion-down
        data-[ending-style]:animate-accordion-up
        ${className}
      `}
    >
      {children}
    </Collapsible.Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* TOC ITEM                                                                    */
/* -------------------------------------------------------------------------- */

function TocItemRow({
  item,
}: {
  item: TocReportNode;
}) {
  const hasChildren = item.children.length > 0;

  const completionStyle = getCompletionStyle(
    item.percentage,
  );

  /* ------------------------------------------------------------------------ */
  /* Leaf                                                                      */
  /* ------------------------------------------------------------------------ */

  if (!hasChildren) {
    return (
      <div
        className={`
          flex
          min-h-9
          items-center
          justify-between
          gap-2
          border-t
          border-border/40
          px-2.5
          py-2
          pl-7
          text-[13px]
          transition-colors
          ${completionStyle.row}
        `}
      >
        <span
          className={`
            min-w-0
            truncate
            ${
              item.percentage > 0
                ? "text-foreground"
                : "text-muted-foreground"
            }
          `}
        >
          {item.name}
        </span>

        <Percentage value={item.percentage} />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Parent TOC                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        className={`
          group
          flex
          min-h-10
          w-full
          items-center
          justify-between
          gap-2
          px-2.5
          py-2
          text-left
          text-foreground
          transition-colors
          hover:bg-accent/40
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          ${completionStyle.row}
        `}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Chevron />

          <span
            className="
              min-w-0
              truncate
              text-[13px]
              font-medium
            "
          >
            {item.name}
          </span>
        </div>

        <Percentage value={item.percentage} />
      </Collapsible.Trigger>

      <Panel>
        {/* -------------------------------------------------------------- */}
        {/* Children under-box                                             */}
        {/* -------------------------------------------------------------- */}

        <div
          className="
            mx-1.5
            mb-1.5
            overflow-hidden
            rounded-md
            border
            border-border/60
            bg-background
          "
        >
          {item.children.map((child) => (
            <TocItemRow
              key={child.id}
              item={child}
            />
          ))}
        </div>
      </Panel>
    </Collapsible.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* PART                                                                        */
/* -------------------------------------------------------------------------- */

type Part =
  StudentTocReport["subjects"][number]["parts"][number];

function PartRow({
  part,
}: {
  part: Part;
}) {
  const hasChildren = part.children.length > 0;

  const completionStyle = getCompletionStyle(
    part.percentage,
  );

  /* ------------------------------------------------------------------------ */
  /* Empty part                                                               */
  /* ------------------------------------------------------------------------ */

  if (!hasChildren) {
    return (
      <div
        className={`
          flex
          min-h-10
          items-center
          justify-between
          gap-2
          px-2.5
          py-2
          ${completionStyle.row}
        `}
      >
        <span className="text-sm font-semibold text-foreground">
          {part.name}
        </span>

        <Percentage value={part.percentage} />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Part                                                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        className={`
          group
          flex
          min-h-10
          w-full
          items-center
          justify-between
          gap-2
          border-t
          border-border/50
          px-2.5
          py-2.5
          text-left
          text-foreground
          transition-colors
          hover:bg-accent/40
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          ${completionStyle.row}
        `}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Chevron />

          <span
            className="
              truncate
              text-sm
              font-semibold
            "
          >
            {part.name}
          </span>
        </div>

        <Percentage value={part.percentage} />
      </Collapsible.Trigger>

      <Panel>
        {/* -------------------------------------------------------------- */}
        {/* Part → TOC                                                    */}
        {/* -------------------------------------------------------------- */}

        <div
          className="
            mx-1.5
            mb-1.5
            mt-1
            overflow-hidden
            rounded-md
            border
            border-border/60
            bg-background
          "
        >
          {part.children.map((item) => (
            <TocItemRow
              key={item.id}
              item={item}
            />
          ))}
        </div>
      </Panel>
    </Collapsible.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* SUBJECT                                                                     */
/* -------------------------------------------------------------------------- */

type Subject =
  StudentTocReport["subjects"][number];

function SubjectRow({
  subject,
}: {
  subject: Subject;
}) {
  /*
   * Only the first part is shown here.
   *
   * Subject
   *   └── Para
   *
   * Surah / Ruku / Ayat are handled
   * recursively inside the TOC.
   */
  const firstPart = subject.parts[0];

  const completionStyle = getCompletionStyle(
    subject.percentage,
  );

  /* ------------------------------------------------------------------------ */
  /* Subject without part                                                     */
  /* ------------------------------------------------------------------------ */

  if (!firstPart) {
    return (
      <div
        className={`
          flex
          items-center
          justify-between
          gap-2
          border-t
          border-border/50
          px-2.5
          py-2.5
          ${completionStyle.row}
        `}
      >
        <span className="text-sm font-semibold text-foreground">
          {subject.name}
        </span>

        <Percentage value={subject.percentage} />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Subject                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        className={`
          group
          flex
          min-h-11
          w-full
          items-center
          justify-between
          gap-2
          border-t
          border-border/50
          px-2.5
          py-2.5
          text-left
          text-foreground
          transition-colors
          hover:bg-accent/40
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-ring
          ${completionStyle.row}
        `}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <Chevron />

          <span
            className="
              min-w-0
              truncate
              text-[14px]
              font-semibold
              tracking-tight
            "
          >
            {subject.name}
          </span>
        </div>

        <Percentage value={subject.percentage} />
      </Collapsible.Trigger>

      <Panel>
        {/* -------------------------------------------------------------- */}
        {/* Subject → Part                                                */}
        {/* -------------------------------------------------------------- */}

        <div
          className="
            mx-1.5
            mb-1.5
            overflow-hidden
            rounded-md
            border
            border-border/60
            bg-background
          "
        >
          <PartRow part={firstPart} />
        </div>
      </Panel>
    </Collapsible.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* STUDENT                                                                     */
/* -------------------------------------------------------------------------- */

function StudentRow({
  student,
}: {
  student: StudentTocReport;
}) {
  const hasSubjects = student.subjects.length > 0;

  return (
    <Collapsible.Root>
      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-border
          bg-card
          shadow-sm
        "
      >
        {/* ---------------------------------------------------------------- */}
        {/* Student                                                          */}
        {/* ---------------------------------------------------------------- */}

        <Collapsible.Trigger
          disabled={!hasSubjects}
          className="
            group
            flex
            min-h-12
            w-full
            items-center
            justify-between
            gap-2
            px-3
            py-3
            text-left
            transition-colors
            hover:bg-muted/40
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            disabled:cursor-default
          "
        >
          <div className="flex min-w-0 items-center gap-2">
            <Chevron />

            <span
              className="
                min-w-0
                truncate
                text-base
                font-bold
                tracking-tight
                text-foreground
              "
            >
              {student.name}
            </span>
          </div>
        </Collapsible.Trigger>

        <Panel>
          {hasSubjects ? (
            <div
              className="
                border-t
                border-border
                bg-muted/20
              "
            >
              {student.subjects.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                />
              ))}
            </div>
          ) : (
            <div
              className="
                border-t
                border-border
                px-3
                py-4
                text-sm
                text-muted-foreground
              "
            >
              No subjects assigned.
            </div>
          )}
        </Panel>
      </div>
    </Collapsible.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                        */
/* -------------------------------------------------------------------------- */

export default function TocCompletionClient({
  students,
}: {
  students: StudentTocReport[];
}) {
  if (students.length === 0) {
    return (
      <div
        className="
          rounded-xl
          border
          border-border
          bg-card
          px-4
          py-8
          text-center
          text-sm
          text-muted-foreground
        "
      >
        No students found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
        />
      ))}
    </div>
  );
}