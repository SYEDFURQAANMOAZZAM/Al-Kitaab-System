"use client";

import { useState } from "react";
import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { Copy } from "lucide-react";
import { saveAttendance } from "./actions";


type Student = {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
};

type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE";

type AttendanceFormProps = {
  batchId: string;
  students: Student[];
  attendanceTaken: boolean;
  todayAttendance: Record<string, AttendanceStatus>;
};

export function AttendanceForm({
  batchId,
  students,
  attendanceTaken: initialAttendanceTaken,
  todayAttendance,
}: AttendanceFormProps) {
  const [attendance, setAttendance] =
    useState<Record<string, AttendanceStatus>>(todayAttendance);

  const [submitting, setSubmitting] = useState(false);

  const [attendanceTaken, setAttendanceTaken] = useState(
    initialAttendanceTaken
  );
  const [attendanceAlreadySubmitted, setAttendanceAlreadySubmitted] =
  useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const getStatus = (userId: string): AttendanceStatus => {
    return attendance[userId] ?? "ABSENT";
  };

  const setStudentStatus = (
    userId: string,
    status: AttendanceStatus
  ) => {
    if (submitting || attendanceTaken) return;

    setAttendance((current) => ({
      ...current,
      [userId]: status,
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    if (submitting || attendanceTaken) return;

    const updated: Record<string, AttendanceStatus> = {};

    students.forEach((student) => {
      updated[student.userId] = status;
    });

    setAttendance(updated);
  };

  const presentCount = students.filter(
    (student) => getStatus(student.userId) === "PRESENT"
  ).length;

  const leaveCount = students.filter(
    (student) => getStatus(student.userId) === "LEAVE"
  ).length;

  const absentCount = students.filter(
    (student) => getStatus(student.userId) === "ABSENT"
  ).length;

  const handleSubmit = async () => {
  if (submitting || attendanceTaken) return;

  setSubmitting(true);

  try {
    const attendanceData = students.map((student) => ({
      userId: student.userId,
      attended: getStatus(student.userId),
    }));

    const result = await saveAttendance(batchId, attendanceData);

    if (result.alreadyTaken) {
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
    console.error("Failed to save attendance:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to save attendance."
    );
  } finally {
    setSubmitting(false);
  }
};

  const formDisabled = submitting || attendanceTaken;

  return (
    <>
    <div className="w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="border-b bg-muted/20 p-4 sm:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Attendance
          </h2>

          <p className="text-sm text-muted-foreground">
            Mark each student as present, absent, or on leave.
          </p>
        </div>

        {/* Already taken */}
        {attendanceTaken && (
          <div className="mt-4 flex items-center rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            Attendance for today has already been taken.
          </div>
        )}

        {/* Bulk actions */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Button
            type="button"
            disabled={formDisabled}
            onClick={() => markAll("PRESENT")}
            className="
              min-h-10 w-full rounded-lg border border-primary/30
              bg-primary/5 px-2 text-xs font-medium text-primary
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
            onClick={() => markAll("LEAVE")}
            className="
              min-h-10 w-full rounded-lg border border-border
              bg-secondary px-2 text-xs font-medium text-secondary-foreground
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
            onClick={() => markAll("ABSENT")}
            className="
              min-h-10 w-full rounded-lg border border-destructive/30
              bg-destructive/5 px-2 text-xs font-medium text-destructive
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

      {/* Content */}
      <div className="space-y-4 p-4 sm:p-6">
        {/* Summary */}
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

        {/* Students */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {students.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No students are enrolled in this batch.
              </p>
            </div>
          ) : (
            students.map((student, index) => {
              const status = getStatus(student.userId);

              return (
                <div key={student.id}>
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 min-w-0">
                      <p className="truncate font-medium">
                        {student.name}
                      </p>

                      {student.phone && (
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={`tel:${student.phone}`}
                            className="
                              truncate text-sm text-muted-foreground
                              transition-colors
                              hover:text-primary
                              hover:underline
                            "
                          >
                            {student.phone}
                          </a>

                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(student.phone!)}
                            className="
                              shrink-0 rounded-md p-1.5
                              text-muted-foreground
                              transition-colors
                              hover:bg-muted
                              hover:text-foreground
                              focus-visible:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-ring
                              focus-visible:ring-offset-2
                            "
                            aria-label={`Copy ${student.phone}`}
                            title="Copy phone number"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <StatusOption
                        id={`${student.id}-present`}
                        label="Present"
                        checked={status === "PRESENT"}
                        disabled={formDisabled}
                        activeClass="
                          border-primary
                          bg-primary/10
                          text-primary
                          shadow-sm
                        "
                        onChange={() =>
                          setStudentStatus(
                            student.userId,
                            "PRESENT"
                          )
                        }
                      />

                      <StatusOption
                        id={`${student.id}-leave`}
                        label="Leave"
                        checked={status === "LEAVE"}
                        disabled={formDisabled}
                        activeClass="
                          border-border
                          bg-secondary
                          text-secondary-foreground
                          shadow-sm
                        "
                        onChange={() =>
                          setStudentStatus(
                            student.userId,
                            "LEAVE"
                          )
                        }
                      />

                      <StatusOption
                        id={`${student.id}-absent`}
                        label="Absent"
                        checked={status === "ABSENT"}
                        disabled={formDisabled}
                        activeClass="
                          border-destructive
                          bg-destructive/10
                          text-destructive
                          shadow-sm
                        "
                        onChange={() =>
                          setStudentStatus(
                            student.userId,
                            "ABSENT"
                          )
                        }
                      />
                    </div>
                  </div>

                  {index !== students.length - 1 && (
                    <div className="h-px bg-border" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Save */}
        <div
          className="
            sticky bottom-0 -mx-4 border-t
            bg-background/95 p-4 backdrop-blur
            sm:static sm:mx-0 sm:border-0
            sm:bg-transparent sm:p-0
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
                formDisabled || students.length === 0
              }
              className="
                inline-flex min-h-11 w-full
                items-center justify-center
                rounded-lg bg-primary px-4 py-2
                text-sm font-medium text-primary-foreground
                shadow-sm
                transition-all
                hover:bg-primary/90
                active:scale-[0.99]
                disabled:pointer-events-none
                disabled:opacity-50
                sm:ml-auto sm:w-auto sm:min-w-36
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
                  flex items-center justify-center
                  p-4
                "
              >
                <Dialog.Popup
                  className="
                    w-full max-w-md
                    rounded-xl border
                    bg-card text-card-foreground
                    p-5 shadow-2xl
                    outline-none
                    sm:p-6
                  "
                >
                  <Dialog.Title className="text-lg font-semibold tracking-tight">
                    Confirm attendance
                  </Dialog.Title>

                  <Dialog.Description
                    className="
                      mt-2 text-sm leading-6
                      text-muted-foreground
                    "
                  >
                    Are you sure you want to save
                    today&apos;s attendance? Please make
                    sure all students have been marked
                    correctly.
                  </Dialog.Description>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <SummaryCard
                      label="Present"
                      count={presentCount}
                      className="border-primary/20 bg-primary/5 p-3"
                      countClassName="text-primary"
                      compact
                    />

                    <SummaryCard
                      label="Leave"
                      count={leaveCount}
                      className="border-border bg-muted/40 p-3"
                      countClassName="text-foreground"
                      compact
                    />

                    <SummaryCard
                      label="Absent"
                      count={absentCount}
                      className="border-destructive/20 bg-destructive/5 p-3"
                      countClassName="text-destructive"
                      compact
                    />
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Dialog.Close
                      type="button"
                      disabled={submitting}
                      className="
                        min-h-11 rounded-lg border
                        bg-background px-4 py-2
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
                      {submitting
                        ? "Saving..."
                        : "Confirm & Save"}
                    </button>
                  </div>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </div>
<Dialog.Root
  open={attendanceAlreadySubmitted}
  onOpenChange={setAttendanceAlreadySubmitted}
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
        flex items-center justify-center
        p-4
      "
    >
      <Dialog.Popup
        className="
          w-full max-w-md
          rounded-xl border
          bg-card text-card-foreground
          p-5 shadow-2xl
          outline-none
          sm:p-6
        "
      >
        <Dialog.Title className="text-lg font-semibold tracking-tight">
          Attendance Already Submitted
        </Dialog.Title>

        <Dialog.Description
          className="
            mt-2 text-sm leading-6
            text-muted-foreground
          "
        >
          Attendance for this batch has already been submitted for today.
          You cannot submit attendance again.
        </Dialog.Description>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setAttendanceAlreadySubmitted(false)}
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
      className={`
        rounded-lg border
        ${compact ? "p-3" : "p-3 sm:p-4"}
        ${className}
      `}
    >
      <p className="text-xs text-muted-foreground sm:text-sm">
        {label}
      </p>

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
        <Checkbox.Indicator className="flex items-center justify-center text-background">
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