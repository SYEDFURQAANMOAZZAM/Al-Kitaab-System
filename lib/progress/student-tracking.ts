import {
  calculatePartCompletion,
  calculateSubjectCompletion,
  getCurrentSubjectPosition,
  resolveCompletedTocItems,
  type SubjectPartLike,
  type SubjectTocItemLike,
  type ProgressRangeValue,
} from "./subject-completion";

export type StudentTrackingProgressRow = {
  id: string;
  studentId: string;
  date: string | Date;
  learnings: Array<{
    subject?: { id?: string; name?: string };
    trackingTerm?: { id?: string; name?: string };
    parts?: Array<{ subjectPartId?: string; value?: ProgressRangeValue | string }>;
  }>;
};

export type StudentTrackingSummaryInput = {
  studentId: string;
  subject: {
    id: string;
    name: string;
    parts: SubjectPartLike[];
    tocItems: SubjectTocItemLike[];
  };
  trackingTermId: string;
  fromDate: string | Date;
  toDate: string | Date;
  completedLeafIds?: Iterable<string> | Set<string>;
  progress?: StudentTrackingProgressRow[];
};

export function buildStudentTrackingSummary({
  studentId,
  subject,
  trackingTermId,
  fromDate,
  toDate,
  completedLeafIds,
  progress,
}: StudentTrackingSummaryInput) {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  const resolvedCompletedLeafIds = completedLeafIds
    ? new Set(completedLeafIds)
    : new Set<string>();

  const overall = calculateSubjectCompletion(subject.parts, subject.tocItems, resolvedCompletedLeafIds);
  const partCompletion = calculatePartCompletion(subject.parts, subject.tocItems, resolvedCompletedLeafIds);
  const currentPosition = getCurrentSubjectPosition(subject.parts, subject.tocItems, resolvedCompletedLeafIds);

  const completedItems = [...resolvedCompletedLeafIds].map((leafId) => {
    const tocItem = subject.tocItems.find((item) => item.id === leafId);
    return {
      id: leafId,
      name: tocItem?.name ?? leafId,
      partId: tocItem?.subjectPartId ?? subject.parts[0]?.id ?? "",
    };
  });

  const trackingTerm = {
    id: trackingTermId,
    name: "Current tracking",
  };

  return {
    trackingTerm,
    dateRange: {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    },
    overall,
    partCompletion,
    completedItems,
    currentPosition,
  };
}
