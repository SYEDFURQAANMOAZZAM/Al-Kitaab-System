"use client";
import { Collapsible } from "@base-ui/react/collapsible";
import { submitProgress } from "@/app/ServerActions/progress/progress";
import { useEffect, useState } from "react";
import { saveGlobalLearnings } from "@/app/ServerActions/progress/saveGlobalLearnings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { PatternTocRangeFields, type TocRange } from "@/components/PatternTocRangeFields";

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

import { Separator } from "@/components/ui/separator";

import { getCommonPatterns } from "@/app/ServerActions/progress/getCommonPatterns";
import { getBatchPatterns } from "@/app/ServerActions/progress/getBatchPatterns";
import { getTodayProgress } from "@/app/ServerActions/progress/getProgress";

type Student = {
  id: string;
  userId: string;
  name: string;
};

type PatternPart = {
  id: string;
  name: string;
  position: number;
};

type Pattern = {
  id: string;
  name: string;
  patternArr: PatternPart[];
  tocItems?: { id: string; name: string; parentId: string | null; patternArrId: string; position: number }[];
};

type Learning = {
  id: string;
  pattern: Pattern | null;
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
  statuses: string[];
};

export function ProgressForm({
  batchId,
  batchName,
  students,
  statuses,
}: ProgressFormProps) {
  const [progress, setProgress] = useState<
    Record<string, StudentProgress>
  >(() =>
    Object.fromEntries(
      students.map((student) => [
        student.id,
        {
          learnings: [],
        },
      ])
    )
  );

  const [globalPatterns, setGlobalPatterns] = useState<
  Awaited<ReturnType<typeof getBatchPatterns>>
>([]);

type GlobalLearning = {
  id: string;
  pattern: Pattern | null;
  status: string;
  values: Record<string, string | TocRange>;
};

const [globalLearnings, setGlobalLearnings] =
  useState<GlobalLearning[]>([]);

const [globalLearningsExpanded, setGlobalLearningsExpanded] =
  useState(true);

const [expandedGlobalLearnings, setExpandedGlobalLearnings] =
  useState<Record<string, boolean>>({});

const [globalPatternDialog, setGlobalPatternDialog] =
  useState<{
    learningId: string;
  } | null>(null);



const [loadingGlobalPatterns, setLoadingGlobalPatterns] =
  useState(false);

const [progressLoading, setProgressLoading] = useState(true);

  const [patterns, setPatterns] = useState<Pattern[]>(
    []
  );

  const [patternDialog, setPatternDialog] =
    useState<{
      studentId: string;
      learningId: string;
    } | null>(null);

  const [loadingPatterns, setLoadingPatterns] =
    useState<string | null>(null);

  

  const [globalStudents, setGlobalStudents] =
    useState<string[]>([]);

  /*
   * Controls individual Learning 1, Learning 2, etc.
   */
  const [expandedLearnings, setExpandedLearnings] =
    useState<Record<string, boolean>>({});

  /*
   * Controls the entire "Learnings" section
   * for each student.
   */
  const [expandedStudentLearnings, setExpandedStudentLearnings] =
    useState<Record<string, boolean>>(() =>
      Object.fromEntries(
        students.map((student) => [
          student.id,
          false,
        ])
      )
    );

  // ---------------------------------------------
  // Student helpers
  // ---------------------------------------------

  const updateStudentLearnings = (
    studentId: string,
    learnings: Learning[]
  ) => {
    setProgress((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        learnings,
      },
    }));
  };

  // ---------------------------------------------
  // Global learning
  // ---------------------------------------------

  const toggleGlobalStudent = (
    studentId: string
  ) => {
    setGlobalStudents((current) =>
      current.includes(studentId)
        ? current.filter(
            (id) => id !== studentId
          )
        : [...current, studentId]
    );
  };

  const selectAllGlobalStudents = () => {
    setGlobalStudents(
      students.map((student) => student.id)
    );
  };

  const clearGlobalStudents = () => {
    setGlobalStudents([]);
  };

  // ---------------------------------------------
  // Learning helpers
  // ---------------------------------------------

  const createLearningId = () => {
    if (
      typeof crypto !== "undefined" &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
  };

  /*
   * Toggle individual learning.
   *
   * Example:
   * Learning 1
   * Learning 2
   */
  const toggleLearning = (
    studentId: string,
    learningId: string
  ) => {
    const key = `${studentId}-${learningId}`;

    setExpandedLearnings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /*
   * Toggle the complete "Learnings" section
   * for one student.
   */
  const toggleStudentLearnings = (
    studentId: string
  ) => {
    setExpandedStudentLearnings((current) => ({
      ...current,
      [studentId]:
        !current[studentId],
    }));
  };

  const addLearning = async (
    student: Student
  ) => {
    setLoadingPatterns(student.id);

    try {
      const commonPatterns =
        await getCommonPatterns(
          student.id,
          batchId
        );

      if (commonPatterns.length === 0) {
        alert(
          "This student has no pattern in common with this batch."
        );
        return;
      }

      const learningId = createLearningId();

      const newLearning: Learning = {
  id: learningId,
  pattern: null,
  status: statuses[0] ?? "",
  values: {},
  saved: false,
};

      const currentLearnings =
        progress[student.id]?.learnings ?? [];

      updateStudentLearnings(student.id, [
        ...currentLearnings,
        newLearning,
      ]);

      /*
       * Make sure the student's Learnings section
       * is open when adding a new learning.
       */
      setExpandedStudentLearnings(
        (current) => ({
          ...current,
          [student.id]: true,
        })
      );

      /*
       * Open the newly-created individual learning.
       */
      setExpandedLearnings((current) => ({
        ...current,
        [`${student.id}-${learningId}`]:
          true,
      }));

      /*
       * Only one possible pattern.
       */
      if (commonPatterns.length === 1) {
        updateLearningPattern(
          student.id,
          learningId,
          commonPatterns[0]
        );

        return;
      }

      /*
       * Multiple patterns.
       */
      setPatterns(commonPatterns);

      setPatternDialog({
        studentId: student.id,
        learningId,
      });
    } finally {
      setLoadingPatterns(null);
    }
  };

  const updateLearningPattern = (
    studentId: string,
    learningId: string,
    pattern: Pattern
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
                    pattern,
                    values: {},
                  }
                : learning
          ),
      },
    }));
  };

  const selectPattern = (
    pattern: Pattern
  ) => {
    if (!patternDialog) return;

    updateLearningPattern(
      patternDialog.studentId,
      patternDialog.learningId,
      pattern
    );

    setPatternDialog(null);
  };

  const updateLearningStatus = (
    studentId: string,
    learningId: string,
    status: string
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
                : learning
          ),
      },
    }));
  };

  const updateLearningValue = (
    studentId: string,
    learningId: string,
    partId: string,
    value: string | TocRange
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
                : learning
          ),
      },
    }));
  };

  const removeLearning = (
    studentId: string,
    learningId: string
  ) => {
    setProgress((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        learnings:
          current[studentId].learnings.filter(
            (learning) =>
              learning.id !== learningId
          ),
      },
    }));

    /*
     * Remove its expanded state as well.
     */
    setExpandedLearnings((current) => {
      const next = { ...current };

      delete next[
        `${studentId}-${learningId}`
      ];

      return next;
    });
  };

  // ---------------------------------------------
  // Submit
  // ---------------------------------------------

 const submitStudent = async (student: Student) => {
  const data = progress[student.id];

  const learnings = data.learnings.map((learning) => ({
    learningId: learning.id,

    pattern: learning.pattern
      ? {
          id: learning.pattern.id,
          name: learning.pattern.name,
        }
      : null,

    status: learning.status,

    parts: learning.pattern
      ? learning.pattern.patternArr.map((part) => ({
          id: part.id,
          name: part.name,
          position: part.position,
          value: learning.values[part.id] ?? "",
        }))
      : [],
  }));

  console.log("SUBMITTING:", {
    studentId: student.id,
    batchId,
    batchName,
    learnings,
  });

  try {
    const result = await submitProgress({
      studentId: student.id,
      batchId,
      batchName,
      learnings,
    });

    console.log("SERVER RESULT:", result);

    // Mark the submitted learnings as saved
    setProgress((current) => ({
      ...current,
      [student.id]: {
        ...current[student.id],
        learnings:
          current[student.id].learnings.map(
            (learning) => ({
              ...learning,
              saved: true,
            })
          ),
      },
    }));
  } catch (error) {
    console.error("SUBMIT ERROR:", error);
  }
};


