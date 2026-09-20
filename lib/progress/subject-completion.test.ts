import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePartCompletion,
  calculateSubjectCompletion,
  getCurrentSubjectPosition,
  resolveCompletedTocItems,
} from "./subject-completion";

const parts = [
  { id: "part-1", name: "Surah", position: 0 },
  { id: "part-2", name: "Topic", position: 1 },
];

const tocItems = [
  { id: "node-1", name: "Para 1", parentId: null, subjectPartId: "part-1", position: 0 },
  { id: "node-2", name: "Ruku 1", parentId: "node-1", subjectPartId: "part-1", position: 1 },
  { id: "node-3", name: "Ayah 1", parentId: "node-2", subjectPartId: "part-1", position: 2 },
  { id: "node-4", name: "Ayah 2", parentId: "node-2", subjectPartId: "part-1", position: 3 },
  { id: "node-5", name: "Chapter 1", parentId: null, subjectPartId: "part-2", position: 0 },
  { id: "node-6", name: "Topic 1", parentId: "node-5", subjectPartId: "part-2", position: 1 },
];

test("single leaf resolves to the exact completed leaf", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: "node-3" },
  ]);

  assert.deepEqual([...completed].sort(), ["node-3"]);
});

test("range resolves all leaves inside the selected interval", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: { from: "node-1", to: "node-4" } },
  ]);

  assert.deepEqual([...completed].sort(), ["node-3", "node-4"]);
});

test("parent selection expands to descendant leaves", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: "node-2" },
  ]);

  assert.deepEqual([...completed].sort(), ["node-3", "node-4"]);
});

test("duplicate progress entries are deduplicated", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: "node-3" },
    { partId: "part-1", value: "node-3" },
    { partId: "part-1", value: { from: "node-2", to: "node-4" } },
  ]);

  assert.deepEqual([...completed].sort(), ["node-3", "node-4"]);
});

test("same-parent range covers all leaves between neighbors", () => {
  const subject = {
    parts: [{ id: "part-1", name: "Leaf", position: 0 }],
    tocItems: [
      { id: "leaf-1", name: "1", parentId: null, subjectPartId: "part-1", position: 0 },
      { id: "leaf-2", name: "2", parentId: null, subjectPartId: "part-1", position: 1 },
      { id: "leaf-3", name: "3", parentId: null, subjectPartId: "part-1", position: 2 },
      { id: "leaf-4", name: "4", parentId: null, subjectPartId: "part-1", position: 3 },
    ],
  };

  const completed = resolveCompletedTocItems(subject.parts, subject.tocItems, [
    { partId: "part-1", value: { from: "leaf-2", to: "leaf-4" } },
  ]);

  assert.deepEqual([...completed].sort(), ["leaf-2", "leaf-3", "leaf-4"]);
});

test("real UI hierarchical Para/Surah/Ruku/Ayat range resolves valid leaves", () => {
  const subject = {
    parts: [
      { id: "para", name: "Para", position: 0 },
      { id: "surah", name: "Surah", position: 1 },
      { id: "ruku", name: "Ruku", position: 2 },
      { id: "ayat", name: "Ayat", position: 3 },
    ],
    tocItems: [
      { id: "para-1", name: "Para 1", parentId: null, subjectPartId: "para", position: 0 },
      { id: "para-2", name: "Para 2", parentId: null, subjectPartId: "para", position: 1 },
      { id: "para-3", name: "Para 3", parentId: null, subjectPartId: "para", position: 2 },
      { id: "surah-1-1", name: "Surah 1", parentId: "para-1", subjectPartId: "surah", position: 0 },
      { id: "surah-1-2", name: "Surah 2", parentId: "para-1", subjectPartId: "surah", position: 1 },
      { id: "surah-1-3", name: "Surah 3", parentId: "para-1", subjectPartId: "surah", position: 2 },
      { id: "surah-2-1", name: "Surah 1", parentId: "para-2", subjectPartId: "surah", position: 0 },
      { id: "surah-2-2", name: "Surah 2", parentId: "para-2", subjectPartId: "surah", position: 1 },
      { id: "surah-3-1", name: "Surah 1", parentId: "para-3", subjectPartId: "surah", position: 0 },
      { id: "surah-3-2", name: "Surah 2", parentId: "para-3", subjectPartId: "surah", position: 1 },
      { id: "ruku-1-1", name: "Ruku 1", parentId: "surah-1-1", subjectPartId: "ruku", position: 0 },
      { id: "ruku-1-2", name: "Ruku 2", parentId: "surah-1-1", subjectPartId: "ruku", position: 1 },
      { id: "ruku-2-1", name: "Ruku 1", parentId: "surah-2-1", subjectPartId: "ruku", position: 0 },
      { id: "ruku-3-1", name: "Ruku 1", parentId: "surah-3-1", subjectPartId: "ruku", position: 0 },
      { id: "ayat-1-1-1", name: "Ayat 1", parentId: "ruku-1-1", subjectPartId: "ayat", position: 0 },
      { id: "ayat-1-1-2", name: "Ayat 2", parentId: "ruku-1-1", subjectPartId: "ayat", position: 1 },
      { id: "ayat-1-2-1", name: "Ayat 1", parentId: "ruku-1-2", subjectPartId: "ayat", position: 0 },
      { id: "ayat-1-2-2", name: "Ayat 2", parentId: "ruku-1-2", subjectPartId: "ayat", position: 1 },
      { id: "ayat-2-1-1", name: "Ayat 1", parentId: "ruku-2-1", subjectPartId: "ayat", position: 0 },
      { id: "ayat-2-1-2", name: "Ayat 2", parentId: "ruku-2-1", subjectPartId: "ayat", position: 1 },
      { id: "ayat-3-1-1", name: "Ayat 1", parentId: "ruku-3-1", subjectPartId: "ayat", position: 0 },
      { id: "ayat-3-1-2", name: "Ayat 2", parentId: "ruku-3-1", subjectPartId: "ayat", position: 1 },
    ],
  };

  const completed = resolveCompletedTocItems(subject.parts, subject.tocItems, [
    { partId: "para", value: { from: "para-1", to: "para-3" } },
    { partId: "surah", value: { from: "surah-1-2", to: "surah-3-2" } },
    { partId: "ruku", value: { from: "ruku-1-2", to: "ruku-3-1" } },
    { partId: "ayat", value: { from: "ayat-1-2-1", to: "ayat-3-1-2" } },
  ]);

  assert.ok(completed.has("ayat-1-2-1"));
  assert.ok(completed.has("ayat-3-1-2"));
  assert.ok(completed.size >= 8);
});

