"use client";

import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { Copy, Loader2 } from "lucide-react";

import { saveAttendance } from "@/app/ServerActions/attendance/createAttendance";

/* =========================================================
TYPES
========================================================= */

type Person = {
id: string;
userId: string;
name: string;
phone: string | null;
};

type AttendanceStatus =
| "PRESENT"
| "ABSENT"
| "LEAVE";

type AttendanceMap = Record<string, AttendanceStatus>;

type AttendanceForDateResult = {
success: boolean;
attendanceTaken: boolean;
todayAttendance: AttendanceMap;
};

type AttendanceFormProps = {
batchId: string;
batchName?: string;

students: Person[];
teachers: Person[];

initialDate: Date;

attendanceTaken: boolean;
todayAttendance: AttendanceMap;

getAttendanceForDate: (
batchId: string,
date: string
) => Promise<AttendanceForDateResult>;
};

/* =========================================================
HELPERS
========================================================= */

function formatDateForInput(date: Date): string {
return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateString: string): string {
const date = new Date(`${dateString}T00:00:00`);

return date.toLocaleDateString("en-IN", {
day: "numeric",
month: "short",
year: "numeric",
});
}

/* =========================================================
MAIN COMPONENT
========================================================= */

export function AttendanceForm({
batchId,
batchName,
students,
teachers,
initialDate,
attendanceTaken: initialAttendanceTaken,
todayAttendance,
getAttendanceForDate,
}: AttendanceFormProps) {
/* -------------------------------------------------------
DATE
------------------------------------------------------- */

const [selectedDate, setSelectedDate] = useState(
formatDateForInput(initialDate)
);

/* -------------------------------------------------------
ATTENDANCE
------------------------------------------------------- */

const [attendance, setAttendance] =
useState<AttendanceMap>(todayAttendance);

const [attendanceTaken, setAttendanceTaken] =
useState(initialAttendanceTaken);

/* -------------------------------------------------------
UI STATE
------------------------------------------------------- */

const [loadingDate, setLoadingDate] =
useState(false);

const [submitting, setSubmitting] =
useState(false);

const [confirmationOpen, setConfirmationOpen] =
useState(false);

const [
attendanceAlreadySubmitted,
setAttendanceAlreadySubmitted,
] = useState(false);

/* =======================================================
PEOPLE
======================================================= */

const totalPeople =
students.length + teachers.length;

const people = [...teachers, ...students];

/* =======================================================
ATTENDANCE HELPERS
======================================================= */

const getStatus = (
userId: string
): AttendanceStatus => {
return attendance[userId] ?? "ABSENT";
};

const setPersonStatus = (
userId: string,
status: AttendanceStatus
) => {
if (
submitting ||
loadingDate ||
attendanceTaken
) {
return;
}


setAttendance((current) => ({
  ...current,
  [userId]: status,
}));


};

const markAll = (
status: AttendanceStatus
) => {
if (
submitting ||
loadingDate ||
attendanceTaken
) {
return;
}


const updated: AttendanceMap = {};

for (const person of people) {
  updated[person.userId] = status;
}

setAttendance(updated);


};

/* =======================================================
DATE CHANGE
======================================================= */

const handleDateChange = async (
date: string
) => {
if (
!date ||
date === selectedDate ||
submitting ||
loadingDate
) {
return;
}


setSelectedDate(date);
setLoadingDate(true);

setConfirmationOpen(false);
setAttendanceAlreadySubmitted(false);

// Clear previous date immediately.
setAttendance({});
setAttendanceTaken(false);

try {
  const result =
    await getAttendanceForDate(
      batchId,
      date
    );

  setAttendance(
    result.todayAttendance ?? {}
  );

  setAttendanceTaken(
    result.attendanceTaken
  );
} catch (error) {
  console.error(
    "Failed to load attendance:",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Failed to load attendance."
  );

  setAttendance({});
  setAttendanceTaken(false);
} finally {
  setLoadingDate(false);
}


};

/* =======================================================
SUBMIT
======================================================= */

const handleSubmit = async () => {
if (
submitting ||
loadingDate ||
attendanceTaken
) {
return;
}


setSubmitting(true);

try {
  /*
   * Students + teachers are both stored
   * using their userId.
   */
  const attendanceData = people.map(
    (person) => ({
      userId: person.userId,
      attended: getStatus(
        person.userId
      ),
    })
  );

  const result = await saveAttendance(
    batchId,
    selectedDate,
    attendanceData
  );

  /*
   * Another teacher/admin may have
   * submitted attendance concurrently.
   */
  if (result.alreadyTaken) {
    setAttendance(
      result.todayAttendance ?? {}
    );

    setAttendanceTaken(true);
    setAttendanceAlreadySubmitted(true);
    setConfirmationOpen(false);

    return;
  }

  if (!result.success) {
    throw new Error(result.message);
  }

  setAttendanceTaken(true);
  setConfirmationOpen(false);
} catch (error) {
  console.error(
    "Failed to save attendance:",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Failed to save attendance."
  );
} finally {
  setSubmitting(false);
}


};

/* =======================================================
COUNTS
======================================================= */

const presentCount = people.filter(
(person) =>
getStatus(person.userId) === "PRESENT"
).length;

const leaveCount = people.filter(
(person) =>
getStatus(person.userId) === "LEAVE"
).length;

const absentCount = people.filter(
(person) =>
getStatus(person.userId) === "ABSENT"
).length;

/* =======================================================
DISABLED STATE
======================================================= */

const formDisabled =
submitting ||
loadingDate ||
attendanceTaken;

const displayDate =
formatDisplayDate(selectedDate);

/* =======================================================
RENDER
======================================================= */

return (
<> 
<div className="w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">


    {/* =================================================
        HEADER
    ================================================= */}

    <div className="border-b bg-muted/20 p-4 sm:p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Attendance
          </h2>

          <p className="text-sm text-muted-foreground">
            {batchName
              ? `${batchName} · `
              : ""}
            Mark students and teachers as
            present, absent, or on leave.
          </p>
        </div>

        {/* DATE PICKER */}

        <div className="flex shrink-0 flex-col gap-1.5">
          <label
            htmlFor="attendance-date"
            className="text-xs font-medium text-muted-foreground"
          >
            Attendance date
          </label>

          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            disabled={
              submitting ||
              loadingDate
            }
            max={formatDateForInput(
              new Date()
            )}
            onChange={(event) =>
              handleDateChange(
                event.target.value
              )
            }
            className="
              min-h-10 rounded-lg border
              bg-background px-3 py-2
              text-sm outline-none
              transition-colors
              focus:border-ring
              focus:ring-2
              focus:ring-ring
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          />
        </div>
      </div>

      {/* LOADING */}

      {loadingDate && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading attendance for{" "}
          {displayDate}...
        </div>
      )}

      {/* ALREADY TAKEN */}

      {attendanceTaken &&
        !loadingDate && (
          <div className="mt-4 flex items-center rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            Attendance for{" "}
            <span className="ml-1 font-medium text-foreground">
              {displayDate}
            </span>{" "}
            has already been taken.
          </div>
        )}

      {/* BULK ACTIONS */}

      <div className="mt-5 grid grid-cols-3 gap-2">

        <Button
          type="button"
          disabled={formDisabled}
          onClick={() =>
            markAll("PRESENT")
          }
          className="
            min-h-10 w-full rounded-lg
            border border-primary/30
            bg-primary/5 px-2
            text-xs font-medium text-primary
            transition-colors
            hover:bg-primary/10
            disabled:pointer-events-none
            disabled:opacity-50
            sm:text-sm
          "
        >
          Present all
        </Button>

        <Button
          type="button"
          disabled={formDisabled}
          onClick={() =>
            markAll("LEAVE")
          }
          className="
            min-h-10 w-full rounded-lg
            border border-border
            bg-secondary px-2
            text-xs font-medium
            text-secondary-foreground
            transition-colors
            hover:bg-secondary/80
            disabled:pointer-events-none
            disabled:opacity-50
            sm:text-sm
          "
        >
          Leave all
        </Button>

        <Button
          type="button"
          disabled={formDisabled}
          onClick={() =>
            markAll("ABSENT")
          }
          className="
            min-h-10 w-full rounded-lg
            border border-destructive/30
            bg-destructive/5 px-2
            text-xs font-medium text-destructive
            transition-colors
            hover:bg-destructive/10
            disabled:pointer-events-none
            disabled:opacity-50
            sm:text-sm
          "
        >
          Absent all
        </Button>

      </div>
    </div>

    {/* =================================================
        CONTENT
    ================================================= */}

    <div className="space-y-4 p-4 sm:p-6">

      {/* SUMMARY */}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">

        <SummaryCard
          label="Present"
          count={presentCount}
          className="border-primary/20 bg-primary/5"
          countClassName="text-primary"
        />

        <SummaryCard
          label="Leave"
          count={leaveCount}
          className="border-border bg-muted/40"
          countClassName="text-foreground"
        />

        <SummaryCard
          label="Absent"
          count={absentCount}
          className="border-destructive/20 bg-destructive/5"
          countClassName="text-destructive"
        />

      </div>

      {/* =================================================
          TEACHERS
      ================================================= */}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Teachers
          </h3>

          <span className="text-xs text-muted-foreground">
            {teachers.length}{" "}
            {teachers.length === 1
              ? "teacher"
              : "teachers"}
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">

          {teachers.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No teachers are assigned to
                this batch.
              </p>
            </div>
          ) : (
            teachers.map(
              (teacher, index) => (
                <PersonRow
                  key={teacher.id}
                  person={teacher}
                  status={getStatus(
                    teacher.userId
                  )}
                  disabled={formDisabled}
                  onChange={(status) =>
                    setPersonStatus(
                      teacher.userId,
                      status
                    )
                  }
                  index={index}
                  total={teachers.length}
                />
              )
            )
          )}

        </div>
      </div>

      {/* =================================================
          STUDENTS
      ================================================= */}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Students
          </h3>

          <span className="text-xs text-muted-foreground">
            {students.length}{" "}
            {students.length === 1
              ? "student"
              : "students"}
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">

          {students.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No students are enrolled in
                this batch.
              </p>
            </div>
          ) : (
            students.map(
              (student, index) => (
                <PersonRow
                  key={student.id}
                  person={student}
                  status={getStatus(
                    student.userId
                  )}
                  disabled={formDisabled}
                  onChange={(status) =>
                    setPersonStatus(
                      student.userId,
                      status
                    )
                  }
                  index={index}
                  total={students.length}
                />
              )
            )
          )}

        </div>
      </div>

      {/* =================================================
          SAVE
      ================================================= */}

      <div
        className="
          sticky bottom-0 -mx-4
          border-t bg-background/95
          p-4 backdrop-blur
          sm:static sm:mx-0
          sm:border-0 sm:bg-transparent
          sm:p-0
        "
      >
        <Dialog.Root
          open={confirmationOpen}
          onOpenChange={(open) => {
            if (!submitting) {
              setConfirmationOpen(open);
            }
          }}
        >

          <Dialog.Trigger
            disabled={
              formDisabled ||
              totalPeople === 0
            }
            className="
              inline-flex min-h-11 w-full
              items-center justify-center
              rounded-lg bg-primary
              px-4 py-2
              text-sm font-medium
              text-primary-foreground
              shadow-sm
              transition-all
              hover:bg-primary/90
              active:scale-[0.99]
              disabled:pointer-events-none
              disabled:opacity-50
              sm:ml-auto sm:w-auto
              sm:min-w-36
            "
          >
            {attendanceTaken
              ? "Attendance Taken"
              : submitting
                ? "Saving..."
                : "Save Attendance"}
          </Dialog.Trigger>

          <Dialog.Portal>

            <Dialog.Backdrop
              className="
                fixed inset-0 z-50
                bg-background/80
                backdrop-blur-sm
              "
            />

            <Dialog.Viewport
              className="
                fixed inset-0 z-50
                flex items-center
                justify-center p-4
              "
            >

              <Dialog.Popup
                className="
                  w-full max-w-md
                  rounded-xl border
                  bg-card text-card-foreground
                  p-5 shadow-2xl
                  outline-none sm:p-6
                "
              >

                <Dialog.Title
                  className="
                    text-lg font-semibold
                    tracking-tight
                  "
                >
                  Confirm attendance
                </Dialog.Title>

                <Dialog.Description
                  className="
                    mt-2 text-sm leading-6
                    text-muted-foreground
                  "
                >
                  Are you sure you want to
                  save attendance for{" "}
                  <span className="font-medium text-foreground">
                    {displayDate}
                  </span>
                  ? This will save attendance
                  for all students and teachers.
                </Dialog.Description>

                {/* SUMMARY */}

                <div className="mt-5 grid grid-cols-3 gap-2">

                  <SummaryCard
                    label="Present"
                    count={presentCount}
                    className="
                      border-primary/20
                      bg-primary/5 p-3
                    "
                    countClassName="text-primary"
                    compact
                  />

                  <SummaryCard
                    label="Leave"
                    count={leaveCount}
                    className="
                      border-border
                      bg-muted/40 p-3
                    "
                    countClassName="text-foreground"
                    compact
                  />

                  <SummaryCard
                    label="Absent"
                    count={absentCount}
                    className="
                      border-destructive/20
                      bg-destructive/5 p-3
                    "
                    countClassName="text-destructive"
                    compact
                  />

                </div>

                {/* PEOPLE COUNT */}

                <div className="mt-4 rounded-lg border bg-muted/40 px-3 py-2.5 text-center text-sm text-muted-foreground">
                  {teachers.length}{" "}
                  {teachers.length === 1
                    ? "teacher"
                    : "teachers"}{" "}
                  +{" "}
                  {students.length}{" "}
                  {students.length === 1
                    ? "student"
                    : "students"}
                </div>

                {/* ACTIONS */}

                <div
                  className="
                    mt-6 flex flex-col-reverse
                    gap-2
                    sm:flex-row
                    sm:justify-end
                  "
                >

                  <Dialog.Close
                    type="button"
                    disabled={submitting}
                    className="
                      min-h-11 rounded-lg
                      border bg-background
                      px-4 py-2
                      text-sm font-medium
                      transition-colors
                      hover:bg-muted
                      disabled:pointer-events-none
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </Dialog.Close>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="
                      min-h-11 rounded-lg
                      bg-primary px-4 py-2
                      text-sm font-medium
                      text-primary-foreground
                      shadow-sm
                      transition-all
                      hover:bg-primary/90
                      active:scale-[0.99]
                      disabled:pointer-events-none
                      disabled:opacity-50
                    "
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Confirm & Save"
                    )}
                  </button>

                </div>

              </Dialog.Popup>

            </Dialog.Viewport>

          </Dialog.Portal>

        </Dialog.Root>
      </div>

    </div>
  </div>

  {/* =====================================================
      ALREADY SUBMITTED DIALOG
  ===================================================== */}

  <Dialog.Root
    open={attendanceAlreadySubmitted}
    onOpenChange={
      setAttendanceAlreadySubmitted
    }
  >

    <Dialog.Portal>

      <Dialog.Backdrop
        className="
          fixed inset-0 z-50
          bg-background/80
          backdrop-blur-sm
        "
      />

      <Dialog.Viewport
        className="
          fixed inset-0 z-50
          flex items-center
          justify-center p-4
        "
      >

        <Dialog.Popup
          className="
            w-full max-w-md
            rounded-xl border
            bg-card text-card-foreground
            p-5 shadow-2xl
            outline-none sm:p-6
          "
        >

          <Dialog.Title
            className="
              text-lg font-semibold
              tracking-tight
            "
          >
            Attendance Already Submitted
          </Dialog.Title>

          <Dialog.Description
            className="
              mt-2 text-sm leading-6
              text-muted-foreground
            "
          >
            Attendance for{" "}
            <span className="font-medium text-foreground">
              {displayDate}
            </span>{" "}
            has already been submitted.
            You cannot submit attendance again
            for this date.
          </Dialog.Description>

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={() =>
                setAttendanceAlreadySubmitted(
                  false
                )
              }
              className="
                min-h-11 rounded-lg
                bg-primary px-4 py-2
                text-sm font-medium
                text-primary-foreground
                hover:bg-primary/90
              "
            >
              OK
            </button>

          </div>

        </Dialog.Popup>

      </Dialog.Viewport>

    </Dialog.Portal>

  </Dialog.Root>
