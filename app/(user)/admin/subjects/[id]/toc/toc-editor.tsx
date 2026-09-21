"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExampleText } from "./toc-rules";

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  addTocItem,
  deleteTocItem,
  updateTocItem,
} from "@/app/ServerActions/subjectOperations/toc";

import { importToc } from "@/app/ServerActions/subjectOperations/bulkToc";

/* ============================================================
   TYPES
============================================================ */

type Part = {
  id: string;
  name: string;
  position: number;
};

type Item = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

type Subject = {
  id: string;
  name: string;
  parts: Part[];
  tocItems: Item[];
};

/* ============================================================
   COMPONENT
============================================================ */

export default function TocEditor({
  subject,
}: {
  subject: Subject;
}) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [showAdd, setShowAdd] = useState<Record<string, boolean>>({});

  const [showBulk, setShowBulk] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [bulkText, setBulkText] = useState("");

  /* ============================================================
     SORTED PARTS
  ============================================================ */

  const parts = [...subject.parts].sort(
    (a, b) => a.position - b.position,
  );

  /* ============================================================
     TREE HELPERS
  ============================================================ */

  const children = (parentId: string | null) => {
    return subject.tocItems
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.position - b.position);
  };

  const rootItems = children(null);

  const getPart = (partId: string) => {
    return parts.find((part) => part.id === partId);
  };

  const getChildPart = (part: Part) => {
    return parts.find(
      (child) => child.position === part.position + 1,
    );
  };

  /*
   * Direct children only.
   *
   * Example:
   *
   * Para 1
   *   ├── Surah A
   *   ├── Surah B
   *   └── Surah C
   *
   * Para 1 => 3 Surahs
   */
  const getChildCount = (item: Item) => {
    return children(item.id).length;
  };

  const getDraftKey = (
    partId: string,
    parentId: string | null,
  ) => {
    return `${partId}-${parentId ?? "root"}`;
  };

  /* ============================================================
     EXPAND / COLLAPSE
  ============================================================ */

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({
      ...current,
      [id]: !(current[id] ?? false),
    }));
  };

  /* ============================================================
     ADD UI
  ============================================================ */

  const openAdd = (id: string) => {
    setShowAdd((current) => ({
      ...current,
      [id]: true,
    }));

    setExpanded((current) => ({
      ...current,
      [id]: true,
    }));
  };

  const closeAdd = (id: string) => {
    setShowAdd((current) => ({
      ...current,
      [id]: false,
    }));
  };

  /* ============================================================
     ADD ITEM
  ============================================================ */

  const addItem = (
    part: Part,
    parentId: string | null,
    afterSuccess?: () => void,
  ) => {
    const key = getDraftKey(part.id, parentId);

    const name = drafts[key]?.trim();

    if (!name) {
      return;
    }

    startTransition(async () => {
      const result = await addTocItem({
        subjectId: subject.id,
        subjectPartId: part.id,
        parentId,
        name,
      });

      if (!result.success) {
        alert(result.error ?? "Failed to add TOC item.");
        return;
      }

      setDrafts((current) => ({
        ...current,
        [key]: "",
      }));

      afterSuccess?.();

      router.refresh();
    });
  };

  /* ============================================================
     EDIT
  ============================================================ */

  const startEdit = (item: Item) => {
    setEditing((current) => ({
      ...current,
      [item.id]: true,
    }));

    setEditDrafts((current) => ({
      ...current,
      [item.id]: item.name,
    }));
  };

  const cancelEdit = (id: string) => {
    setEditing((current) => ({
      ...current,
      [id]: false,
    }));
  };

  const saveEdit = (item: Item) => {
    const name = editDrafts[item.id]?.trim();

    if (!name) {
      return;
    }

    startTransition(async () => {
      const result = await updateTocItem({
        id: item.id,
        name,
      });

      if (!result.success) {
        alert(result.error ?? "Failed to update TOC item.");
        return;
      }

      setEditing((current) => ({
        ...current,
        [item.id]: false,
      }));

      router.refresh();
    });
  };

  /* ============================================================
     DELETE
  ============================================================ */

  const removeItem = (item: Item) => {
    if (
      !window.confirm(
        `Remove "${item.name}"?\n\nAll child items will also be removed.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTocItem(item.id);

      if (!result.success) {
        alert(result.error ?? "Failed to remove TOC item.");
        return;
      }

      router.refresh();
    });
  };

  /* ============================================================
     BULK IMPORT
  ============================================================ */

  const saveBulk = () => {
    const value = bulkText.trim();

    if (!value) {
      return;
    }

    startTransition(async () => {
      const result = await importToc({
        subjectId: subject.id,
        text: value,
      });

      if (!result.success) {
        alert(result.error ?? "Failed to import TOC.");
        return;
      }

      setBulkText("");
      setShowBulk(false);

      router.refresh();
    });
  };

  /* ============================================================
     COPY RULES
  ============================================================ */

  const copyRules = async () => {
    const rules = getRulesText(subject);

    try {
      await navigator.clipboard.writeText(rules);
    } catch {
      alert("Could not copy rules.");
    }
  };

  /* ============================================================
     TREE NODE
  ============================================================ */

  const renderNode = (item: Item): React.ReactNode => {
    const part = getPart(item.subjectPartId);

    if (!part) {
      return null;
    }

    const itemChildren = children(item.id);
    const childCount = itemChildren.length;

    const childPart = getChildPart(part);

    const isExpanded = expanded[item.id] ?? false;

    const isEditing = editing[item.id] ?? false;

    const addKey = getDraftKey(
      childPart?.id ?? "",
      item.id,
    );

    return (
      <div
        key={item.id}
        className="overflow-hidden rounded-lg border bg-background"
      >
        {/* ====================================================
            ITEM HEADER
        ==================================================== */}

        <div
          role={childCount > 0 ? "button" : undefined}
          tabIndex={childCount > 0 ? 0 : undefined}
          onClick={() => {
            if (childCount > 0 && !isEditing) {
              toggleExpanded(item.id);
            }
          }}
          onKeyDown={(event) => {
            if (
              childCount > 0 &&
              !isEditing &&
              (event.key === "Enter" ||
                event.key === " ")
            ) {
              event.preventDefault();
              toggleExpanded(item.id);
            }
          }}
          className={[
            "flex min-h-[64px] flex-wrap items-center gap-2.5 px-3 py-2 sm:px-4",
            childCount > 0
              ? "cursor-pointer select-none hover:bg-muted/40"
              : "",
          ].join(" ")}
        >
          {/* CHEVRON */}

          <div className="flex w-6 shrink-0 items-center justify-center">
            {childCount > 0 ? (
              <span className="rounded-md p-1 text-muted-foreground">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            ) : (
              <span className="h-6 w-6" />
            )}
          </div>

          {/* NAME + COUNT */}

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div
                className="flex min-w-0 gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  value={editDrafts[item.id] ?? ""}
                  onChange={(event) =>
                    setEditDrafts((current) => ({
                      ...current,
                      [item.id]: event.target.value,
                    }))
                  }
                  disabled={pending}
                  autoFocus
                  className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <button
                  type="button"
                  disabled={
                    pending ||
                    !editDrafts[item.id]?.trim()
                  }
                  onClick={() => saveEdit(item)}
                  className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  aria-label="Save"
                >
                  <Check className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() => cancelEdit(item.id)}
                  className="rounded-md border p-2 hover:bg-muted"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 break-words text-sm font-semibold">
                    {item.name}
                  </span>

                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {part.name}
                  </span>
                </div>

                {/* CHILD COUNT */}

                {childCount > 0 && childPart && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {childCount}{" "}
                    {childPart.name}
                    {childCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ACTIONS */}

          {!isEditing && (
            <div
              className="flex shrink-0 items-center gap-0.5"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {childPart && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openAdd(item.id)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  {childPart.name}
                </button>
              )}

              <button
                type="button"
                disabled={pending}
                onClick={() => startEdit(item)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={() => removeItem(item)}
                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ====================================================
            CHILDREN / ADD
        ==================================================== */}

        {(showAdd[item.id] ||
          (isExpanded && childCount > 0)) && (
          <div className="border-t bg-muted/20 px-3 py-3 sm:px-4">
            {/* ADD CHILD */}

            {showAdd[item.id] && childPart && (
              <div className="mb-3 rounded-lg border bg-background p-3">
                <p className="text-xs font-semibold">
                  Add {childPart.name}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Under {item.name}
                </p>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={drafts[addKey] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [addKey]: event.target.value,
                      }))
                    }
                    placeholder={`Enter ${childPart.name}`}
                    disabled={pending}
                    className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <button
                    type="button"
                    disabled={
                      pending ||
                      !drafts[addKey]?.trim()
                    }
                    onClick={() =>
                      addItem(
                        childPart,
                        item.id,
                        () => closeAdd(item.id),
                      )
                    }
                    className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      closeAdd(item.id)
                    }
                    className="h-9 rounded-md border px-3 text-sm hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* CHILDREN */}

            {isExpanded && childCount > 0 && (
              <div className="space-y-2 border-l-2 border-muted pl-3 sm:pl-4">
                {itemChildren.map(renderNode)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ============================================================
     ROOT ADD
  ============================================================ */

  const firstPart = parts[0];

  const rootDraftKey = firstPart
    ? getDraftKey(firstPart.id, null)
    : "";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-background">
      {/* ======================================================
          SAVING OVERLAY
      ====================================================== */}

      {pending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />

            <span className="font-medium">
              Saving TOC...
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full px-2 py-2 sm:px-3 sm:py-3">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-4">
          <Link
            href={`/admin/subjects/${subject.id}`}
            className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to {subject.name}
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold sm:text-2xl">
                  {subject.name}
                </h1>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Subject TOC
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowRules(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted sm:px-4"
              >
                <Info className="h-4 w-4" />
                Rules
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={() => setShowBulk(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4"
              >
                <Upload className="h-4 w-4" />
                Bulk Import
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            CURRENT TOC
        ==================================================== */}

        <section className="rounded-lg border bg-background">
          <div className="border-b px-3 py-3 sm:px-4">
            <h2 className="text-sm font-semibold">
              Table of Contents
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Click an item to expand or collapse it.
            </p>
          </div>

          <div className="space-y-2 p-3 sm:p-4">
            {/* ROOT ADD */}

            {firstPart && (
              <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold">
                  Add {firstPart.name}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={drafts[rootDraftKey] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [rootDraftKey]:
                          event.target.value,
                      }))
                    }
                    placeholder={`Enter ${firstPart.name}`}
                    disabled={pending}
                    className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <button
                    type="button"
                    disabled={
                      pending ||
                      !drafts[rootDraftKey]?.trim()
                    }
                    onClick={() =>
                      addItem(firstPart, null)
                    }
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* TREE */}

            {rootItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center sm:p-8">
                <p className="font-medium">
                  No TOC items yet.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add the first{" "}
                  {firstPart?.name ?? "TOC item"}{" "}
                  or use Bulk Import.
                </p>
              </div>
            ) : (
              rootItems.map(renderNode)
            )}
          </div>
        </section>
      </div>

      {/* ======================================================
          RULES DIALOG
      ====================================================== */}

      {showRules && (
        <Dialog
          title="Subject TOC Rules"
          onClose={() => setShowRules(false)}
        >
          <div className="space-y-5 text-sm">
            <RulesContent subject={subject} />

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
                onClick={() => setShowRules(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ======================================================
          BULK IMPORT DIALOG
      ====================================================== */}

      {showBulk && (
        <Dialog
          title="Bulk Import TOC"
          wide
          onClose={() =>
            !pending && setShowBulk(false)
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
              <p className="text-sm">
                Add additional TOC items using
                the rules below.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Existing TOC items will remain
                unchanged. Imported items are
                appended to the existing TOC.
              </p>

              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border bg-background p-3 text-xs leading-5">
                {getExampleText(subject)}
              </pre>
            </div>

            <textarea
              value={bulkText}
              onChange={(event) =>
                setBulkText(event.target.value)
              }
              disabled={pending}
              spellCheck={false}
              placeholder={getExampleText(subject)}
              className="min-h-[320px] w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-ring sm:min-h-[500px] sm:p-4"
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() => setShowBulk(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted sm:min-w-24"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  pending || !bulkText.trim()
                }
                onClick={saveBulk}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:min-w-40"
              >
                {pending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                Add TOC
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
          wide ? "max-w-5xl" : "max-w-2xl"
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
   RULES CONTENT
============================================================ */

function RulesContent({
  subject,
}: {
  subject: Subject;
}) {
  const parts = [...subject.parts].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-semibold">
          1. Subject part names
        </h3>

        <p className="text-muted-foreground">
          Every line must start with one of
          the SubjectPart names defined for
          this subject.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
          {parts
            .map((part) => `${part.name}:value`)
            .join("\n")}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          2. Hierarchy
        </h3>

        <p className="text-muted-foreground">
          Hierarchy is determined by the
          SubjectPart position. Indentation is
          optional and has no meaning.
        </p>

        <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3">
          {parts
            .map((part) => `${part.name}:example`)
            .join("\n")}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          3. Normal value
        </h3>

        <pre className="rounded-lg border bg-muted/40 p-3">
          {`${parts[0]?.name ?? "Lesson"}:1 Example`}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          4. Range value
        </h3>

        <p className="text-muted-foreground">
          A range uses this syntax:
        </p>

        <pre className="mt-2 rounded-lg border bg-muted/40 p-3">
          range(i=1-10):{"{i}"}
        </pre>

        <pre className="mt-2 rounded-lg border bg-muted/40 p-3">
          range(i=1-10):Exercise {"{i}"}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">
          5. Complete example
        </h3>

        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 leading-6">
          {getExampleText(subject)}
        </pre>
      </div>
    </div>
  );
}

/* ============================================================
   COPYABLE RULES
============================================================ */

function getRulesText(subject: Subject) {
  const parts = [...subject.parts].sort(
    (a, b) => a.position - b.position,
  );

  return `SUBJECT TOC RULES

Subject part names:
${parts
  .map((part) => `${part.name}:value`)
  .join("\n")}

HIERARCHY

Hierarchy is determined by SubjectPart position.
Indentation is optional and has no meaning.

${parts
  .map((part) => `${part.name}:example`)
  .join("\n")}

NORMAL VALUE

${parts[0]?.name ?? "Lesson"}:1 Example

RANGE VALUE

range(i=1-10):{i}

The variable is replaced only when it appears inside { }.

range(i=1-10):Exercise {i}

COMPLETE EXAMPLE

${getExampleText(subject)}
`;
}