import {
  findStudentsForReport,
  findTocItems,
  findTocCompletions,
} from "../queries/tocReport.queries";

import type {
  BuildTocReportOptions,
  StudentTocReport,
  TocReportNode,
} from "../types/tocReport.types";

function percentage(
  completed: number,
  total: number
) {
  if (total === 0) return 0;

  return Math.round(
    (completed / total) * 100
  );
}

function getMonthRange(month?: string) {
  if (!month) {
    return undefined;
  }

  const match =
    /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error(
      "Invalid month. Expected YYYY-MM."
    );
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      "Invalid month. Expected YYYY-MM."
    );
  }

  return {
    start: new Date(
      Date.UTC(
        year,
        monthNumber - 1,
        1
      )
    ),

    end: new Date(
      Date.UTC(
        year,
        monthNumber,
        1
      )
    ),
  };
}

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

  const students =
    await findStudentsForReport(
      studentIds,
      subjectIds
    );

  if (students.length === 0) {
    return [];
  }

  const studentSubjectIds =
    students.flatMap((student) =>
      student.studentSubjects.map(
        (studentSubject) =>
          studentSubject.id
      )
    );

  if (studentSubjectIds.length === 0) {
    return students.map((student) => ({
      id: student.id,
      name: student.user.name,
      subjects: [],
    }));
  }

  const allSubjectIds = [
    ...new Set(
      students.flatMap((student) =>
        student.studentSubjects.map(
          (studentSubject) =>
            studentSubject.subject.id
        )
      )
    ),
  ];

  const [tocItems, completions] =
    await Promise.all([
      findTocItems(allSubjectIds),
      findTocCompletions(
        studentSubjectIds,
        monthRange
      ),
    ]);

  // --------------------------------------------------
  // Build tree
  // --------------------------------------------------

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
          item.subjectPartId
        ) ?? [];

      roots.push(node);

      rootsByPart.set(
        item.subjectPartId,
        roots
      );
    }
  }

  for (const node of nodeMap.values()) {
    node.children.sort(
      (a, b) =>
        a.position - b.position
    );
  }

  for (const roots of rootsByPart.values()) {
    roots.sort(
      (a, b) =>
        a.position - b.position
    );
  }

  // --------------------------------------------------
  // Completion map
  // --------------------------------------------------

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
            track.tocItemId
        )
      )
    );
  }

  // --------------------------------------------------
  // Calculate node
  // --------------------------------------------------

  function calculateNode(
    node: RawNode,
    completedIds: Set<string>
  ): TocReportNode {
    if (node.children.length === 0) {
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

    const children =
      node.children.map((child) =>
        calculateNode(
          child,
          completedIds
        )
      );

    const totalLeaves =
      children.reduce(
        (sum, child) =>
          sum + child.totalLeaves,
        0
      );

    const completedLeaves =
      children.reduce(
        (sum, child) =>
          sum +
          child.completedLeaves,
        0
      );

    return {
      id: node.id,
      name: node.name,
      position: node.position,

      totalLeaves,
      completedLeaves,

      percentage: percentage(
        completedLeaves,
        totalLeaves
      ),

      children,
    };
  }

  // --------------------------------------------------
  // Final report
  // --------------------------------------------------

  return students.map((student) => {
    const subjects =
      student.studentSubjects.map(
        (studentSubject) => {
          const subject =
            studentSubject.subject;

          const completedIds =
            completedMap.get(
              studentSubject.id
            ) ?? new Set<string>();

          const parts =
            subject.parts.map(
              (part) => {
                const roots =
                  rootsByPart.get(
                    part.id
                  ) ?? [];

                const children =
                  roots.map((root) =>
                    calculateNode(
                      root,
                      completedIds
                    )
                  );

                const totalLeaves =
                  children.reduce(
                    (sum, child) =>
                      sum +
                      child.totalLeaves,
                    0
                  );

                const completedLeaves =
                  children.reduce(
                    (sum, child) =>
                      sum +
                      child.completedLeaves,
                    0
                  );

                return {
                  id: part.id,
                  name: part.name,
                  position:
                    part.position,

                  totalLeaves,
                  completedLeaves,

                  percentage:
                    percentage(
                      completedLeaves,
                      totalLeaves
                    ),

                  children,
                };
              }
            );

          const totalLeaves =
            parts.reduce(
              (sum, part) =>
                sum + part.totalLeaves,
              0
            );

          const completedLeaves =
            parts.reduce(
              (sum, part) =>
                sum +
                part.completedLeaves,
              0
            );

          const firstPart = parts[0];

          let subjectPercentage = 0;

          if (
            firstPart &&
            firstPart.children.length > 0
          ) {
            const paraPercentages =
              firstPart.children.map(
                (para) =>
                  para.percentage
              );

            subjectPercentage =
              Math.round(
                paraPercentages.reduce(
                  (sum, value) =>
                    sum + value,
                  0
                ) /
                  paraPercentages.length
              );
          }

          return {
            id: subject.id,
            name: subject.name,

            totalLeaves,
            completedLeaves,

            percentage:
              subjectPercentage,

            parts,
          };
        }
      );

    return {
      id: student.id,
      name: student.user.name,
      subjects,
    };
  });
}