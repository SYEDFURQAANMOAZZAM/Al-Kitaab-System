import {
  findSubjectsByIds,
  findTodayProgress,
} from "../queries/getTodayProgress.queries";

import type {
  StoredLearning,
  StoredLearningPart,
  StoredTocItemValue,
  SubjectPart,
  TocItem,
} from "../types/progressRelated.types";

export async function getTodayProgressService(
  batchId: string,
) {
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

  const progress = await findTodayProgress(
    batchId,
    today,
  );

  if (progress.length === 0) {
    return [];
  }

  /* ==========================================================
     COLLECT SUBJECT IDS
  ========================================================== */

  const subjectIds = [
    ...new Set(
      progress.flatMap((row) => {
        const learnings = Array.isArray(row.learnings)
          ? (row.learnings as StoredLearning[])
          : [];

        return learnings.flatMap((learning) => {
          const subjectId =
            learning.subject?.id;

          return subjectId ? [subjectId] : [];
        });
      }),
    ),
  ];

  /* ==========================================================
     NO SUBJECT IDS
  ========================================================== */

  if (subjectIds.length === 0) {
    return progress;
  }

  /* ==========================================================
     FETCH SUBJECT DATA
  ========================================================== */

  const subjects =
    await findSubjectsByIds(subjectIds);

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
      const byId = parts.find(
        (part) => part.id === stored.id,
      );

      if (byId) {
        return byId;
      }

      return parts.find(
        (part) => part.name === stored.name,
      );
    }

    return parts.find(
      (part) => part.name === stored,
    );
  };

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

    /* NEW FORMAT */

    if (
      typeof value === "object"
    ) {
      if (value.id) {
        return value.id;
      }

      const byName = tocItems.find(
        (item) =>
          item.subjectPartId === partId &&
          item.name === value.name,
      );

      return byName?.id ?? "";
    }

    /* OLD FORMAT */

    const byName = tocItems.find(
      (item) =>
        item.subjectPartId === partId &&
        item.name === value,
    );

    return byName?.id ?? value;
  };

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
  ):
    | string
    | {
        from: string;
        to?: string;
      } => {
    /* SIMPLE STRING */

    if (typeof value === "string") {
      return resolveTocItem(
        tocItems,
        partId,
        value,
      );
    }

    /* SIMPLE NEW OBJECT */

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

    /* RANGE */

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
      storedLearnings.map((learning) => {
        const subjectId =
          learning.subject?.id;

        /* SUBJECT ID MISSING */

        if (!subjectId) {
          return learning;
        }

        /* FIND SUBJECT */

        const subject =
          subjectMap.get(subjectId);

        if (!subject) {
          return learning;
        }

        /* REBUILD PARTS */

        const parts =
          (learning.parts ?? []).map(
            (part: StoredLearningPart) => {
              const subjectPart =
                resolveSubjectPart(
                  subject.parts,
                  part.subjectPart,
                );

              /* SUBJECT PART NOT FOUND */

              if (!subjectPart) {
                const fallbackValue =
                  typeof part.value === "string"
                    ? part.value
                    : "id" in part.value
                      ? part.value.id
                      : {
                          from:
                            typeof part.value
                              .from === "string"
                              ? part.value.from
                              : part.value.from.id,

                          ...(part.value.to
                            ? {
                                to:
                                  typeof part.value
                                    .to === "string"
                                    ? part.value.to
                                    : part.value.to.id,
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

              /* RESOLVE VALUE */

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

        /* RETURN EXACT ProgressForm SHAPE */

        return {
          learningId:
            learning.learningId,

          subject: {
            id: subject.id,
            name: subject.name,
            parts: subject.parts,
            tocItems: subject.tocItems,
            trackingTerms:
              subject.trackingTerms,
          },

          status:
            learning.status ?? "",

          parts,
        };
      });

    return {
      ...row,
      learnings,
    };
  });
}