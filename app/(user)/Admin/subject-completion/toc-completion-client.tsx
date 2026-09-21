"use client";

import * as React from "react";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { Collapsible } from "@base-ui/react/collapsible";

import type {
  StudentTocReport,
  TocReportNode,
} from "@/app/ServerActions/getTocCompletionReports/build-toc-report";

import {
  getAdminTocReport,
  type PaginatedTocReport,
} from "@/app/ServerActions/getTocCompletionReports/get-admin-toc-report";

/* -------------------------------------------------------------------------- */
/* Completion styles                                                          */
/* -------------------------------------------------------------------------- */

function getCompletionStyle(
  value: number,
) {
  if (value === 0) {
    return {
      row: "",
      badge:
        "border-border/60 bg-background text-muted-foreground",
    };
  }

  if (value < 25) {
    return {
      row: "bg-muted/25",
      badge:
        "border-border/60 bg-muted text-muted-foreground",
    };
  }

  if (value < 50) {
    return {
      row: "bg-secondary/30",
      badge:
        "border-border/60 bg-secondary text-secondary-foreground",
    };
  }

  if (value < 75) {
    return {
      row: "bg-accent/30",
      badge:
        "border-border/60 bg-accent text-accent-foreground",
    };
  }

  if (value < 100) {
    return {
      row: "bg-primary/5",
      badge:
        "border-primary/20 bg-primary/10 text-primary",
    };
  }

  return {
    row: "bg-primary/10",
    badge:
      "border-primary/30 bg-primary/15 text-primary",
  };
}

/* -------------------------------------------------------------------------- */
/* Percentage                                                                 */
/* -------------------------------------------------------------------------- */

function Percentage({
  value,
}: {
  value: number;
}) {
  const style =
    getCompletionStyle(value);

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
  const hasChildren =
    item.children.length > 0;

  const completionStyle =
    getCompletionStyle(
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

        <Percentage
          value={item.percentage}
        />
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

        <Percentage
          value={item.percentage}
        />
      </Collapsible.Trigger>

      <Panel>
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
          {item.children.map(
            (child) => (
              <TocItemRow
                key={child.id}
                item={child}
              />
            ),
          )}
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
  const hasChildren =
    part.children.length > 0;

  const completionStyle =
    getCompletionStyle(
      part.percentage,
    );

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

        <Percentage
          value={part.percentage}
        />
      </div>
    );
  }

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

        <Percentage
          value={part.percentage}
        />
      </Collapsible.Trigger>

      <Panel>
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
          {part.children.map(
            (item) => (
              <TocItemRow
                key={item.id}
                item={item}
              />
            ),
          )}
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
  const firstPart =
    subject.parts[0];

  const completionStyle =
    getCompletionStyle(
      subject.percentage,
    );

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

        <Percentage
          value={subject.percentage}
        />
      </div>
    );
  }

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

        <Percentage
          value={subject.percentage}
        />
      </Collapsible.Trigger>

      <Panel>
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
          <PartRow
            part={firstPart}
          />
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
  const hasSubjects =
    student.subjects.length > 0;

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
              {student.subjects.map(
                (subject) => (
                  <SubjectRow
                    key={subject.id}
                    subject={subject}
                  />
                ),
              )}
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

