"use server";

import { prisma } from "@/lib/prisma";
import {
  requireRole,
  requireRoleForAction,
} from "@/lib/auth/require-role";

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
  percentage: number;

  parts: PartReport[];
};

export type StudentTocReport = {
  id: string;
  name: string;
  subjects: SubjectReport[];
};

function percentage(
  completed: number,
  total: number,
) {
  if (total === 0) return 0;

  return Math.round(
    (completed / total) * 100,
  );
}

export async function getTocCompletionReport(): Promise<
  StudentTocReport[]
> {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  await requireRole("TEACHER", "ADMIN");

  // ---------------------------------------------------------
  // 1. Students + assigned subjects + parts
  // ---------------------------------------------------------

  const students =
    await prisma.student.findMany({
      select: {
        id: true,

        user: {
          select: {
            name: true,
          },
        },

        studentSubjects: {
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

  // ---------------------------------------------------------
  // 2. IDs
  // ---------------------------------------------------------

  const studentSubjectIds =
    students.flatMap((student) =>
      student.studentSubjects.map(
        (ss) => ss.id,
      ),
    );

  const subjectIds = [
    ...new Set(
      students.flatMap((student) =>
        student.studentSubjects.map(
          (ss) => ss.subject.id,
        ),
      ),
    ),
  ];

  // ---------------------------------------------------------
  // 3. ALL TOC ITEMS
  // ---------------------------------------------------------

  const tocItems =
    await prisma.subjectTocItem.findMany({
      where: {
        subjectId: {
          in: subjectIds,
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

  // ---------------------------------------------------------
  // 4. Build immutable TOC structure
  // ---------------------------------------------------------

  type RawNode = {
    id: string;
    subjectId: string;
    subjectPartId: string;
    parentId: string | null;
    name: string;
    position: number;
    children: RawNode[];
  };

  const nodeMap = new Map<
    string,
    RawNode
  >();

  for (const item of tocItems) {
    nodeMap.set(item.id, {
      id: item.id,
      subjectId: item.subjectId,
      subjectPartId: item.subjectPartId,
      parentId: item.parentId,
      name: item.name,
      position: item.position,
      children: [],
    });
  }

  const rootsByPart = new Map<
    string,
    RawNode[]
  >();

  for (const item of tocItems) {
    const node = nodeMap.get(item.id)!;

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

  // Sort every level
  for (const node of nodeMap.values()) {
    node.children.sort(
      (a, b) => a.position - b.position,
    );
  }

  for (const roots of rootsByPart.values()) {
    roots.sort(
      (a, b) => a.position - b.position,
    );
  }

  // ---------------------------------------------------------
  // 5. Get actual completion records
  // ---------------------------------------------------------

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
          select: {
            tocItemId: true,
          },
        },
      },
    });

  // ---------------------------------------------------------
  // 6. Student -> completed TOC IDs
  // ---------------------------------------------------------

  const completedMap =
    new Map<string, Set<string>>();

  for (const completion of completions) {
    completedMap.set(
      completion.studentSubjectId,
      new Set(
        completion.leafTracks.map(
          (track) => track.tocItemId,
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // 7. Calculate ONE node
  // ---------------------------------------------------------

  function calculateNode(
    node: RawNode,
    completedIds: Set<string>,
  ): TocReportNode {
    // ---------------------------------------------
    // Actual leaf
    // ---------------------------------------------

    if (node.children.length === 0) {
      const completed =
        completedIds.has(node.id);

      return {
        id: node.id,
        name: node.name,
        position: node.position,

        totalLeaves: 1,

        completedLeaves: completed
          ? 1
          : 0,

        percentage: completed
          ? 100
          : 0,

        children: [],
      };
    }

    // ---------------------------------------------
    // Parent
    // ---------------------------------------------

    const children =
      node.children.map((child) =>
        calculateNode(
          child,
          completedIds,
        ),
      );

    const totalLeaves =
      children.reduce(
        (sum, child) =>
          sum + child.totalLeaves,
        0,
      );

    const completedLeaves =
      children.reduce(
        (sum, child) =>
          sum + child.completedLeaves,
        0,
      );

    return {
      id: node.id,
      name: node.name,
      position: node.position,

      totalLeaves,

      completedLeaves,

      percentage: percentage(
        completedLeaves,
        totalLeaves,
      ),

      children,
    };
  }

  // ---------------------------------------------------------
  // 8. Build report
  // ---------------------------------------------------------

  return students.map((student) => {
    const subjects =
      student.studentSubjects.map(
        (studentSubject) => {
          const subject =
            studentSubject.subject;

          const completedIds =
            completedMap.get(
              studentSubject.id,
            ) ?? new Set<string>();

          // ---------------------------------------------
          // Parts
          // ---------------------------------------------

          const parts =
            subject.parts.map((part) => {
              const roots =
                rootsByPart.get(part.id) ??
                [];

              const children =
                roots.map((root) =>
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

              return {
                id: part.id,
                name: part.name,
                position: part.position,

                totalLeaves,

                completedLeaves,

                percentage: percentage(
                  completedLeaves,
                  totalLeaves,
                ),

                children,
              };
            });

          // ---------------------------------------------
          // Subject
          // ---------------------------------------------

          const totalLeaves =
            parts.reduce(
              (sum, part) =>
                sum + part.totalLeaves,
              0,
            );

          const completedLeaves =
            parts.reduce(
              (sum, part) =>
                sum +
                part.completedLeaves,
              0,
            );

          return {
            id: subject.id,
            name: subject.name,

            totalLeaves,

            completedLeaves,

            percentage: percentage(
              completedLeaves,
              totalLeaves,
            ),

            parts,
          };
        },
      );

    return {
      id: student.id,
      name: student.user.name,
      subjects,
    };
  });
}