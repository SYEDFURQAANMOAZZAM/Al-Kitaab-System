import {
  findStudentSubject,
  findSubjectTocItems,
  findTodaysTracks,
  syncTodaysTracks,
  upsertTocCompletion,
} from "../queries/saveTocCompletion.queries";

import {
  buildChildrenMap,
  flattenLeaves,
  getLeavesForLearning,
  getToday,
} from "./tocCompletion.shared";

import type {
  TocItem,
  TocLearning,
} from "../types/saveTocCompletion.types";

export async function saveGlobalTocCompletionService(
  studentSubjectId: string,
  learnings: TocLearning[],
) {
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

  const studentSubject =
    await findStudentSubject(
      studentSubjectId,
    );

  if (!studentSubject) {
    throw new Error(
      "StudentSubject not found",
    );
  }

  const subjectLearnings =
    learnings.filter(
      (learning) =>
        learning.subject?.id ===
        studentSubject.subjectId,
    );

  const tocItems =
    await findSubjectTocItems(
      studentSubject.subjectId,
    );

  const tocCompletion =
    await upsertTocCompletion(
      studentSubject.id,
    );

  const today = getToday();

  const todaysTracks =
    await findTodaysTracks(
      tocCompletion.id,
      today,
    );

  const todaysLeafIds =
    new Set(
      todaysTracks.map(
        (track) => track.tocItemId,
      ),
    );

  if (tocItems.length === 0) {
    return {
      success: true,
      added: 0,
      removed: 0,
      total: 0,
      tocCompletionId:
        tocCompletion.id,
    };
  }

  const itemMap =
    new Map<string, TocItem>();

  for (const item of tocItems) {
    itemMap.set(item.id, item);
  }

  const childrenMap =
    buildChildrenMap(
      tocItems,
    );

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

  const leavesToAdd: string[] =
    [];

  for (
    const leafId of submittedLeafIds
  ) {
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

  await syncTodaysTracks(
    tocCompletion.id,
    today,
    [],
    leavesToAdd,
  );

  return {
    success: true,
    added: leavesToAdd.length,
    removed: 0,
    total: submittedLeafIds.size,
    tocCompletionId:
      tocCompletion.id,
  };
}