-- CreateTable
CREATE TABLE "TeacherPattern" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "TeacherPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherPattern_patternId_idx" ON "TeacherPattern"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherPattern_teacherId_patternId_key" ON "TeacherPattern"("teacherId", "patternId");

-- AddForeignKey
ALTER TABLE "TeacherPattern" ADD CONSTRAINT "TeacherPattern_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherPattern" ADD CONSTRAINT "TeacherPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