test("parent-only Quran-style case expands to all descendant leaves", () => {
  const subject = {
    parts: [
      { id: "para", name: "Para", position: 0 },
      { id: "surah", name: "Surah", position: 1 },
      { id: "ruku", name: "Ruku", position: 2 },
      { id: "ayat", name: "Ayat", position: 3 },
    ],
    tocItems: [
      { id: "para-1", name: "Para 1", parentId: null, subjectPartId: "para", position: 0 },
      { id: "para-2", name: "Para 2", parentId: null, subjectPartId: "para", position: 1 },
      { id: "para-3", name: "Para 3", parentId: null, subjectPartId: "para", position: 2 },
      { id: "surah-1", name: "Surah 1", parentId: "para-1", subjectPartId: "surah", position: 0 },
      { id: "surah-2", name: "Surah 2", parentId: "para-2", subjectPartId: "surah", position: 0 },
      { id: "surah-3", name: "Surah 3", parentId: "para-3", subjectPartId: "surah", position: 0 },
      { id: "ruku-1", name: "Ruku 1", parentId: "surah-1", subjectPartId: "ruku", position: 0 },
      { id: "ruku-2", name: "Ruku 2", parentId: "surah-2", subjectPartId: "ruku", position: 0 },
      { id: "ruku-3", name: "Ruku 3", parentId: "surah-3", subjectPartId: "ruku", position: 0 },
      { id: "ayat-1", name: "Ayat 1", parentId: "ruku-1", subjectPartId: "ayat", position: 0 },
      { id: "ayat-2", name: "Ayat 2", parentId: "ruku-2", subjectPartId: "ayat", position: 0 },
      { id: "ayat-3", name: "Ayat 3", parentId: "ruku-3", subjectPartId: "ayat", position: 0 },
    ],
  };

  const completed = resolveCompletedTocItems(subject.parts, subject.tocItems, [
    { partId: "para", value: { from: "para-1", to: "para-3" } },
  ]);

  assert.deepEqual([...completed].sort(), ["ayat-1", "ayat-2", "ayat-3"]);
});

test("invalid node ids are ignored", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: "missing-node" },
    { partId: "part-1", value: { from: "missing-node", to: "node-4" } },
  ]);

  assert.deepEqual([...completed], []);
});

test("multiple hierarchy depths are handled generically", () => {
  const subjectCompleted = new Set(["node-3", "node-6"]);
  const completion = calculateSubjectCompletion(parts, tocItems, subjectCompleted);

  assert.equal(completion.totalLeaves, 3);
  assert.equal(completion.completedLeaves, 2);
  assert.equal(completion.percentage, 66.67);

  const partStats = calculatePartCompletion(parts, tocItems, subjectCompleted);
  assert.deepEqual(partStats.map((part) => ({ partId: part.partId, completed: part.completed, total: part.total })), [
    { partId: "part-1", completed: 1, total: 2 },
    { partId: "part-2", completed: 1, total: 1 },
  ]);
});

test("empty TOC produces zero completion", () => {
  const completed = resolveCompletedTocItems(parts, [], [
    { partId: "part-1", value: "node-1" },
  ]);

  assert.deepEqual([...completed], []);

  const subjectCompletion = calculateSubjectCompletion(parts, [], new Set());
  assert.equal(subjectCompletion.totalLeaves, 0);
  assert.equal(subjectCompletion.completedLeaves, 0);
  assert.equal(subjectCompletion.percentage, 0);
});

test("invalid values are ignored", () => {
  const completed = resolveCompletedTocItems(parts, tocItems, [
    { partId: "part-1", value: "missing-node" },
    { partId: "part-1", value: { from: "missing-node", to: "node-4" } },
    { partId: "part-1", value: { from: "", to: "node-4" } },
  ]);

  assert.deepEqual([...completed], []);
});

test("current position reflects the highest completed position for each part", () => {
  const position = getCurrentSubjectPosition(parts, tocItems, new Set(["node-3", "node-4", "node-6"]));

  assert.deepEqual(position, {
    "part-1": 3,
    "part-2": 1,
  });
});