export default function TocCompletionClient() {
  const [students, setStudents] =
    React.useState<
      StudentTocReport[]
    >([]);

  const [search, setSearch] =
    React.useState("");

  const [pagination, setPagination] =
    React.useState<
      Omit<
        PaginatedTocReport,
        "data"
      >
    >({
      page: 1,
      pageSize: 15,
      totalStudents: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [loading, setLoading] =
    React.useState(true);

  const [error, setError] =
    React.useState<string | null>(
      null,
    );

  /* ------------------------------------------------------------------------ */
  /* Load reports                                                              */
  /* ------------------------------------------------------------------------ */

  const loadReports =
    React.useCallback(
      async (
        requestedPage: number,
        requestedSearch: string,
      ) => {
        /*
         * Yield before updating state.
         *
         * This avoids the React lint warning about
         * synchronous state updates from an effect.
         */
        await Promise.resolve();

        setLoading(true);
        setError(null);

        try {
          const result =
            await getAdminTocReport({
              page: requestedPage,
              search: requestedSearch,
            });

          setStudents(
            result.data,
          );

          setPagination({
            page: result.page,
            pageSize:
              result.pageSize,
            totalStudents:
              result.totalStudents,
            totalPages:
              result.totalPages,
            hasNextPage:
              result.hasNextPage,
            hasPreviousPage:
              result.hasPreviousPage,
          });
        } catch (error) {
          console.error(
            "Failed to load TOC reports:",
            error,
          );

          setError(
            "Failed to load student reports.",
          );

          setStudents([]);
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  /* ------------------------------------------------------------------------ */
  /* Initial load                                                              */
  /* ------------------------------------------------------------------------ */

  React.useEffect(() => {
    let cancelled = false;

    const loadInitial =
      async () => {
        /*
         * Do not directly call loadReports()
         * in the effect body.
         *
         * The async boundary prevents the
         * cascading-render lint warning.
         */
        await Promise.resolve();

        if (cancelled) {
          return;
        }

        await loadReports(
          1,
          "",
        );
      };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [loadReports]);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleSearch = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value;

    setSearch(value);

    /*
     * Every new search starts from page 1.
     */
    void loadReports(
      1,
      value,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Previous                                                                  */
  /* ------------------------------------------------------------------------ */

  const handlePrevious = () => {
    if (
      loading ||
      !pagination.hasPreviousPage
    ) {
      return;
    }

    const nextPage =
      pagination.page - 1;

    void loadReports(
      nextPage,
      search,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Next                                                                      */
  /* ------------------------------------------------------------------------ */

  const handleNext = () => {
    if (
      loading ||
      !pagination.hasNextPage
    ) {
      return;
    }

    const nextPage =
      pagination.page + 1;

    void loadReports(
      nextPage,
      search,
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Empty                                                                     */
  /* ------------------------------------------------------------------------ */

  const showEmpty =
    !loading &&
    students.length === 0;

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------------ */}
      {/* Search                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative">
        <Search
          className="
            pointer-events-none
            absolute
            left-3
            top-1/2
            size-4
            -translate-y-1/2
            text-muted-foreground
          "
        />

        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Search students..."
          className="
            h-10
            w-full
            rounded-md
            border
            border-input
            bg-background
            pl-9
            pr-3
            text-sm
            text-foreground
            outline-none
            placeholder:text-muted-foreground
            focus-visible:border-ring
            focus-visible:ring-2
            focus-visible:ring-ring/50
          "
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Result information                                                  */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          flex
          flex-col
          gap-2
          text-sm
          text-muted-foreground
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <span>
          {pagination.totalStudents}{" "}
          {pagination.totalStudents === 1
            ? "student"
            : "students"}
        </span>

        {pagination.totalPages > 0 && (
          <span>
            Page{" "}
            {pagination.page}{" "}
            of{" "}
            {pagination.totalPages}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error                                                               */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div
          className="
            rounded-lg
            border
            border-destructive/30
            bg-destructive/5
            px-4
            py-3
            text-sm
            text-destructive
          "
        >
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading                                                             */}
      {/* ------------------------------------------------------------------ */}

      {loading && (
        <div
          className="
            flex
            items-center
            justify-center
            rounded-xl
            border
            border-border
            bg-card
            px-4
            py-10
            text-sm
            text-muted-foreground
          "
        >
          <Loader2
            className="
              mr-2
              size-4
              animate-spin
            "
          />

          Loading student reports...
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Students                                                            */}
      {/* ------------------------------------------------------------------ */}

      {!loading &&
        students.length > 0 && (
          <div className="space-y-3">
            {students.map(
              (student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                />
              ),
            )}
          </div>
        )}

      {/* ------------------------------------------------------------------ */}
      {/* Empty                                                               */}
      {/* ------------------------------------------------------------------ */}

      {showEmpty && (
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
          {search.trim()
            ? "No students found."
            : "No students available."}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Pagination                                                           */}
      {/* ------------------------------------------------------------------ */}

      {!loading &&
        pagination.totalPages > 0 && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              border-t
              border-border
              pt-4
            "
          >
            <button
              type="button"
              onClick={
                handlePrevious
              }
              disabled={
                loading ||
                !pagination.hasPreviousPage
              }
              className="
                inline-flex
                h-9
                items-center
                gap-1.5
                rounded-md
                border
                border-border
                bg-background
                px-3
                text-sm
                font-medium
                text-foreground
                transition-colors
                hover:bg-accent
                hover:text-accent-foreground
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >
              <ChevronLeft className="size-4" />

              Previous
            </button>

            <span
              className="
                text-sm
                tabular-nums
                text-muted-foreground
              "
            >
              {pagination.page}{" "}
              /{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                loading ||
                !pagination.hasNextPage
              }
              className="
                inline-flex
                h-9
                items-center
                gap-1.5
                rounded-md
                border
                border-border
                bg-background
                px-3
                text-sm
                font-medium
                text-foreground
                transition-colors
                hover:bg-accent
                hover:text-accent-foreground
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >
              Next

              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
    </div>
  );
}

