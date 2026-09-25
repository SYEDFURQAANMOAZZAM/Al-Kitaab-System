"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";

import { Collapsible } from "@base-ui/react/collapsible";
import { Select } from "@base-ui/react/select";

import type {
  StudentTocReport,
  TocReportNode,
} from "@/app/ServerActions/getTocCompletionReports/build-toc-report";

import {
  getAdminTocReport,
  type PaginatedTocReport,
} from "@/app/ServerActions/getTocCompletionReports/get-admin-toc-report";

/* ==========================================================================
   COMPLETION STYLES
   ========================================================================== */

function getCompletionStyle(value: number) {
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

/* ==========================================================================
   PERCENTAGE
   ========================================================================== */

function Percentage({
  value,
}: {
  value: number;
}) {
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

/* ==========================================================================
   CHEVRON
   ========================================================================== */

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

/* ==========================================================================
   PANEL
   ========================================================================== */

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

/* ==========================================================================
   TOC ITEM
   ========================================================================== */

function TocItemRow({
  item,
}: {
  item: TocReportNode;
}) {
  const hasChildren = item.children.length > 0;

  const completionStyle =
    getCompletionStyle(item.percentage);

  /* ------------------------------------------------------------------------
     LEAF
     ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------
     PARENT TOC
     ------------------------------------------------------------------------ */

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

/* ==========================================================================
   SUBJECT
   ========================================================================== */

type Subject =
  StudentTocReport["subjects"][number];

function SubjectRow({
  subject,
}: {
  subject: Subject;
}) {
  const completionStyle =
    getCompletionStyle(subject.percentage);

  /*
   * Subject expands directly to TOC.
   *
   * No SubjectPart row is rendered.
   */
  const tocItems =
    subject.parts.flatMap(
      (part) => part.children,
    );

  const hasToc = tocItems.length > 0;

  return (
    <Collapsible.Root>
      <Collapsible.Trigger
        disabled={!hasToc}
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
          disabled:cursor-default
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
          {tocItems.map((item) => (
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

/* ==========================================================================
   STUDENT
   ========================================================================== */

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

/* ==========================================================================
   FILTER TYPES
   ========================================================================== */

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = Array.from(
  { length: 10 },
  (_, index) =>
    new Date().getFullYear() - index,
);

/* ==========================================================================
   FILTER SELECT
   ========================================================================== */

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onValueChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        className="
          mb-1.5
          block
          text-[11px]
          font-medium
          text-muted-foreground
        "
      >
        {label}
      </label>

      <Select.Root
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue ?? "")
        }
        disabled={disabled}
      >
        <Select.Trigger
          className="
            inline-flex
            h-10
            w-full
            min-w-[130px]
            items-center
            justify-between
            gap-2
            rounded-md
            border
            border-input
            bg-background
            px-3
            text-sm
            text-foreground
            shadow-sm
            outline-none
            transition-colors
            hover:bg-accent/40
            focus-visible:border-ring
            focus-visible:ring-2
            focus-visible:ring-ring/50
            disabled:pointer-events-none
            disabled:opacity-50
            sm:w-[145px]
          "
        >
          <Select.Value
            placeholder={placeholder}
          />

          <ChevronRight
            className="
              size-4
              rotate-90
              shrink-0
              text-muted-foreground
            "
          />
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            sideOffset={5}
            className="z-[100]"
          >
            <Select.Popup
              className="
                max-h-72
                min-w-[var(--anchor-width)]
                overflow-y-auto
                rounded-lg
                border
                border-border
                bg-popover
                p-1
                text-popover-foreground
                shadow-lg
                outline-none
              "
            >
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="
                    flex
                    min-h-9
                    cursor-pointer
                    items-center
                    rounded-md
                    px-3
                    py-2
                    text-sm
                    outline-none
                    transition-colors
                    data-[highlighted]:bg-accent
                    data-[highlighted]:text-accent-foreground
                    data-[selected]:font-medium
                  "
                >
                  <Select.ItemText>
                    {option.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

/* ==========================================================================
   MAIN
   ========================================================================== */

export default function TocCompletionClient() {
  const [students, setStudents] =
    React.useState<StudentTocReport[]>([]);

  const [search, setSearch] =
    React.useState("");

  /*
   * Pending filter values.
   *
   * Changing these does NOT fetch anything.
   */
  const [month, setMonth] =
    React.useState("");

  const [year, setYear] =
    React.useState("");

  /*
   * The filter currently used by the
   * displayed report.
   *
   * undefined = all-time.
   */
  const [appliedMonth, setAppliedMonth] =
    React.useState<string | undefined>(
      undefined,
    );

  const [pagination, setPagination] =
    React.useState<
      Omit<PaginatedTocReport, "data">
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
    React.useState<string | null>(null);

  /* ==========================================================================
     LOAD REPORTS
     ========================================================================== */

  const loadReports =
    React.useCallback(
      async (
        requestedPage: number,
        requestedSearch: string,
        requestedMonth?: string,
      ) => {
        await Promise.resolve();

        setLoading(true);
        setError(null);

        try {
          const result =
            await getAdminTocReport({
              page: requestedPage,
              search: requestedSearch,
              month: requestedMonth,
            });

          setStudents(result.data);

          setPagination({
            page: result.page,
            pageSize: result.pageSize,
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

  /* ==========================================================================
     INITIAL LOAD
     ========================================================================== */

  React.useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      await Promise.resolve();

      if (cancelled) {
        return;
      }

      await loadReports(
        1,
        "",
        undefined,
      );
    };

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [loadReports]);

  /* ==========================================================================
     SEARCH
     ========================================================================== */

  const handleSearch = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value =
      event.target.value;

    setSearch(value);

    /*
     * Search uses the currently APPLIED
     * month/year, not the pending selection.
     */
    void loadReports(
      1,
      value,
      appliedMonth,
    );
  };

  /* ==========================================================================
     MONTH
     ========================================================================== */

  const handleMonthChange = (
    value: string,
  ) => {
    /*
     * Only change the pending selection.
     *
     * NO FETCH HERE.
     */
    setMonth(value);
  };

  /* ==========================================================================
     YEAR
     ========================================================================== */

  const handleYearChange = (
    value: string,
  ) => {
    /*
     * Only change the pending selection.
     *
     * NO FETCH HERE.
     */
    setYear(value);
  };

  /* ==========================================================================
     FETCH / APPLY FILTER
     ========================================================================== */

  const handleFetch = () => {
    setError(null);

    const hasMonth = Boolean(month);
    const hasYear = Boolean(year);

    /*
     * Either both must be selected
     * or both must be empty.
     */
    if (hasMonth !== hasYear) {
      setError(
        "Please select both month and year.",
      );

      return;
    }

    const nextMonth =
      hasMonth && hasYear
        ? `${year}-${month.padStart(2, "0")}`
        : undefined;

    /*
     * This becomes the filter that is
     * actually being displayed.
     */
    setAppliedMonth(nextMonth);

    /*
     * Always go back to page 1
     * when applying a new filter.
     */
    void loadReports(
      1,
      search,
      nextMonth,
    );
  };

  /* ==========================================================================
     CLEAR FILTER
     ========================================================================== */

  const handleClearFilter = () => {
    setMonth("");
    setYear("");
    setAppliedMonth(undefined);
    setError(null);

    void loadReports(
      1,
      search,
      undefined,
    );
  };

  /* ==========================================================================
     PREVIOUS
     ========================================================================== */

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
      appliedMonth,
    );
  };

  /* ==========================================================================
     NEXT
     ========================================================================== */

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
      appliedMonth,
    );
  };

  /* ==========================================================================
     FILTER STATE
     ========================================================================== */

  const hasPendingFilter =
    Boolean(month) || Boolean(year);

  const hasCompletePendingFilter =
    Boolean(month) && Boolean(year);

  const isSameAsApplied =
    (month && year
      ? `${year}-${month.padStart(2, "0")}`
      : undefined) ===
    appliedMonth;

  const canFetch =
    !loading &&
    (
      (!hasPendingFilter &&
        appliedMonth !== undefined) ||
      (hasCompletePendingFilter &&
        !isSameAsApplied) ||
      (!hasPendingFilter &&
        appliedMonth === undefined)
    );

  /* ==========================================================================
     DISPLAY DATE
     ========================================================================== */

  const appliedMonthLabel =
    appliedMonth
      ? new Date(
          `${appliedMonth}-01T00:00:00`,
        ).toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          },
        )
      : "All time";

  /* ==========================================================================
     EMPTY
     ========================================================================== */

  const showEmpty =
    !loading &&
    students.length === 0;

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="space-y-4">

      {/* ======================================================================
          FILTER BAR
          ====================================================================== */}

      <div
        className="
          rounded-xl
          border
          border-border
          bg-card
          p-3
          shadow-sm
          sm:p-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >

          {/* ------------------------------------------------------------------
              SEARCH
          ------------------------------------------------------------------ */}

          <div className="min-w-0 flex-1">
            <label
              className="
                mb-1.5
                block
                text-[11px]
                font-medium
                text-muted-foreground
              "
            >
              Search students
            </label>

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
                placeholder="Search by student name..."
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
          </div>

          {/* ------------------------------------------------------------------
              DATE FILTER
          ------------------------------------------------------------------ */}

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-end
            "
          >
            <FilterSelect
              label="Month"
              placeholder="Select month"
              value={month}
              options={MONTHS}
              onValueChange={handleMonthChange}
            />

            <FilterSelect
              label="Year"
              placeholder="Select year"
              value={year}
              options={YEARS.map(
                (value) => ({
                  value: String(value),
                  label: String(value),
                }),
              )}
              onValueChange={handleYearChange}
            />

            {/* --------------------------------------------------------------
                FETCH
            -------------------------------------------------------------- */}

            <button
              type="button"
              onClick={handleFetch}
              disabled={!canFetch}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-md
                bg-primary
                px-4
                text-sm
                font-medium
                text-primary-foreground
                shadow-sm
                transition-colors
                hover:bg-primary/90
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >
              {loading ? (
                <>
                  <Loader2
                    className="
                      size-4
                      animate-spin
                    "
                  />
                  Fetching
                </>
              ) : (
                <>
                  <CalendarDays
                    className="size-4"
                  />
                  Fetch
                </>
              )}
            </button>

            {/* --------------------------------------------------------------
                CLEAR
            -------------------------------------------------------------- */}

            {hasPendingFilter && (
              <button
                type="button"
                onClick={
                  handleClearFilter
                }
                disabled={loading}
                className="
                  h-10
                  rounded-md
                  px-3
                  text-sm
                  font-medium
                  text-muted-foreground
                  transition-colors
                  hover:bg-muted
                  hover:text-foreground
                  disabled:pointer-events-none
                  disabled:opacity-50
                "
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------
            PENDING FILTER NOTICE
        ------------------------------------------------------------------ */}

        {hasPendingFilter &&
          !isSameAsApplied && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-2
                rounded-md
                border
                border-primary/20
                bg-primary/5
                px-3
                py-2
                text-xs
                text-muted-foreground
              "
            >
              <CalendarDays
                className="
                  size-3.5
                  shrink-0
                  text-primary
                "
              />

              <span>
                {month && year
                  ? `Ready to fetch ${MONTHS.find(
                      (item) =>
                        item.value === month,
                    )?.label} ${year}.`
                  : "Select both month and year to fetch a monthly report."}
              </span>
            </div>
          )}
      </div>

      {/* ======================================================================
          RESULT INFORMATION
          ====================================================================== */}

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

        <div className="flex items-center gap-3">
          <span
            className="
              rounded-md
              border
              border-border
              bg-muted/40
              px-2
              py-1
              text-xs
              font-medium
              text-foreground
            "
          >
            {appliedMonthLabel}
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
      </div>

      {/* ======================================================================
          ERROR
          ====================================================================== */}

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

      {/* ======================================================================
          LOADING
          ====================================================================== */}

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

      {/* ======================================================================
          STUDENTS
          ====================================================================== */}

      {!loading &&
        students.length > 0 && (
          <div className="space-y-3">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
              />
            ))}
          </div>
        )}

      {/* ======================================================================
          EMPTY
          ====================================================================== */}

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

      {/* ======================================================================
          PAGINATION
          ====================================================================== */}

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
              onClick={handlePrevious}
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
              {pagination.page} /{" "}
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