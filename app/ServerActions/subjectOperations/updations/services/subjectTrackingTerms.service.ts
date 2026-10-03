
import { replaceSubjectTrackingTermsQuery } from "../queries/subjectTrackingTerms.queries";

type TrackingTermInput = {
  name: string;
  position: number;
};

export async function replaceSubjectTrackingTermsService(
  subjectId: string,
  trackingTerms: TrackingTermInput[],
) {
  const uniqueNames = new Set<string>();
  const uniquePositions = new Set<number>();

  for (const term of trackingTerms) {
    const nameKey = term.name.trim().toLowerCase();

    if (uniqueNames.has(nameKey)) {
      throw new Error(
        `Duplicate tracking term: ${term.name}`,
      );
    }

    if (uniquePositions.has(term.position)) {
      throw new Error(
        `Duplicate tracking term position: ${term.position}`,
      );
    }

    uniqueNames.add(nameKey);
    uniquePositions.add(term.position);
  }

  return replaceSubjectTrackingTermsQuery(
    subjectId,
    trackingTerms.map((term) => ({
      ...term,
      name: term.name.trim(),
    })),
  );
}
