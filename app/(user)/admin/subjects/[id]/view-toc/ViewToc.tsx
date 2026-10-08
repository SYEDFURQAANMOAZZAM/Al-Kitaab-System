"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

type TocItem = {
  id: string;
  subjectPartId: string;
  parentId: string | null;
  name: string;
  position: number;
};

type SubjectPart = {
  id: string;
  name: string;
  position: number;
};

type ViewTocProps = {
  subjectName: string;
  parts: SubjectPart[];
  tocItems: TocItem[];
};

export default function ViewToc({
  subjectName,
  parts,
  tocItems,
}: ViewTocProps) {
  const [copied, setCopied] = useState(false);

  const tocText = useMemo(
    () => buildTocText(parts, tocItems),
    [parts, tocItems]
  );

  async function handleCopy() {
    if (!tocText) return;

    await navigator.clipboard.writeText(tocText);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* Subject */}
      <div className="space-y-2">
        <label
          htmlFor="subjectName"
          className="text-sm font-medium"
        >
          Subject
        </label>

        <Input
          id="subjectName"
          value={subjectName}
          disabled
          className="disabled:bg-background disabled:text-foreground disabled:opacity-100"
        />
      </div>

      {/* TOC */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Table of Contents
        </label>

        <div className="rounded-lg border bg-background p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">
            {tocText || "No TOC items found."}
          </pre>
        </div>
      </div>

      {/* Copy */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!tocText}
          className={buttonVariants()}
        >
          {copied ? "Copied" : "Copy TOC"}
        </button>
      </div>
    </div>
  );
}

function buildTocText(
  parts: SubjectPart[],
  tocItems: TocItem[]
): string {
  const lines: string[] = [];

  const sortedParts = [...parts].sort(
    (a, b) => a.position - b.position
  );

  /*
   * Build a lookup so every TOC item can find
   * the SubjectPart it belongs to.
   */
  const partMap = new Map(
    sortedParts.map((part) => [
      part.id,
      part,
    ])
  );

  /*
   * Each SubjectPart owns the root TOC items.
   */
  for (const part of sortedParts) {
    const rootItems = tocItems
      .filter(
        (item) =>
          item.subjectPartId === part.id &&
          item.parentId === null
      )
      .sort(
        (a, b) => a.position - b.position
      );

    for (const item of rootItems) {
      addTocItem(
        item,
        tocItems,
        partMap,
        0,
        lines
      );
    }
  }

  return lines.join("\n");
}

function addTocItem(
  item: TocItem,
  allItems: TocItem[],
  partMap: Map<string, SubjectPart>,
  depth: number,
  lines: string[]
) {
  const part = partMap.get(item.subjectPartId);

  /*
   * Every TOC item is displayed as:
   *
   * SubjectPartName:TocItemName
   *
   * Example:
   * Para:1 الم
   * Surah:الفاتحة
   * Ruku:1
   * Ayat:1
   */
  const label = part
    ? `${part.name}:${item.name}`
    : item.name;

  const indentation = "   ".repeat(depth);

  lines.push(
    `${indentation}${label}`
  );

  const children = allItems
    .filter(
      (child) => child.parentId === item.id
    )
    .sort(
      (a, b) => a.position - b.position
    );

  for (const child of children) {
    addTocItem(
      child,
      allItems,
      partMap,
      depth + 1,
      lines
    );
  }
}