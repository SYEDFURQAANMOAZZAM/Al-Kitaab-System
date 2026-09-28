import type { ProgressRecord } from "./types";

export type RawPartValue = {
  from?: {
    id?: string;
    name?: string;
  };
  to?: {
    id?: string;
    name?: string;
  };
};

export type LearningPart = {
  id?: string;
  value?: string | RawPartValue | null;
  subjectPart?: {
    id?: string;
    name?: string;
  };
  position?: number;
};

export type Learning = {
  parts?: LearningPart[];
  status?: string;
  subject?: {
    id?: string;
    name?: string;
  };
  learningId?: string;
};

export type GroupedLearning = {
  subjectName: string;
  status: string;
  learnings: Learning[];
};

/* -------------------------------------------------------------------------- */
/* STATUS                                                                    */
/* -------------------------------------------------------------------------- */

export function formatStatus(status?: string) {
  switch (status) {
    case "SABAQ":
      return "sabaq";

    case "PARASABAQ":
      return "para sabaq";

    case "AMUQTA":
      return "amuqta";

    default:
      return (
        status?.toLowerCase().replaceAll("_", " ") || "progress"
      );
  }
}

/* -------------------------------------------------------------------------- */
/* LEARNINGS                                                                  */
/* -------------------------------------------------------------------------- */

export function parseLearnings(
  progress: ProgressRecord
): Learning[] {
  if (!Array.isArray(progress.learnings)) {
    return [];
  }

  return progress.learnings as Learning[];
}

/* -------------------------------------------------------------------------- */
/* GROUP LEARNINGS                                                            */
/* -------------------------------------------------------------------------- */

export function groupLearnings(
  learnings: Learning[]
): GroupedLearning[] {
  const groups = new Map<string, GroupedLearning>();

  for (const learning of learnings) {
    const subjectName =
      learning.subject?.name?.trim() || "Other";

    const status = formatStatus(learning.status);

    const key = `${subjectName}::${status}`;

    const existing = groups.get(key);

    if (existing) {
      existing.learnings.push(learning);
    } else {
      groups.set(key, {
        subjectName,
        status,
        learnings: [learning],
      });
    }
  }

  return Array.from(groups.values());
}

/* -------------------------------------------------------------------------- */
/* PART VALUE PARSING                                                         */
/* -------------------------------------------------------------------------- */

function getValueName(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    const object = value as { name?: unknown };

    if (typeof object.name === "string") {
      return object.name.trim();
    }
  }

  return "";
}

function getEndpointPart(
  part: LearningPart,
  endpoint: "from" | "to"
): string {
  const label = part.subjectPart?.name?.trim();

  if (!label) return "";

  const value = part.value;

  if (!value) return "";

  /*
   * Normal range value:
   *
   * {
   *   from: { name: "22 Wa Manyaqnut" },
   *   to:   { name: "24 Faman Azlam" }
   * }
   */
  if (typeof value === "object") {
    const rangeValue = value as RawPartValue;

    const endpointValue = rangeValue[endpoint];

    if (endpointValue?.name) {
      return `${label} ${endpointValue.name}`;
    }

    return "";
  }

  /*
   * Simple value:
   *
   * value: "Wazu"
   */
  const simpleValue = getValueName(value);

  if (!simpleValue) {
    return "";
  }

  return `${label} ${simpleValue}`;
}

/* -------------------------------------------------------------------------- */
/* FORMAT ONE LEARNING                                                        */
/* -------------------------------------------------------------------------- */

export function formatLearning(
  learning: Learning
): string {
  const parts = [...(learning.parts ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const fromParts: string[] = [];
  const toParts: string[] = [];

  for (const part of parts) {
    const from = getEndpointPart(part, "from");
    const to = getEndpointPart(part, "to");

    if (from) {
      fromParts.push(from);
    }

    if (to) {
      toParts.push(to);
    }

    /*
     * If this is a simple value rather than a from/to object,
     * put it into the from side.
     */
    if (
      typeof part.value === "string" &&
      part.value.trim()
    ) {
      const simple = getEndpointPart(part, "from");

      if (simple && !fromParts.includes(simple)) {
        fromParts.push(simple);
      }
    }
  }

  const fromText = fromParts.join(" ");
  const toText = toParts.join(" ");

  if (fromText && toText) {
    return `${fromText} - ${toText}`;
  }

  return fromText || toText;
}