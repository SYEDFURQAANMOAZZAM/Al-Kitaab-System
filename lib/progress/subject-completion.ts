export type SubjectPartLike = {
  id: string;
  name: string;
  position: number;
};

export type SubjectTocItemLike = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

export type ProgressRangeValue = string | { from: string; to?: string };

export type CompletionNode = {
  id: string;
  name: string;
  parentId: string | null;
  partId: string;
  position: number;
  children: string[];
};

function sortByPosition<T extends { position: number }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position);
}

function getNodeDepth(nodeId: string, nodeMap: Map<string, CompletionNode>) {
  let depth = 0;
  let current = nodeMap.get(nodeId);

  while (current?.parentId) {
    depth += 1;
    current = nodeMap.get(current.parentId);
  }

  return depth;
}

function getNodePath(nodeId: string, nodeMap: Map<string, CompletionNode>): string[] {
  const path: string[] = [];
  let current: CompletionNode | undefined = nodeMap.get(nodeId);

  while (current) {
    path.unshift(current.id);
    current = current.parentId ? nodeMap.get(current.parentId) : undefined;
  }

  return path;
}

function chooseBoundaryNode(ids: string[], orderMap: Map<string, number>, pickStart: boolean) {
  if (ids.length === 0) return null;

  return ids.reduce((best, current) => {
    if (!best) return current;
    const bestOrder = orderMap.get(best) ?? Number.MAX_SAFE_INTEGER;
    const currentOrder = orderMap.get(current) ?? Number.MAX_SAFE_INTEGER;
    if (pickStart) return currentOrder < bestOrder ? current : best;
    return currentOrder > bestOrder ? current : best;
  }, null as string | null);
}

export function buildSubjectTree(
  parts: SubjectPartLike[],
  tocItems: SubjectTocItemLike[]
) {
  const partById = new Map(parts.map((part) => [part.id, part]));
  const nodeMap = new Map<string, CompletionNode>();
  const childrenByParent = new Map<string | null, string[]>();

  for (const item of tocItems) {
    const children = childrenByParent.get(item.parentId) ?? [];
    children.push(item.id);
    childrenByParent.set(item.parentId, children);

    nodeMap.set(item.id, {
      id: item.id,
      name: item.name,
      parentId: item.parentId,
      partId: item.subjectPartId,
      position: item.position,
      children: [],
    });
  }

  for (const [parentId, childIds] of childrenByParent.entries()) {
    const ordered = sortByPosition(
      childIds
        .map((id) => nodeMap.get(id))
        .filter((node): node is CompletionNode => Boolean(node))
    );

    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children = ordered.map((node) => node.id);
    }
  }

  const descendantsByNode = new Map<string, Set<string>>();
  const leafIds = new Set<string>();

  const visit = (nodeId: string): Set<string> => {
    const node = nodeMap.get(nodeId);
    if (!node) return new Set();

    if (node.children.length === 0) {
      const leaves = new Set([nodeId]);
      leafIds.add(nodeId);
      descendantsByNode.set(nodeId, leaves);
      return leaves;
    }

    const descendantSet = new Set<string>();
    for (const childId of node.children) {
      for (const descendant of visit(childId)) {
        descendantSet.add(descendant);
      }
    }
    descendantsByNode.set(nodeId, descendantSet);
    return descendantSet;
  };

  const orderedNodeIds: string[] = [];
  const visitInOrder = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    orderedNodeIds.push(nodeId);
    for (const childId of node.children) {
      visitInOrder(childId);
    }
  };

  const rootNodes = sortByPosition(
    tocItems
      .filter((item) => item.parentId == null)
      .map((item) => nodeMap.get(item.id))
      .filter((node): node is CompletionNode => Boolean(node))
  );

  for (const rootNode of rootNodes) {
    visit(rootNode.id);
    visitInOrder(rootNode.id);
  }

  const nodeOrderMap = new Map<string, number>();
  for (const [index, nodeId] of orderedNodeIds.entries()) {
    nodeOrderMap.set(nodeId, index);
  }

  return {
    parts,
    partById,
    nodeMap,
    childrenByParent,
    descendantsByNode,
    leafIds: [...leafIds],
    orderedNodeIds,
    nodeOrderMap,
  };
}

function resolveNodeToLeafIds(
  nodeId: string,
  nodeMap: Map<string, CompletionNode>,
  descendantsByNode: Map<string, Set<string>>
) {
  if (!nodeMap.has(nodeId)) return new Set<string>();

  const node = nodeMap.get(nodeId)!;
  if (node.children.length === 0) return new Set([nodeId]);

  const descendants = descendantsByNode.get(nodeId) ?? new Set<string>();
  return new Set([...descendants].filter((id) => nodeMap.get(id)?.children.length === 0));
}

