"use server";

import { prisma } from "@/lib/prisma";

/* ============================================================
   TYPES
============================================================ */

export type TocLearningPart = {
  id: string;
  name: string;
  position: number;

  value:
    | string
    | {
        from: string;
        to?: string;
      };
};

export type TocLearning = {
  learningId: string;

  subject: {
    id: string;
    name: string;
  } | null;

  status: string;

  parts: TocLearningPart[];
};

type TocItem = {
  id: string;
  parentId: string | null;
  position: number;
  subjectPartId: string;
};

/* ============================================================
   DATE
============================================================ */

/**
 * Returns today's calendar date in India.
 *
 * TocLeafTrack.completedAt is @db.Date.
 *
 * Example:
 *
 * 2026-09-21
 *
 * becomes:
 *
 * 2026-09-21T00:00:00.000Z
 */
function getToday(): Date {
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return new Date(`${indiaDate}T00:00:00.000Z`);
}

/* ============================================================
   TOC HELPERS
============================================================ */

/**
 * Build:
 *
 * parentId -> children
 */
function buildChildrenMap(
  items: TocItem[],
): Map<string | null, TocItem[]> {
  const childrenMap =
    new Map<string | null, TocItem[]>();

  for (const item of items) {
    const children =
      childrenMap.get(item.parentId) ?? [];

    children.push(item);

    childrenMap.set(
      item.parentId,
      children,
    );
  }

  /* Keep TOC order */
  for (const children of childrenMap.values()) {
    children.sort(
      (a, b) => a.position - b.position,
    );
  }

  return childrenMap;
}

/**
 * Flatten the TOC into leaf IDs.
 *
 * A leaf is a TOC item which has no children.
 */
function flattenLeaves(
  childrenMap: Map<string | null, TocItem[]>,
): string[] {
  const leaves: string[] = [];

  function walk(parentId: string | null) {
    const children =
      childrenMap.get(parentId) ?? [];

    for (const child of children) {
      const grandchildren =
        childrenMap.get(child.id) ?? [];

      if (grandchildren.length === 0) {
        leaves.push(child.id);
      } else {
        walk(child.id);
      }
    }
  }

  walk(null);

  return leaves;
}

/**
 * Find the first leaf under a TOC node.
 */
function getFirstLeaf(
  nodeId: string,
  childrenMap: Map<string | null, TocItem[]>,
): string {
  let currentId = nodeId;

  while (true) {
    const children =
      childrenMap.get(currentId) ?? [];

    if (children.length === 0) {
      return currentId;
    }

    currentId = children[0].id;
  }
}

/**
 * Find the last leaf under a TOC node.
 */
function getLastLeaf(
  nodeId: string,
  childrenMap: Map<string | null, TocItem[]>,
): string {
  let currentId = nodeId;

  while (true) {
    const children =
      childrenMap.get(currentId) ?? [];

    if (children.length === 0) {
      return currentId;
    }

    currentId =
      children[children.length - 1].id;
  }
}

/* ============================================================
   LEARNING VALUE HELPERS
============================================================ */

/**
 * Get FROM value from a learning part.
 */
function getFromValue(
  part: TocLearningPart,
): string | undefined {
  if (typeof part.value === "string") {
    return part.value || undefined;
  }

  return part.value.from || undefined;
}

/**
 * Get TO value from a learning part.
 */
function getToValue(
  part: TocLearningPart,
): string | undefined {
  if (typeof part.value === "string") {
    return undefined;
  }

  return part.value.to || undefined;
}

/* ============================================================
   CALCULATE ONE SABAQ
============================================================ */

/**
 * Calculate the leaves belonging to ONE Sabaq.
 *
 * IMPORTANT:
 *
 * Each learning is calculated independently.
 *
 * We NEVER combine:
 *
 *   Sabaq 1 FROM
 *        +
 *   Sabaq 2 TO
 *
 * into one range.
 *
 * Instead:
 *
 *   Sabaq 1 -> its own leaves
 *   Sabaq 2 -> its own leaves
 *
 * The caller merges them using a Set.
 */
