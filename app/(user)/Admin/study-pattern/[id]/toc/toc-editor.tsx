"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ListTree,
  Plus,
  Trash2,
} from "lucide-react";

import {
  addTocItem,
  deleteTocItem,
} from "@/app/ServerActions/patternOperations/toc";

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
  const [pending, startTransition] = useTransition();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState<Record<string, boolean>>({});

  /*
   * Return children of a TOC item.
   */
  const getChildren = (parentId: string | null) => {
    return pattern.tocItems
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.position - b.position);
  };

  /*
   * Root-level TOC items.
   *
   * No useMemo is needed here.
   */
  const rootItems = pattern.tocItems
    .filter((item) => item.parentId === null)
    .sort((a, b) => a.position - b.position);

  const firstPart = pattern.patternArr[0];

  /*
   * Draft key for each add input.
   */
  const getDraftKey = (
    partId: string,
    parentId: string | null,
  ) => {
    return `${partId}-${parentId ?? "root"}`;
  };

  /*
   * Expand / collapse one node.
   */
  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({
      ...current,
      [id]: !(current[id] ?? false),
    }));
  };

  /*
   * Open child add form.
   */
  const openAdd = (id: string) => {
    setShowAdd((current) => ({
      ...current,
      [id]: true,
    }));

    // Opening Add should also expand the node.
    setExpanded((current) => ({
      ...current,
      [id]: true,
    }));
  };

  /*
   * Close child add form.
   */
  const closeAdd = (id: string) => {
    setShowAdd((current) => ({
      ...current,
      [id]: false,
    }));
  };

  /*
   * Add TOC item.
   */
  const addItem = (
    part: Part,
    parentId: string | null,
    afterSuccess?: () => void,
  ) => {
    const key = getDraftKey(part.id, parentId);
    const name = drafts[key]?.trim();

    if (!name) return;

    startTransition(async () => {
      const result = await addTocItem({
        patternId: pattern.id,
        patternArrId: part.id,
        parentId,
        name,
      });

      /*
       * Your current server action returns:
       * { success: boolean }
       *
       * So don't access result.error here.
       */
      if (!result.success) {
        alert("Failed to add TOC item.");
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

  /*
   * Delete TOC item.
   */
  const removeItem = (item: Item) => {
    const confirmed = window.confirm(
      `Remove "${item.name}"?\n\nAll of its child items will also be removed.`,
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteTocItem(item.id);

      /*
       * Your current server action returns:
       * { success: boolean }
       */
      if (!result.success) {
        alert("Failed to remove TOC item.");
        return;
      }

      router.refresh();
    });
  };

  /*
   * Expand every node.
   */
  const expandAll = () => {
    const next: Record<string, boolean> = {};

    for (const item of pattern.tocItems) {
      next[item.id] = true;
    }

    setExpanded(next);
  };

  /*
   * Collapse every node.
   */
  const collapseAll = () => {
    setExpanded({});
  };

  /*
   * Render one TOC node recursively.
   */
  const renderNode = (item: Item): ReactNode => {
    const part = pattern.patternArr.find(
      (current) => current.id === item.patternArrId,
    );

    if (!part) return null;

    const nextPart =
      pattern.patternArr[part.position + 1];

    const itemChildren = getChildren(item.id);

    const isExpanded = expanded[item.id] ?? false;
    const isAdding = showAdd[item.id] ?? false;

    return (
      <li key={item.id}>
        <div
          className={`
            overflow-hidden rounded-lg border
            bg-background
            transition-colors
            ${
              isExpanded
                ? "border-border"
                : "border-border/70"
            }
          `}
        >
          {/* ================================================= */}
          {/* NODE HEADER                                       */}
          {/* ================================================= */}

          <div
            role={nextPart ? "button" : undefined}
            tabIndex={nextPart ? 0 : undefined}
            onClick={() => {
              if (nextPart) {
                toggleExpanded(item.id);
              }
            }}
            onKeyDown={(event) => {
              if (
                nextPart &&
                (event.key === "Enter" ||
                  event.key === " ")
              ) {
                event.preventDefault();
                toggleExpanded(item.id);
              }
            }}
            className={`
              group flex min-h-[56px]
              items-center gap-2.5
              px-3 py-2 sm:px-4
              ${
                nextPart
                  ? "cursor-pointer select-none hover:bg-muted/40"
                  : ""
              }
            `}
          >
            {/* Expand / collapse */}

            {nextPart ? (
              <div
                className="
                  flex h-8 w-8 shrink-0
                  items-center justify-center
                  rounded-md
                  text-muted-foreground
                  transition-colors
                  group-hover:bg-muted
                  group-hover:text-foreground
                "
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            ) : (
              <div className="h-8 w-8 shrink-0" />
            )}

            {/* Level number */}

            <div
              className="
                hidden h-8 min-w-8 shrink-0
                items-center justify-center
                rounded-md bg-muted
                px-2
                text-[11px] font-semibold
                text-muted-foreground
                sm:flex
              "
            >
              {part.position + 1}
            </div>

            {/* Item information */}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm font-semibold">
                  {item.name}
                </span>

                <span
                  className="
                    rounded-full bg-muted
                    px-2 py-0.5
                    text-[10px] font-medium
                    uppercase tracking-wide
                    text-muted-foreground
                  "
                >
                  {part.name}
                </span>
              </div>

              {nextPart && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {itemChildren.length}{" "}
                  {itemChildren.length === 1
                    ? nextPart.name
                    : `${nextPart.name}s`}
                </p>
              )}
            </div>

            {/* ================================================= */}
            {/* ACTIONS                                           */}
            {/* ================================================= */}

            <div
              className="
                flex shrink-0
                items-center gap-0.5
              "
              onClick={(event) => {
                /*
                 * Prevent Add/Delete clicks from
                 * expanding or collapsing the node.
                 */
                event.stopPropagation();
              }}
            >
              {nextPart && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openAdd(item.id)}
                  className="
                    inline-flex h-8
                    items-center gap-1.5
                    rounded-md
                    px-2.5
                    text-xs font-medium
                    text-primary
                    transition-colors
                    hover:bg-primary/10
                    disabled:opacity-50
                  "
                >
                  <Plus className="h-3.5 w-3.5" />

                  <span className="hidden sm:inline">
                    Add {nextPart.name}
                  </span>

                  <span className="sm:hidden">
                    Add
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={pending}
                onClick={() => removeItem(item)}
                className="
                  flex h-8 w-8
                  items-center justify-center
                  rounded-md
                  text-muted-foreground
                  transition-colors
                  hover:bg-destructive/10
                  hover:text-destructive
                  disabled:opacity-50
                "
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ================================================= */}
          {/* CHILDREN                                          */}
          {/* ================================================= */}

          {nextPart && isExpanded && (
            <div
              className="
                border-t
                bg-muted/20
                px-3 py-3
                sm:px-4
              "
            >
              {/* ============================================= */}
              {/* ADD CHILD FORM                                 */}
              {/* ============================================= */}

              {isAdding && (
                <div
                  className="
                    mb-3
                    rounded-lg
                    border
                    bg-background
                    p-3
                  "
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <div className="mb-2">
                    <p className="text-xs font-semibold">
                      Add {nextPart.name}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Under {item.name}
                    </p>
                  </div>

                  <AddInput
                    part={nextPart}
                    value={
                      drafts[
                        getDraftKey(
                          nextPart.id,
                          item.id,
                        )
                      ] ?? ""
                    }
                    setValue={(value) =>
                      setDrafts((current) => ({
                        ...current,
                        [getDraftKey(
                          nextPart.id,
                          item.id,
                        )]: value,
                      }))
                    }
                    onAdd={() =>
                      addItem(
                        nextPart,
                        item.id,
                        () => closeAdd(item.id),
                      )
                    }
                    pending={pending}
                  />
                </div>
              )}

              {/* ============================================= */}
              {/* CHILD TREE                                     */}
              {/* ============================================= */}

              {itemChildren.length > 0 ? (
                <ul
                  className="
                    ml-1
                    space-y-2
                    border-l-2
                    border-muted
                    pl-3
                    sm:ml-2
                    sm:pl-4
                  "
                >
                  {itemChildren.map((child) =>
                    renderNode(child),
                  )}
                </ul>
              ) : (
                !isAdding && (
                  <div
                    className="
                      rounded-lg
                      border border-dashed
                      bg-background/60
                      px-4 py-6
                      text-center
                    "
                  >
                    <p className="text-xs text-muted-foreground">
                      No {nextPart.name}s added yet.
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openAdd(item.id);
                      }}
                      className="
                        mt-2
                        text-xs font-medium
                        text-primary
                        hover:underline
                      "
                    >
                      Add {nextPart.name}
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <main className="w-full px-2 py-2 sm:px-3 sm:py-3">
      {/* ================================================== */}
      {/* PAGE HEADER                                        */}
      {/* ================================================== */}

      <div className="mb-4">
        <Link
          href={`/Admin/study-pattern/${pattern.id}`}
          className="
            mb-3
            inline-flex items-center
            text-sm
            text-muted-foreground
            transition-colors
            hover:text-foreground
          "
        >
          ← Back to {pattern.name}
        </Link>

        <div
          className="
            flex flex-col gap-3
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          {/* Title */}

          <div className="flex min-w-0 gap-3">
            <div
              className="
                flex h-10 w-10
                shrink-0
                items-center justify-center
                rounded-lg
                bg-primary/10
                text-primary
              "
            >
              <ListTree className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1
                className="
                  truncate
                  text-xl font-bold
                  tracking-tight
                  sm:text-2xl
                "
              >
                {pattern.name}
              </h1>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Build and organize the table of contents.
              </p>
            </div>
          </div>

          {/* Expand / collapse */}

          {pattern.tocItems.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="
                  rounded-md
                  border
                  px-3 py-1.5
                  text-xs font-medium
                  transition-colors
                  hover:bg-muted
                "
              >
                Expand all
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="
                  rounded-md
                  border
                  px-3 py-1.5
                  text-xs font-medium
                  transition-colors
                  hover:bg-muted
                "
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* STRUCTURE                                         */}
      {/* ================================================== */}

      {pattern.patternArr.length > 0 && (
        <section
          className="
            mb-3
            rounded-lg
            border
            bg-muted/30
            p-3
          "
        >
          <div className="mb-2.5 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />

            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
              "
            >
              Structure
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {pattern.patternArr.map(
              (part, index) => (
                <div
                  key={part.id}
                  className="
                    flex items-center gap-1.5
                  "
                >
                  <span
                    className="
                      rounded-md
                      bg-background
                      px-2.5 py-1.5
                      text-xs font-medium
                      shadow-sm
                      ring-1 ring-border
                    "
                  >
                    {index + 1}. {part.name}
                  </span>

                  {index <
                    pattern.patternArr.length - 1 && (
                    <ChevronRight
                      className="
                        h-3.5 w-3.5
                        text-muted-foreground
                      "
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* NO PARAMETERS                                     */}
      {/* ================================================== */}

      {!firstPart ? (
        <section
          className="
            rounded-lg
            border border-dashed
            px-5 py-10
            text-center
          "
        >
          <p className="text-sm font-medium">
            No pattern parameters found.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Add pattern parameters first.
          </p>
        </section>
      ) : (
        /* ================================================= */
        /* TOC                                                */
        /* ================================================= */

        <section
          className="
            rounded-lg
            border
            bg-background
          "
        >
          {/* =============================================== */}
          {/* TOC HEADER                                       */}
          {/* =============================================== */}

          <div
            className="
              flex flex-col gap-3
              border-b
              px-3 py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-4
            "
          >
            <div>
              <h2 className="text-sm font-semibold">
                {firstPart.name}s
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {rootItems.length}{" "}
                {rootItems.length === 1
                  ? "item"
                  : "items"}{" "}
                added
              </p>
            </div>

            {/* Root add */}

            <RootAdd
              part={firstPart}
              value={
                drafts[
                  getDraftKey(
                    firstPart.id,
                    null,
                  )
                ] ?? ""
              }
              setValue={(value) =>
                setDrafts((current) => ({
                  ...current,
                  [getDraftKey(
                    firstPart.id,
                    null,
                  )]: value,
                }))
              }
              onAdd={() =>
                addItem(firstPart, null)
              }
              pending={pending}
            />
          </div>

          {/* =============================================== */}
          {/* TREE                                             */}
          {/* =============================================== */}

          <div className="p-3 sm:p-4">
            {rootItems.length > 0 ? (
              <ul className="space-y-2">
                {rootItems.map((item) =>
                  renderNode(item),
                )}
              </ul>
            ) : (
              <div
                className="
                  rounded-lg
                  border border-dashed
                  px-5 py-10
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    bg-muted
                  "
                >
                  <Plus
                    className="
                      h-4 w-4
                      text-muted-foreground
                    "
                  />
                </div>

                <p className="mt-3 text-sm font-medium">
                  No {firstPart.name}s yet
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add your first{" "}
                  {firstPart.name.toLowerCase()}{" "}
                  using the field above.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================== */}
      {/* SAVING INDICATOR                                  */}
      {/* ================================================== */}

      {pending && (
        <div
          className="
            fixed
            bottom-4
            left-1/2
            z-50
            -translate-x-1/2
            rounded-full
            border
            bg-background
            px-4 py-2
            text-xs font-medium
            shadow-lg
          "
        >
          Saving…
        </div>
      )}
    </main>
  );
}

/* ====================================================== */
/* ROOT ADD INPUT                                        */
/* ====================================================== */

function RootAdd({
  part,
  value,
  setValue,
  onAdd,
  pending,
}: {
  part: Part;
  value: string;
  setValue: (value: string) => void;
  onAdd: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <input
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onAdd();
          }
        }}
        disabled={pending}
        placeholder={`e.g. ${part.name} 1`}
        className="
          h-9
          min-w-0
          flex-1
          rounded-md
          border
          bg-background
          px-3
          text-sm
          outline-none
          transition
          placeholder:text-muted-foreground
          focus:border-primary
          focus:ring-2
          focus:ring-primary/20
          sm:w-48
        "
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={
          pending || !value.trim()
        }
        className="
          inline-flex
          h-9
          shrink-0
          items-center
          gap-1.5
          rounded-md
          bg-primary
          px-3
          text-xs font-medium
          text-primary-foreground
          transition-colors
          hover:bg-primary/90
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </div>
  );
}

/* ====================================================== */
/* CHILD ADD INPUT                                       */
/* ====================================================== */

function AddInput({
  part,
  value,
  setValue,
  onAdd,
  pending,
}: {
  part: Part;
  value: string;
  setValue: (value: string) => void;
  onAdd: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onAdd();
          }
        }}
        disabled={pending}
        placeholder={`${part.name} name / number`}
        className="
          h-9
          min-w-0
          flex-1
          rounded-md
          border
          bg-background
          px-3
          text-sm
          outline-none
          transition
          placeholder:text-muted-foreground
          focus:border-primary
          focus:ring-2
          focus:ring-primary/20
        "
      />

      <button
        type="button"
        onClick={onAdd}
        disabled={
          pending || !value.trim()
        }
        className="
          inline-flex
          h-9
          shrink-0
          items-center
          gap-1.5
          rounded-md
          bg-primary
          px-3
          text-xs font-medium
          text-primary-foreground
          transition-colors
          hover:bg-primary/90
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
    </div>
  );
}

