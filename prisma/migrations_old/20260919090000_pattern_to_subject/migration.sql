-- Rename the existing domain tables and columns in place. These are metadata
-- operations in PostgreSQL, so they retain every primary key and relationship.
BEGIN;

ALTER TABLE "Pattern" RENAME TO "Subject";
ALTER TABLE "PatternArr" RENAME TO "SubjectPart";
ALTER TABLE "PatternTocItem" RENAME TO "SubjectTocItem";
ALTER TABLE "StudentPattern" RENAME TO "StudentSubject";
ALTER TABLE "TeacherPattern" RENAME TO "TeacherSubject";
ALTER TABLE "BatchPattern" RENAME TO "BatchSubject";

ALTER TABLE "SubjectPart" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "SubjectTocItem" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "SubjectTocItem" RENAME COLUMN "patternArrId" TO "subjectPartId";
ALTER TABLE "StudentSubject" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "TeacherSubject" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "BatchSubject" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "StudentOverallProgress" RENAME COLUMN "patternId" TO "subjectId";
ALTER TABLE "StudentOverallProgress" RENAME COLUMN "studentPatternId" TO "studentSubjectId";

-- A term is local to a subject. Seed the vocabulary represented by the legacy
-- global enum for every existing subject before removing that enum.
CREATE TABLE "SubjectTrackingTerm" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SubjectTrackingTerm_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SubjectTrackingTerm" ("id", "subjectId", "name", "position")
SELECT
    md5(subject."id" || ':' || term."status"::text),
    subject."id",
    term."status"::text,
    (term."position" - 1)::integer
FROM "Subject" AS subject
CROSS JOIN unnest(enum_range(NULL::"Status")) WITH ORDINALITY
    AS term("status", "position");

CREATE UNIQUE INDEX "SubjectTrackingTerm_subjectId_name_key"
    ON "SubjectTrackingTerm"("subjectId", "name");
CREATE UNIQUE INDEX "SubjectTrackingTerm_subjectId_position_key"
    ON "SubjectTrackingTerm"("subjectId", "position");
CREATE INDEX "SubjectTrackingTerm_subjectId_idx"
    ON "SubjectTrackingTerm"("subjectId");

ALTER TABLE "SubjectTrackingTerm"
    ADD CONSTRAINT "SubjectTrackingTerm_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StudentSubjectTracking" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "studentSubjectId" TEXT NOT NULL,
    "trackingTermId" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "currentValues" JSONB NOT NULL,
    "currentPrimaryTocItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentSubjectTracking_pkey" PRIMARY KEY ("id")
);

-- Convert the legacy overall-progress status into a subject-local tracking
-- selection, retaining the progress payload and using its creation/update
-- dates as the initial tracking interval.
INSERT INTO "StudentSubjectTracking" (
    "id", "studentId", "subjectId", "studentSubjectId", "trackingTermId",
    "fromDate", "toDate", "currentValues", "currentPrimaryTocItemId",
    "createdAt", "updatedAt"
)
SELECT
    overall."id",
    overall."studentId",
    overall."subjectId",
    overall."studentSubjectId",
    term."id",
    overall."createdAt"::date,
    overall."updatedAt"::date,
    overall."currentValues",
    overall."currentPrimaryTocItemId",
    overall."createdAt",
    overall."updatedAt"
FROM "StudentOverallProgress" AS overall
JOIN "SubjectTrackingTerm" AS term
    ON term."subjectId" = overall."subjectId"
   AND term."name" = overall."trackingStatus"::text;

CREATE UNIQUE INDEX "StudentSubjectTracking_studentSubjectId_key"
    ON "StudentSubjectTracking"("studentSubjectId");
CREATE UNIQUE INDEX "StudentSubjectTracking_studentId_subjectId_key"
    ON "StudentSubjectTracking"("studentId", "subjectId");
CREATE INDEX "StudentSubjectTracking_subjectId_idx"
    ON "StudentSubjectTracking"("subjectId");
CREATE INDEX "StudentSubjectTracking_studentId_idx"
    ON "StudentSubjectTracking"("studentId");
CREATE INDEX "StudentSubjectTracking_trackingTermId_idx"
    ON "StudentSubjectTracking"("trackingTermId");

ALTER TABLE "StudentSubjectTracking"
    ADD CONSTRAINT "StudentSubjectTracking_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentSubjectTracking"
    ADD CONSTRAINT "StudentSubjectTracking_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentSubjectTracking"
    ADD CONSTRAINT "StudentSubjectTracking_studentSubjectId_fkey"
    FOREIGN KEY ("studentSubjectId") REFERENCES "StudentSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentSubjectTracking"
    ADD CONSTRAINT "StudentSubjectTracking_trackingTermId_fkey"
    FOREIGN KEY ("trackingTermId") REFERENCES "SubjectTrackingTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The historical progress record remains intact; only its global status value
-- moves into StudentSubjectTracking. The subject-level default and enum can
-- now be removed without losing the vocabulary or each student's selection.
DROP INDEX "StudentOverallProgress_patternId_trackingStatus_idx";
ALTER TABLE "StudentOverallProgress" DROP COLUMN "trackingStatus";
ALTER TABLE "Subject" DROP COLUMN "trackingStatus";
DROP TYPE "Status";

COMMIT;
