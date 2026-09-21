"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";

import { saveTocCompletion } from "./toctracking";

/* ============================================================
   TYPES
============================================================ */

type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

type GlobalLearning = {
  id: string;

  subject: {
    id: string;
    name: string;
    parts: SubjectPart[];
  } | null;

  status: string;

  values: Record<
    string,
    string | { from: string; to?: string }
  >;
};

type ProgressLearningForStorage = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    subjectPart: string;

    value:
      | string
      | {
          from: string;
          to?: string;
        };
  }[];
};

type TocTrackingLearning = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    id: string;
    name: string;
    position: number;

    value:
      | string
      | {
          from: string;
          to?: string;
        };
  }[];
};

type SaveGlobalLearningsInput = {
  batchId: string;
  batchName: string;
  studentIds: string[];
  learnings: GlobalLearning[];
};

/* ============================================================
   PREPARE GLOBAL LEARNINGS FOR PROGRESS STORAGE
============================================================ */

async function prepareGlobalLearnings(
  learnings: GlobalLearning[],
): Promise<ProgressLearningForStorage[]> {
  /* ==========================================================
     COLLECT SUBJECT PART IDS
  ========================================================== */

  const subjectPartIds = [
    ...new Set(
      learnings.flatMap(
        (learning) =>
          learning.subject?.parts.map(
            (part) => part.id,
          ) ?? [],
      ),
    ),
  ];

  /* ==========================================================
     COLLECT TOC IDS
  ========================================================== */

  const tocItemIds = [
    ...new Set(
      learnings.flatMap((learning) =>
        Object.values(learning.values).flatMap(
          (value) => {
            if (typeof value === "string") {
              return value ? [value] : [];
            }

            return [
              value.from,
              ...(value.to
                ? [value.to]
                : []),
            ];
          },
        ),
      ),
    ),
  ];

  /* ==========================================================
     FETCH SUBJECT PARTS
  ========================================================== */

  const subjectParts =
    subjectPartIds.length > 0
      ? await prisma.subjectPart.findMany({
          where: {
            id: {
              in: subjectPartIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  /* ==========================================================
     FETCH TOC ITEMS
  ========================================================== */

  const tocItems =
    tocItemIds.length > 0
      ? await prisma.subjectTocItem.findMany({
          where: {
            id: {
              in: tocItemIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  /* ==========================================================
     MAPS
  ========================================================== */

  const subjectPartMap = new Map(
    subjectParts.map((part) => [
      part.id,
      part.name,
    ]),
  );

  const tocMap = new Map(
    tocItems.map((item) => [
      item.id,
      item.name,
    ]),
  );

  /* ==========================================================
     BUILD READABLE LEARNINGS
  ========================================================== */

  return learnings.map((learning) => {
    if (!learning.subject) {
      return {
        learningId: learning.id,
        subject: null,
        status: learning.status,
        parts: [],
      };
    }

    return {
      learningId: learning.id,

      subject: {
        id: learning.subject.id,
        name: learning.subject.name,
      },

      status: learning.status,

      parts: learning.subject.parts.map(
        (part) => {
          const subjectPartName =
            subjectPartMap.get(part.id);

          if (!subjectPartName) {
            throw new Error(
              `Subject part not found: ${part.id}`,
            );
          }

          const value =
            learning.values[part.id] ?? "";

          /* --------------------------------------------
             SIMPLE VALUE
          -------------------------------------------- */

          if (typeof value === "string") {
            return {
              subjectPart: subjectPartName,

              value: value
                ? tocMap.get(value) ?? value
                : "",
            };
          }

          /* --------------------------------------------
             RANGE VALUE
          -------------------------------------------- */

          const fromName = value.from
            ? tocMap.get(value.from)
            : undefined;

          const toName = value.to
            ? tocMap.get(value.to)
            : undefined;

          if (
            value.from &&
            !fromName
          ) {
            throw new Error(
              `TOC item not found: ${value.from}`,
            );
          }

          if (
            value.to &&
            !toName
          ) {
            throw new Error(
              `TOC item not found: ${value.to}`,
            );
          }

          return {
            subjectPart: subjectPartName,

            value: {
              from: fromName ?? "",
              ...(toName
                ? { to: toName }
                : {}),
            },
          };
        },
      ),
    };
  });
}

/* ============================================================
   CONVERT GLOBAL LEARNING → TOC TRACKING LEARNING
============================================================ */

function prepareGlobalLearningsForToc(
  learnings: GlobalLearning[],
): TocTrackingLearning[] {
  return learnings
    .filter((learning) => learning.subject)
    .map((learning) => ({
      learningId: learning.id,

      subject: learning.subject
        ? {
            id: learning.subject.id,
            name: learning.subject.name,
          }
        : null,

      status: learning.status,

      parts:
        learning.subject?.parts.map(
          (part) => ({
            id: part.id,
            name: part.name,
            position: part.position,
            value:
              learning.values[part.id] ?? "",
          }),
        ) ?? [],
    }));
}

/* ============================================================
   SAVE GLOBAL LEARNINGS
============================================================ */

export async function saveGlobalLearnings(
  data: SaveGlobalLearningsInput,
) {
  /* ==========================================================
     AUTHORIZATION
  ========================================================== */

  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  await requireRole(
    "TEACHER",
    "ADMIN",
  );

  /* ==========================================================
     VALIDATION
  ========================================================== */

  if (data.studentIds.length === 0) {
    throw new Error(
      "No students selected.",
    );
  }

  if (data.learnings.length === 0) {
    throw new Error(
      "No learnings provided.",
    );
  }

  /* ==========================================================
     TODAY IN IST
  ========================================================== */

  const indiaDate =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const today = new Date(
    `${indiaDate}T00:00:00.000Z`,
  );

  /* ==========================================================
     PREPARE READABLE PROGRESS DATA
  ========================================================== */

  const newLearnings =
    await prepareGlobalLearnings(
      data.learnings,
    );

  /* ==========================================================
     PREPARE DATA FOR TOC TRACKING
  ========================================================== */

  const tocTrackingLearnings =
    prepareGlobalLearningsForToc(
      data.learnings,
    );

  /* ==========================================================
     SAVE FOR ALL SELECTED STUDENTS
  ========================================================== */

  const results = await prisma.$transaction(
    async (tx) => {
      const savedProgress = [];

      for (const studentId of data.studentIds) {
        /* ====================================================
           SAVE PROGRESS
        ==================================================== */

        const existingProgress =
          await tx.progress.findUnique({
            where: {
              studentId_date_batchId: {
                studentId,
                batchId: data.batchId,
                date: today,
              },
            },

            select: {
              id: true,
              learnings: true,
            },
          });

        /* ====================================================
           NO PROGRESS YET
        ==================================================== */

        if (!existingProgress) {
          const created =
            await tx.progress.create({
              data: {
                studentId,
                batchId: data.batchId,
                batchname: data.batchName,
                date: today,
                learnings: newLearnings,
              },
            });

          savedProgress.push(created);
        } else {
          /* ==================================================
             EXISTING PROGRESS
          ================================================== */

          const existingLearnings =
            Array.isArray(
              existingProgress.learnings,
            )
              ? existingProgress.learnings
              : [];

          const updatedLearnings = [
            ...existingLearnings,
            ...newLearnings,
          ];

          const updated =
            await tx.progress.update({
              where: {
                id: existingProgress.id,
              },

              data: {
                batchname: data.batchName,
                learnings: updatedLearnings,
              },
            });

          savedProgress.push(updated);
        }

        /* ====================================================
           FIND STUDENT'S SUBJECTS
        ==================================================== */

        const subjectIds = [
          ...new Set(
            tocTrackingLearnings
              .map(
                (learning) =>
                  learning.subject?.id,
              )
              .filter(
                (
                  id,
                ): id is string =>
                  Boolean(id),
              ),
          ),
        ];

        if (subjectIds.length === 0) {
          continue;
        }

        const studentSubjects =
          await tx.studentSubject.findMany({
            where: {
              studentId,

              subjectId: {
                in: subjectIds,
              },
            },

            select: {
              id: true,
              subjectId: true,
            },
          });

        /* ====================================================
           STUDENT SUBJECT MAP
        ==================================================== */

        const studentSubjectMap =
          new Map(
            studentSubjects.map(
              (studentSubject) => [
                studentSubject.subjectId,
                studentSubject,
              ],
            ),
          );

        /* ====================================================
           FIND POSITION 0 TRACKING TERMS
           
           SAME RULE AS submitProgress
        ==================================================== */

        const trackingTerms =
          await tx.subjectTrackingTerm.findMany({
            where: {
              subjectId: {
                in: subjectIds,
              },

              position: 0,
            },

            select: {
              subjectId: true,
              name: true,
              position: true,
            },
          });

        const positionZeroTermMap =
          new Map(
            trackingTerms.map(
              (term) => [
                term.subjectId,
                term,
              ],
            ),
          );

        /* ====================================================
           FILTER GLOBAL LEARNINGS FOR THIS STUDENT
        ==================================================== */

        const tocLearningsBySubject =
          new Map<
            string,
            TocTrackingLearning[]
          >();

        for (const learning of tocTrackingLearnings) {
          const subjectId =
            learning.subject?.id;

          if (!subjectId) {
            continue;
          }

          /* ----------------------------------------------
             SUBJECT MUST BELONG TO STUDENT
          ---------------------------------------------- */

          const studentSubject =
            studentSubjectMap.get(
              subjectId,
            );

          if (!studentSubject) {
            continue;
          }

          /* ----------------------------------------------
             FIND POSITION 0 TRACKING TERM
          ---------------------------------------------- */

          const trackingTerm =
            positionZeroTermMap.get(
              subjectId,
            );

          if (!trackingTerm) {
            continue;
          }

          /* ----------------------------------------------
             STATUS MUST MATCH TRACKING TERM
          ---------------------------------------------- */

          if (
            learning.status !==
            trackingTerm.name
          ) {
            continue;
          }

          /* ----------------------------------------------
             ADD FOR THIS SUBJECT
          ---------------------------------------------- */

          const existing =
            tocLearningsBySubject.get(
              subjectId,
            ) ?? [];

          existing.push(learning);

          tocLearningsBySubject.set(
            subjectId,
            existing,
          );
        }

        /* ====================================================
           SAVE TOC COMPLETION
        ==================================================== */

        await Promise.all(
          Array.from(
            tocLearningsBySubject.entries(),
          ).map(
            async ([
              subjectId,
              subjectLearnings,
            ]) => {
              const studentSubject =
                studentSubjectMap.get(
                  subjectId,
                );

              if (!studentSubject) {
                return;
              }

              await saveTocCompletion(
                studentSubject.id,
                subjectLearnings,
              );
            },
          ),
        );
      }

      return savedProgress;
    },
  );

  /* ==========================================================
     REVALIDATE
  ========================================================== */

  revalidatePath(
    `/admin/branches/${data.batchId}/progress`,
    "page",
  );

  /* ==========================================================
     RETURN
  ========================================================== */

  return {
    success: true,

    progressIds: results.map(
      (progress) => progress.id,
    ),

    progress: results.map(
      (progress) => progress.learnings,
    ),
  };
}

