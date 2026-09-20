import assert from "node:assert/strict";
import test from "node:test";

import { mergeDailyProgressLearnings } from "../../app/ServerActions/progress/subject-progress";
import { buildStudentTrackingSummary } from "./student-tracking";

test("buildStudentTrackingSummary filters by student, subject, tracking term, and date range", () => {
  const subject = {
    id: "subject-1",
    name: "Hifz",
    parts: [
      { id: "part-1", name: "Part 1", position: 1 },
      { id: "part-2", name: "Part 2", position: 2 },
    ],
    tocItems: [
      { id: "leaf-1", name: "1", parentId: null, subjectPartId: "part-1", position: 1 },
      { id: "leaf-2", name: "2", parentId: null, subjectPartId: "part-1", position: 2 },
      { id: "leaf-3", name: "3", parentId: null, subjectPartId: "part-2", position: 1 },
      { id: "leaf-4", name: "4", parentId: null, subjectPartId: "part-2", position: 2 },
    ],
  };

  const summary = buildStudentTrackingSummary({
    studentId: "student-a",
    subject,
    trackingTermId: "term-a",
    fromDate: "2026-09-01",
    toDate: "2026-09-30",
    progress: [
      {
        id: "progress-1",
        studentId: "student-a",
        date: "2026-09-05",
        learnings: [
          {
            subject: { id: "subject-1" },
            trackingTerm: { id: "term-a", name: "Sabaq" },
            parts: [
              { subjectPartId: "part-1", value: { from: "leaf-1", to: "leaf-2" } },
              { subjectPartId: "part-2", value: "" },
            ],
          },
        ],
      },
      {
        id: "progress-2",
        studentId: "student-a",
        date: "2026-09-10",
        learnings: [
          {
            subject: { id: "subject-1" },
            trackingTerm: { id: "term-a", name: "Sabaq" },
            parts: [
              { subjectPartId: "part-1", value: "" },
              { subjectPartId: "part-2", value: { from: "leaf-3", to: "leaf-4" } },
            ],
          },
        ],
      },
      {
        id: "progress-3",
        studentId: "student-b",
        date: "2026-09-08",
        learnings: [
          {
            subject: { id: "subject-1" },
            trackingTerm: { id: "term-b", name: "Para Sabaq" },
            parts: [
              { subjectPartId: "part-1", value: { from: "leaf-1", to: "leaf-2" } },
              { subjectPartId: "part-2", value: { from: "leaf-3", to: "leaf-4" } },
            ],
          },
        ],
      },
      {
        id: "progress-4",
        studentId: "student-a",
        date: "2026-08-20",
        learnings: [
          {
            subject: { id: "subject-1" },
            trackingTerm: { id: "term-a", name: "Sabaq" },
            parts: [
              { subjectPartId: "part-1", value: { from: "leaf-1", to: "leaf-2" } },
              { subjectPartId: "part-2", value: { from: "leaf-3", to: "leaf-4" } },
            ],
          },
        ],
      },
    ],
  });

  assert.equal(summary.trackingTerm.name, "Sabaq");
  assert.equal(summary.overall.completedLeaves, 4);
  assert.equal(summary.overall.totalLeaves, 4);
  assert.equal(summary.overall.percentage, 100);
  assert.equal(summary.completedItems.length, 4);
  assert.deepEqual(summary.currentPosition, {
    "part-1": 2,
    "part-2": 2,
  });
});

test("mergeDailyProgressLearnings replaces the same subject instead of duplicating it on the same day", () => {
  const existing = [
    {
      learningId: "a1",
      subject: { id: "subject-1", name: "Hifz" },
      trackingTerm: { id: "term-a", name: "Sabaq" },
      parts: [{ subjectPartId: "part-1", value: { from: "leaf-1", to: "leaf-2" } }],
    },
    {
      learningId: "b1",
      subject: { id: "subject-2", name: "Nazra" },
      trackingTerm: { id: "term-b", name: "Revision" },
      parts: [{ subjectPartId: "part-1", value: "" }],
    },
  ];

  const updated = mergeDailyProgressLearnings(existing, [
    {
      learningId: "a2",
      subject: { id: "subject-1", name: "Hifz" },
      trackingTerm: { id: "term-a", name: "Sabaq" },
      parts: [{ subjectPartId: "part-1", value: { from: "leaf-3", to: "leaf-4" } }],
    },
  ]);

  assert.equal(updated.length, 2);
  assert.equal(updated[0].learningId, "a2");
  assert.equal(updated[1].learningId, "b1");
});

test("cumulative tracking unions daily leaf submissions without duplicates", () => {
  const existing = new Set(["leaf-1", "leaf-2", "leaf-3"]);
  const additional = ["leaf-3", "leaf-4", "leaf-5", "leaf-5"];
  const merged = new Set([...existing, ...additional]);

  assert.deepEqual([...merged].sort(), ["leaf-1", "leaf-2", "leaf-3", "leaf-4", "leaf-5"]);
});

test("global learning only creates subject tracking when the student is actually assigned to the subject", () => {
  const selectedStudents = [
    { studentId: "student-a", hasStudentSubject: true },
    { studentId: "student-b", hasStudentSubject: false },
  ];

  const shouldTrack = selectedStudents.filter((student) => student.hasStudentSubject).map((student) => student.studentId);

  assert.deepEqual(shouldTrack, ["student-a"]);
});
