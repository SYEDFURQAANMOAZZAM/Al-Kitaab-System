import {
  findPositionZeroTrackingTerms,
  findStudentSubjects,
  findSubjectParts,
  findTocItems,
  saveProgressForStudent,
} from "../queries/saveGlobalLearnings.queries";

import { saveGlobalTocCompletion } from "../actions/globalTocTracking";

import type {
  GlobalLearning,
  ProgressLearningForStorage,
  SaveGlobalLearningsInput,
  TocTrackingLearning,
} from "../types/saveGlobalLearnings.types";

async function prepareGlobalLearnings(
  learnings: GlobalLearning[],
): Promise<ProgressLearningForStorage[]> {
  const subjectPartIds = [
    ...new Set(
      learnings.flatMap(
        (learning) =>
          learning.subject?.parts.map(
            (part) => part.id,
          ) ?? [],
      ),
    ),
  ];

  const tocItemIds = [
    ...new Set(
      learnings.flatMap(
        (learning) =>
          Object.values(
            learning.values,
          ).flatMap((value) => {
            if (
              typeof value === "string"
            ) {
              return value
                ? [value]
                : [];
            }

            return [
              value.from,
              ...(value.to
                ? [value.to]
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
        part.name,
      ]),
    );

  const tocMap =
    new Map(
      tocItems.map((item) => [
        item.id,
        item.name,
      ]),
    );

  return learnings.map((learning) => {
    if (!learning.subject) {
      return {
        learningId: learning.id,
        subject: null,
        status: learning.status,
        parts: [],
      };
    }

    return {
      learningId: learning.id,

      subject: {
        id: learning.subject.id,
        name: learning.subject.name,
      },

      status: learning.status,

      parts: learning.subject.parts.map(
        (part) => {
          const subjectPartName =
            subjectPartMap.get(
              part.id,
            );

          if (!subjectPartName) {
            throw new Error(
              `Subject part not found: ${part.id}`,
            );
          }

          const value =
            learning.values[
              part.id
            ] ?? "";

          if (
            typeof value === "string"
          ) {
            return {
              subjectPart:
                subjectPartName,

              value: value
                ? tocMap.get(value) ??
                  value
                : "",
            };
          }

          const fromName = value.from
            ? tocMap.get(value.from)
            : undefined;

          const toName = value.to
            ? tocMap.get(value.to)
            : undefined;

          if (
            value.from &&
            !fromName
          ) {
            throw new Error(
              `TOC item not found: ${value.from}`,
            );
          }

          if (
            value.to &&
            !toName
          ) {
            throw new Error(
              `TOC item not found: ${value.to}`,
            );
          }

          return {
            subjectPart:
              subjectPartName,

            value: {
              from: fromName ?? "",
              ...(toName
                ? { to: toName }
                : {}),
            },
          };
        },
      ),
    };
  });
}

function prepareGlobalLearningsForToc(
  learnings: GlobalLearning[],
): TocTrackingLearning[] {
  return learnings
    .filter(
      (learning) =>
        learning.subject,
    )
    .map((learning) => ({
      learningId: learning.id,

      subject: learning.subject
        ? {
            id: learning.subject.id,
            name: learning.subject.name,
          }
        : null,

      status: learning.status,

      parts:
        learning.subject?.parts.map(
          (part) => ({
            id: part.id,
            name: part.name,
            position: part.position,
            value:
              learning.values[
                part.id
              ] ?? "",
          }),
        ) ?? [],
    }));
}

export async function saveGlobalLearningsService(
  data: SaveGlobalLearningsInput,
) {
  if (data.studentIds.length === 0) {
    throw new Error(
      "No students selected.",
    );
  }

  if (data.learnings.length === 0) {
    throw new Error(
      "No learnings provided.",
    );
  }

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

  const newLearnings =
    await prepareGlobalLearnings(
      data.learnings,
    );

  const tocTrackingLearnings =
    prepareGlobalLearningsForToc(
      data.learnings,
    );

  const savedProgress = [];

  for (
    const studentId of data.studentIds
  ) {
    const saved =
      await saveProgressForStudent(
        studentId,
        data.batchId,
        data.batchName,
        today,
        newLearnings,
      );

    savedProgress.push(saved);

    const subjectIds = [
      ...new Set(
        tocTrackingLearnings
          .map(
            (learning) =>
              learning.subject?.id,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    ];

    if (subjectIds.length === 0) {
      continue;
    }

    const studentSubjects =
      await findStudentSubjects(
        studentId,
        subjectIds,
      );

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
      await findPositionZeroTrackingTerms(
        subjectIds,
      );

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
        TocTrackingLearning[]
      >();

    for (
      const learning of
        tocTrackingLearnings
    ) {
      const subjectId =
        learning.subject?.id;

      if (!subjectId) {
        continue;
      }

      const studentSubject =
        studentSubjectMap.get(
          subjectId,
        );

      if (!studentSubject) {
        continue;
      }

      const trackingTerm =
        positionZeroTermMap.get(
          subjectId,
        );

      if (!trackingTerm) {
        continue;
      }

      if (
        learning.status !==
        trackingTerm.name
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

          await saveGlobalTocCompletion(
            studentSubject.id,
            subjectLearnings,
          );
        },
      ),
    );
  }

  return savedProgress;
}