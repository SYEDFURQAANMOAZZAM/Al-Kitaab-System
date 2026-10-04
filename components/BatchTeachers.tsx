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

import { getBatchTeachers } from "@/app/ServerActions/batchOperations/teachers/actions/getBatchTeachers";

import { getTeachersForSearch } from "@/app/ServerActions/batchOperations/teachers/actions/getTeachersForSearch";

import { addTeacherToBatch } from "@/app/ServerActions/batchOperations/teachers/actions/addTeacherToBatch";

import { removeTeacherFromBatch } from "@/app/ServerActions/batchOperations/teachers/actions/removeTeacherFromBatch";

import { getBranchesWithBatches } from "@/app/ServerActions/batchOperations/teachers/actions/getBranchesWithBatches";

import { replaceTeacherBatchAssignment } from "@/app/ServerActions/batchOperations/teachers/actions/replaceTeacherBatchAssignment";

import { getSubjectsForSearch } from "@/app/ServerActions/batchOperations/teachers/actions/getSubjectsForSearch";

import { addSubjectToTeacher } from "@/app/ServerActions/batchOperations/teachers/actions/addSubjectToTeacher";

import { deleteSubjectFromTeacher } from "@/app/ServerActions/batchOperations/teachers/actions/deleteSubjectFromTeacher";

import type {

  BatchTeacherItem,

  BranchWithBatches,

  TeacherSearchItem,

  SubjectSearchItem,

} from "@/app/ServerActions/batchOperations/teachers/types";

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

      type: "remove-teacher";

      teacherId: string;

      label: string;

    }

  | {

      type: "remove-subject";

      teacherId: string;

      subjectId: string;

      label: string;

    };

type Props = {

  batchId: string;

  isAdmin: boolean;

};