useEffect(() => {
  const loadTodayProgress = async () => {
    try {
      const savedProgress = await getTodayProgress(batchId);

      setProgress((current) => {
        const next = { ...current };

        for (const saved of savedProgress) {
          if (!saved.learnings) continue;

          const savedLearnings = Array.isArray(
            saved.learnings
          )
            ? saved.learnings
            : [];

          const learnings: Learning[] =
            savedLearnings.map((learning: any) => ({
              id: learning.learningId,

              pattern: learning.pattern
                ? {
                    id: learning.pattern.id,
                    name: learning.pattern.name,

                    patternArr: (
                      learning.parts ?? []
                    ).map((part: any) => ({
                      id: part.id,
                      name: part.name,
                      position: part.position,
                      })),
                    tocItems: learning.pattern.tocItems ?? [],
                  }
                : null,

              status: learning.status,

              values: Object.fromEntries(
                (learning.parts ?? []).map(
                  (part: any) => [
                    part.id,
                    part.value ?? "",
                  ]
                )
              ),
              saved:true,
            }));

          next[saved.studentId] = {
            ...next[saved.studentId],
            learnings,
          };
        }

        return next;
      });
    } catch (error) {
      console.error(
        "Failed to load today's progress:",
        error
      );
    } finally {
      setProgressLoading(false);
    }
  };

  loadTodayProgress();
}, [batchId]);

  return (
    <>
      <div className="space-y-4 px-3 sm:px-4 lg:px-6">

        {/* ---------------------------------- */}
        {/* Header */}
        {/* ---------------------------------- */}

        <div>
          <h1 className="text-2xl font-semibold">
            Mark Progress
          </h1>

          <p className="text-sm text-muted-foreground">
            {batchName}
          </p>
        </div>

        {/* ---------------------------------- */}
        {/* Global Learning */}
        {/* ---------------------------------- */}

 <Collapsible.Root defaultOpen={false}>
  <Card className="overflow-hidden border-0 bg-transparent p-0 shadow-none">

    {/* Global Learning Header */}
    <Collapsible.Trigger
      className="
        group
        flex w-full
        items-center justify-between
        gap-3
        px-4 py-3
        text-left
        outline-none
        transition-colors
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
          h-4 w-4
          shrink-0
          text-muted-foreground
          transition-transform
          duration-200
          group-data-[panel-open]:rotate-180
        "
      />
    </Collapsible.Trigger>

    <Collapsible.Panel>
      <CardContent className="space-y-3 border-t px-3 py-2 sm:px-4">

        {/* ---------------------------------- */}
        {/* Global Learning Header */}
        {/* ---------------------------------- */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">
            <p className="font-medium">
              Global Learnings
            </p>

            <p className="text-xs text-muted-foreground">
              {globalLearnings.length}{" "}
              learning
              {globalLearnings.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          {/* Add Learning */}
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setLoadingGlobalPatterns(true);

              try {
                const batchPatterns =
                  await getBatchPatterns(batchId);

                if (batchPatterns.length === 0) {
                  alert(
                    "This batch has no patterns."
                  );
                  return;
                }

                const learningId =
                  createLearningId();

                const newLearning = {
                  id: learningId,
                  pattern: null,
                  status: statuses[0] ?? "",
                  values: {},
                };

                setGlobalLearnings((current) => [
                  ...current,
                  newLearning,
                ]);

                /*
                 * Open the Learnings section.
                 */
                setGlobalLearningsExpanded(true);

                /*
                 * Open the newly-created learning.
                 */
                setExpandedGlobalLearnings(
                  (current) => ({
                    ...current,
                    [learningId]: true,
                  })
                );

                /*
                 * If there is only one pattern,
                 * select it automatically.
                 */
                if (batchPatterns.length === 1) {
                  setGlobalLearnings((current) =>
                    current.map((learning) =>
                      learning.id === learningId
                        ? {
                            ...learning,
                            pattern:
                              batchPatterns[0],
                          }
                        : learning
                    )
                  );

                  return;
                }

                /*
                 * Multiple patterns.
                 */
                setGlobalPatterns(
                  batchPatterns
                );

                setGlobalPatternDialog({
                  learningId,
                });
              } finally {
                setLoadingGlobalPatterns(false);
              }
            }}
            disabled={loadingGlobalPatterns}
          >
            {loadingGlobalPatterns
              ? "Loading..."
              : "Add Learning"}
          </Button>
        </div>

        {/* ---------------------------------- */}
        {/* Learnings Collapsible */}
        {/* ---------------------------------- */}

        {globalLearnings.length > 0 && (
          <div className="mt-3">

            {/* Learnings Header */}
            <button
              type="button"
              className="
                group
                flex w-full
                items-center justify-between
                gap-3
                border-b px-0 py-2
                text-left
                transition-colors
                hover:bg-muted/50
              "
              onClick={() =>
                setGlobalLearningsExpanded(
                  (current) => !current
                )
              }
            >
              <div>
                <p className="font-medium">
                  Learnings
                </p>

                <p className="text-xs text-muted-foreground">
                  {globalLearnings.length}{" "}
                  learning
                  {globalLearnings.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              {globalLearningsExpanded ? (
                <ChevronUp
                  className="
                    h-5 w-5
                    shrink-0
                    transition-all
                    duration-200
                    group-hover:scale-110
                    group-hover:text-primary
                  "
                />
              ) : (
                <ChevronDown
                  className="
                    h-5 w-5
                    shrink-0
                    transition-all
                    duration-200
                    group-hover:scale-110
                    group-hover:text-primary
                  "
                />
              )}
            </button>

            {/* Learnings Content */}
            {globalLearningsExpanded && (
              <div className="space-y-2 py-2">

                {globalLearnings.map(
                  (learning, learningIndex) => {
                    const isExpanded =
                      expandedGlobalLearnings[
                        learning.id
                      ] ?? false;

                    return (
                      <div
                        key={`${learning.id}-${learningIndex}`}
                        className="
                          overflow-hidden
                          rounded-lg
                          border
                        "
                      >

                        {/* -------------------------------- */}
                        {/* Learning Header */}
                        {/* -------------------------------- */}

                        <button
                          type="button"
                          className="
                            group
                            flex w-full
                            items-center justify-between
                            gap-3
                            bg-background
                            px-3 py-2.5
                            text-left
                            transition-colors
                            hover:bg-muted/50
                          "
                          onClick={() =>
                            setExpandedGlobalLearnings(
                              (current) => ({
                                ...current,
                                [learning.id]:
                                  !current[
                                    learning.id
                                  ],
                              })
                            )
                          }
                        >
                          <div className="min-w-0">

                            {/* <p className="font-medium">
                              Learning{" "}
                              {learningIndex + 1}
                            </p> */}

                            <p className="font-medium">
                              {learning.pattern
                                ?.name ??
                                "Choose pattern"}
                              {"   "}
                              ({learning.status.toLowerCase()})
                            </p>

                          </div>

                          {isExpanded ? (
                            <ChevronUp
                              className="
                                h-5 w-5
                                shrink-0
                                transition-all
                                duration-200
                                group-hover:scale-110
                                group-hover:text-primary
                              "
                            />
                          ) : (
                            <ChevronDown
                              className="
                                h-5 w-5
                                shrink-0
                                transition-all
                                duration-200
                                group-hover:scale-110
                                group-hover:text-primary
                              "
                            />
                          )}
                        </button>

                        {/* -------------------------------- */}
                        {/* Learning Content */}
                        {/* -------------------------------- */}

                        {isExpanded && (
                          <div className="space-y-2 px-3 py-2">

                            

                            {/* Pattern + Status */}
                            <div className="grid gap-2 md:grid-cols-2">

                              {/* Pattern */}
                              <div className="space-y-1">
                                <Label>
                                  Pattern
                                </Label>

                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={async () => {
                                    setLoadingGlobalPatterns(
                                      true
                                    );

                                    try {
                                      const batchPatterns =
                                        await getBatchPatterns(
                                          batchId
                                        );

                                      setGlobalPatterns(
                                        batchPatterns
                                      );

                                      setGlobalPatternDialog(
                                        {
                                          learningId:
                                            learning.id,
                                        }
                                      );
                                    } finally {
                                      setLoadingGlobalPatterns(
                                        false
                                      );
                                    }
                                  }}
                                  disabled={
                                    loadingGlobalPatterns
                                  }
                                >
                                  {learning.pattern
                                    ? learning
                                        .pattern
                                        .name
                                    : "Choose Pattern"}
                                </Button>
                              </div>

                              {/* Status */}
                              <div className="space-y-1">
                                <Label>
                                  Status
                                </Label>

                                <Select
                                  value={
                                    learning.status
                                  }
                                  onValueChange={(
                                    value
                                  ) => {
                                    if (!value)
                                      return;

                                    setGlobalLearnings(
                                      (current) =>
                                        current.map(
                                          (item) =>
                                            item.id ===
                                            learning.id
                                              ? {
                                                  ...item,
                                                  status:
                                                    value,
                                                }
                                              : item
                                        )
                                    );
                                  }}
                                >
                                  <SelectTrigger className={learning.status === "SABAQ" ? "border-secondary bg-secondary text-secondary-foreground" : learning.status === "PARASABAQ" ? "border-accent bg-accent text-accent-foreground" : "border-border bg-muted text-muted-foreground"}>
                                    <SelectValue />
                                  </SelectTrigger>

                                  <SelectContent>
                                    {statuses.map(
                                      (status) => (
                                        <SelectItem
                                          key={status}
                                          value={status}
                                          className={status === "SABAQ" ? "text-secondary-foreground" : status === "PARASABAQ" ? "text-accent-foreground" : "text-muted-foreground"}
                                        >
                                          {status.toLowerCase()}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>

                            </div>

                            {/* Learning ranges */}
                            {learning.pattern && (
                                    <div className="space-y-2">

                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">Learning ranges</p>
                                </div>

                                <PatternTocRangeFields parts={learning.pattern.patternArr} tocItems={learning.pattern.tocItems} values={learning.values} onChange={(partId, value) => setGlobalLearnings(current => current.map(item => item.id === learning.id ? { ...item, values: { ...item.values, [partId]: value } } : item))} />
                              </div>
                            )}

                            {/* Remove */}
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                className="
                                  text-destructive
                                  transition-colors
                                  hover:bg-destructive/10
                                  hover:text-destructive
                                "
                                onClick={() => {
                                  setGlobalLearnings(
                                    (current) =>
                                      current.filter(
                                        (item) =>
                                          item.id !==
                                          learning.id
                                      )
                                  );

                                  setExpandedGlobalLearnings(
                                    (current) => {
                                      const next = {
                                        ...current,
                                      };

                                      delete next[
                                        learning.id
                                      ];

                                      return next;
                                    }
                                  );
                                }}
                              >
                                Remove Learning
                              </Button>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  }
                )}

              </div>
            )}
          </div>
        )}

        {/* ---------------------------------- */}
        {/* Student Selection */}
        {/* ---------------------------------- */}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllGlobalStudents}
          >
            Select All
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearGlobalStudents}
          >
            Clear
          </Button>
        </div>

        <div
          className="
            max-h-64
            overflow-y-auto
            rounded-md
            border
            bg-background
            p-2
          "
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <label
                key={student.id}
                className="
                  flex cursor-pointer
                  items-center gap-2
                  rounded-md
                  border
                  bg-background
                  p-3
                  text-sm
                  transition-colors
                  hover:bg-muted
                "
              >
                <input
                  type="checkbox"
                  checked={globalStudents.includes(
                    student.id
                  )}
                  onChange={() =>
                    toggleGlobalStudent(
                      student.id
                    )
                  }
                  className="size-4 accent-primary"
                />

                <span className="truncate">
                  {student.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Assign */}
        <div className="flex justify-end">
  <Button
  type="button"
  onClick={async () => {
    try {
      const result = await saveGlobalLearnings({
        batchId,
        batchName,
        studentIds: globalStudents,
        learnings: globalLearnings,
      });

      console.log(
        "GLOBAL LEARNINGS SAVED:",
        result
      );

      // These learnings have now been successfully
      // saved to the database.
      const savedGlobalLearnings =
        globalLearnings.map((learning) => ({
          ...learning,
          saved: true,
        }));

      // Add the saved global learnings to the
      // currently displayed progress for every
      // selected student.
      setProgress((current) => {
        const updated = { ...current };

        for (const studentId of globalStudents) {
          const existing =
            updated[studentId]?.learnings ?? [];

          updated[studentId] = {
            ...updated[studentId],
            learnings: [
              ...existing,
              ...savedGlobalLearnings,
            ],
          };
        }

        return updated;
      });

      // Clear global form
      setGlobalLearnings([]);
      setGlobalStudents([]);
      setExpandedGlobalLearnings({});
      setGlobalLearningsExpanded(true);

    } catch (error) {
      console.error(
        "Failed to save global learnings:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save global learnings."
      );
    }
  }}
  disabled={
    globalLearnings.length === 0 ||
    globalStudents.length === 0
  }
>
  Assign Learning
</Button>
</div>

      </CardContent>
    </Collapsible.Panel>
  </Card>
</Collapsible.Root>

{/* ---------------------------------- */}
{/* Global Pattern Selection Dialog */}
{/* ---------------------------------- */}

<Dialog
  open={globalPatternDialog !== null}
  onOpenChange={(open) => {
    if (!open) {
      setGlobalPatternDialog(null);
    }
  }}
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Choose Pattern
      </DialogTitle>

      <DialogDescription>
        Choose the pattern for this learning.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-2">
      {globalPatterns.map((pattern) => (
        <Button
          key={pattern.id}
          type="button"
          variant="outline"
          className="h-auto w-full justify-start py-3"
          onClick={() => {
            if (!globalPatternDialog)
              return;

            setGlobalLearnings(
              (current) =>
                current.map((learning) =>
                  learning.id ===
                  globalPatternDialog.learningId
                    ? {
                        ...learning,
                        pattern,
                        values: {},
                      }
                    : learning
                )
            );

            setGlobalPatternDialog(null);
          }}
        >
          <div className="text-left">
            <p className="font-medium">
              {pattern.name}
            </p>

            <p className="text-xs text-muted-foreground">
              {pattern.patternArr
                .map((part) => part.name)
                .join(" → ")}
            </p>
          </div>
        </Button>
      ))}
    </div>
  </DialogContent>
</Dialog>

        {/* ---------------------------------- */}
        {/* Students */}
        {/* ---------------------------------- */}
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
  <CardHeader>
    <CardTitle>Student Progress</CardTitle>
  </CardHeader>

  <CardContent className="space-y-2 p-0">
    {students.length === 0 ? (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No students are enrolled in this batch.
        </p>
      </div>
    ) : (
      students.map((student, index) => {
        const data = progress[student.id];

        const isLearningsExpanded =
          expandedStudentLearnings[student.id] ?? true;

        return (
          <div key={student.id}>
            <div className="rounded-md border border-border/70 bg-muted/20 p-3">

              {/* Student Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {student.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {data.learnings.length}{" "}
                    learning
                    {data.learnings.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    addLearning(student)
                  }
                  disabled={
                    loadingPatterns === student.id
                  }
                >
                  {loadingPatterns === student.id
                    ? "Loading..."
                    : "Add Learning"}
                </Button>
              </div>

              {/* Learnings */}
              {data.learnings.length > 0 && (
                <div className="mt-3 rounded-md bg-background/70 px-2 py-2">

                  {/* Learnings Header */}
                  <button
                    type="button"
                    className="
                      group flex w-full
                      items-center justify-between
                      gap-3
                      border-b px-0 py-2
                      text-left
                      transition-colors
                      hover:bg-muted/50
                    "
                    onClick={() =>
                      toggleStudentLearnings(
                        student.id
                      )
                    }
                  >
                    <div>
                      <p className="font-medium">
                        Learnings
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {data.learnings.length}{" "}
                        learning
                        {data.learnings.length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    {isLearningsExpanded ? (
                      <ChevronUp
                        className="
                          h-5 w-5 shrink-0
                          transition-all duration-200
                          group-hover:scale-110
                          group-hover:text-primary
                        "
                      />
                    ) : (
                      <ChevronDown
                        className="
                          h-5 w-5 shrink-0
                          transition-all duration-200
                          group-hover:scale-110
                          group-hover:text-primary
                        "
                      />
                    )}
                  </button>

                  {/* Individual Learnings */}
                  {isLearningsExpanded && (
                    <div className="space-y-2 py-2">

                      {data.learnings.map(
                        (
                          learning,
                          learningIndex
                        ) => {
                          const key =
                            `${student.id}-${learning.id}`;

                          const isExpanded =
                            expandedLearnings[key] ??
                            false;

                          return (
                            <div
                              key={`${learning.id}-${learningIndex}`}
                              className="
                                overflow-hidden
                                rounded-lg
                                border
                              "
                            >

                              {/* Learning Header */}
                              <button
                                type="button"
                                className="
                                  group flex w-full
                                  items-center justify-between
                                  gap-3
                                  bg-background
                                  px-3 py-2.5
                                  text-left
                                  transition-colors
                                  hover:bg-muted/50
                                "
                                onClick={() =>
                                  toggleLearning(
                                    student.id,
                                    learning.id
                                  )
                                }
                              >
                                <div className="min-w-0">

                                  {/* Learning name + saved indicator */}
                                  <div className="flex items-center gap-2">
                                    {/* <p className="font-medium">
                                      Learning{" "}
                                      {learningIndex + 1}
                                    </p> */}

                                    {learning.saved && (
                                      <span
                                        className="
                                          inline-flex
                                          items-center
                                          rounded-full
                                          border
                                          px-2 py-0.5
                                          text-[11px]
                                          font-medium
                                          text-primary
                                        "
                                      >
                                        ✓ Saved
                                      </span>
                                    )}
                                  </div>

                                  {/* Pattern + Status */}
                                  <p className="font-medium">
                                    {learning.pattern?.name ??
                                      "Choose pattern"}
                                    {"   "}
                                    ({learning.status.toLowerCase()})
                                  </p>
                                </div>

                                {isExpanded ? (
                                  <ChevronUp
                                    className="
                                      h-5 w-5 shrink-0
                                      transition-all duration-200
                                      group-hover:scale-110
                                      group-hover:text-primary
                                    "
                                  />
                                ) : (
                                  <ChevronDown
                                    className="
                                      h-5 w-5 shrink-0
                                      transition-all duration-200
                                      group-hover:scale-110
                                      group-hover:text-primary
                                    "
                                  />
                                )}
                              </button>

                              {/* Learning Content */}
                              {isExpanded && (
                                <div className="space-y-2 px-3 py-2">

                                  {/* Pattern + Status */}
                                  <div className="grid gap-2 md:grid-cols-2">

                                    {/* Pattern */}
                                    <div className="space-y-1">
                                      <Label>
                                        Pattern
                                      </Label>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={async () => {
                                          setLoadingPatterns(
                                            student.id
                                          );

                                          try {
                                            const commonPatterns =
                                              await getCommonPatterns(
                                                student.id,
                                                batchId
                                              );

                                            setPatterns(
                                              commonPatterns
                                            );

                                            setPatternDialog({
                                              studentId:
                                                student.id,
                                              learningId:
                                                learning.id,
                                            });
                                          } finally {
                                            setLoadingPatterns(
                                              null
                                            );
                                          }
                                        }}
                                        disabled={
                                          loadingPatterns ===
                                          student.id
                                        }
                                      >
                                        {learning.pattern
                                          ? learning.pattern.name
                                          : "Choose Pattern"}
                                      </Button>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1">
                                      <Label>
                                        Status
                                      </Label>

                                      <Select
                                        value={
                                          learning.status
                                        }
                                        onValueChange={(
                                          value
                                        ) => {
                                          if (!value)
                                            return;

                                          updateLearningStatus(
                                            student.id,
                                            learning.id,
                                            value
                                          );
                                        }}
                                      >
                                        <SelectTrigger className={learning.status === "SABAQ" ? "border-secondary bg-secondary text-secondary-foreground" : learning.status === "PARASABAQ" ? "border-accent bg-accent text-accent-foreground" : "border-border bg-muted text-muted-foreground"}>
                                          <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent>
                                          {statuses.map(
                                            (status) => (
                                              <SelectItem
                                                key={status}
                                                value={status}
                                              >
                                                {status.toLowerCase()}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Pattern TOC ranges */}
                                  {learning.pattern && (
                                    <div className="space-y-2">

                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold">Learning ranges</p>

                                        {learning.saved && <span className="text-xs font-medium text-primary">✓ Saved</span>}
                                      </div>

                                      <PatternTocRangeFields
                                        parts={learning.pattern.patternArr}
                                        tocItems={learning.pattern.tocItems}
                                        values={learning.values}
                                        onChange={(partId, value) => updateLearningValue(student.id, learning.id, partId, value)}
                                      />
                                    </div>
                                  )}

                                  {/* Remove */}
                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="
                                        text-destructive
                                        transition-colors
                                        hover:bg-destructive/10
                                        hover:text-destructive
                                      "
                                      onClick={() =>
                                        removeLearning(
                                          student.id,
                                          learning.id
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
                        }
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="mt-4 flex justify-end">
                <Button
                  type="submit"
                  onClick={() =>
                    submitStudent(student)
                  }
                >
                  Submit
                </Button>
              </div>

            </div>

            {index !== students.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        );
      })
    )}
  </CardContent>
</Card>
)}

      </div>

      {/* ---------------------------------- */}
      {/* Pattern Selection Dialog */}
      {/* ---------------------------------- */}

      <Dialog
        open={patternDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPatternDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Choose Pattern
            </DialogTitle>

            <DialogDescription>
              Choose the pattern for this
              learning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {patterns.map((pattern) => (
              <Button
                key={pattern.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start py-3"
                onClick={() =>
                  selectPattern(pattern)
                }
              >
                <div className="text-left">
                  <p className="font-medium">
                    {pattern.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {pattern.patternArr
                      .map(
                        (part) => part.name
                      )
                      .join(" → ")}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