function getLeavesForLearning(
  learning: TocLearning,
  itemMap: Map<string, TocItem>,
  childrenMap: Map<string | null, TocItem[]>,
  leafIds: string[],
  leafIndex: Map<string, number>,
): string[] {
  if (!learning.parts?.length) {
    return [];
  }

  /* ----------------------------------------------------------
     Find parts that actually contain a selection
  ---------------------------------------------------------- */

  const specifiedParts =
    learning.parts
      .filter((part) => {
        const from =
          getFromValue(part);

        const to =
          getToValue(part);

        return Boolean(from || to);
      })
      .sort(
        (a, b) =>
          a.position - b.position,
      );

  if (specifiedParts.length === 0) {
    return [];
  }

  /*
   * Use the deepest selected part.
   *
   * Example:
   *
   * Para 1 -> 4
   *
   * deepest = Para
   *
   * Example:
   *
   * Para 1
   * Surah 2
   * Ruku 2 -> 11
   * Ayat 10 -> 96
   *
   * deepest = Ayat
   */
  const deepestPart =
    specifiedParts[
      specifiedParts.length - 1
    ];

  const from =
    getFromValue(deepestPart);

  const to =
    getToValue(deepestPart);

  const startNodeId =
    from ?? to;

  const endNodeId =
    to ?? from;

  if (
    !startNodeId ||
    !endNodeId
  ) {
    return [];
  }

  /* ----------------------------------------------------------
     Validate nodes
  ---------------------------------------------------------- */

  if (
    !itemMap.has(startNodeId) ||
    !itemMap.has(endNodeId)
  ) {
    return [];
  }

  /* ----------------------------------------------------------
     Convert boundaries to actual leaves
  ---------------------------------------------------------- */

  const startChildren =
    childrenMap.get(startNodeId) ?? [];

  const endChildren =
    childrenMap.get(endNodeId) ?? [];

  const startLeaf =
    startChildren.length === 0
      ? startNodeId
      : getFirstLeaf(
          startNodeId,
          childrenMap,
        );

  const endLeaf =
    endChildren.length === 0
      ? endNodeId
      : getLastLeaf(
          endNodeId,
          childrenMap,
        );

  /* ----------------------------------------------------------
     Find leaf indexes
  ---------------------------------------------------------- */

  const startIndex =
    leafIndex.get(startLeaf);

  const endIndex =
    leafIndex.get(endLeaf);

  if (
    startIndex === undefined ||
    endIndex === undefined
  ) {
    return [];
  }

  const first = Math.min(
    startIndex,
    endIndex,
  );

  const last = Math.max(
    startIndex,
    endIndex,
  );

  /* ----------------------------------------------------------
     Return ONLY this Sabaq's leaves
  ---------------------------------------------------------- */

  const result: string[] = [];

  for (
    let i = first;
    i <= last;
    i++
  ) {
    result.push(leafIds[i]);
  }

  return result;
}

/* ============================================================
   SAVE / SYNCHRONIZE TOC COMPLETION
============================================================ */

/**
 * Synchronize today's TOC completion.
 *
 * IMPORTANT:
 *
 * This function DOES NOT replace the complete historical
 * TocLeafTrack state.
 *
 * Only today's leaves are considered editable.
 *
 * Historical leaves:
 *
 *   completedAt < today
 *
 * are protected.
 *
 * Today's leaves:
 *
 *   completedAt = today
 *
 * can be added or removed.
 *
 *
 * Example:
 *
 * Yesterday:
 *
 *   1 - 10
 *
 * Today:
 *
 *   11 - 20
 *
 * DB:
 *
 *   1 - 10  -> yesterday
 *   11 - 20 -> today
 *
 *
 * Edit today's progress:
 *
 *   11 - 20
 *
 * to:
 *
 *   11 - 17
 *
 * Result:
 *
 *   1 - 10  -> yesterday
 *   11 - 17 -> today
 *
 * 18 - 20 are deleted.
 */
