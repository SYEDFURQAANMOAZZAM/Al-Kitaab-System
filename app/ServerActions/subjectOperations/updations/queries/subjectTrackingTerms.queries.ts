
import { prisma } from "@/lib/prisma";

type TrackingTermInput = {
  name: string;
  position: number;
};

export async function replaceSubjectTrackingTermsQuery(
  subjectId: string,
  trackingTerms: TrackingTermInput[],
) {
  return prisma.$transaction(async (tx) => {
    const subject = await tx.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });

    if (!subject) {
      throw new Error("Subject not found");
    }

    await tx.subjectTrackingTerm.deleteMany({
      where: { subjectId },
    });

    if (trackingTerms.length > 0) {
      await tx.subjectTrackingTerm.createMany({
        data: trackingTerms.map((term) => ({
          subjectId,
          name: term.name,
          position: term.position,
        })),
      });
    }

    return tx.subjectTrackingTerm.findMany({
      where: { subjectId },
      orderBy: { position: "asc" },
    });
  });
}
