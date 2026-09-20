"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

/* ============================================================
   TYPES
============================================================ */

type StoredTocItemValue = {
  id: string;
  name: string;
};

type StoredTocRange = {
  from: StoredTocItemValue;
  to?: StoredTocItemValue;
};

/**
 * New format:
 *
 * subjectPart: {
 *   id: string;
 *   name: string;
 * }
 *
 * value:
 *   {
 *     id: string;
 *     name: string;
 *   }
 *
 * OR
 *
 *   {
 *     from: {
 *       id: string;
 *       name: string;
 *     };
 *     to?: {
 *       id: string;
 *       name: string;
 *     };
 *   }
 *
 * Old format is also accepted so existing DB records
 * continue to work.
 */

type StoredLearningPart = {
  subjectPart:
    | string
    | {
        id: string;
        name: string;
      };

  value:
    | string
    | StoredTocItemValue
    | {
        from: string | StoredTocItemValue;
        to?: string | StoredTocItemValue;
      };
};

type StoredLearning = {
  learningId: string;

  subject?: {
    id?: string;
    name?: string;
    [key: string]: unknown;
  } | null;

  status?: string;

  parts?: StoredLearningPart[];
};

type TocItem = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

type TrackingTerm = {
  id: string;
  name: string;
  position: number;
};

/* ============================================================
   GET TODAY'S PROGRESS
============================================================ */

