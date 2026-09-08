ALTER TABLE "Pattern" ADD COLUMN "trackingStatus" "Status" NOT NULL DEFAULT 'SABAQ';

CREATE TABLE "PatternTocItem" (
  "id" TEXT NOT NULL,
  "patternId" TEXT NOT NULL,
  "patternArrId" TEXT NOT NULL,
  "parentId" TEXT,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "PatternTocItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentOverallProgress" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "patternId" TEXT NOT NULL,
  "studentPatternId" TEXT NOT NULL,
  "trackingStatus" "Status" NOT NULL,
  "currentValues" JSONB NOT NULL,
  "currentPrimaryTocItemId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentOverallProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatternTocItem_parentId_position_key" ON "PatternTocItem"("parentId", "position");
CREATE INDEX "PatternTocItem_patternId_patternArrId_parentId_idx" ON "PatternTocItem"("patternId", "patternArrId", "parentId");
CREATE UNIQUE INDEX "StudentOverallProgress_studentPatternId_key" ON "StudentOverallProgress"("studentPatternId");
CREATE UNIQUE INDEX "StudentOverallProgress_studentId_patternId_key" ON "StudentOverallProgress"("studentId", "patternId");
CREATE INDEX "StudentOverallProgress_patternId_trackingStatus_idx" ON "StudentOverallProgress"("patternId", "trackingStatus");

ALTER TABLE "PatternTocItem" ADD CONSTRAINT "PatternTocItem_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatternTocItem" ADD CONSTRAINT "PatternTocItem_patternArrId_fkey" FOREIGN KEY ("patternArrId") REFERENCES "PatternArr"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatternTocItem" ADD CONSTRAINT "PatternTocItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PatternTocItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentOverallProgress" ADD CONSTRAINT "StudentOverallProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentOverallProgress" ADD CONSTRAINT "StudentOverallProgress_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentOverallProgress" ADD CONSTRAINT "StudentOverallProgress_studentPatternId_fkey" FOREIGN KEY ("studentPatternId") REFERENCES "StudentPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
