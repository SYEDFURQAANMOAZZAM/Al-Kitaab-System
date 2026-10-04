"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {

  ArrowLeftRight,

  BookOpen,

  Loader2,

  MoreHorizontal,

  Plus,

  Search,

  Trash2,

  UserPlus,

  Users,

  X,

} from "lucide-react";

import { getBatchStudents } from "@/app/ServerActions/batchOperations/students/actions/getBatchStudents";

import { getStudentsForSearch } from "@/app/ServerActions/batchOperations/students/actions/getStudentsForSearch";

import { addStudentToBatch } from "@/app/ServerActions/batchOperations/students/actions/addStudentToBatch";

import { removeStudentFromBatch } from "@/app/ServerActions/batchOperations/students/actions/removeStudentFromBatch";

import { getBranchesWithBatches } from "@/app/ServerActions/batchOperations/students/actions/getBranchesWithBatches";

import { replaceStudentBatchEnrollment } from "@/app/ServerActions/batchOperations/students/actions/replaceStudentBatchEnrollment";

import { getSubjectsForSearch } from "@/app/ServerActions/batchOperations/students/actions/getSubjectsForSearch";

import { addSubjectToStudent } from "@/app/ServerActions/batchOperations/students/actions/addSubjectToStudent";

import { deleteSubjectFromStudent } from "@/app/ServerActions/batchOperations/students/actions/deleteSubjectFromStudent";

import type {

  BatchStudentItem,

  BranchWithBatches,

  StudentSearchItem,

  SubjectSearchItem,

} from "@/app/ServerActions/batchOperations/students/types";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

type Feedback = {

  type: "success" | "error";

  message: string;

};

type ConfirmAction =

  | {

      type: "remove-student";

      studentId: string;

      label: string;

    }

  | {

      type: "remove-subject";

      studentId: string;

      subjectId: string;

      label: string;

    };

type Props = {

  batchId: string;

};

