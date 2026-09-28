import {
  findPositionZeroTrackingTerms,
  findStudentSubjects,
  findSubjectParts,
  findTocItems,
  upsertProgress,
} from "../queries/submitProgress.queries";

import { saveTocCompletion } from "../actions/toctracking";

import type {
  ProgressLearning,
  StoredProgressLearning,
  SubmitProgressInput,
} from "../types/submitProgress.types";

async function prepareLearningsForStorage(
  learnings: ProgressLearning[],
): Promise<StoredProgressLearning[]> {
  const subjectPartIds = [
    ...new Set(
      learnings.flatMap((learning) =>
        learning.parts.map(
          (part) => part.id,
        ),
      ),
    ),
  ];

  const tocItemIds = [
    ...new Set(
      learnings.flatMap((learning) =>
        learning.parts.flatMap((part) => {
          if (
            typeof part.value === "string"
          ) {
            return part.value
              ? [part.value]
              : [];
          }

          return [
            part.value.from,
            ...(part.value.to
              ? [part.value.to]
              : []),
          ];
        }),
      ),
    ),
  ];

  const [
    subjectParts,
    tocItems,
  ] = await Promise.all([
    subjectPartIds.length > 0
      ? findSubjectParts(
          subjectPartIds,
        )
      : [],

    tocItemIds.length > 0
      ? findTocItems(
          tocItemIds,
        )
      : [],
  ]);

  const subjectPartMap =
    new Map(
      subjectParts.map((part) => [
        part.id,
        {
          id: part.id,
          name: part.name,
        },
      ]),
    );

  const tocMap =
    new Map(
      tocItems.map((item) => [
        item.id,
        {
          id: item.id,
          name: item.name,
        },
      ]),
    );

  return learnings.map((learning) => ({
    learningId:
      learning.learningId,

    subject: learning.subject
      ? {
          id: learning.subject.id,
          name: learning.subject.name,
        }
      : null,

    status: learning.status,

    parts: learning.parts.map((part) => {
      const subjectPart =
        subjectPartMap.get(part.id);

      if (!subjectPart) {
        throw new Error(
          `Subject part not found: ${part.id}`,
        );
      }

      if (
        typeof part.value === "string"
      ) {
        if (!part.value) {
          return {
            subjectPart,
            value: "",
          };
        }

        const tocItem =
          tocMap.get(part.value);

        if (!tocItem) {
          throw new Error(
            `TOC item not found: ${part.value}`,
          );
        }

        return {
          subjectPart,

          value: {
            id: tocItem.id,
            name: tocItem.name,
          },
        };
      }

      const fromItem =
        part.value.from
          ? tocMap.get(
              part.value.from,
            )
          : undefined;

      const toItem =
        part.value.to
          ? tocMap.get(
              part.value.to,
            )
          : undefined;

      if (
        part.value.from &&
        !fromItem
      ) {
        throw new Error(
          `TOC item not found: ${part.value.from}`,
        );
      }

      if (
        part.value.to &&
        !toItem
      ) {
        throw new Error(
          `TOC item not found: ${part.value.to}`,
        );
      }

      return {
        subjectPart,

        value: {
          from: fromItem
            ? {
                id: fromItem.id,
                name: fromItem.name,
              }
            : {
                id: "",
                name: "",
              },

          ...(toItem
            ? {
                to: {
                  id: toItem.id,
                  name: toItem.name,
                },
              }
            : {}),
        },
      };
    }),
  }));
}

export async function submitProgressService(
  data: SubmitProgressInput,
) {
  const indiaDate =
    new Intl.DateTimeFormat(
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

  const validLearnings =
    data.learnings.filter(
      (learning) =>
        learning.subject?.id,
    );

  const subjectIds = [
    ...new Set(
      validLearnings.map(
        (learning) =>
          learning.subject!.id,
      ),
    ),
  ];

  const studentSubjects =
    subjectIds.length > 0
      ? await findStudentSubjects(
          data.studentId,
          subjectIds,
        )
      : [];

  const studentSubjectMap =
    new Map(
      studentSubjects.map(
        (studentSubject) => [
          studentSubject.subjectId,
          studentSubject,
        ],
      ),
    );

  const trackingTerms =
    subjectIds.length > 0
      ? await findPositionZeroTrackingTerms(
          subjectIds,
        )
      : [];

  const positionZeroTermMap =
    new Map(
      trackingTerms.map(
        (term) => [
          term.subjectId,
          term,
        ],
      ),
    );

  const tocLearningsBySubject =
    new Map<
      string,
      ProgressLearning[]
    >();

  for (
    const learning of validLearnings
  ) {
    const subjectId =
      learning.subject!.id;

    const studentSubject =
      studentSubjectMap.get(
        subjectId,
      );

    if (!studentSubject) {
      continue;
    }

    const positionZeroTerm =
      positionZeroTermMap.get(
        subjectId,
      );

    if (!positionZeroTerm) {
      continue;
    }

    if (
      learning.status !==
      positionZeroTerm.name
    ) {
      continue;
    }

    const existing =
      tocLearningsBySubject.get(
        subjectId,
      ) ?? [];

    existing.push(learning);

    tocLearningsBySubject.set(
      subjectId,
      existing,
    );
  }

  await Promise.all(
    Array.from(
      tocLearningsBySubject.entries(),
    ).map(
      async ([
        subjectId,
        subjectLearnings,
      ]) => {
        const studentSubject =
          studentSubjectMap.get(
            subjectId,
          );

        if (!studentSubject) {
          return;
        }

        await saveTocCompletion(
          studentSubject.id,
          subjectLearnings,
        );
      },
    ),
  );

  const storedLearnings =
    await prepareLearningsForStorage(
      data.learnings,
    );

  const progress =
    await upsertProgress(
      data.studentId,
      data.batchId,
      data.batchName,
      today,
      storedLearnings,
    );

  return {
    success: true,
    progressId: progress.id,
  };
}