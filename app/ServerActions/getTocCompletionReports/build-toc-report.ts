"use server";

import { prisma } from "@/lib/prisma";

// ============================================================
// TYPES
// ============================================================

export type TocReportNode = {
  id: string;
  name: string;
  position: number;

  totalLeaves: number;
  completedLeaves: number;
  percentage: number;

  children: TocReportNode[];
};

type PartReport = {
  id: string;
  name: string;
  position: number;

  totalLeaves: number;
  completedLeaves: number;
  percentage: number;

  children: TocReportNode[];
};

type SubjectReport = {
  id: string;
  name: string;

  totalLeaves: number;
  completedLeaves: number;

  /**
   * Overall subject percentage.
   *
   * For the first part (Para):
   *
   *     Subject % =
   *     average of all Para percentages
   *
   * Each Para has equal weight.
   *
   * Example:
   *
   * Para 1 = 82%
   * Para 2 = 3%
   * Para 3 = 0%
   * Para 4 = 0%
   * Para 5 = 68%
   * Remaining Paras = 0%
   *
   * Subject % = average of all Paras.
   *
   * It is NOT calculated from total Ayahs.
   */
  percentage: number;

  parts: PartReport[];
};

export type StudentTocReport = {
  id: string;
  name: string;
  subjects: SubjectReport[];
};

type BuildTocReportOptions = {
  studentIds: string[];

  subjectIds?: string[];

  /**
   * YYYY-MM
   *
   * undefined / empty = all-time completion
   */
  month?: string;
};

// ============================================================
// HELPERS
// ============================================================

function percentage(
  completed: number,
  total: number,
) {
  if (total === 0) return 0;

  return Math.round(
    (completed / total) * 100,
  );
}

/**
 * Converts YYYY-MM into a UTC date range.
 *
 * Example:
 *
 * 2026-09
 *
 * =>
 *
 * 2026-09-01 inclusive
 * 2026-10-01 exclusive
 */
function getMonthRange(
  month?: string,
) {
  if (!month) {
    return undefined;
  }

  const match =
    /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error(
      "Invalid month. Expected YYYY-MM.",
    );
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      "Invalid month. Expected YYYY-MM.",
    );
  }

  const start = new Date(
    Date.UTC(
      year,
      monthNumber - 1,
      1,
    ),
  );

  const end = new Date(
    Date.UTC(
      year,
      monthNumber,
      1,
    ),
  );

  return {
    start,
    end,
  };
}

// ============================================================
// BUILD REPORT
//
// Authorization is handled by the public actions.
// ============================================================

export async function buildTocReport({
  studentIds,
  subjectIds,
  month,
}: BuildTocReportOptions): Promise<
  StudentTocReport[]