export async function saveTocCompletion(
  studentSubjectId: string,
  learnings: TocLearning[],
) {
  /* ==========================================================
     1. VALIDATE
  ========================================================== */

  if (!studentSubjectId) {
    throw new Error(
      "studentSubjectId is required",
    );
  }

  if (!Array.isArray(learnings)) {
    throw new Error(
      "learnings must be an array",
    );
  }

  /* ==========================================================
     2. GET STUDENT SUBJECT
  ========================================================== */

  const studentSubject =
    await prisma.studentSubject.findUnique({
      where: {
        id: studentSubjectId,
      },

      select: {
        id: true,
        subjectId: true,
      },
    });

  if (!studentSubject) {
    throw new Error(
      "StudentSubject not found",
    );
  }

  /* ==========================================================
     3. ONLY THIS SUBJECT'S SABAQS
  ========================================================== */

  const subjectLearnings =
    learnings.filter(
      (learning) =>
        learning.subject?.id ===
        studentSubject.subjectId,
    );

  /*
   * IMPORTANT:
   *
   * Do NOT return if there are no learnings.
   *
   * An empty array can mean:
   *
   * "teacher deleted today's saved Sabaq".
   *
   * We still need to remove today's leaves.
   */

  /* ==========================================================
     4. GET TOC
  ========================================================== */

  const tocItems =
    await prisma.subjectTocItem.findMany({
      where: {
        subjectId:
          studentSubject.subjectId,
      },

      select: {
        id: true,
        parentId: true,
        position: true,
        subjectPartId: true,
      },

      orderBy: {
        position: "asc",
      },
    });

  /* ==========================================================
     5. GET / CREATE TOC COMPLETION
  ========================================================== */

  const tocCompletion =
    await prisma.tocCompletion.upsert({
      where: {
        studentSubjectId:
          studentSubject.id,
      },

      create: {
        studentSubjectId:
          studentSubject.id,
      },

      update: {},

      select: {
        id: true,
      },
    });

  /* ==========================================================
     6. TODAY
  ========================================================== */

  const today =
    getToday();

  /* ==========================================================
     7. GET ONLY TODAY'S TRACKS
  ========================================================== */

  /*
   * THIS IS THE MAIN CHANGE.
   *
   * We DO NOT load all existing leaves.
   *
   * We only load leaves whose completedAt is today.
   *
   * Therefore yesterday/older leaves are protected.
   */

  const todaysTracks =
    await prisma.tocLeafTrack.findMany({
      where: {
        tocCompletionId:
          tocCompletion.id,

        completedAt:
          today,
      },

      select: {
        id: true,
        tocItemId: true,
      },
    });

  const todaysLeafIds =
    new Set(
      todaysTracks.map(
        (track) =>
          track.tocItemId,
      ),
    );

  /* ==========================================================
     8. NO TOC
  ========================================================== */

  if (tocItems.length === 0) {
    /*
     * Only today's rows are deleted.
     *
     * Historical rows remain untouched.
     */

    if (todaysLeafIds.size > 0) {
      await prisma.tocLeafTrack.deleteMany({
        where: {
          tocCompletionId:
            tocCompletion.id,

          completedAt:
            today,
        },
      });
    }

    return {
      success: true,
      added: 0,
      removed:
        todaysLeafIds.size,
      total: 0,
      tocCompletionId:
        tocCompletion.id,
    };
  }

  /* ==========================================================
     9. BUILD LOOKUPS
  ========================================================== */

  const itemMap =
    new Map<string, TocItem>();

  for (const item of tocItems) {
    itemMap.set(
      item.id,
      item,
    );
  }

  const childrenMap =
    buildChildrenMap(
      tocItems,
    );

  /* ==========================================================
     10. GET ALL LEAVES
  ========================================================== */

  const leafIds =
    flattenLeaves(
      childrenMap,
    );

  const leafIndex =
    new Map<string, number>();

  leafIds.forEach(
    (id, index) => {
      leafIndex.set(
        id,
        index,
      );
    },
  );

  /* ==========================================================
     11. CALCULATE CURRENT SUBMITTED LEAVES
  ========================================================== */

  /*
   * Every Sabaq is calculated separately.
   *
   * Example:
   *
   * Sabaq 1:
   *   A B C D
   *
   * Sabaq 2:
   *   D E F G
   *
   * Final:
   *
   *   A B C D E F G
   *
   * D is stored only once.
   */

  const submittedLeafIds =
    new Set<string>();

  for (
    const learning of subjectLearnings
  ) {
    const learningLeafIds =
      getLeavesForLearning(
        learning,
        itemMap,
        childrenMap,
        leafIds,
        leafIndex,
      );

    for (
      const leafId of learningLeafIds
    ) {
      submittedLeafIds.add(
        leafId,
      );
    }
  }

  /* ==========================================================
     12. TODAY'S LEAVES TO REMOVE
  ========================================================== */

  /*
   * IMPORTANT:
   *
   * Compare ONLY today's tracks.
   *
   * Historical leaves are NOT part of this comparison.
   */

  const leavesToRemove: string[] =
    [];

  for (
    const leafId of todaysLeafIds
  ) {
    if (
      !submittedLeafIds.has(
        leafId,
      )
    ) {
      leavesToRemove.push(
        leafId,
      );
    }
  }

  /* ==========================================================
     13. TODAY'S NEW LEAVES
  ========================================================== */

  const leavesToAdd: string[] =
    [];

  for (
    const leafId of submittedLeafIds
  ) {
    /*
     * If it already exists TODAY,
     * nothing needs to be inserted.
     */
    if (
      todaysLeafIds.has(
        leafId,
      )
    ) {
      continue;
    }

    leavesToAdd.push(
      leafId,
    );
  }

  /* ==========================================================
     14. SYNCHRONIZE
  ========================================================== */

  await prisma.$transaction(
    async (tx) => {
      /* ------------------------------------------------------
         DELETE ONLY TODAY'S OLD LEAVES
      ------------------------------------------------------ */

      if (
        leavesToRemove.length > 0
      ) {
        await tx.tocLeafTrack.deleteMany({
          where: {
            tocCompletionId:
              tocCompletion.id,

            completedAt:
              today,

            tocItemId: {
              in: leavesToRemove,
            },
          },
        });
      }

      /* ------------------------------------------------------
         INSERT TODAY'S NEW LEAVES
      ------------------------------------------------------ */

      if (
        leavesToAdd.length > 0
      ) {
        await tx.tocLeafTrack.createMany({
          data: leavesToAdd.map(
            (tocItemId) => ({
              tocCompletionId:
                tocCompletion.id,

              tocItemId,

              completedAt:
                today,
            }),
          ),

          /*
           * Database-level protection against
           * duplicate tocCompletionId + tocItemId.
           */
          skipDuplicates: true,
        });
      }
    },
  );

  /* ==========================================================
     15. RETURN
  ========================================================== */

  return {
    success: true,

    /*
     * Newly inserted TODAY leaves.
     */
    added:
      leavesToAdd.length,

    /*
     * Deleted TODAY leaves.
     */
    removed:
      leavesToRemove.length,

    /*
     * Current number of unique leaves represented
     * by today's Sabaqs.
     *
     * This does NOT mean total historical completion.
     */
    total:
      submittedLeafIds.size,

    tocCompletionId:
      tocCompletion.id,
  };
}