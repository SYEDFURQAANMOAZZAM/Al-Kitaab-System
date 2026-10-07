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

export type FormattedPart = {
  label: string;
  value: string;
};

export type FormattedLearning = {
  fromParts: FormattedPart[];
  toParts: FormattedPart[];
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
): FormattedPart | null {
  const label = part.subjectPart?.name?.trim();

  if (!label) return null;

  const value = part.value;

  if (!value) return null;

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
      const endpointName = endpointValue.name.trim();
      return endpointName ? { label, value: endpointName } : null;
    }

    return null;
  }

  /*
   * Simple value:
   *
   * value: "Wazu"
   */
  const simpleValue = getValueName(value);

  if (!simpleValue) return null;

  return endpoint === "from" ? { label, value: simpleValue } : null;
}

/* -------------------------------------------------------------------------- */
/* FORMAT ONE LEARNING                                                        */
/* -------------------------------------------------------------------------- */

export function formatLearning(
  learning: Learning
): FormattedLearning | "" {
  if (!learning.parts || !learning.parts.length) {
    return "";
  }
  const parts = [...(learning.parts ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const fromParts: FormattedPart[] = [];
  const toParts: FormattedPart[] = [];

  for (const part of parts) {
    const from = getEndpointPart(part, "from");
    const to = getEndpointPart(part, "to");

    if (from) {
      fromParts.push(from);
    }

    if (to) {
      toParts.push(to);
    }

  }

  return fromParts.length || toParts.length
    ? { fromParts, toParts }
    : "";
}