> {
  if (studentIds.length === 0) {
    return [];
  }

  const monthRange =
    getMonthRange(month);

  // ==========================================================
  // 1. STUDENTS + ASSIGNED SUBJECTS + PARTS
  // ==========================================================

  const students =
    await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },

      select: {
        id: true,

        user: {
          select: {
            name: true,
          },
        },

        studentSubjects: {
          where:
            subjectIds &&
            subjectIds.length > 0
              ? {
                  subjectId: {
                    in: subjectIds,
                  },
                }
              : undefined,

          select: {
            id: true,

            subject: {
              select: {
                id: true,
                name: true,

                parts: {
                  select: {
                    id: true,
                    name: true,
                    position: true,
                  },

                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

  if (students.length === 0) {
    return [];
  }

  // ==========================================================
  // 2. STUDENT SUBJECT IDS
  // ==========================================================

  const studentSubjectIds =
    students.flatMap(
      (student) =>
        student.studentSubjects.map(
          (studentSubject) =>
            studentSubject.id,
        ),
    );

  if (studentSubjectIds.length === 0) {
    return students.map(
      (student) => ({
        id: student.id,
        name: student.user.name,
        subjects: [],
      }),
    );
  }

  // ==========================================================
  // 3. SUBJECT IDS
  // ==========================================================

  const allSubjectIds = [
    ...new Set(
      students.flatMap(
        (student) =>
          student.studentSubjects.map(
            (studentSubject) =>
              studentSubject.subject.id,
          ),
      ),
    ),
  ];

  // ==========================================================
  // 4. TOC ITEMS
  // ==========================================================

  const tocItems =
    await prisma.subjectTocItem.findMany({
      where: {
        subjectId: {
          in: allSubjectIds,
        },
      },

      select: {
        id: true,
        subjectId: true,
        subjectPartId: true,
        parentId: true,
        name: true,
        position: true,
      },

      orderBy: {
        position: "asc",
      },
    });

  // ==========================================================
  // 5. BUILD TOC TREE
  // ==========================================================

  type RawNode = {
    id: string;
    subjectId: string;
    subjectPartId: string;
    parentId: string | null;
    name: string;
    position: number;
    children: RawNode[];
  };

  const nodeMap =
    new Map<string, RawNode>();

  for (const item of tocItems) {
    nodeMap.set(item.id, {
      id: item.id,
      subjectId: item.subjectId,
      subjectPartId:
        item.subjectPartId,
      parentId: item.parentId,
      name: item.name,
      position: item.position,
      children: [],
    });
  }

  /**
   * Roots grouped by SubjectPart.
   *
   * For example:
   *
   * Para part:
   *
   *   Para 1
   *   Para 2
   *   Para 3
   *   ...
   *
   * Each Para can then contain its Ayahs.
   */
  const rootsByPart =
    new Map<string, RawNode[]>();

  for (const item of tocItems) {
    const node =
      nodeMap.get(item.id)!;

    if (item.parentId) {
      const parent =
        nodeMap.get(item.parentId);

      if (parent) {
        parent.children.push(node);
      }
    } else {
      const roots =
        rootsByPart.get(
          item.subjectPartId,
        ) ?? [];

      roots.push(node);

      rootsByPart.set(
        item.subjectPartId,
        roots,
      );
    }
  }

  // Sort children.
  for (const node of nodeMap.values()) {
    node.children.sort(
      (a, b) =>
        a.position - b.position,
    );
  }

  // Sort roots.
  for (const roots of rootsByPart.values()) {
    roots.sort(
      (a, b) =>
        a.position - b.position,
    );
  }

  // ==========================================================
  // 6. COMPLETION RECORDS
  // ==========================================================

  /**
   * No month:
   *
   *   Fetch all completion records.
   *
   * Month:
   *
   *   Fetch only leaves completed during that month.
   */
  const completions =
    await prisma.tocCompletion.findMany({
      where: {
        studentSubjectId: {
          in: studentSubjectIds,
        },
      },

      select: {
        studentSubjectId: true,

        leafTracks: {
          where: monthRange
            ? {
                completedAt: {
                  gte: monthRange.start,
                  lt: monthRange.end,
                },
              }
            : undefined,

          select: {
            tocItemId: true,
          },
        },
      },
    });

  // ==========================================================
  // 7. COMPLETED TOC MAP
  // ==========================================================

  const completedMap =
    new Map<
      string,
      Set<string>
    >();

  for (const completion of completions) {
    completedMap.set(
      completion.studentSubjectId,
      new Set(
        completion.leafTracks.map(
          (track) =>
            track.tocItemId,
        ),
      ),
    );
  }

  // ==========================================================
  // 8. CALCULATE NODE
  // ==========================================================

  function calculateNode(
    node: RawNode,
    completedIds: Set<string>,
  ): TocReportNode {
    // ========================================================
    // LEAF
    // ========================================================

    if (
      node.children.length === 0
    ) {
      const completed =
        completedIds.has(node.id);

      return {
        id: node.id,
        name: node.name,
        position: node.position,

        totalLeaves: 1,

        completedLeaves:
          completed ? 1 : 0,

        percentage:
          completed ? 100 : 0,

        children: [],
      };
    }

    // ========================================================
    // PARENT
    // ========================================================

    const children =
      node.children.map(
        (child) =>
          calculateNode(
            child,
            completedIds,
          ),
      );

    const totalLeaves =
      children.reduce(
        (sum, child) =>
          sum +
          child.totalLeaves,
        0,
      );

    const completedLeaves =
      children.reduce(
        (sum, child) =>
          sum +
          child.completedLeaves,
        0,
      );

    return {
      id: node.id,
      name: node.name,
      position: node.position,

      totalLeaves,

      completedLeaves,

      /**
       * Individual TOC percentage.
       *
       * Example:
       *
       * Para 1 has 550 Ayahs.
       * Student completed 451.
       *
       * Para 1 = 451 / 550 = 82%
       *
       * This is intentionally Ayah-wise.
       */
      percentage: percentage(
        completedLeaves,
        totalLeaves,
      ),

      children,
    };
  }

  // ==========================================================
  // 9. BUILD FINAL REPORT
  // ==========================================================

  return students.map(
    (student) => {
      const subjects =
        student.studentSubjects.map(
          (studentSubject) => {
            const subject =
              studentSubject.subject;

            const completedIds =
              completedMap.get(
                studentSubject.id,
              ) ??
              new Set<string>();

            // ==================================================
            // PARTS
            // ==================================================

            const parts =
              subject.parts.map(
                (part) => {
                  const roots =
                    rootsByPart.get(
                      part.id,
                    ) ?? [];

                  const children =
                    roots.map(
                      (root) =>
                        calculateNode(
                          root,
                          completedIds,
                        ),
                    );

                  const totalLeaves =
                    children.reduce(
                      (sum, child) =>
                        sum +
                        child.totalLeaves,
                      0,
                    );

                  const completedLeaves =
                    children.reduce(
                      (sum, child) =>
                        sum +
                        child.completedLeaves,
                      0,
                    );

                  // ------------------------------------------
                  // DEFAULT PART PERCENTAGE
                  //
                  // This is leaf/Ayah-wise.
                  // ------------------------------------------

                  const partPercentage =
                    percentage(
                      completedLeaves,
                      totalLeaves,
                    );

                  return {
                    id: part.id,
                    name: part.name,
                    position:
                      part.position,

                    totalLeaves,

                    completedLeaves,

                    percentage:
                      partPercentage,

                    children,
                  };
                },
              );

            // ==================================================
            // SUBJECT TOTALS
            // ==================================================

            const totalLeaves =
              parts.reduce(
                (sum, part) =>
                  sum +
                  part.totalLeaves,
                0,
              );

            const completedLeaves =
              parts.reduce(
                (sum, part) =>
                  sum +
                  part.completedLeaves,
                0,
              );

            // ==================================================
            // SUBJECT PERCENTAGE
            // ==================================================

            /**
             * IMPORTANT:
             *
             * The first part is the Para part.
             *
             * We DO NOT calculate:
             *
             *   total completed Ayahs
             *   ---------------------
             *       total Ayahs
             *
             * because that makes the Subject percentage
             * Ayah-wise.
             *
             * Instead:
             *
             *   1. Calculate each Para percentage
             *      using its Ayahs.
             *
             *   2. Give every Para equal weight.
             *
             *   3. Average all Para percentages.
             *
             * Example:
             *
             * Para 1 = 82%
             * Para 2 = 3%
             * Para 3 = 0%
             * Para 4 = 0%
             * Para 5 = 68%
             * ...
             *
             * If there are 30 Paras:
             *
             * Subject =
             *
             * (82 + 3 + 0 + 0 + 68 + ...)
             * --------------------------------
             *              30
             *
             * This gives the true Para-wise percentage.
             */

            const firstPart =
              parts[0];

            let subjectPercentage = 0;

            if (
              firstPart &&
              firstPart.children.length > 0
            ) {
              const paraPercentages =
                firstPart.children.map(
                  (para) =>
                    para.percentage,
                );

              const totalParaPercentage =
                paraPercentages.reduce(
                  (sum, value) =>
                    sum + value,
                  0,
                );

              subjectPercentage =
                Math.round(
                  totalParaPercentage /
                    paraPercentages.length,
                );
            }

            // ==================================================
            // RETURN SUBJECT
            // ==================================================

            return {
              id: subject.id,
              name: subject.name,

              totalLeaves,

              completedLeaves,

              /**
               * Subject = Para-wise average.
               */
              percentage:
                subjectPercentage,

              parts,
            };
          },
        );

      return {
        id: student.id,
        name: student.user.name,
        subjects,
      };
    },
  );
}