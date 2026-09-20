"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  submitProgress,
  type ProgressLearning,
} from "@/app/ServerActions/progress/progress";

import { saveGlobalLearnings } from "@/app/ServerActions/progress/saveGlobalLearnings";

import { getCommonSubjects } from "@/app/ServerActions/progress/getCommonSubjects";
import { getBatchSubjects } from "@/app/ServerActions/progress/getBatchSubjects";
import { getTodayProgress } from "@/app/ServerActions/progress/get-today-progress";

import {
  SubjectTocRangeFields,
  type TocRange,
} from "@/components/SubjectTocRangeFields";

/* ============================================================
   TYPES
============================================================ */

type Student = {
  id: string;
  userId: string;
  name: string;
};

type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

type SubjectTocItem = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

type TrackingTerm = {
  id: string;
  name: string;
  position: number;
};

type Subject = {
  id: string;
  name: string;

  parts: SubjectPart[];

  tocItems?: SubjectTocItem[];

  trackingTerms: TrackingTerm[];
};

type Learning = {
  id: string;

  subject: Subject | null;

  status: string;

  values: Record<string, string | TocRange>;

  saved: boolean;
};

type StudentProgress = {
  learnings: Learning[];
};

type ProgressFormProps = {
  batchId: string;
  batchName: string;
  students: Student[];
};

/* ============================================================
   GLOBAL LEARNING TYPES
============================================================ */

type GlobalLearning = {
  id: string;

  subject: Subject | null;

  status: string;

  values: Record<string, string | TocRange>;
};

type GlobalLearningPayload = {
  id: string;

  subject: {
    id: string;
    name: string;
    parts: SubjectPart[];
  } | null;

  status: string;

  values: Record<
    string,
    string | TocRange
  >;
};

/* ============================================================
   COMPONENT
============================================================ */

