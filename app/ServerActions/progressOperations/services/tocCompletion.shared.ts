import {
  findSubjectTocItems,
  findTodaysTracks,
  upsertTocCompletion,
} from "../queries/saveTocCompletion.queries";

import type {
  TocItem,
  TocLearning,
  TocLearningPart,
} from "../types/saveTocCompletion.types";

export function getToday(): Date {
  const indiaDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());

  return new Date(
    `${indiaDate}T00:00:00.000Z`,
  );
}

export function buildChildrenMap(
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

  for (const children of childrenMap.values()) {
    children.sort(
      (a, b) => a.position - b.position,
    );
  }

  return childrenMap;
}

export function flattenLeaves(
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

export function getFirstLeaf(
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

export function getLastLeaf(
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

export function getFromValue(
  part: TocLearningPart,
): string | undefined {
  if (typeof part.value === "string") {
    return part.value || undefined;
  }

  return part.value.from || undefined;
}

export function getToValue(
  part: TocLearningPart,
): string | undefined {
  if (typeof part.value === "string") {
    return undefined;
  }

  return part.value.to || undefined;
}

export function getLeavesForLearning(
  learning: TocLearning,
  itemMap: Map<string, TocItem>,
  childrenMap: Map<string | null, TocItem[]>,
  leafIds: string[],
  leafIndex: Map<string, number>,
): string[] {
  if (!learning.parts?.length) {
    return [];
  }

  const selectedParts = learning.parts
    .map((part) => ({
      part,
      from: getFromValue(part),
      to: getToValue(part),
    }))
    .filter(({ from, to }) =>
      Boolean(from || to),
    )
    .sort(
      (a, b) =>
        a.part.position - b.part.position,
    );

  if (selectedParts.length === 0) {
    return [];
  }

  const fromSelections =
    selectedParts.filter(
      ({ from }) => Boolean(from),
    );

  const deepestFrom =
    fromSelections.length > 0
      ? fromSelections[
          fromSelections.length - 1
        ].from
      : undefined;

  const toSelections =
    selectedParts.filter(
      ({ to }) => Boolean(to),
    );

  const deepestTo =
    toSelections.length > 0
      ? toSelections[
          toSelections.length - 1
        ].to
      : undefined;

  const startNodeId =
    deepestFrom ?? deepestTo;

  const endNodeId =
    deepestTo ?? deepestFrom;

  if (!startNodeId || !endNodeId) {
    return [];
  }

  if (
    !itemMap.has(startNodeId) ||
    !itemMap.has(endNodeId)
  ) {
    return [];
  }

  const startChildren =
    childrenMap.get(startNodeId) ?? [];

  const startLeaf =
    startChildren.length === 0
      ? startNodeId
      : getFirstLeaf(
          startNodeId,
          childrenMap,
        );

  const endChildren =
    childrenMap.get(endNodeId) ?? [];

  const endLeaf =
    endChildren.length === 0
      ? endNodeId
      : getLastLeaf(
          endNodeId,
          childrenMap,
        );

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

  return leafIds.slice(
    first,
    last + 1,
  );
}

export async function prepareTocCompletion(
  studentSubjectId: string,
  learnings: TocLearning[],
) {
  const tocCompletion =
    await upsertTocCompletion(
      studentSubjectId,
    );

  const today = getToday();

  const tocItems =
    await findSubjectTocItems(
      // This is supplied by the service.
      "",
    );

  return {
    tocCompletion,
    today,
    tocItems,
  };
}