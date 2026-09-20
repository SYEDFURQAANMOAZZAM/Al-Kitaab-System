"use server";

import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";

import { saveTocCompletion } from "./toctracking";

/* ============================================================
   TYPES
============================================================ */

export type ProgressLearning = {
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

/**
 * Shape stored inside Progress.learnings JSON.
 *
 * IMPORTANT:
 * We store BOTH IDs and names.
 *
 * This means when loading progress later we don't have
 * to reverse-resolve an ID from a name.
 */
type StoredTocValue =
  | {
      id: string;
      name: string;
    }
  | {
      from: {
        id: string;
        name: string;
      };
      to?: {
        id: string;
        name: string;
      };
    };

type StoredProgressLearning = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: {
    subjectPart: {
      id: string;
      name: string;
    };

    value: StoredTocValue | "";
  }[];
};

type SubmitProgressInput = {
  studentId: string;
  batchId: string;
  batchName: string;
  learnings: ProgressLearning[];
};

/* ============================================================
   RESOLVE TOC IDS → IDS + NAMES
============================================================ */

async function prepareLearningsForStorage(
  learnings: ProgressLearning[],
): Promise<StoredProgressLearning[]> {
  /* ==========================================================
     COLLECT SUBJECT PART IDS
  ========================================================== */

  const subjectPartIds = [
    ...new Set(
      learnings.flatMap((learning) =>
        learning.parts.map((part) => part.id),
      ),
    ),
  ];

  /* ==========================================================
     COLLECT TOC ITEM IDS
  ========================================================== */

  const tocItemIds = [
    ...new Set(
      learnings.flatMap((learning) =>
        learning.parts.flatMap((part) => {
          if (typeof part.value === "string") {
            return part.value
              ? [part.value]
              : [];
          }

          return [
            part.value.from,
            ...(part.value.to
              ? [part.value.to]
              : []),
          ];
        }),
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
     CREATE MAPS
  ========================================================== */

  const subjectPartMap = new Map(
    subjectParts.map((part) => [
      part.id,
      {
        id: part.id,
        name: part.name,
      },
    ]),
  );

  const tocMap = new Map(
    tocItems.map((item) => [
      item.id,
      {
        id: item.id,
        name: item.name,
      },
    ]),
  );

  /* ==========================================================
     CONVERT
  ========================================================== */

  return learnings.map((learning) => ({
    learningId: learning.learningId,

    subject: learning.subject
      ? {
          id: learning.subject.id,
          name: learning.subject.name,
        }
      : null,

    status: learning.status,

    parts: learning.parts.map((part) => {
      /* ======================================================
         SUBJECT PART
      ====================================================== */

      const subjectPart =
        subjectPartMap.get(part.id);

      if (!subjectPart) {
        throw new Error(
          `Subject part not found: ${part.id}`,
        );
      }

      /* ======================================================
         SIMPLE VALUE
      ====================================================== */

      if (typeof part.value === "string") {
        if (!part.value) {
          return {
            subjectPart,
            value: "",
          };
        }

        const tocItem =
          tocMap.get(part.value);

        if (!tocItem) {
          throw new Error(
            `TOC item not found: ${part.value}`,
          );
        }

        return {
          subjectPart,

          value: {
            id: tocItem.id,
            name: tocItem.name,
          },
        };
      }

      /* ======================================================
         RANGE VALUE
      ====================================================== */

      const fromItem = part.value.from
        ? tocMap.get(part.value.from)
        : undefined;

      const toItem = part.value.to
        ? tocMap.get(part.value.to)
        : undefined;

      /* ======================================================
         VALIDATE FROM
      ====================================================== */

      if (
        part.value.from &&
        !fromItem
      ) {
        throw new Error(
          `TOC item not found: ${part.value.from}`,
        );
      }

      /* ======================================================
         VALIDATE TO
      ====================================================== */

      if (
        part.value.to &&
        !toItem
      ) {
        throw new Error(
          `TOC item not found: ${part.value.to}`,
        );
      }

      /* ======================================================
         RETURN RANGE
      ====================================================== */

      return {
        subjectPart,

        value: {
          from: fromItem
            ? {
                id: fromItem.id,
                name: fromItem.name,
              }
            : {
                id: "",
                name: "",
              },

          ...(toItem
            ? {
                to: {
                  id: toItem.id,
                  name: toItem.name,
                },
              }
            : {}),
        },
      };
    }),
  }));
}

/* ============================================================
   SUBMIT PROGRESS
============================================================ */

export async function submitProgress(
  data: SubmitProgressInput,
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
     VALIDATE LEARNINGS
  ========================================================== */

  const validLearnings =
    data.learnings.filter(
      (learning) =>
        learning.subject?.id,
    );

  /* ==========================================================
     FIND STUDENT'S SUBJECTS
  ========================================================== */

  const subjectIds = [
    ...new Set(
      validLearnings.map(
        (learning) =>
          learning.subject!.id,
      ),
    ),
  ];

  const studentSubjects =
    subjectIds.length > 0
      ? await prisma.studentSubject.findMany({
          where: {
            studentId: data.studentId,

            subjectId: {
              in: subjectIds,
            },
          },

          select: {
            id: true,

            subjectId: true,

            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

  /*
   * Map:
   *
   * subjectId -> StudentSubject
   */

  const studentSubjectMap =
    new Map(
      studentSubjects.map(
        (studentSubject) => [
          studentSubject.subjectId,
          studentSubject,
        ],
      ),
    );

  /* ==========================================================
     FIND POSITION 0 TRACKING TERMS
  ========================================================== */

  const trackingTerms =
    subjectIds.length > 0
      ? await prisma.subjectTrackingTerm.findMany({
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
        })
      : [];

  /*
   * Map:
   *
   * subjectId -> position 0 tracking term
   */

  const positionZeroTermMap =
    new Map(
      trackingTerms.map(
        (term) => [
          term.subjectId,
          term,
        ],
      ),
    );

  /* ==========================================================
     FILTER TOC TRACKING LEARNINGS
  ========================================================== */

  const tocLearningsBySubject =
    new Map<
      string,
      ProgressLearning[]
    >();

  for (const learning of validLearnings) {
    const subjectId =
      learning.subject!.id;

    /* ========================================================
       SUBJECT MUST BELONG TO STUDENT
    ======================================================== */

    const studentSubject =
      studentSubjectMap.get(
        subjectId,
      );

    if (!studentSubject) {
      continue;
    }

    /* ========================================================
       FIND POSITION 0 TRACKING TERM
    ======================================================== */

    const positionZeroTerm =
      positionZeroTermMap.get(
        subjectId,
      );

    if (!positionZeroTerm) {
      continue;
    }

    /*
     * Only the learning whose status
     * matches the position 0 term.
     *
     * Example:
     *
     * position 0 = SABAQ
     *
     * Only:
     *
     * status === "SABAQ"
     *
     * gets sent to TOC completion.
     */

    if (
      learning.status !==
      positionZeroTerm.name
    ) {
      continue;
    }

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

  /* ==========================================================
     SAVE TOC COMPLETION
  ========================================================== */

  /*
   * Each subject gets its own TocCompletion
   * because TocCompletion belongs to StudentSubject.
   *
   * Multiple learnings of the SAME subject are
   * passed together.
   */

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

  /* ==========================================================
     CONVERT IDS → IDS + READABLE NAMES
  ========================================================== */

  const storedLearnings =
    await prepareLearningsForStorage(
      data.learnings,
    );

  /* ==========================================================
     SAVE PROGRESS
  ========================================================== */

  const progress =
    await prisma.progress.upsert({
      where: {
        studentId_date_batchId: {
          studentId: data.studentId,
          batchId: data.batchId,
          date: today,
        },
      },

      create: {
        studentId: data.studentId,
        batchId: data.batchId,
        batchname: data.batchName,
        date: today,
        learnings: storedLearnings,
      },

      update: {
        batchname: data.batchName,
        learnings: storedLearnings,
      },
    });

  /* ==========================================================
     RETURN
  ========================================================== */

  return {
    success: true,
    progressId: progress.id,
  };
}