export function ProgressForm({
  batchId,
  batchName,
  students,
}: ProgressFormProps) {
  /* ==========================================================
     STUDENT PROGRESS
  ========================================================== */

  const [progress, setProgress] = useState<
    Record<string, StudentProgress>
  >(() =>
    Object.fromEntries(
      students.map((student) => [
        student.id,
        {
          learnings: [],
        },
      ]),
    ),
  );

  /* ==========================================================
     SUBJECT SELECTION
  ========================================================== */

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [globalSubjects, setGlobalSubjects] = useState<
    Subject[]
  >([]);

  /* ==========================================================
     GLOBAL LEARNINGS
  ========================================================== */

  const [globalLearnings, setGlobalLearnings] =
    useState<GlobalLearning[]>([]);

  const [globalStudents, setGlobalStudents] =
    useState<string[]>([]);

  const [
    globalLearningsExpanded,
    setGlobalLearningsExpanded,
  ] = useState(true);

  const [
    expandedGlobalLearnings,
    setExpandedGlobalLearnings,
  ] = useState<Record<string, boolean>>({});

  const [
    globalSubjectDialog,
    setGlobalSubjectDialog,
  ] = useState<{
    learningId: string;
  } | null>(null);

  const [
    loadingGlobalSubjects,
    setLoadingGlobalSubjects,
  ] = useState(false);

  /* ==========================================================
     STUDENT LEARNING UI
  ========================================================== */

  const [
    expandedStudentLearnings,
    setExpandedStudentLearnings,
  ] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      students.map((student) => [
        student.id,
        false,
      ]),
    ),
  );

  const [
    expandedLearnings,
    setExpandedLearnings,
  ] = useState<Record<string, boolean>>({});

  const [
    subjectDialog,
    setSubjectDialog,
  ] = useState<{
    studentId: string;
    learningId: string;
  } | null>(null);

  const [
    loadingSubjects,
    setLoadingSubjects,
  ] = useState<string | null>(null);

  const [
    studentProgressSearch,
    setStudentProgressSearch,
  ] = useState("");

  const [
    progressLoading,
    setProgressLoading,
  ] = useState(true);

  /* ==========================================================
     HELPERS
  ========================================================== */

  const createLearningId = () => {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
  };

  /* ==========================================================
     STUDENT HELPERS
  ========================================================== */

  const updateStudentLearnings = (
    studentId: string,
    learnings: Learning[],
  ) => {
    setProgress((current) => ({
      ...current,

      [studentId]: {
        ...current[studentId],
        learnings,
      },
    }));
  };

  const toggleStudentLearnings = (
    studentId: string,
  ) => {
    setExpandedStudentLearnings((current) => ({
      ...current,

      [studentId]:
        !current[studentId],
    }));
  };

  const toggleLearning = (
    studentId: string,
    learningId: string,
  ) => {
    const key = `${studentId}-${learningId}`;

    setExpandedLearnings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /* ==========================================================
     GLOBAL STUDENT SELECTION
  ========================================================== */

  const toggleGlobalStudent = (
    studentId: string,
  ) => {
    setGlobalStudents((current) =>
      current.includes(studentId)
        ? current.filter(
            (id) => id !== studentId,
          )
        : [...current, studentId],
    );
  };

  const selectAllGlobalStudents = () => {
    setGlobalStudents(
      students.map(
        (student) => student.id,
      ),
    );
  };

  const clearGlobalStudents = () => {
    setGlobalStudents([]);
  };

  /* ==========================================================
     SUBJECT HELPERS
  ========================================================== */

  const getDefaultStatus = (
    subject: Subject | null,
  ) => {
    return (
      subject?.trackingTerms
        ?.slice()
        .sort(
          (a, b) =>
            a.position - b.position,
        )[0]?.name ?? ""
    );
  };

  const updateLearningSubject = (
    studentId: string,
    learningId: string,
    subject: Subject,
  ) => {
    setProgress((current) => ({
      ...current,

      [studentId]: {
        ...current[studentId],

        learnings:
          current[studentId].learnings.map(
            (learning) =>
              learning.id === learningId
                ? {
                    ...learning,
                    subject,
                    status:
                      getDefaultStatus(
                        subject,
                      ),
                    values: {},
                  }
                : learning,
          ),
      },
    }));
  };

  const updateGlobalLearningSubject = (
    learningId: string,
    subject: Subject,
  ) => {
    setGlobalLearnings((current) =>
      current.map((learning) =>
        learning.id === learningId
          ? {
              ...learning,
              subject,
              status:
                getDefaultStatus(subject),
              values: {},
            }
          : learning,
      ),
    );
  };

  /* ==========================================================
     ADD STUDENT LEARNING
  ========================================================== */

  const addLearning = async (
    student: Student,
  ) => {
    setLoadingSubjects(student.id);

    try {
      const commonSubjects =
        await getCommonSubjects(
          student.id,
          batchId,
        );

      if (commonSubjects.length === 0) {
        alert(
          "This student has no subject in common with this batch.",
        );

        return;
      }

      setSubjects(commonSubjects);

      const learningId =
        createLearningId();

      const newLearning: Learning = {
        id: learningId,
        subject: null,
        status: "",
        values: {},
        saved: false,
      };

      const currentLearnings =
        progress[student.id]?.learnings ??
        [];

      updateStudentLearnings(
        student.id,
        [
          ...currentLearnings,
          newLearning,
        ],
      );

      setExpandedStudentLearnings(
        (current) => ({
          ...current,
          [student.id]: true,
        }),
      );

      setExpandedLearnings(
        (current) => ({
          ...current,
          [`${student.id}-${learningId}`]:
            true,
        }),
      );

      /* --------------------------------------------
         Only one subject
      -------------------------------------------- */

      if (commonSubjects.length === 1) {
        updateLearningSubject(
          student.id,
          learningId,
          commonSubjects[0],
        );

        return;
      }

      /* --------------------------------------------
         Multiple subjects
      -------------------------------------------- */

      setSubjectDialog({
        studentId: student.id,
        learningId,
      });
    } finally {
      setLoadingSubjects(null);
    }
  };

  /* ==========================================================
     UPDATE STUDENT STATUS
  ========================================================== */

  const updateLearningStatus = (
    studentId: string,
    learningId: string,
    status: string,
  ) => {
    setProgress((current) => ({
      ...current,

      [studentId]: {
        ...current[studentId],

        learnings:
          current[studentId].learnings.map(
            (learning) =>
              learning.id === learningId
                ? {
                    ...learning,
                    status,
                  }
                : learning,
          ),
      },
    }));
  };

  /* ==========================================================
     UPDATE STUDENT RANGE
  ========================================================== */

  const updateLearningValue = (
    studentId: string,
    learningId: string,
    partId: string,
    value: string | TocRange,
  ) => {
    setProgress((current) => ({
      ...current,

      [studentId]: {
        ...current[studentId],

        learnings:
          current[studentId].learnings.map(
            (learning) =>
              learning.id === learningId
                ? {
                    ...learning,

                    values: {
                      ...learning.values,
                      [partId]: value,
                    },
                  }
                : learning,
          ),
      },
    }));
  };

  /* ==========================================================
     REMOVE STUDENT LEARNING
  ========================================================== */

  const removeLearning = (
    studentId: string,
    learningId: string,
  ) => {
    setProgress((current) => ({
      ...current,

      [studentId]: {
        ...current[studentId],

        learnings:
          current[
            studentId
          ].learnings.filter(
            (learning) =>
              learning.id !== learningId,
          ),
      },
    }));

    setExpandedLearnings((current) => {
      const next = {
        ...current,
      };

      delete next[
        `${studentId}-${learningId}`
      ];

      return next;
    });
  };

  /* ==========================================================
     GLOBAL LEARNING → SERVER PAYLOAD
  ========================================================== */

  const toGlobalLearningPayload = (
    learning: GlobalLearning,
  ): GlobalLearningPayload => ({
    id: learning.id,

    subject: learning.subject
      ? {
          id: learning.subject.id,
          name: learning.subject.name,
          parts: learning.subject.parts,
        }
      : null,

    status: learning.status,

    values: learning.values,
  });

  /* ==========================================================
     ADD GLOBAL LEARNING
  ========================================================== */

  const addGlobalLearning = async () => {
    setLoadingGlobalSubjects(true);

    try {
      const batchSubjects =
        await getBatchSubjects(batchId);

      if (batchSubjects.length === 0) {
        alert(
          "This batch has no subjects.",
        );

        return;
      }

      setGlobalSubjects(
        batchSubjects,
      );

      const learningId =
        createLearningId();

      const newLearning: GlobalLearning = {
        id: learningId,
        subject: null,
        status: "",
        values: {},
      };

      setGlobalLearnings((current) => [
        ...current,
        newLearning,
      ]);

      setGlobalLearningsExpanded(true);

      setExpandedGlobalLearnings(
        (current) => ({
          ...current,
          [learningId]: true,
        }),
      );

      /* --------------------------------------------
         Only one subject
      -------------------------------------------- */

      if (batchSubjects.length === 1) {
        updateGlobalLearningSubject(
          learningId,
          batchSubjects[0],
        );

        return;
      }

      setGlobalSubjectDialog({
        learningId,
      });
    } finally {
      setLoadingGlobalSubjects(false);
    }
  };

  /* ==========================================================
     UPDATE GLOBAL STATUS
  ========================================================== */

  const updateGlobalLearningStatus = (
    learningId: string,
    status: string,
  ) => {
    setGlobalLearnings((current) =>
      current.map((learning) =>
        learning.id === learningId
          ? {
              ...learning,
              status,
            }
          : learning,
      ),
    );
  };

  /* ==========================================================
     UPDATE GLOBAL RANGE
  ========================================================== */

  const updateGlobalLearningValue = (
    learningId: string,
    partId: string,
    value: string | TocRange,
  ) => {
    setGlobalLearnings((current) =>
      current.map((learning) =>
        learning.id === learningId
          ? {
              ...learning,

              values: {
                ...learning.values,
                [partId]: value,
              },
            }
          : learning,
      ),
    );
  };

  /* ==========================================================
     REMOVE GLOBAL LEARNING
  ========================================================== */

  const removeGlobalLearning = (
    learningId: string,
  ) => {
    setGlobalLearnings((current) =>
      current.filter(
        (learning) =>
          learning.id !== learningId,
      ),
    );

    setExpandedGlobalLearnings(
      (current) => {
        const next = {
          ...current,
        };

        delete next[learningId];

        return next;
      },
    );
  };

  /* ==========================================================
     BUILD PROGRESS PAYLOAD
  ========================================================== */

  const buildProgressLearnings = (
    learnings: Learning[],
  ): ProgressLearning[] =>
    learnings.map((learning) => ({
      learningId: learning.id,

      subject: learning.subject
        ? {
            id: learning.subject.id,
            name: learning.subject.name,
          }
        : null,

      status: learning.status,

      parts: learning.subject
        ? learning.subject.parts.map(
            (part) => ({
              id: part.id,
              name: part.name,
              position: part.position,

              value:
                learning.values[
                  part.id
                ] ?? "",
            }),
          )
        : [],
    }));

  /* ==========================================================
     SUBMIT STUDENT
  ========================================================== */

  const submitStudent = async (
    student: Student,
  ) => {
    const data =
      progress[student.id];

    if (
      !data ||
      data.learnings.length === 0
    ) {
      return;
    }

    const learnings =
      buildProgressLearnings(
        data.learnings,
      );

    try {
      await submitProgress({
        studentId: student.id,
        batchId,
        batchName,
        learnings,
      });

      setProgress((current) => ({
        ...current,

        [student.id]: {
          ...current[student.id],

          learnings:
            current[
              student.id
            ].learnings.map(
              (learning) => ({
                ...learning,
                saved: true,
              }),
            ),
        },
      }));
    } catch (error) {
      console.error(
        "Failed to submit progress:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit progress.",
      );
    }
  };

  /* ==========================================================
     LOAD TODAY'S PROGRESS
  ========================================================== */

  useEffect(() => {
    const loadTodayProgress =
      async () => {
        try {
          const savedProgress =
            await getTodayProgress(
              batchId,
            );

          setProgress((current) => {
            const next = {
              ...current,
            };

            for (const saved of savedProgress) {
              if (!saved.learnings) {
                continue;
              }

              const savedLearnings =
                Array.isArray(
                  saved.learnings,
                )
                  ? saved.learnings
                  : [];

              const learnings: Learning[] =
                savedLearnings.map(
                  (learning: any) => {
                    const subject =
                      learning.subject;

                    return {
                      id: learning.learningId,

                      subject: subject
                        ? {
                            id: subject.id,
                            name: subject.name,

                            parts:
                              (
                                learning.parts ??
                                []
                              ).map(
                                (
                                  part: any,
                                ) => ({
                                  id: part.id,
                                  name:
                                    part.name,
                                  position:
                                    part.position,
                                }),
                              ),

                            tocItems:
                              subject.tocItems ??
                              [],

                            trackingTerms:
                              subject.trackingTerms ??
                              [],
                          }
                        : null,

                      status:
                        learning.status ??
                        "",

                      values:
                        Object.fromEntries(
                          (
                            learning.parts ??
                            []
                          ).map(
                            (
                              part: any,
                            ) => [
                              part.id,
                              part.value ??
                                "",
                            ],
                          ),
                        ),

                      saved: true,
                    };
                  },
                );

              next[saved.studentId] = {
                ...next[
                  saved.studentId
                ],

                learnings,
              };
            }

            return next;
          });
        } catch (error) {
          console.error(
            "Failed to load today's progress:",
            error,
          );
        } finally {
          setProgressLoading(false);
        }
      };

    loadTodayProgress();
  }, [batchId]);

  /* ==========================================================
     RENDER
  ========================================================== */

  const searchTerm =
    studentProgressSearch
      .trim()
      .toLowerCase();

  const filteredStudents =
    students.filter((student) =>
      student.name
        .toLowerCase()
        .includes(searchTerm),
    );

  return (
    <>
      <div className="space-y-4 px-3 sm:px-4 lg:px-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div>
          <h1 className="text-2xl font-semibold">
            Mark Progress
          </h1>

          <p className="text-sm text-muted-foreground">
            {batchName}
          </p>
        </div>

        {/* ======================================================
            GLOBAL LEARNING
        ====================================================== */}

        <Collapsible.Root defaultOpen={false}>
          <Card className="overflow-hidden border-0 bg-transparent p-0 shadow-none">

            <Collapsible.Trigger
              className="
                group flex w-full items-center
                justify-between gap-3
                px-4 py-3 text-left
                outline-none transition-colors
                hover:bg-muted/50
                focus-visible:bg-muted/50
                sm:px-5 sm:py-3.5
              "
            >
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Global Learning
                </CardTitle>

                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  Create learning once and assign it to selected students.
                </p>
              </div>

              <ChevronDown
                className="
                  h-4 w-4 shrink-0
                  text-muted-foreground
                  transition-transform duration-200
                  group-data-[panel-open]:rotate-180
                "
              />
            </Collapsible.Trigger>

            <Collapsible.Panel>
              <CardContent className="space-y-3 border-t px-3 py-2 sm:px-4">

                {/* GLOBAL HEADER */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      Global Learnings
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {globalLearnings.length}{" "}
                      learning
                      {globalLearnings.length !==
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGlobalLearning}
                    disabled={
                      loadingGlobalSubjects
                    }
                  >
                    {loadingGlobalSubjects
                      ? "Loading..."
                      : "Add Learning"}
                  </Button>
                </div>

                {/* GLOBAL LEARNINGS */}

                {globalLearnings.length >
                  0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="
                        group flex w-full
                        items-center justify-between
                        gap-3 border-b px-0 py-2
                        text-left transition-colors
                        hover:bg-muted/50
                      "
                      onClick={() =>
                        setGlobalLearningsExpanded(
                          (current) =>
                            !current,
                        )
                      }
                    >
                      <div>
                        <p className="font-medium">
                          Learnings
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            globalLearnings.length
                          }{" "}
                          learning
                          {globalLearnings.length !==
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>

                      {globalLearningsExpanded ? (
                        <ChevronUp className="size-5" />
                      ) : (
                        <ChevronDown className="size-5" />
                      )}
                    </button>

                    {globalLearningsExpanded && (
                      <div className="space-y-2 py-2">
                        {globalLearnings.map(
                          (
                            learning,
                          ) => {
                            const isExpanded =
                              expandedGlobalLearnings[
                                learning.id
                              ] ??
                              false;

                            return (
                              <div
                                key={
                                  learning.id
                                }
                                className="overflow-visible rounded-lg border"
                              >
                                <button
                                  type="button"
                                  className="
                                    group flex w-full
                                    items-center
                                    justify-between
                                    gap-3 bg-background
                                    px-3 py-2.5
                                    text-left
                                    hover:bg-muted/50
                                  "
                                  onClick={() =>
                                    setExpandedGlobalLearnings(
                                      (current) => ({
                                        ...current,
                                        [learning.id]:
                                          !current[
                                            learning
                                              .id
                                          ],
                                      }),
                                    )
                                  }
                                >
                                  <p className="font-medium">
                                    {learning.subject
                                      ?.name ??
                                      "Choose subject"}{" "}
                                    (
                                    {learning.status ||
                                      "no status"}
                                    )
                                  </p>

                                  {isExpanded ? (
                                    <ChevronUp className="size-5 shrink-0" />
                                  ) : (
                                    <ChevronDown className="size-5 shrink-0" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="space-y-3 px-3 py-2">

                                    <div className="grid gap-2 md:grid-cols-2">

                                      {/* SUBJECT */}

                                      <div className="space-y-1">
                                        <Label>
                                          Subject
                                        </Label>

                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full justify-start"
                                          onClick={() =>
                                            setGlobalSubjectDialog(
                                              {
                                                learningId:
                                                  learning.id,
                                              },
                                            )
                                          }
                                        >
                                          {learning.subject
                                            ?.name ??
                                            "Choose Subject"}
                                        </Button>
                                      </div>

                                      {/* STATUS */}

                                      <div className="space-y-1">
                                        <Label>
                                          Status
                                        </Label>

                                        <Select
                                          value={
                                            learning.status
                                          }
                                          onValueChange={(
                                            value,
                                          ) =>
                                            updateGlobalLearningStatus(
                                              learning.id,
                                              value ?? "",
                                            )
                                          }
                                          disabled={
                                            !learning.subject ||
                                            learning.subject
                                              .trackingTerms
                                              .length ===
                                              0
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Choose status" />
                                          </SelectTrigger>

                                          <SelectContent>
                                            {learning.subject?.trackingTerms.map(
                                              (
                                                term,
                                              ) => (
                                                <SelectItem
                                                  key={
                                                    term.id
                                                  }
                                                  value={
                                                    term.name
                                                  }
                                                >
                                                  {
                                                    term.name
                                                  }
                                                </SelectItem>
                                              ),
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {/* RANGES */}

                                    {learning.subject && (
                                      <div className="space-y-2">
                                        <p className="text-sm font-semibold">
                                          Learning ranges
                                        </p>

                                        <SubjectTocRangeFields
                                          parts={
                                            learning
                                              .subject
                                              .parts
                                          }
                                          tocItems={
                                            learning
                                              .subject
                                              .tocItems ??
                                            []
                                          }
                                          values={
                                            learning.values
                                          }
                                          onChange={(
                                            partId,
                                            value,
                                          ) =>
                                            updateGlobalLearningValue(
                                              learning.id,
                                              partId,
                                              value,
                                            )
                                          }
                                        />
                                      </div>
                                    )}

                                    <div className="flex justify-end">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() =>
                                          removeGlobalLearning(
                                            learning.id,
                                          )
                                        }
                                      >
                                        Remove Learning
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STUDENTS */}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                      selectAllGlobalStudents
                    }
                  >
                    Select All
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                      clearGlobalStudents
                    }
                  >
                    Clear
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-md border bg-background p-2">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {students.map(
                      (student) => (
                        <label
                          key={student.id}
                          className="
                            flex cursor-pointer
                            items-center gap-2
                            rounded-md border
                            bg-background p-3
                            text-sm
                            hover:bg-muted
                          "
                        >
                          <input
                            type="checkbox"
                            checked={globalStudents.includes(
                              student.id,
                            )}
                            onChange={() =>
                              toggleGlobalStudent(
                                student.id,
                              )
                            }
                            className="size-4 accent-primary"
                          />

                          <span className="truncate">
                            {student.name}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                {/* ASSIGN */}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        const learnings =
                          globalLearnings.map(
                            toGlobalLearningPayload,
                          );

                        await saveGlobalLearnings({
                          batchId,
                          batchName,
                          studentIds:
                            globalStudents,
                          learnings,
                        });

                        const saved =
                          globalLearnings.map(
                            (learning) => ({
                              ...learning,
                              saved: true,
                            }),
                          );

                        setProgress(
                          (current) => {
                            const updated = {
                              ...current,
                            };

                            for (const studentId of globalStudents) {
                              const existing =
                                updated[
                                  studentId
                                ]
                                  ?.learnings ??
                                [];

                              updated[
                                studentId
                              ] = {
                                ...updated[
                                  studentId
                                ],

                                learnings: [
                                  ...existing,
                                  ...saved,
                                ],
                              };
                            }

                            return updated;
                          },
                        );

                        setGlobalLearnings(
                          [],
                        );

                        setGlobalStudents(
                          [],
                        );

                        setExpandedGlobalLearnings(
                          {},
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save global learnings:",
                          error,
                        );

                        alert(
                          error instanceof Error
                            ? error.message
                            : "Failed to save global learnings.",
                        );
                      }
                    }}
                    disabled={
                      globalLearnings.length ===
                        0 ||
                      globalStudents.length ===
                        0 ||
                      globalLearnings.some(
                        (learning) =>
                          !learning.subject,
                      )
                    }
                  >
                    Assign Learning
                  </Button>
                </div>
              </CardContent>
            </Collapsible.Panel>
          </Card>
        </Collapsible.Root>

        {/* ======================================================
            STUDENT PROGRESS
        ====================================================== */}

        {progressLoading ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Loading progress...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-transparent shadow-none">

            <CardHeader className="px-0 pb-5">
              <div className="flex flex-col gap-4 px-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">
                    Student Progress
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Mark progress for individual students.
                  </p>
                </div>

                <div className="relative w-full md:w-72 lg:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    value={
                      studentProgressSearch
                    }
                    onChange={(event) =>
                      setStudentProgressSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search students..."
                    className="
                      h-10 w-full rounded-lg
                      border border-input
                      bg-background pl-9 pr-3
                      text-sm outline-none
                      placeholder:text-muted-foreground
                      focus:border-ring
                      focus:ring-2 focus:ring-ring
                    "
                  />
                </div>
              </div>

              {studentProgressSearch.trim() && (
                <div className="px-2 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {
                      filteredStudents.length
                    }{" "}
                    student
                    {filteredStudents.length !==
                    1
                      ? "s"
                      : ""}{" "}
                    found
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-2 p-0">

              {students.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No students are enrolled in this batch.
                  </p>
                </div>
              ) : filteredStudents.length ===
                0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <Search className="mx-auto mb-3 size-5 text-muted-foreground" />

                  <p className="text-sm font-medium">
                    No students found
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Try searching with a different name.
                  </p>
                </div>
              ) : (
                filteredStudents.map(
                  (student) => {
                    const data =
                      progress[
                        student.id
                      ];

                    const isLearningsExpanded =
                      expandedStudentLearnings[
                        student.id
                      ] ?? true;

                    return (
                      <div
                        key={student.id}
                      >
                        <div className="rounded-md border border-border/70 bg-muted/20 p-3">

                          {/* STUDENT HEADER */}

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {student.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  data.learnings
                                    .length
                                }{" "}
                                learning
                                {data.learnings
                                  .length !==
                                1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                addLearning(
                                  student,
                                )
                              }
                              disabled={
                                loadingSubjects ===
                                student.id
                              }
                            >
                              {loadingSubjects ===
                              student.id
                                ? "Loading..."
                                : "Add Learning"}
                            </Button>
                          </div>

                          {/* LEARNINGS */}

                          {data.learnings
                            .length > 0 && (
                            <div className="mt-3 rounded-md bg-background/70 px-2 py-2">

                              <button
                                type="button"
                                className="
                                  group flex w-full
                                  items-center
                                  justify-between gap-3
                                  border-b px-0 py-2
                                  text-left
                                  hover:bg-muted/50
                                "
                                onClick={() =>
                                  toggleStudentLearnings(
                                    student.id,
                                  )
                                }
                              >
                                <div>
                                  <p className="font-medium">
                                    Learnings
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {
                                      data
                                        .learnings
                                        .length
                                    }{" "}
                                    learning
                                    {data
                                      .learnings
                                      .length !==
                                    1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>

                                {isLearningsExpanded ? (
                                  <ChevronUp className="size-5" />
                                ) : (
                                  <ChevronDown className="size-5" />
                                )}
                              </button>

                              {isLearningsExpanded && (
                                <div className="space-y-2 py-2">
                                  {data.learnings.map(
                                    (
                                      learning,
                                    ) => {
                                      const key =
                                        `${student.id}-${learning.id}`;

                                      const isExpanded =
                                        expandedLearnings[
                                          key
                                        ] ??
                                        false;

                                      return (
                                        <div
                                          key={
                                            learning.id
                                          }
                                          className="overflow-visible rounded-lg border"
                                        >
                                          <button
                                            type="button"
                                            className="
                                              group flex w-full
                                              items-center
                                              justify-between
                                              gap-3 bg-background
                                              px-3 py-2.5
                                              text-left
                                              hover:bg-muted/50
                                            "
                                            onClick={() =>
                                              toggleLearning(
                                                student.id,
                                                learning.id,
                                              )
                                            }
                                          >
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                {learning.saved && (
                                                  <span className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium text-primary">
                                                    ✓ Saved
                                                  </span>
                                                )}
                                              </div>

                                              <p className="font-medium">
                                                {learning
                                                  .subject
                                                  ?.name ??
                                                  "Choose subject"}{" "}
                                                (
                                                {learning.status ||
                                                  "no status"}
                                                )
                                              </p>
                                            </div>

                                            {isExpanded ? (
                                              <ChevronUp className="size-5 shrink-0" />
                                            ) : (
                                              <ChevronDown className="size-5 shrink-0" />
                                            )}
                                          </button>

                                          {isExpanded && (
                                            <div className="space-y-3 px-3 py-2">

                                              {/* SUBJECT + STATUS */}

                                              <div className="grid gap-2 md:grid-cols-2">

                                                <div className="space-y-1">
                                                  <Label>
                                                    Subject
                                                  </Label>

                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full justify-start"
                                                    onClick={async () => {
                                                      setLoadingSubjects(
                                                        student.id,
                                                      );

                                                      try {
                                                        const commonSubjects =
                                                          await getCommonSubjects(
                                                            student.id,
                                                            batchId,
                                                          );

                                                        setSubjects(
                                                          commonSubjects,
                                                        );

                                                        setSubjectDialog(
                                                          {
                                                            studentId:
                                                              student.id,
                                                            learningId:
                                                              learning.id,
                                                          },
                                                        );
                                                      } finally {
                                                        setLoadingSubjects(
                                                          null,
                                                        );
                                                      }
                                                    }}
                                                  >
                                                    {learning
                                                      .subject
                                                      ?.name ??
                                                      "Choose Subject"}
                                                  </Button>
                                                </div>

                                                <div className="space-y-1">
                                                  <Label>
                                                    Status
                                                  </Label>

                                                  <Select
                                                    value={
                                                      learning.status
                                                    }
                                                    onValueChange={(
                                                      value,
                                                    ) =>
                                                      updateLearningStatus(
                                                        student.id,
                                                        learning.id,
                                                        value ?? "",
                                                      )
                                                    }
                                                    disabled={
                                                      !learning.subject ||
                                                      learning
                                                        .subject
                                                        .trackingTerms
                                                        .length ===
                                                        0
                                                    }
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue placeholder="Choose status" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                      {learning.subject?.trackingTerms.map(
                                                        (
                                                          term,
                                                        ) => (
                                                          <SelectItem
                                                            key={
                                                              term.id
                                                            }
                                                            value={
                                                              term.name
                                                            }
                                                          >
                                                            {
                                                              term.name
                                                            }
                                                          </SelectItem>
                                                        ),
                                                      )}
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </div>

                                              {/* RANGES */}

                                              {learning.subject && (
                                                <div className="space-y-2">
                                                  <p className="text-sm font-semibold">
                                                    Learning ranges
                                                  </p>

                                                  <SubjectTocRangeFields
                                                    parts={
                                                      learning
                                                        .subject
                                                        .parts
                                                    }
                                                    tocItems={
                                                      learning
                                                        .subject
                                                        .tocItems ??
                                                      []
                                                    }
                                                    values={
                                                      learning.values
                                                    }
                                                    onChange={(
                                                      partId,
                                                      value,
                                                    ) =>
                                                      updateLearningValue(
                                                        student.id,
                                                        learning.id,
                                                        partId,
                                                        value,
                                                      )
                                                    }
                                                  />
                                                </div>
                                              )}

                                              {/* REMOVE */}

                                              <div className="flex justify-end">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                  onClick={() =>
                                                    removeLearning(
                                                      student.id,
                                                      learning.id,
                                                    )
                                                  }
                                                >
                                                  Remove Learning
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUBMIT */}

                          <div className="mt-4 flex justify-end">
                            <Button
                              type="button"
                              onClick={() =>
                                submitStudent(
                                  student,
                                )
                              }
                              disabled={
                                data.learnings.length ===
                                0
                              }
                            >
                              Submit
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-4" />
                      </div>
                    );
                  },
                )
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================
          GLOBAL SUBJECT DIALOG
      ======================================================== */}

      <Dialog
        open={
          globalSubjectDialog !==
          null
        }
        onOpenChange={(open) => {
          if (!open) {
            setGlobalSubjectDialog(
              null,
            );
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Choose Subject
            </DialogTitle>

            <DialogDescription>
              Choose the subject for this learning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {globalSubjects.map(
              (subject) => (
                <Button
                  key={subject.id}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start py-3"
                  onClick={() => {
                    if (
                      !globalSubjectDialog
                    ) {
                      return;
                    }

                    updateGlobalLearningSubject(
                      globalSubjectDialog.learningId,
                      subject,
                    );

                    setGlobalSubjectDialog(
                      null,
                    );
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">
                      {subject.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {subject.parts
                        .map(
                          (part) =>
                            part.name,
                        )
                        .join(" → ")}
                    </p>
                  </div>
                </Button>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          STUDENT SUBJECT DIALOG
      ======================================================== */}

      <Dialog
        open={subjectDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSubjectDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Choose Subject
            </DialogTitle>

            <DialogDescription>
              Choose the subject for this learning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {subjects.map(
              (subject) => (
                <Button
                  key={subject.id}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start py-3"
                  onClick={() => {
                    if (!subjectDialog) {
                      return;
                    }

                    updateLearningSubject(
                      subjectDialog.studentId,
                      subjectDialog.learningId,
                      subject,
                    );

                    setSubjectDialog(
                      null,
                    );
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">
                      {subject.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {subject.parts
                        .map(
                          (part) =>
                            part.name,
                        )
                        .join(" → ")}
                    </p>
                  </div>
                </Button>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}