</>


);
}

/* =========================================================
PERSON ROW
========================================================= */

type PersonRowProps = {
person: Person;
status: AttendanceStatus;
disabled: boolean;
onChange: (
status: AttendanceStatus
) => void;
index: number;
total: number;
};

function PersonRow({
person,
status,
disabled,
onChange,
index,
total,
}: PersonRowProps) {
return ( <div> <div className="p-4 sm:p-5">


    {/* PERSON INFO */}

    <div className="mb-3 min-w-0">

      <p className="truncate font-medium">
        {person.name}
      </p>

      {person.phone && (
        <div className="mt-1 flex items-center gap-2">

          <a
            href={`tel:${person.phone}`}
            className="
              truncate text-sm
              text-muted-foreground
              transition-colors
              hover:text-primary
              hover:underline
            "
          >
            {person.phone}
          </a>

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(
                person.phone!
              )
            }
            className="
              shrink-0 rounded-md
              p-1.5
              text-muted-foreground
              transition-colors
              hover:bg-muted
              hover:text-foreground
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
            "
            aria-label={`Copy ${person.phone}`}
            title="Copy phone number"
          >
            <Copy className="size-4" />
          </button>

        </div>
      )}

    </div>

    {/* STATUS OPTIONS */}

    <div className="grid grid-cols-3 gap-2">

      <StatusOption
        id={`${person.id}-present`}
        label="Present"
        checked={status === "PRESENT"}
        disabled={disabled}
        activeClass="
          border-primary
          bg-primary/10
          text-primary
          shadow-sm
        "
        onChange={() =>
          onChange("PRESENT")
        }
      />

      <StatusOption
        id={`${person.id}-leave`}
        label="Leave"
        checked={status === "LEAVE"}
        disabled={disabled}
        activeClass="
          border-border
          bg-secondary
          text-secondary-foreground
          shadow-sm
        "
        onChange={() =>
          onChange("LEAVE")
        }
      />

      <StatusOption
        id={`${person.id}-absent`}
        label="Absent"
        checked={status === "ABSENT"}
        disabled={disabled}
        activeClass="
          border-destructive
          bg-destructive/10
          text-destructive
          shadow-sm
        "
        onChange={() =>
          onChange("ABSENT")
        }
      />

    </div>

  </div>

  {index !== total - 1 && (
    <div className="h-px bg-border" />
  )}

</div>


);
}

