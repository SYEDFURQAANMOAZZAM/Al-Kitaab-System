"use client";

import { useMemo, useState } from "react";
import type { ComponentProps } from "react";

import { SubjectsList } from "./SubjectsList";

type Subjects = ComponentProps<typeof SubjectsList>["subjects"];

type Props = {
  subjects: Subjects;
};

const CLASSES = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "other"
] as const;

const SUBJECTS = [
  "mathematics",
  "science",
  "social",
  "evs",
  "english",
  "urdu",
  "telugu",
  "arabic",
  "hifz",
  "nazira",
  "qaida",
  "deeniyat",
] as const;

const BOARDS = ["cbse", "ssc", "icse"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildRegex(
  search: string,
  selectedClass: string,
  selectedSubject: string,
  selectedBoard: string,
) {
  const conditions: string[] = [];

  const searchValue = normalize(search);
  const classValue = normalize(selectedClass);
  const subjectValue = normalize(selectedSubject);
  const boardValue = normalize(selectedBoard);

  if (searchValue) {
    conditions.push(`(?=.*${escapeRegex(searchValue)})`);
  }

  if (classValue) {
    conditions.push(`(?=.*${escapeRegex(classValue)})`);
  }

  if (subjectValue) {
    conditions.push(`(?=.*${escapeRegex(subjectValue)})`);
  }

  if (boardValue) {
    conditions.push(`(?=.*${escapeRegex(boardValue)})`);
  }

  if (conditions.length === 0) {
    return null;
  }

  return new RegExp(`^${conditions.join("")}.*$`, "i");
}

export function SubjectsFilter({ subjects }: Props) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");

  const filteredSubjects = useMemo(() => {
    const regex = buildRegex(
      search,
      selectedClass,
      selectedSubject,
      selectedBoard,
    );

    if (!regex) {
      return subjects;
    }

    return subjects.filter((subject) => regex.test(subject.name));
  }, [
    subjects,
    search,
    selectedClass,
    selectedSubject,
    selectedBoard,
  ]);

  const hasFilters =
    search ||
    selectedClass ||
    selectedSubject ||
    selectedBoard;

  function clearFilters() {
    setSearch("");
    setSelectedClass("");
    setSelectedSubject("");
    setSelectedBoard("");
  }

  return (
    <div className="space-y-5">
      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(150px,180px))]">
          {/* Search */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject-search"
              className="text-sm font-medium"
            >
              Search
            </label>

            <input
              id="subject-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject names..."
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Class */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject-class"
              className="text-sm font-medium"
            >
              Class
            </label>

            <select
              id="subject-class"
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">All classes</option>

              {CLASSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject-type"
              className="text-sm font-medium"
            >
              Subject
            </label>

            <select
              id="subject-type"
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">All subjects</option>

              {SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Board */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject-board"
              className="text-sm font-medium"
            >
              Board
            </label>

            <select
              id="subject-board"
              value={selectedBoard}
              onChange={(event) => setSelectedBoard(event.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            >
              <option value="">All boards</option>

              {BOARDS.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter status */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {filteredSubjects.length}{" "}
            {filteredSubjects.length === 1 ? "subject" : "subjects"} found
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          FILTERED SUBJECTS
      ===================================================== */}

      <SubjectsList subjects={filteredSubjects} />
    </div>
  );
}