export async function getTodayProgress(
  batchId: string,
) {
  await requireRole("TEACHER", "ADMIN");

  /* ==========================================================
     TODAY IN IST
  ========================================================== */

  const indiaDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());

  const today = new Date(
    `${indiaDate}T00:00:00.000Z`,
  );

  /* ==========================================================
     FETCH TODAY'S PROGRESS
  ========================================================== */

  const progress =
    await prisma.progress.findMany({
      where: {
        batchId,
        date: today,
      },

      select: {
        id: true,
        studentId: true,
        date: true,
        learnings: true,
      },
    });

  if (progress.length === 0) {
    return [];
  }

  /* ==========================================================
     COLLECT SUBJECT IDS
  ========================================================== */

  const subjectIds = [
    ...new Set(
      progress.flatMap((row) => {
        const learnings = Array.isArray(
          row.learnings,
        )
          ? (row.learnings as StoredLearning[])
          : [];

        return learnings.flatMap(
          (learning) => {
            const subjectId =
              learning.subject?.id;

            return subjectId
              ? [subjectId]
              : [];
          },
        );
      }),
    ),
  ];

  /*
   * No subject IDs means there is nothing
   * to hydrate.
   */

  if (subjectIds.length === 0) {
    return progress;
  }

  /* ==========================================================
     FETCH SUBJECT DATA
  ========================================================== */

  const subjects =
    await prisma.subject.findMany({
      where: {
        id: {
          in: subjectIds,
        },
      },

      select: {
        id: true,
        name: true,

        parts: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            name: true,
            position: true,
          },
        },

        trackingTerms: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            name: true,
            position: true,
          },
        },

        tocItems: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            name: true,
            parentId: true,
            subjectPartId: true,
            position: true,
          },
        },
      },
    });

  /* ==========================================================
     MAP SUBJECTS
  ========================================================== */

  const subjectMap = new Map(
    subjects.map((subject) => [
      subject.id,
      subject,
    ]),
  );

  /* ==========================================================
     HELPERS
  ========================================================== */

  /**
   * Get the subject-part ID from either:
   *
   * NEW:
   * {
   *   id,
   *   name
   * }
   *
   * OLD:
   * "Ruku"
   */
  const resolveSubjectPart = (
    parts: SubjectPart[],
    stored:
      | string
      | {
          id: string;
          name: string;
        },
  ): SubjectPart | undefined => {
    if (
      typeof stored === "object" &&
      stored !== null
    ) {
      /*
       * New format.
       *
       * Prefer ID.
       */
      const byId = parts.find(
        (part) => part.id === stored.id,
      );

      if (byId) {
        return byId;
      }

      /*
       * Fallback to name in case the ID
       * no longer exists.
       */
      return parts.find(
        (part) => part.name === stored.name,
      );
    }

    /*
     * Old format.
     */
    return parts.find(
      (part) => part.name === stored,
    );
  };

  /**
   * Resolve one stored TOC value.
   *
   * New records already contain the ID.
   *
   * Old records contain only the name.
   */
  const resolveTocItem = (
    tocItems: TocItem[],
    partId: string,
    value:
      | string
      | StoredTocItemValue,
  ): string => {
    if (!value) {
      return "";
    }

    /* --------------------------------------------------------
       NEW FORMAT
    -------------------------------------------------------- */

    if (
      typeof value === "object"
    ) {
      /*
       * The ID is what SearchPicker needs.
       */
      if (value.id) {
        return value.id;
      }

      /*
       * Fallback to name.
       */
      const byName = tocItems.find(
        (item) =>
          item.subjectPartId === partId &&
          item.name === value.name,
      );

      return byName?.id ?? "";
    }

    /* --------------------------------------------------------
       OLD FORMAT
    -------------------------------------------------------- */

    const byName = tocItems.find(
      (item) =>
        item.subjectPartId === partId &&
        item.name === value,
    );

    return byName?.id ?? value;
  };

  /**
   * Convert stored TOC value into the exact
   * format expected by ProgressForm.
   *
   * ProgressForm expects:
   *
   * string
   *
   * OR
   *
   * {
   *   from: tocItemId;
   *   to?: tocItemId;
   * }
   */
  const resolveTocValue = (
    tocItems: TocItem[],
    partId: string,
    value:
      | string
      | StoredTocItemValue
      | {
          from: string | StoredTocItemValue;
          to?: string | StoredTocItemValue;
        },
  ): string | {
    from: string;
    to?: string;
  } => {
    /* --------------------------------------------------------
       SIMPLE STRING
    -------------------------------------------------------- */

    if (typeof value === "string") {
      return resolveTocItem(
        tocItems,
        partId,
        value,
      );
    }

    /* --------------------------------------------------------
       SIMPLE NEW OBJECT
       {
         id,
         name
       }
    -------------------------------------------------------- */

    if (
      "id" in value &&
      "name" in value
    ) {
      return resolveTocItem(
        tocItems,
        partId,
        value,
      );
    }

    /* --------------------------------------------------------
       RANGE
    -------------------------------------------------------- */

    return {
      from: resolveTocItem(
        tocItems,
        partId,
        value.from,
      ),

      ...(value.to
        ? {
            to: resolveTocItem(
              tocItems,
              partId,
              value.to,
            ),
          }
        : {}),
    };
  };

  /* ==========================================================
     REBUILD LEARNINGS
  ========================================================== */

  return progress.map((row) => {
    const storedLearnings =
      Array.isArray(row.learnings)
        ? (row.learnings as StoredLearning[])
        : [];

    const learnings =
      storedLearnings.map(
        (learning) => {
          const subjectId =
            learning.subject?.id;

          /* ----------------------------------------------------
             SUBJECT ID MISSING
          ---------------------------------------------------- */

          if (!subjectId) {
            return learning;
          }

          /* ----------------------------------------------------
             FIND SUBJECT
          ---------------------------------------------------- */

          const subject =
            subjectMap.get(subjectId);

          if (!subject) {
            return learning;
          }

          /* ----------------------------------------------------
             REBUILD PARTS
          ---------------------------------------------------- */

          const parts =
            (learning.parts ?? []).map(
              (part) => {
                const subjectPart =
                  resolveSubjectPart(
                    subject.parts,
                    part.subjectPart,
                  );

                /*
                 * If subject part cannot be found,
                 * preserve the stored information
                 * rather than crashing.
                 */

                if (!subjectPart) {
                  const fallbackValue =
                    typeof part.value ===
                    "string"
                      ? part.value
                      : "id" in part.value
                        ? part.value.id
                        : {
                            from:
                              typeof part
                                .value
                                .from ===
                              "string"
                                ? part.value
                                    .from
                                : part.value
                                    .from.id,

                            ...(part.value
                              .to
                              ? {
                                  to:
                                    typeof part
                                      .value
                                      .to ===
                                    "string"
                                      ? part
                                          .value
                                          .to
                                      : part.value
                                          .to.id,
                                }
                              : {}),
                          };

                  return {
                    id: "",
                    name:
                      typeof part.subjectPart ===
                      "string"
                        ? part.subjectPart
                        : part.subjectPart.name,
                    position: 0,
                    value: fallbackValue,
                  };
                }

                /* ------------------------------------------------
                   RESOLVE VALUE USING STORED IDS
                ------------------------------------------------ */

                const value =
                  resolveTocValue(
                    subject.tocItems,
                    subjectPart.id,
                    part.value,
                  );

                return {
                  id: subjectPart.id,
                  name: subjectPart.name,
                  position:
                    subjectPart.position,
                  value,
                };
              },
            );

          /* ----------------------------------------------------
             RETURN EXACT ProgressForm SHAPE
          ---------------------------------------------------- */

          return {
            learningId:
              learning.learningId,

            subject: {
              id: subject.id,
              name: subject.name,

              /*
               * Full subject parts.
               */
              parts: subject.parts,

              /*
               * Full TOC.
               */
              tocItems:
                subject.tocItems,

              /*
               * Tracking terms.
               */
              trackingTerms:
                subject.trackingTerms,
            },

            status:
              learning.status ?? "",

            parts,
          };
        },
      );

    return {
      ...row,
      learnings,
    };
  });
}