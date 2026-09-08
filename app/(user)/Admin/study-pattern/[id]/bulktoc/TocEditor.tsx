// app/(user)/Admin/study-pattern/[id]/toc/toc-editor.tsx

"use client";

import {
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  addTocItem,
  deleteTocItem,
} from "@/app/ServerActions/patternOperations/toc";

import {
  importToc,
} from "@/app/ServerActions/patternOperations/bulkToc";

type Part = {
  id: string;
  name: string;
  position: number;
};

type Item = {
  id: string;
  name: string;
  parentId: string | null;
  patternArrId: string;
  position: number;
};

type Pattern = {
  id: string;
  name: string;
  patternArr: Part[];
  tocItems: Item[];
};

export default function TocEditor({
  pattern,
}: {
  pattern: Pattern;
}) {
  const router = useRouter();

  const [
    pending,
    startTransition,
  ] = useTransition();

  const [
    drafts,
    setDrafts,
  ] = useState<
    Record<string, string>
  >({});

  const [
    expanded,
    setExpanded,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    showAdd,
    setShowAdd,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    showBulk,
    setShowBulk,
  ] = useState(false);

  const [
    showRules,
    setShowRules,
  ] = useState(false);

  const [
    bulkText,
    setBulkText,
  ] = useState("");

  const children = (
    parentId: string | null,
  ) =>
    pattern.tocItems
      .filter(
        (item) =>
          item.parentId === parentId,
      )
      .sort(
        (a, b) =>
          a.position - b.position,
      );

  const rootItems =
    children(null);

  const getDraftKey = (
    partId: string,
    parentId: string | null,
  ) =>
    `${partId}-${
      parentId ?? "root"
    }`;

  const toggleExpanded = (
    id: string,
  ) => {
    setExpanded(
      (current) => ({
        ...current,
        [id]:
          !(
            current[id] ??
            false
          ),
      }),
    );
  };

  const openAdd = (
    id: string,
  ) => {
    setShowAdd(
      (current) => ({
        ...current,
        [id]: true,
      }),
    );

    setExpanded(
      (current) => ({
        ...current,
        [id]: true,
      }),
    );
  };

  const closeAdd = (
    id: string,
  ) => {
    setShowAdd(
      (current) => ({
        ...current,
        [id]: false,
      }),
    );
  };

  /*
   * --------------------------------------------------------
   * SINGLE SAVE
   * --------------------------------------------------------
   */
  const addItem = (
    part: Part,
    parentId: string | null,
    afterSuccess?: () => void,
  ) => {
    const key =
      getDraftKey(
        part.id,
        parentId,
      );

    const name =
      drafts[key]?.trim();

    if (!name) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await addTocItem({
            patternId:
              pattern.id,

            patternArrId:
              part.id,

            parentId,

            name,
          });

        if (!result.success) {
          alert(
            result.error ??
              "Failed to add TOC item.",
          );

          return;
        }

        setDrafts(
          (current) => ({
            ...current,
            [key]: "",
          }),
        );

        afterSuccess?.();

        router.refresh();
      },
    );
  };

  /*
   * --------------------------------------------------------
   * SINGLE DELETE
   * --------------------------------------------------------
   */
  const removeItem = (
    item: Item,
  ) => {
    if (
      !window.confirm(
        `Remove "${item.name}"?\n\nAll child items will also be removed.`,
      )
    ) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await deleteTocItem(
            item.id,
          );

        if (!result.success) {
  alert("Failed to remove TOC item.");
  return;
}

        router.refresh();
      },
    );
  };

  /*
   * --------------------------------------------------------
   * BULK SAVE
   *
   * One server action call.
   * No addTocItem() calls.
   * --------------------------------------------------------
   */
  const saveBulk = () => {
    if (!bulkText.trim()) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await importToc({
            patternId:
              pattern.id,

            text: bulkText,
          });

        if (!result.success) {
          alert(
            result.error ??
              "Failed to import TOC.",
          );

          return;
        }

        setBulkText("");

        setShowBulk(false);

        router.refresh();
      },
    );
  };

  const copyRules = async () => {
    const rules =
      getRulesText(pattern);

    await navigator.clipboard.writeText(
      rules,
    );
  };

  /*
   * --------------------------------------------------------
   * TREE NODE
   * --------------------------------------------------------
   */
  const renderNode = (
    item: Item,
  ): React.ReactNode => {
    const part =
      pattern.patternArr.find(
        (x) =>
          x.id ===
          item.patternArrId,
      );

    if (!part) {
      return null;
    }

    const itemChildren =
      children(item.id);

    const childPart =
      pattern.patternArr.find(
        (x) =>
          x.position ===
          part.position + 1,
      );

    const isExpanded =
      expanded[item.id] ??
      false;

    const addKey =
      getDraftKey(
        childPart?.id ?? "",
        item.id,
      );

    return (
      <div
        key={item.id}
        className="overflow-hidden rounded-lg border bg-background"
      >
        <div className="flex min-h-[56px] flex-wrap items-center gap-2.5 px-3 py-2 sm:px-4">
          {itemChildren.length >
          0 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                toggleExpanded(
                  item.id,
                )
              }
              className="rounded p-1 hover:bg-muted"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="min-w-0 break-words text-sm font-semibold">
                {item.name}
              </span>

              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {part.name}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {childPart && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  openAdd(
                    item.id,
                  )
                }
                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              >
                <Plus className="mr-1 inline h-3 w-3" />
                {childPart.name}
              </button>
            )}

            <button
              type="button"
              disabled={pending}
              onClick={() =>
                removeItem(
                  item,
                )
              }
              className="rounded-md p-1.5 text-destructive hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(showAdd[item.id] || (isExpanded && itemChildren.length > 0)) && (
          <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
            {showAdd[item.id] && childPart && (
            <div className="mb-3 rounded-lg border bg-background p-3">
              <div className="mb-2">
                <p className="text-xs font-semibold">
                  Add {childPart.name}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Under {item.name}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={
                  drafts[addKey] ??
                  ""
                }
                onChange={(e) =>
                  setDrafts(
                    (current) => ({
                      ...current,
                      [addKey]:
                        e.target.value,
                    }),
                  )
                }
                placeholder={`Enter ${childPart.name}`}
                disabled={pending}
                className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2"
              />

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  addItem(
                    childPart,
                    item.id,
                    () =>
                      closeAdd(
                        item.id,
                      ),
                  )
                }
                className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
              >
                Save
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  closeAdd(
                    item.id,
                  )
                }
                className="h-9 rounded-md border px-3 text-sm"
              >
                Cancel
              </button>
              </div>
            </div>
            )}

            {isExpanded && (
          <div className="space-y-2 border-l-2 border-muted pl-3 sm:pl-4">
            {itemChildren.map(
              renderNode,
            )}
          </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin" />

            <span className="font-medium">
              Saving TOC...
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full px-2 py-2 sm:px-3 sm:py-3">
        {/* HEADER */}
        <div className="mb-4">
            <Link
              href={`/Admin/study-pattern/${pattern.id}`}
              className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to {pattern.name}
            </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold sm:text-2xl">
                  {pattern.name}
                </h1>

                <p className="mt-0.5 text-sm text-muted-foreground">Pattern TOC</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  setShowRules(true)
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted sm:px-4"
              >
                <Info className="h-4 w-4" />
                Rules
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  setShowBulk(true)
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 sm:px-4"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </button>
            </div>
          </div>
        </div>

        {/* CURRENT TOC */}
        <section className="rounded-lg border bg-background">
          <div className="flex flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
            <h2 className="text-sm font-semibold">
              Table of Contents
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Add individual items or use Bulk Import for the entire TOC.
            </p>
            </div>
          </div>

          <div className="space-y-2 p-3 sm:p-4">
            {rootItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center sm:p-8">
                <p className="font-medium">
                  No TOC items yet.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Use Bulk Import to create the complete TOC.
                </p>
              </div>
            ) : (
              rootItems.map(
                renderNode,
              )
            )}
          </div>
        </section>
      </div>

      {/* -------------------------------------------------- */}
      {/* RULES DIALOG */}
      {/* -------------------------------------------------- */}

      {showRules && (
        <Dialog
          title="Pattern TOC Rules"
          onClose={() =>
            setShowRules(false)
          }
        >
          <div className="space-y-5">
            <RulesContent
              pattern={pattern}
            />

            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyRules}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
                Copy Rules
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowRules(false)
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* -------------------------------------------------- */}
      {/* BULK DIALOG */}
      {/* -------------------------------------------------- */}

      {showBulk && (
        <Dialog
          title="Bulk Import TOC"
          onClose={() =>
            !pending &&
            setShowBulk(false)
          }
          wide
        >
          <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
              <p className="text-sm">
                Enter the complete TOC using the rules shown below.
              </p>

              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs">
{getExampleText(pattern)}
              </pre>
            </div>

            <textarea
              value={bulkText}
              onChange={(e) =>
                setBulkText(
                  e.target.value,
                )
              }
              disabled={pending}
              spellCheck={false}
              placeholder={getExampleText(pattern)}
              className="min-h-[320px] w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm leading-6 outline-none focus:ring-2 sm:min-h-[500px] sm:p-4"
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  setShowBulk(false)
                }
                className="rounded-lg border px-4 py-2 text-sm sm:min-w-24"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  pending ||
                  !bulkText.trim()
                }
                onClick={saveBulk}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 sm:min-w-40"
              >
                {pending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Save Entire TOC
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  );
}