export function resolveCompletedTocItems(
  subjectParts: SubjectPartLike[],
  tocItems: SubjectTocItemLike[],
  entries: Array<{
    partId: string;
    value: ProgressRangeValue;
  }>,
) {
  const {
    nodeMap,
    descendantsByNode,
  } = buildSubjectTree(subjectParts, tocItems);

  if (entries.length === 0) {
    return new Set<string>();
  }

  /**
   * ---------------------------------------------------------
   * 1. Build a constraint for every selected subject part
   *
   * Example:
   *
   * Para → 1 to 2
   * Ayat → 1 to 2
   *
   * These remain TWO separate constraints.
   * They are NOT converted into one global tree range.
   * ---------------------------------------------------------
   */

  const constraints = new Map<
    string,
    Set<string>
  >();

  for (const entry of entries) {
    if (!entry.value || entry.value === "") {
      continue;
    }

    const partId = entry.partId;

    const partNodes = tocItems
      .filter((item) => item.subjectPartId === partId)
      .sort((a, b) => a.position - b.position);

    if (partNodes.length === 0) {
      continue;
    }

    if (typeof entry.value === "string") {
      const node = nodeMap.get(entry.value);

      if (!node || node.partId !== partId) {
        continue;
      }

      constraints.set(
        partId,
        new Set([node.id]),
      );

      continue;
    }

    const fromNode = nodeMap.get(entry.value.from);
    const toNode = nodeMap.get(
      entry.value.to ?? entry.value.from,
    );

    if (
      !fromNode ||
      !toNode ||
      fromNode.partId !== partId ||
      toNode.partId !== partId
    ) {
      continue;
    }

    const fromPosition = fromNode.position;
    const toPosition = toNode.position;

    const minPosition = Math.min(
      fromPosition,
      toPosition,
    );

    const maxPosition = Math.max(
      fromPosition,
      toPosition,
    );

    const selectedIds = new Set(
      partNodes
        .filter(
          (node) =>
            node.position >= minPosition &&
            node.position <= maxPosition,
        )
        .map((node) => node.id),
    );

    constraints.set(partId, selectedIds);
  }

  if (constraints.size === 0) {
    return new Set<string>();
  }

  /**
   * ---------------------------------------------------------
   * 2. Find all leaves
   * ---------------------------------------------------------
   */

  const leafIds = [...nodeMap.values()]
    .filter((node) => node.children.length === 0)
    .map((node) => node.id);

  /**
   * ---------------------------------------------------------
   * 3. For every leaf, walk upward through its parents.
   *
   * Example:
   *
   * Ayat
   *   ↓
   * Ruku
   *   ↓
   * Surah
   *   ↓
   * Para
   *
   * Then check each selected part constraint.
   * ---------------------------------------------------------
   */

  const completed = new Set<string>();

  for (const leafId of leafIds) {
    const path: CompletionNode[] = [];

    let current = nodeMap.get(leafId);

    while (current) {
      path.push(current);

      if (!current.parentId) {
        break;
      }

      current = nodeMap.get(current.parentId);
    }

    /**
     * path is:
     *
     * Ayat → Ruku → Surah → Para
     *
     * Convert to lookup by part.
     */
    const nodeByPart = new Map<string, CompletionNode>();

    for (const node of path) {
      nodeByPart.set(node.partId, node);
    }

    /**
     * -------------------------------------------------------
     * Every selected constraint must match.
     *
     * Example:
     *
     * Para = 1–2       ✓
     * Surah = 1–2      ✓
     * Ruku = 1–23      ✓
     * Ayat = 1–2       ✓
     *
     * Therefore this leaf is completed.
     * -------------------------------------------------------
     */

    let matches = true;

    for (const [partId, allowedNodeIds] of constraints) {
      const node = nodeByPart.get(partId);

      if (!node || !allowedNodeIds.has(node.id)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      completed.add(leafId);
    }
  }

  return completed;
}

export function calculatePartCompletion(
  subjectParts: SubjectPartLike[],
  tocItems: SubjectTocItemLike[],
  completedLeafIds: Set<string>
) {
  const { descendantsByNode, nodeMap } = buildSubjectTree(subjectParts, tocItems);

  const results: Array<{ partId: string; partName: string; total: number; completed: number; percentage: number }> = [];

  for (const part of subjectParts) {
    const partLeaves = new Set<string>();

    for (const item of tocItems.filter((tocItem) => tocItem.subjectPartId === part.id)) {
      if (nodeMap.has(item.id)) {
        for (const leafId of resolveNodeToLeafIds(item.id, nodeMap, descendantsByNode)) {
          partLeaves.add(leafId);
        }
      }
    }

    const total = partLeaves.size;
    const completed = [...partLeaves].filter((leafId) => completedLeafIds.has(leafId)).length;
    const percentage = total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

    results.push({
      partId: part.id,
      partName: part.name,
      total,
      completed,
      percentage,
    });
  }

  return results;
}

export function calculateSubjectCompletion(
  subjectParts: SubjectPartLike[],
  tocItems: SubjectTocItemLike[],
  completedLeafIds: Set<string>
) {
  const { leafIds } = buildSubjectTree(subjectParts, tocItems);
  const totalLeaves = leafIds.length;
  const completedLeaves = leafIds.filter((leafId) => completedLeafIds.has(leafId)).length;
  const percentage = totalLeaves === 0 ? 0 : Number(((completedLeaves / totalLeaves) * 100).toFixed(2));

  return {
    totalLeaves,
    completedLeaves,
    percentage,
  };
}

export function getCurrentSubjectPosition(
  subjectParts: SubjectPartLike[],
  tocItems: SubjectTocItemLike[],
  completedLeafIds: Set<string>
) {
  const { nodeMap, descendantsByNode } = buildSubjectTree(subjectParts, tocItems);
  const result: Record<string, number> = {};

  for (const part of subjectParts) {
    const partLeafPositions: number[] = [];

    for (const item of tocItems.filter((tocItem) => tocItem.subjectPartId === part.id)) {
      const leafIds = resolveNodeToLeafIds(item.id, nodeMap, descendantsByNode);
      for (const leafId of leafIds) {
        if (completedLeafIds.has(leafId)) {
          const node = nodeMap.get(leafId);
          if (node) partLeafPositions.push(node.position);
        }
      }
    }

    result[part.id] = partLeafPositions.length ? Math.max(...partLeafPositions) : 0;
  }

  return result;
}