/* =========================================================
SUMMARY CARD
========================================================= */

type SummaryCardProps = {
label: string;
count: number;
className?: string;
countClassName?: string;
compact?: boolean;
};

function SummaryCard({
label,
count,
className = "",
countClassName = "",
compact = false,
}: SummaryCardProps) {
return (
<div
className={`         rounded-lg border
        ${compact ? "p-3" : "p-3 sm:p-4"}
        ${className}
      `}
> <p className="text-xs text-muted-foreground sm:text-sm">
{label} </p>


  <p
    className={`
      mt-1 font-semibold
      ${compact ? "text-lg" : "text-xl sm:text-2xl"}
      ${countClassName}
    `}
  >
    {count}
  </p>
</div>


);
}

/* =========================================================
STATUS OPTION
========================================================= */

type StatusOptionProps = {
id: string;
label: string;
checked: boolean;
disabled: boolean;
activeClass: string;
onChange: () => void;
};

function StatusOption({
id,
label,
checked,
disabled,
activeClass,
onChange,
}: StatusOptionProps) {
return (
<label
htmlFor={id}
className={`
flex min-h-11 cursor-pointer
items-center justify-center
gap-1.5 rounded-lg border
px-2 py-2
text-xs font-medium
transition-all
sm:text-sm


    ${
      checked
        ? activeClass
        : `
          border-border
          bg-background
          text-muted-foreground
          hover:bg-muted
          hover:text-foreground
        `
    }

    ${
      disabled
        ? "pointer-events-none opacity-60"
        : ""
    }
  `}
>
  <Checkbox.Root
    id={id}
    checked={checked}
    disabled={disabled}
    onCheckedChange={(value) => {
      if (value) {
        onChange();
      }
    }}
    className="
      flex size-4 shrink-0
      items-center justify-center
      rounded-[4px]
      border border-current
      outline-none
      transition-colors
      data-[checked]:bg-current
      focus-visible:ring-2
      focus-visible:ring-ring
      focus-visible:ring-offset-2
    "
  >
    <Checkbox.Indicator
      className="
        flex items-center
        justify-center
        text-background
      "
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2.5 6 2.2 2.2L9.5 3.5" />
      </svg>
    </Checkbox.Indicator>
  </Checkbox.Root>

  <span>{label}</span>
</label>


);
}