/* ============================================================
   DIALOG
   ============================================================ */

function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div
        className={`max-h-[90vh] w-full overflow-hidden rounded-xl border bg-card shadow-2xl ${
          wide
            ? "max-w-5xl"
            : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <h2 className="min-w-0 truncate font-semibold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-70px)] overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RULES
   ============================================================ */

function RulesContent({
  pattern,
}: {
  pattern: Pattern;
}) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h3 className="mb-2 font-semibold">
          1. Pattern part names
        </h3>

        <p className="text-muted-foreground">
          Every line must start with one of the PatternArr names for this pattern.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{pattern.patternArr
  .map(
    (part) =>
      `${"    ".repeat(part.position)}${part.name}:value`,
  )
  .join("\n")}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          2. Indentation defines hierarchy
        </h3>

        <p className="text-muted-foreground">
          Use exactly 4 spaces for every hierarchy level.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{pattern.patternArr
  .map(
    (part) =>
      `${"    ".repeat(part.position)}${part.name}:example`,
  )
  .join("\n")}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          3. Normal value
        </h3>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`${pattern.patternArr[0]?.name ?? "Para"}:1 Example`}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          4. Range value
        </h3>

        <p className="text-muted-foreground">
          A range is written as:
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`range(i=1-10):{i}`}
        </pre>

        <p className="mt-2 text-muted-foreground">
          The letter can be any single variable name, such as{" "}
          <code>i</code> or <code>n</code>.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
{`range(i=1-10):Exercise {i}`}
        </pre>

        <p className="mt-2 text-muted-foreground">
          produces Exercise1, Exercise2, ... Exercise10.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          5. Complete example
        </h3>

        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 leading-6">
{getExampleText(pattern)}
        </pre>
      </div>
    </div>
  );
}

function getRulesText(
  pattern: Pattern,
) {
  return `PATTERN TOC RULES

Pattern hierarchy:
${pattern.patternArr
  .map(
    (part) =>
      `${"    ".repeat(part.position)}${part.name}:value`,
  )
  .join("\n")}

RULES

1. Use PatternArr names exactly as defined by this pattern.

2. Use 4 spaces for every hierarchy level.

3. A child must be indented exactly one level below its parent.

4. Normal value:
${pattern.patternArr[0]?.name ?? "Para"}:1 Example

5. Range:
range(i=1-10):{i}

6. Range with text:
range(i=1-10):Exercise {i}

The variable can be any letter such as i or n.

7. The entire TOC is validated before anything is saved.

EXAMPLE

${getExampleText(pattern)}
`;
}

function getExampleText(
  pattern: Pattern,
) {
  const parts =
    [...pattern.patternArr].sort(
      (a, b) =>
        a.position -
        b.position,
    );

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return `${parts[0].name}:range:i(i=1-10)`;
  }

  if (parts.length === 2) {
    return `${parts[0].name}:1 Example
    ${parts[1].name}:range:i(i=1-10)`;
  }

  if (parts.length === 3) {
    return `${parts[0].name}:1 Example
    ${parts[1].name}:range:i(i=1-2)
        ${parts[2].name}:range:i(i=1-3)`;
  }

  return parts
    .map(
      (part) =>
        `${"    ".repeat(part.position)}${part.name}:Example`,
    )
    .join("\n");
}