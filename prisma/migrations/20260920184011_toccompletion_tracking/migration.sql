-- CreateTable
CREATE TABLE "TocCompletion" (
    "id" TEXT NOT NULL,
    "studentSubjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TocCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TocLeafTrack" (
    "id" TEXT NOT NULL,
    "tocCompletionId" TEXT NOT NULL,
    "tocItemId" TEXT NOT NULL,
    "completedAt" DATE NOT NULL,

    CONSTRAINT "TocLeafTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TocCompletion_studentSubjectId_key" ON "TocCompletion"("studentSubjectId");

-- CreateIndex
CREATE INDEX "TocLeafTrack_tocItemId_idx" ON "TocLeafTrack"("tocItemId");

-- CreateIndex
CREATE INDEX "TocLeafTrack_tocCompletionId_idx" ON "TocLeafTrack"("tocCompletionId");

-- CreateIndex
CREATE INDEX "TocLeafTrack_completedAt_idx" ON "TocLeafTrack"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TocLeafTrack_tocCompletionId_tocItemId_key" ON "TocLeafTrack"("tocCompletionId", "tocItemId");

-- AddForeignKey
ALTER TABLE "TocCompletion" ADD CONSTRAINT "TocCompletion_studentSubjectId_fkey" FOREIGN KEY ("studentSubjectId") REFERENCES "StudentSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TocLeafTrack" ADD CONSTRAINT "TocLeafTrack_tocCompletionId_fkey" FOREIGN KEY ("tocCompletionId") REFERENCES "TocCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TocLeafTrack" ADD CONSTRAINT "TocLeafTrack_tocItemId_fkey" FOREIGN KEY ("tocItemId") REFERENCES "SubjectTocItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