export default function BatchTeachers({ batchId, isAdmin }: Props) {

  // Per request, admin view has no management actions.

  const canManage = isAdmin;

  const [teachers, setTeachers] = useState<BatchTeacherItem[]>([]);

  const [branches, setBranches] = useState<BranchWithBatches[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isMutating, setIsMutating] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [teacherFilter, setTeacherFilter] = useState("");

  // Add teacher dialog

  const [addOpen, setAddOpen] = useState(false);

  const [teacherSearch, setTeacherSearch] = useState("");

  const [teacherResults, setTeacherResults] = useState<TeacherSearchItem[]>([]);

  const [selectedTeacher, setSelectedTeacher] =

    useState<TeacherSearchItem | null>(null);

  const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);

  // Subject dialog

  const [subjectTeacher, setSubjectTeacher] =

    useState<BatchTeacherItem | null>(null);

  const [subjectSearch, setSubjectSearch] = useState("");

  const [subjectResults, setSubjectResults] = useState<SubjectSearchItem[]>([]);

  const [selectedSubject, setSelectedSubject] =

    useState<SubjectSearchItem | null>(null);

  const [isSearchingSubjects, setIsSearchingSubjects] = useState(false);

  // Change batch dialog

  const [replaceTeacher, setReplaceTeacher] =

    useState<BatchTeacherItem | null>(null);

  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Confirmation dialog

  const [confirmAction, setConfirmAction] =

    useState<ConfirmAction | null>(null);

  const notify = (type: Feedback["type"], message: string) => {

    setFeedback({ type, message });

  };

  const loadData = useCallback(async () => {

    setIsLoading(true);

    setLoadError("");

    try {

      const [teachersResult, branchesResult] = await Promise.all([

        getBatchTeachers(batchId),

        canManage ? getBranchesWithBatches() : Promise.resolve(null),

      ]);

      if (!teachersResult.success) {

        setLoadError(teachersResult.error);

        setTeachers([]);

      } else {

        setTeachers(teachersResult.data);

      }

      if (branchesResult) {

        if (!branchesResult.success) {

          setFeedback({

            type: "error",

            message: branchesResult.error,

          });

        } else {

          setBranches(branchesResult.data);

        }

      }

    } catch {

      setLoadError("Unable to load batch teachers. Please try again.");

    } finally {

      setIsLoading(false);

    }

  }, [batchId, canManage]);

  // Initial fetch avoids synchronously setting state inside the effect.

  useEffect(() => {

    let active = true;

    async function fetchInitialData() {

      try {

        const [teachersResult, branchesResult] = await Promise.all([

          getBatchTeachers(batchId),

          canManage ? getBranchesWithBatches() : Promise.resolve(null),

        ]);

        if (!active) return;

        if (!teachersResult.success) {

          setLoadError(teachersResult.error);

          setTeachers([]);

        } else {

          setTeachers(teachersResult.data);

          setLoadError("");

        }

        if (branchesResult) {

          if (branchesResult.success) {

            setBranches(branchesResult.data);

          } else {

            setFeedback({

              type: "error",

              message: branchesResult.error,

            });

          }

        }

      } catch {

        if (active) {

          setLoadError("Unable to load batch teachers. Please try again.");

        }

      } finally {

        if (active) setIsLoading(false);

      }

    }

    void fetchInitialData();

    return () => {

      active = false;

    };

  }, [batchId, canManage]);

  const batchName = useMemo(() => {

    for (const branch of branches) {

      const batch = branch.batches.find((item) => item.id === batchId);

      if (batch) return batch.name;

    }

    return "Batch";

  }, [branches, batchId]);

  const filteredTeachers = useMemo(() => {

    const term = teacherFilter.trim().toLowerCase();

    if (!term) return teachers;

    return teachers.filter((teacher) =>

      [

        teacher.name,

        teacher.email,

        teacher.phone ?? "",

        ...teacher.subjects.map((subject) => subject.name),

      ]

        .join(" ")

        .toLowerCase()

        .includes(term),

    );

  }, [teachers, teacherFilter]);

  // Debounced teacher search

  useEffect(() => {

    if (!addOpen || !canManage) return;

    const term = teacherSearch.trim();

    if (term.length < 3) return;

    let active = true;

    const timer = setTimeout(async () => {

      setIsSearchingTeachers(true);

      try {

        const result = await getTeachersForSearch(batchId, term);

        if (!active) return;

        if (result.success) {

          setTeacherResults(result.data);

        } else {

          setTeacherResults([]);

          setFeedback({ type: "error", message: result.error });

        }

      } catch {

        if (active) {

          setTeacherResults([]);

          setFeedback({

            type: "error",

            message: "Teacher search failed.",

          });

        }

      } finally {

        if (active) setIsSearchingTeachers(false);

      }

    }, 350);

    return () => {

      active = false;

      clearTimeout(timer);

    };

  }, [addOpen, batchId, teacherSearch, canManage]);

  // Debounced subject search

  useEffect(() => {

    if (!subjectTeacher || !canManage) return;

    const term = subjectSearch.trim();

    if (term.length < 3) return;

    let active = true;

    const timer = setTimeout(async () => {

      setIsSearchingSubjects(true);

      try {

        const result = await getSubjectsForSearch(

          subjectTeacher.teacherId,

          term,

        );

        if (!active) return;

        if (result.success) {

          setSubjectResults(result.data);

        } else {

          setSubjectResults([]);

          setFeedback({ type: "error", message: result.error });

        }

      } catch {

        if (active) {

          setSubjectResults([]);

          setFeedback({

            type: "error",

            message: "Subject search failed.",

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

  }, [subjectTeacher, subjectSearch, canManage]);

  const handleAddTeacher = async () => {

    if (!selectedTeacher || !canManage) return;

    setIsMutating(true);

    try {

      const result = await addTeacherToBatch(selectedTeacher.id, batchId);

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setAddOpen(false);

      setTeacherSearch("");

      setTeacherResults([]);

      setSelectedTeacher(null);

      notify("success", "Teacher added successfully.");

      await loadData();

    } catch {

      notify("error", "Failed to add teacher.");

    } finally {

      setIsMutating(false);

    }

  };

  const openSubjectDialog = (teacher: BatchTeacherItem) => {

    setSubjectTeacher(teacher);

    setSubjectSearch("");

    setSubjectResults([]);

    setSelectedSubject(null);

  };

  const handleAddSubject = async () => {

    if (!subjectTeacher || !selectedSubject || !canManage) return;

    setIsMutating(true);

    try {

      const result = await addSubjectToTeacher(

        subjectTeacher.teacherId,

        selectedSubject.id,

      );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setSubjectTeacher(null);

      setSubjectSearch("");

      setSubjectResults([]);

      setSelectedSubject(null);

      notify("success", "Subject assigned successfully.");

      await loadData();

    } catch {

      notify("error", "Failed to assign subject.");

    } finally {

      setIsMutating(false);

    }

  };

  const openReplaceDialog = (teacher: BatchTeacherItem) => {

    setReplaceTeacher(teacher);

    const currentBranch = branches.find((branch) =>

      branch.batches.some((batch) => batch.id === batchId),

    );

    setSelectedBranchId(currentBranch?.id ?? "");

    setSelectedBatchId("");

  };

  const availableBatches = useMemo(

    () =>

      branches

        .find((branch) => branch.id === selectedBranchId)

        ?.batches.filter((batch) => batch.id !== batchId) ?? [],

    [branches, selectedBranchId, batchId],

  );

  const handleReplaceBatch = async () => {

    if (!replaceTeacher || !selectedBatchId || !canManage) return;

    setIsMutating(true);

    try {

      const result = await replaceTeacherBatchAssignment(

        replaceTeacher.teacherId,

        batchId,

        selectedBatchId,

      );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setReplaceTeacher(null);

      setSelectedBatchId("");

      notify("success", "Teacher batch assignment changed.");

      await loadData();

    } catch {

      notify("error", "Failed to change teacher batch.");

    } finally {

      setIsMutating(false);

    }

  };

  const handleConfirmDestructive = async () => {

    if (!confirmAction || !canManage) return;

    const action = confirmAction;

    setIsMutating(true);

    try {

      const result =

        action.type === "remove-teacher"

          ? await removeTeacherFromBatch(action.teacherId, batchId)

          : await deleteSubjectFromTeacher(

              action.teacherId,

              action.subjectId,

            );

      if (!result.success) {

        notify("error", result.error);

        return;

      }

      setConfirmAction(null);

      notify(

        "success",

        action.type === "remove-teacher"

          ? "Teacher removed from batch."

          : "Subject removed from teacher.",

      );

      await loadData();

    } catch {

      notify("error", "The operation could not be completed.");

    } finally {

      setIsMutating(false);

    }

  };

  const closeAddDialog = (open: boolean) => {

    setAddOpen(open);

    if (!open) {

      setTeacherSearch("");

      setTeacherResults([]);

      setSelectedTeacher(null);

    }

  };

  const closeSubjectDialog = (open: boolean) => {

    if (!open) {

      setSubjectTeacher(null);

      setSubjectSearch("");

      setSubjectResults([]);

      setSelectedSubject(null);

    }

  };

  return (

    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="space-y-1">

          <div className="flex items-center gap-2 text-sm text-muted-foreground">

            <Users className="size-4" />

            Batch management

          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

            {batchName} Teachers

          </h1>

          <p className="text-sm text-muted-foreground">

            View teachers assigned to this batch and their subjects.

          </p>

        </div>

        {canManage && (

          <Button

            onClick={() => setAddOpen(true)}

            className="w-full sm:w-auto"

          >

            <UserPlus className="mr-2 size-4" />

            Add Teacher

          </Button>

        )}

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

            value={teacherFilter}

            onChange={(event) => setTeacherFilter(event.target.value)}

            placeholder="Search assigned teachers..."

            className="pl-9 pr-9"

          />

          {teacherFilter && (

            <button

              type="button"

              onClick={() => setTeacherFilter("")}

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

            {filteredTeachers.length}{" "}

            {filteredTeachers.length === 1 ? "teacher" : "teachers"}

          </span>

        </div>

      </div>

      {/* Teacher list */}

      {isLoading ? (

        <div className="flex min-h-48 items-center justify-center rounded-xl border">

          <Loader2 className="size-6 animate-spin text-muted-foreground" />

          <span className="ml-2 text-sm text-muted-foreground">

            Loading teachers...

          </span>

        </div>

      ) : loadError ? (

        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 p-8 text-center">

          <p className="text-sm text-destructive">{loadError}</p>

          <Button variant="outline" onClick={() => void loadData()}>

            Try again

          </Button>

        </div>

      ) : filteredTeachers.length === 0 ? (

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-14 text-center">

          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">

            <Users className="size-6 text-muted-foreground" />

          </div>

          <h2 className="font-semibold">

            {teacherFilter ? "No teachers found" : "No teachers in this batch"}

          </h2>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">

            {teacherFilter

              ? "Try another name, email, phone number or subject."

              : "There are currently no teachers assigned to this batch."}

          </p>

          {!teacherFilter && canManage && (

            <Button className="mt-4" onClick={() => setAddOpen(true)}>

              <UserPlus className="mr-2 size-4" />

              Add Teacher

            </Button>

          )}

        </div>

      ) : (

        <div className="space-y-4">

          {filteredTeachers.map((teacher) => (

            <div

              key={teacher.teacherId}

              className="overflow-hidden rounded-xl border bg-card shadow-sm"

            >

              {/* Teacher header */}

              <div className="flex items-start justify-between gap-3 p-4 sm:items-center sm:px-5">

                <div className="flex min-w-0 items-start gap-3">

                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">

                    <Users className="size-5" />

                  </div>

                  <div className="min-w-0 space-y-1">

                    <h2 className="truncate font-semibold leading-tight">

                      {teacher.name}

                    </h2>

                    <p className="break-all text-xs text-muted-foreground sm:text-sm">

                      {teacher.email}

                    </p>

                    {teacher.phone && (

                      <p className="text-xs text-muted-foreground">

                        {teacher.phone}

                      </p>

                    )}

                  </div>

                </div>

                {/* Teacher actions */}

                {canManage && (

                  <DropdownMenu>

                    <DropdownMenuTrigger render={<Button

                        variant="ghost"

                        size="icon"

                        className="size-9 shrink-0"

                        aria-label={`Actions for ${teacher.name}`}

                      >

                        <MoreHorizontal className="h-4 w-4" />

                      </Button>} />

                    <DropdownMenuContent>

                      {/* Menu items */}

                    </DropdownMenuContent>

                  </DropdownMenu>

                )}

              </div>

              {/* Subjects */}

              <div className="border-t bg-muted/20 px-4 py-4 sm:px-5">

                <div className="mb-3 flex items-center justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <BookOpen className="size-4 text-muted-foreground" />

                    <h3 className="text-sm font-medium">Subjects</h3>

                    <Badge variant="secondary" className="text-xs">

                      {teacher.subjects.length}

                    </Badge>

                  </div>

                  {canManage && (

                    <Button

                      variant="outline"

                      size="sm"

                      className="h-8"

                      onClick={() => openSubjectDialog(teacher)}

                    >

                      <Plus className="mr-1.5 size-3.5" />

                      Add Subject

                    </Button>

                  )}

                </div>

                {teacher.subjects.length === 0 ? (

                  <p className="rounded-lg border border-dashed bg-background px-3 py-4 text-center text-xs text-muted-foreground">

                    No batch-linked subjects assigned to this teacher.

                  </p>

                ) : (

                  <div className="space-y-2">

                    {teacher.subjects.map((subject) => (

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

                        {canManage && (

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

                                    teacherId: teacher.teacherId,

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

                        )}

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

      {/* Management dialogs are not rendered for isAdmin=true */}

      {canManage && (

        <>

          {/* Add teacher dialog */}

          <Dialog open={addOpen} onOpenChange={closeAddDialog}>

            <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">

              <DialogHeader className="p-5 pb-4">

                <DialogTitle>Add teacher to batch</DialogTitle>

                <DialogDescription>

                  Search by name, email or phone. Select a teacher to assign to{" "}

                  <span className="font-medium text-foreground">

                    {batchName}

                  </span>.

                </DialogDescription>

              </DialogHeader>

              <div className="space-y-3 overflow-y-auto px-5 pb-4">

                <div className="relative">

                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input

                    value={teacherSearch}

                    onChange={(event) => {

                      setTeacherSearch(event.target.value);

                      setSelectedTeacher(null);

                      setTeacherResults([]);

                    }}

                    placeholder="Enter at least 3 characters..."

                    className="pl-9"

                    autoFocus

                  />

                </div>

                {teacherSearch.trim().length < 3 ? (

                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                    Type at least 3 characters to search for teachers.

                  </div>

                ) : isSearchingTeachers ? (

                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">

                    <Loader2 className="size-4 animate-spin" />

                    Searching teachers...

                  </div>

                ) : teacherResults.length === 0 ? (

                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">

                    No available teachers found.

                  </div>

                ) : (

                  <div className="max-h-64 space-y-2 overflow-y-auto">

                    {teacherResults.map((teacher) => {

                      const selected = selectedTeacher?.id === teacher.id;

                      return (

                        <button

                          type="button"

                          key={teacher.id}

                          onClick={() => setSelectedTeacher(teacher)}

                          className={`w-full rounded-lg border p-3 text-left transition-colors ${

                            selected

                              ? "border-primary bg-primary/5 ring-1 ring-primary"

                              : "hover:bg-muted/60"

                          }`}

                        >

                          <div className="flex items-center justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-medium">

                                {teacher.name}

                              </p>

                              <p className="truncate text-xs text-muted-foreground">

                                {teacher.email}

                              </p>

                              {teacher.phone && (

                                <p className="text-xs text-muted-foreground">

                                  {teacher.phone}

                                </p>

                              )}

                            </div>

                            <span

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

                {selectedTeacher && (

                  <div className="rounded-lg bg-primary/5 p-3 text-sm">

                    <p className="text-xs text-muted-foreground">

                      Selected teacher

                    </p>

                    <p className="font-medium">{selectedTeacher.name}</p>

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

                  onClick={() => void handleAddTeacher()}

                  disabled={!selectedTeacher || isMutating}

                >

                  {isMutating && (

                    <Loader2 className="mr-2 size-4 animate-spin" />

                  )}

                  Add to batch

                </Button>

              </DialogFooter>

            </DialogContent>

          </Dialog>

          {/* Add subject dialog */}

          <Dialog

            open={!!subjectTeacher}

            onOpenChange={closeSubjectDialog}

          >

            <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">

              <DialogHeader className="p-5 pb-4">

                <DialogTitle>Add subject</DialogTitle>

                <DialogDescription>

                  Assign a subject to{" "}

                  <span className="font-medium text-foreground">

                    {subjectTeacher?.name}

                  </span>

                  . Subject assignments are teacher-wide, not batch-specific.

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

                      setSubjectResults([]);

                    }}

                    placeholder="Enter at least 3 characters..."

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

                  {isMutating && (

                    <Loader2 className="mr-2 size-4 animate-spin" />

                  )}

                  Add subject

                </Button>

              </DialogFooter>

            </DialogContent>

          </Dialog>

          {/* Change batch dialog */}

          <Dialog

            open={!!replaceTeacher}

            onOpenChange={(open) => {

              if (!open && !isMutating) {

                setReplaceTeacher(null);

                setSelectedBatchId("");

              }

            }}

          >

            <DialogContent className="sm:max-w-md">

              <DialogHeader>

                <DialogTitle>Change teacher batch</DialogTitle>

                <DialogDescription>

                  Move{" "}

                  <span className="font-medium text-foreground">

                    {replaceTeacher?.name}

                  </span>{" "}

                  from <span className="font-medium">{batchName}</span> to

                  another batch.

                </DialogDescription>

              </DialogHeader>

              <div className="space-y-4 py-2">

                <div className="space-y-2">

                  <label

                    htmlFor="teacher-branch"

                    className="text-sm font-medium"

                  >

                    Branch

                  </label>

                  <select

                    id="teacher-branch"

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

                  <label

                    htmlFor="teacher-batch"

                    className="text-sm font-medium"

                  >

                    Destination batch

                  </label>

                  <select

                    id="teacher-batch"

                    value={selectedBatchId}

                    onChange={(event) =>

                      setSelectedBatchId(event.target.value)

                    }

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

                  The current batch assignment will be replaced. Teacher

                  subject assignments remain unchanged. Existing attendance

                  summaries are not deleted by this assignment change.

                </div>

              </div>

              <DialogFooter>

                <Button

                  variant="outline"

                  onClick={() => setReplaceTeacher(null)}

                  disabled={isMutating}

                >

                  Cancel

                </Button>

                <Button

                  onClick={() => void handleReplaceBatch()}

                  disabled={!selectedBatchId || isMutating}

                >

                  {isMutating && (

                    <Loader2 className="mr-2 size-4 animate-spin" />

                  )}

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

                  {confirmAction?.type === "remove-teacher"

                    ? "Remove teacher from batch?"

                    : "Remove subject from teacher?"}

                </DialogTitle>

                <DialogDescription>

                  {confirmAction?.type === "remove-teacher" ? (

                    <>

                      Are you sure you want to remove{" "}

                      <span className="font-semibold text-foreground">

                        {confirmAction.label}

                      </span>{" "}

                      from{" "}

                      <span className="font-semibold">{batchName}</span>?

                      Existing attendance summaries are not automatically

                      deleted.

                    </>

                  ) : (

                    <>

                      Are you sure you want to remove{" "}

                      <span className="font-semibold text-foreground">

                        {confirmAction?.label}

                      </span>{" "}

                      from this teacher? This removes the teacher-subject

                      assignment.

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

                  {isMutating && (

                    <Loader2 className="mr-2 size-4 animate-spin" />

                  )}

                  {confirmAction?.type === "remove-teacher"

                    ? "Remove teacher"

                    : "Remove subject"}

                </Button>

              </DialogFooter>

            </DialogContent>

          </Dialog>

        </>

      )}

    </div>

  );

}