export default function BatchStudents({ batchId }: Props) {

  const [students, setStudents] = useState<BatchStudentItem[]>([]);

  const [branches, setBranches] = useState<BranchWithBatches[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isMutating, setIsMutating] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [studentFilter, setStudentFilter] = useState("");

  // Add student dialog

  const [addOpen, setAddOpen] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");

  const [studentResults, setStudentResults] = useState<StudentSearchItem[]>([]);

  const [selectedStudent, setSelectedStudent] =

    useState<StudentSearchItem | null>(null);

  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Subject dialog

  const [subjectStudent, setSubjectStudent] =

    useState<BatchStudentItem | null>(null);

  const [subjectSearch, setSubjectSearch] = useState("");

  const [subjectResults, setSubjectResults] = useState<SubjectSearchItem[]>([]);

  const [selectedSubject, setSelectedSubject] =

    useState<SubjectSearchItem | null>(null);

  const [isSearchingSubjects, setIsSearchingSubjects] = useState(false);

  // Change batch dialog

  const [replaceStudent, setReplaceStudent] =

    useState<BatchStudentItem | null>(null);

  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Destructive confirmation dialog

  const [confirmAction, setConfirmAction] =

    useState<ConfirmAction | null>(null);

  const loadData = useCallback(async () => {

    setIsLoading(true);

    setLoadError("");

    try {

      const [studentsResult, branchesResult] = await Promise.all([

        getBatchStudents(batchId),

        getBranchesWithBatches(),

      ]);

      if (!studentsResult.success) {

        setLoadError(studentsResult.error);

        setStudents([]);

      } else {

        setStudents(studentsResult.data ?? []);

      }

      if (!branchesResult.success) {

        setFeedback({

          type: "error",

          message: branchesResult.error,

        });

      } else {

        setBranches(branchesResult.data ?? []);

      }

    } catch {

      setLoadError("Unable to load batch students. Please try again.");

    } finally {

      setIsLoading(false);

    }

  }, [batchId]);

  useEffect(() => {

    void loadData();

  }, [loadData]);

  const batchName = useMemo(() => {

    for (const branch of branches) {

      const batch = branch.batches.find((item) => item.id === batchId);

      if (batch) return batch.name;

    }

    return "Batch";

  }, [branches, batchId]);

  const filteredStudents = useMemo(() => {

    const term = studentFilter.trim().toLowerCase();

    if (!term) return students;

    return students.filter((student) =>

      [

        student.name,

        student.email,

        student.phone ?? "",

        ...student.subjects.map((subject) => subject.name),

      ]

        .join(" ")

        .toLowerCase()

        .includes(term)

    );

  }, [students, studentFilter]);

  // Debounced student search

  useEffect(() => {

    if (!addOpen) return;

    const term = studentSearch.trim();

    if (term.length < 3) {

      setStudentResults([]);

      setIsSearchingStudents(false);

      return;

    }

    let active = true;

    setIsSearchingStudents(true);

    const timer = setTimeout(async () => {

      try {

        const result = await getStudentsForSearch(batchId, term);

        if (!active) return;

        if (result.success) {

          setStudentResults(result.data ?? []);

        } else {

          setStudentResults([]);

          setFeedback({ type: "error", message: result.error });

        }

      } catch {

        if (active) {

          setStudentResults([]);

          setFeedback({

            type: "error",

            message: "Student search failed",

          });

        }

      } finally {

        if (active) setIsSearchingStudents(false);

      }

    }, 350);

    return () => {

      active = false;

      clearTimeout(timer);

    };

  }, [addOpen, batchId, studentSearch]);

  // Debounced subject search

  useEffect(() => {

    if (!subjectStudent) return;

    const term = subjectSearch.trim();

    if (term.length < 3) {

      setSubjectResults([]);

      setIsSearchingSubjects(false);

      return;

    }

    let active = true;

    setIsSearchingSubjects(true);

    const timer = setTimeout(async () => {

      try {

        const result = await getSubjectsForSearch(

          subjectStudent.studentId,

          term

        );

        if (!active) return;

        if (result.success) {

          setSubjectResults(result.data ?? []);

        } else {

          setSubjectResults([]);

          setFeedback({ type: "error", message: result.error });

        }

      } catch {

        if (active) {

          setSubjectResults([]);

          setFeedback({

            type: "error",

            message: "Subject search failed",

          });

        }

      } finally {

        if (active) setIsSearchingSubjects(false);

      }

    }, 350);

    return () => {

      active = false;

      clearTimeout(timer);

    };

  }, [subjectStudent, subjectSearch]);

  const notify = (type: Feedback["type"], message: string) => {

    setFeedback({ type, message });

  };

  const handleAddStudent = async () => {

    if (!selectedStudent) return;

    setIsMutating(true);

    try {

      const result = await addStudentToBatch(

        selectedStudent.id,

        batchId

      );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setAddOpen(false);

      setStudentSearch("");

      setStudentResults([]);

      setSelectedStudent(null);

      notify("success", result.message ?? "Student added successfully");

      await loadData();

    } catch {

      notify("error", "Failed to add student");

    } finally {

      setIsMutating(false);

    }

  };

  const openSubjectDialog = (student: BatchStudentItem) => {

    setSubjectStudent(student);

    setSubjectSearch("");

    setSubjectResults([]);

    setSelectedSubject(null);

  };

  const handleAddSubject = async () => {

    if (!subjectStudent || !selectedSubject) return;

    setIsMutating(true);

    try {

      const result = await addSubjectToStudent(

        subjectStudent.studentId,

        selectedSubject.id

      );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setSubjectStudent(null);

      setSubjectSearch("");

      setSubjectResults([]);

      setSelectedSubject(null);

      notify("success", result.message ?? "Subject added successfully");

      await loadData();

    } catch {

      notify("error", "Failed to add subject");

    } finally {

      setIsMutating(false);

    }

  };

  const openReplaceDialog = (student: BatchStudentItem) => {

    setReplaceStudent(student);

    const currentBranch = branches.find((branch) =>

      branch.batches.some((batch) => batch.id === batchId)

    );

    setSelectedBranchId(currentBranch?.id ?? "");

    setSelectedBatchId("");

  };

  const availableBatches = useMemo(() => {

    return (

      branches.find((branch) => branch.id === selectedBranchId)?.batches

        .filter((batch) => batch.id !== batchId) ?? []

    );

  }, [branches, selectedBranchId, batchId]);

  const handleReplaceBatch = async () => {

    if (!replaceStudent || !selectedBatchId) return;

    setIsMutating(true);

    try {

      const result = await replaceStudentBatchEnrollment(

        replaceStudent.studentId,

        batchId,

        selectedBatchId

      );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setReplaceStudent(null);

      setSelectedBatchId("");

      notify("success", result.message ?? "Student batch changed");

      await loadData();

    } catch {

      notify("error", "Failed to change student batch");

    } finally {

      setIsMutating(false);

    }

  };

  const handleConfirmDestructive = async () => {

    if (!confirmAction) return;

    const action = confirmAction;

    setIsMutating(true);

    try {

      const result =

        action.type === "remove-student"

          ? await removeStudentFromBatch(action.studentId, batchId)

          : await deleteSubjectFromStudent(

              action.studentId,

              action.subjectId

            );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setConfirmAction(null);

      notify(

        "success",

        result.message ??

          (action.type === "remove-student"

            ? "Student removed from batch"

            : "Subject removed from student")

      );

      await loadData();

    } catch {

      notify("error", "The operation could not be completed");

    } finally {

      setIsMutating(false);

    }

  };

  const closeAddDialog = (open: boolean) => {

    setAddOpen(open);

    if (!open) {

      setStudentSearch("");

      setStudentResults([]);

      setSelectedStudent(null);

    }

  };

  const closeSubjectDialog = (open: boolean) => {

    if (!open) {

      setSubjectStudent(null);

      setSubjectSearch("");

      setSubjectResults([]);

      setSelectedSubject(null);

    }

  };

  return (

    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">

      {/* Page header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="space-y-1">

          <div className="flex items-center gap-2 text-sm text-muted-foreground">

            <Users className="size-4" />

            Batch management

          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            {batchName} Students

          </h1>

          <p className="text-sm text-muted-foreground">

            Manage student enrollments and their assigned subjects.

          </p>

        </div>

        <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">

          <UserPlus className="mr-2 size-4" />

          Add Student

        </Button>

      </div>

      {/* Feedback */}

      {feedback && (

        <div

          role="status"

          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${

            feedback.type === "success"

              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"

              : "border-destructive/30 bg-destructive/5 text-destructive"

          }`}

        >

          <span>{feedback.message}</span>

          <button

            type="button"

            onClick={() => setFeedback(null)}

            aria-label="Dismiss message"

            className="shrink-0 opacity-70 hover:opacity-100"

          >

            <X className="size-4" />

          </button>

        </div>

      )}

      {/* Search and count */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="relative w-full sm:max-w-sm">

          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input

            value={studentFilter}

            onChange={(event) => setStudentFilter(event.target.value)}

            placeholder="Search enrolled students..."

            className="pl-9 pr-9"

          />

          {studentFilter && (

            <button

              type="button"

              onClick={() => setStudentFilter("")}

              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"

              aria-label="Clear search"

            >

              <X className="size-4" />

            </button>

          )}

        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">

          <Users className="size-4" />

          <span>

            {filteredStudents.length}{" "}

            {filteredStudents.length === 1 ? "student" : "students"}

          </span>

        </div>

      </div>

      {/* Student list */}

      {isLoading ? (

        <div className="flex min-h-48 items-center justify-center rounded-xl border">

          <Loader2 className="size-6 animate-spin text-muted-foreground" />

          <span className="ml-2 text-sm text-muted-foreground">

            Loading students...

          </span>

        </div>

      ) : loadError ? (

        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 p-8 text-center">

          <p className="text-sm text-destructive">{loadError}</p>

          <Button variant="outline" onClick={() => void loadData()}>

            Try again

          </Button>

        </div>

      ) : filteredStudents.length === 0 ? (

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-14 text-center">

          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">

            <Users className="size-6 text-muted-foreground" />

          </div>

          <h2 className="font-semibold">

            {studentFilter ? "No students found" : "No students in this batch"}

          </h2>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">

            {studentFilter

              ? "Try another name, email, phone number or subject."

              : "Add students to this batch to start managing their learning."}

          </p>

          {!studentFilter && (

            <Button className="mt-4" onClick={() => setAddOpen(true)}>

              <UserPlus className="mr-2 size-4" />

              Add Student

            </Button>

          )}

        </div>

      ) : (

        <div className="space-y-4">

          {filteredStudents.map((student) => (

            <div

              key={student.studentId}

              className="overflow-hidden rounded-xl border bg-card shadow-sm"

            >

              {/* Student header */}

              <div className="flex items-start justify-between gap-3 p-4 sm:items-center sm:px-5">

                <div className="flex min-w-0 items-start gap-3">

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">

                    <Users className="size-5" />

                  </div>

                  <div className="min-w-0 space-y-1">

                    <h2 className="truncate font-semibold leading-tight">

                      {student.name}

                    </h2>

                    <p className="break-all text-xs text-muted-foreground sm:text-sm">

                      {student.email}

                    </p>

                    {student.phone && (

                      <p className="text-xs text-muted-foreground">

                        {student.phone}

                      </p>

                    )}

                  </div>

                </div>

                {/* Student actions */}

                <DropdownMenu>

                  <DropdownMenuTrigger render={<Button

                      variant="ghost"

                      size="icon"

                      className="size-9 shrink-0"

                      aria-label={`Actions for ${student.name}`}

                    >

                      <MoreHorizontal className="size-5" />

                    </Button>} />

                  <DropdownMenuContent align="end" className="w-52">

                    <DropdownMenuItem

                      onClick={() => openReplaceDialog(student)}

                    >

                      <ArrowLeftRight className="mr-2 size-4" />

                      Change batch

                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem

                      className="text-destructive focus:text-destructive"

                      onClick={() =>

                        setConfirmAction({

                          type: "remove-student",

                          studentId: student.studentId,

                          label: student.name,

                        })

                      }

                    >

                      <Trash2 className="mr-2 size-4" />

                      Remove from batch

                    </DropdownMenuItem>

                  </DropdownMenuContent>

                </DropdownMenu>

              </div>

              {/* Connected subject section */}

              <div className="border-t bg-muted/20 px-4 py-4 sm:px-5">

                <div className="mb-3 flex items-center justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <BookOpen className="size-4 text-muted-foreground" />

                    <h3 className="text-sm font-medium">Subjects</h3>

                    <Badge variant="secondary" className="text-xs">

                      {student.subjects.length}

                    </Badge>

                  </div>

                  <Button

                    variant="outline"

                    size="sm"

                    className="h-8"

                    onClick={() => openSubjectDialog(student)}

                  >

                    <Plus className="mr-1.5 size-3.5" />

                    Add Subject

                  </Button>

                </div>

                {student.subjects.length === 0 ? (

                  <p className="rounded-lg border border-dashed bg-background px-3 py-4 text-center text-xs text-muted-foreground">

                    No subjects assigned to this student.

                  </p>

                ) : (

                  <div className="space-y-2">

                    {student.subjects.map((subject) => (

                      <div

                        key={subject.id}

                        className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5"

                      >

                        <div className="flex min-w-0 items-center gap-2">

                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/5">

                            <BookOpen className="size-3.5 text-primary" />

                          </div>

                          <span className="truncate text-sm font-medium">

                            {subject.name}

                          </span>

                        </div>

                        <DropdownMenu>

                          <DropdownMenuTrigger render={<Button

                              variant="ghost"

                              size="icon"

                              className="size-8 shrink-0"

                              aria-label={`Actions for ${subject.name}`}

                            >

                              <MoreHorizontal className="size-4" />

                            </Button>} />

                          <DropdownMenuContent align="end">

                            <DropdownMenuItem

                              className="text-destructive focus:text-destructive"

                              onClick={() =>

                                setConfirmAction({

                                  type: "remove-subject",

                                  studentId: student.studentId,

                                  subjectId: subject.id,

                                  label: subject.name,

                                })

                              }

                            >

                              <Trash2 className="mr-2 size-4" />

                              Remove subject

                            </DropdownMenuItem>

                          </DropdownMenuContent>

                        </DropdownMenu>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

      {/* Add student dialog */}

      <Dialog open={addOpen} onOpenChange={closeAddDialog}>

        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">

          <DialogHeader className="p-5 pb-4">

            <DialogTitle>Add student to batch</DialogTitle>

            <DialogDescription>

              Search by name, email or phone. Select a student to enroll in{" "}

              <span className="font-medium text-foreground">{batchName}</span>.

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-3 overflow-y-auto px-5 pb-4">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input

                value={studentSearch}

                onChange={(event) => {

                  setStudentSearch(event.target.value);

                  setSelectedStudent(null);

                }}

                placeholder="Enter at least 3 characters..."

                className="pl-9"

                autoFocus

              />

            </div>

            {studentSearch.trim().length < 3 ? (

              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                Type at least 3 characters to search for students.

              </div>

            ) : isSearchingStudents ? (

              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">

                <Loader2 className="size-4 animate-spin" />

                Searching students...

              </div>

            ) : studentResults.length === 0 ? (

              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                No available students found.

              </div>

            ) : (

              <div className="max-h-64 space-y-2 overflow-y-auto">

                {studentResults.map((student) => {

                  const selected = selectedStudent?.id === student.id;

                  return (

                    <button

                      type="button"

                      key={student.id}

                      onClick={() => setSelectedStudent(student)}

                      className={`w-full rounded-lg border p-3 text-left transition-colors ${

                        selected

                          ? "border-primary bg-primary/5 ring-1 ring-primary"

                          : "hover:bg-muted/60"

                      }`}

                    >

                      <div className="flex items-center justify-between gap-2">

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium">

                            {student.name}

                          </p>

                          <p className="truncate text-xs text-muted-foreground">

                            {student.email}

                          </p>

                          {student.phone && (

                            <p className="text-xs text-muted-foreground">

                              {student.phone}

                            </p>

                          )}

                        </div>

                        <div

                          className={`size-4 shrink-0 rounded-full border-2 ${

                            selected

                              ? "border-primary bg-primary ring-2 ring-primary/20"

                              : "border-muted-foreground/40"

                          }`}

                        />

                      </div>

                    </button>

                  );

                })}

              </div>

            )}

            {selectedStudent && (

              <div className="rounded-lg bg-primary/5 p-3 text-sm">

                <p className="text-xs text-muted-foreground">Selected student</p>

                <p className="font-medium">{selectedStudent.name}</p>

              </div>

            )}

          </div>

          <DialogFooter className="border-t bg-muted/20 p-4 sm:flex-row">

            <Button

              variant="outline"

              onClick={() => closeAddDialog(false)}

              disabled={isMutating}

            >

              Cancel

            </Button>

            <Button

              onClick={() => void handleAddStudent()}

              disabled={!selectedStudent || isMutating}

            >

              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}

              Add to batch

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* Add subject dialog */}

      <Dialog

        open={!!subjectStudent}

        onOpenChange={closeSubjectDialog}

      >

        <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">

          <DialogHeader className="p-5 pb-4">

            <DialogTitle>Add subject</DialogTitle>

            <DialogDescription>

              Assign a subject to{" "}

              <span className="font-medium text-foreground">

                {subjectStudent?.name}

              </span>

              . Subject assignments are student-wide, not batch-specific.

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-3 overflow-y-auto px-5 pb-4">

            <div className="relative">

              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input

                value={subjectSearch}

                onChange={(event) => {

                  setSubjectSearch(event.target.value);

                  setSelectedSubject(null);

                }}

                placeholder="Search subjects..."

                className="pl-9"

              />

            </div>

            {subjectSearch.trim().length < 3 ? (

              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                Type at least 3 characters to search for subjects.

              </div>

            ) : isSearchingSubjects ? (

              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">

                <Loader2 className="size-4 animate-spin" />

                Searching subjects...

              </div>

            ) : subjectResults.length === 0 ? (

              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                No unassigned subjects found.

              </div>

            ) : (

              <div className="max-h-64 space-y-2 overflow-y-auto">

                {subjectResults.map((subject) => {

                  const selected = selectedSubject?.id === subject.id;

                  return (

                    <button

                      type="button"

                      key={subject.id}

                      onClick={() => setSelectedSubject(subject)}

                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${

                        selected

                          ? "border-primary bg-primary/5 ring-1 ring-primary"

                          : "hover:bg-muted/60"

                      }`}

                    >

                      <span className="text-sm font-medium">

                        {subject.name}

                      </span>

                      <span

                        className={`size-4 shrink-0 rounded-full border-2 ${

                          selected

                            ? "border-primary bg-primary ring-2 ring-primary/20"

                            : "border-muted-foreground/40"

                        }`}

                      />

                    </button>

                  );

                })}

              </div>

            )}

            {selectedSubject && (

              <div className="rounded-lg bg-primary/5 p-3 text-sm">

                <p className="text-xs text-muted-foreground">

                  Selected subject

                </p>

                <p className="font-medium">{selectedSubject.name}</p>

              </div>

            )}

          </div>

          <DialogFooter className="border-t bg-muted/20 p-4 sm:flex-row">

            <Button

              variant="outline"

              onClick={() => closeSubjectDialog(false)}

              disabled={isMutating}

            >

              Cancel

            </Button>

            <Button

              onClick={() => void handleAddSubject()}

              disabled={!selectedSubject || isMutating}

            >

              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}

              Add subject

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* Change batch dialog */}

      <Dialog

        open={!!replaceStudent}

        onOpenChange={(open) => {

          if (!open && !isMutating) {

            setReplaceStudent(null);

            setSelectedBatchId("");

          }

        }}

      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <DialogTitle>Change student batch</DialogTitle>

            <DialogDescription>

              Move{" "}

              <span className="font-medium text-foreground">

                {replaceStudent?.name}

              </span>{" "}

              from <span className="font-medium">{batchName}</span> to another

              batch.

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4 py-2">

            <div className="space-y-2">

              <label htmlFor="student-branch" className="text-sm font-medium">

                Branch

              </label>

              <select

                id="student-branch"

                value={selectedBranchId}

                onChange={(event) => {

                  setSelectedBranchId(event.target.value);

                  setSelectedBatchId("");

                }}

                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"

              >

                <option value="">Select branch</option>

                {branches.map((branch) => (

                  <option key={branch.id} value={branch.id}>

                    {branch.name}

                  </option>

                ))}

              </select>

            </div>

            <div className="space-y-2">

              <label htmlFor="student-batch" className="text-sm font-medium">

                Destination batch

              </label>

              <select

                id="student-batch"

                value={selectedBatchId}

                onChange={(event) => setSelectedBatchId(event.target.value)}

                disabled={!selectedBranchId}

                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

              >

                <option value="">Select batch</option>

                {availableBatches.map((batch) => (

                  <option key={batch.id} value={batch.id}>

                    {batch.name}

                  </option>

                ))}

              </select>

              {selectedBranchId && availableBatches.length === 0 && (

                <p className="text-xs text-muted-foreground">

                  No other batches available in this branch.

                </p>

              )}

            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">

              The current enrollment will be replaced. Existing attendance,

              progress and historical summaries will be preserved. Subject

              assignments remain unchanged.

            </div>

          </div>

          <DialogFooter>

            <Button

              variant="outline"

              onClick={() => setReplaceStudent(null)}

              disabled={isMutating}

            >

              Cancel

            </Button>

            <Button

              onClick={() => void handleReplaceBatch()}

              disabled={!selectedBatchId || isMutating}

            >

              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}

              Change batch

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* Destructive confirmation dialog */}

      <Dialog

        open={!!confirmAction}

        onOpenChange={(open) => {

          if (!open && !isMutating) setConfirmAction(null);

        }}

      >

        <DialogContent className="sm:max-w-md">

          <DialogHeader>

            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">

              <Trash2 className="size-5" />

            </div>

            <DialogTitle>

              {confirmAction?.type === "remove-student"

                ? "Remove student from batch?"

                : "Remove subject from student?"}

            </DialogTitle>

            <DialogDescription>

              {confirmAction?.type === "remove-student" ? (

                <>

                  Are you sure you want to remove{" "}

                  <span className="font-semibold text-foreground">

                    {confirmAction.label}

                  </span>{" "}

                  from <span className="font-semibold">{batchName}</span>?

                  Their existing attendance and progress history will be

                  preserved.

                </>

              ) : (

                <>

                  Are you sure you want to remove{" "}

                  <span className="font-semibold text-foreground">

                    {confirmAction?.label}

                  </span>{" "}

                  from this student? Its linked TOC completion history will

                  also be deleted by the current database cascade rules.

                </>

              )}

            </DialogDescription>

          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-2">

            <Button

              variant="outline"

              onClick={() => setConfirmAction(null)}

              disabled={isMutating}

            >

              Cancel

            </Button>

            <Button

              variant="destructive"

              onClick={() => void handleConfirmDestructive()}

              disabled={isMutating}

            >

              {isMutating && <Loader2 className="mr-2 size-4 animate-spin" />}

              {confirmAction?.type === "remove-student"

                ? "Remove student"

                : "Remove subject"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

}
