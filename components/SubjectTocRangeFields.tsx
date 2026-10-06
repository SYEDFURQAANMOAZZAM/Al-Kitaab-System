"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ============================================================
   TYPES
============================================================ */

type Part = {
  id: string;
  name: string;
  position: number;
};

type Toc = {
  id: string;
  name: string;
  parentId: string | null;
  subjectPartId: string;
  position: number;
};

export type TocRange = {
  from: string;
  to?: string;
};

type Side = "from" | "to";

type Props = {
  parts: Part[];
  tocItems?: Toc[];
  values: Record<string, string | TocRange>;
  onChange: (partId: string, value: TocRange) => void;
};

/* ============================================================
   HELPERS
============================================================ */

function getSelection(
  values: Record<string, string | TocRange>,
  partId: string,
  side: Side,
): string {
  const value = values[partId];

  if (typeof value === "object" && value) {
    return value[side] ?? "";
  }

  return "";
}

function buildAncestorChain(
  itemId: string,
  itemById: Map<string, Toc>,
): Toc[] {
  const chain: Toc[] = [];

  let current = itemById.get(itemId);

  while (current) {
    chain.push(current);

    if (!current.parentId) {
      break;
    }

    current = itemById.get(current.parentId);
  }

  chain.reverse();

  return chain;
}

/* ============================================================
   COMPONENT
============================================================ */

export function SubjectTocRangeFields({
  parts,
  tocItems = [],
  values,
  onChange,
}: Props) {
  const [activePicker, setActivePicker] = useState<string | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);

  /* ==========================================================
     SORT PARTS
  ========================================================== */

  const sortedParts = useMemo(() => {
    return [...parts].sort(
      (a, b) => a.position - b.position,
    );
  }, [parts]);

  /* ==========================================================
     FAST LOOKUPS
  ========================================================== */

  const partById = useMemo(() => {
    const map = new Map<string, Part>();

    for (const part of sortedParts) {
      map.set(part.id, part);
    }

    return map;
  }, [sortedParts]);

  const itemById = useMemo(() => {
    const map = new Map<string, Toc>();

    for (const item of tocItems) {
      map.set(item.id, item);
    }

    return map;
  }, [tocItems]);

  /* ==========================================================
     CHILDREN MAP

     IMPORTANT:
     Children are sorted ONLY against their siblings.

     We do NOT sort all TOC items by position globally.
  ========================================================== */

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Toc[]>();

    for (const item of tocItems) {
      const key = item.parentId;

      const existing = map.get(key);

      if (existing) {
        existing.push(item);
      } else {
        map.set(key, [item]);
      }
    }

    for (const children of map.values()) {
      children.sort((a, b) => a.position - b.position);
    }

    return map;
  }, [tocItems]);

  /* ==========================================================
     TRUE HIERARCHICAL TOC ORDER

     Example:

     Para 1
       Surah 1
         Ruku 1
           Ayat 1
           Ayat 2
         Ruku 2
           Ayat 3

     Para 2
       Surah 2
         Ruku 3
           Ayat 4

     The resulting order is:

     Para 1
     Surah 1
     Ruku 1
     Ayat 1
     Ayat 2
     Ruku 2
     Ayat 3
     Para 2
     Surah 2
     Ruku 3
     Ayat 4

     This is the important fix.
  ========================================================== */

  const orderedTocItems = useMemo(() => {
    const result: Toc[] = [];

    const visited = new Set<string>();

    const visit = (item: Toc) => {
      if (visited.has(item.id)) {
        return;
      }

      visited.add(item.id);

      result.push(item);

      const children =
        childrenByParent.get(item.id) ?? [];

      for (const child of children) {
        visit(child);
      }
    };

    /* --------------------------------------------------------
       Start from root items.
    -------------------------------------------------------- */

    const rootItems =
      childrenByParent.get(null) ?? [];

    for (const root of rootItems) {
      visit(root);
    }

    /* --------------------------------------------------------
       Safety fallback.

       If malformed data contains an item whose parent does
       not exist, it should still appear rather than disappear.
    -------------------------------------------------------- */

    if (visited.size !== tocItems.length) {
      const remaining = [...tocItems]
        .filter(item => !visited.has(item.id))
        .sort((a, b) => {
          if (a.subjectPartId !== b.subjectPartId) {
            return a.subjectPartId.localeCompare(
              b.subjectPartId,
            );
          }

          return a.position - b.position;
        });

      for (const item of remaining) {
        visit(item);
      }
    }

    return result;
  }, [tocItems, childrenByParent]);

  /* ==========================================================
     ITEMS BY PART

     IMPORTANT:

     We preserve the TRUE hierarchical order calculated above.

     We do NOT sort these arrays by position.
  ========================================================== */

  const itemsByPart = useMemo(() => {
    const map = new Map<string, Toc[]>();

    for (const item of orderedTocItems) {
      const existing = map.get(item.subjectPartId);

      if (existing) {
        existing.push(item);
      } else {
        map.set(item.subjectPartId, [item]);
      }
    }

    return map;
  }, [orderedTocItems]);

  /* ==========================================================
     ROOT ITEMS BY PART
  ========================================================== */

  const rootItemsByPart = useMemo(() => {
    const map = new Map<string, Toc[]>();

    for (const item of orderedTocItems) {
      if (item.parentId) {
        continue;
      }

      const existing = map.get(item.subjectPartId);

      if (existing) {
        existing.push(item);
      } else {
        map.set(item.subjectPartId, [item]);
      }
    }

    return map;
  }, [orderedTocItems]);

  /* ==========================================================
     ANCESTOR CHAINS

     item -> root -> ... -> item
  ========================================================== */

  const ancestorsById = useMemo(() => {
    const map = new Map<string, Toc[]>();

    for (const item of tocItems) {
      map.set(
        item.id,
        buildAncestorChain(
          item.id,
          itemById,
        ),
      );
    }

    return map;
  }, [tocItems, itemById]);

  /* ==========================================================
     ANCESTOR IDS

     Used for fast descendant checks.
  ========================================================== */

  const ancestorIdsById = useMemo(() => {
    const map = new Map<string, Set<string>>();

    for (const item of tocItems) {
      const chain =
        ancestorsById.get(item.id) ?? [];

      map.set(
        item.id,
        new Set(
          chain.map(ancestor => ancestor.id),
        ),
      );
    }

    return map;
  }, [tocItems, ancestorsById]);

  /* ==========================================================
     SELECTION
  ========================================================== */

  const selection = useCallback(
    (partId: string, side: Side) => {
      return getSelection(
        values,
        partId,
        side,
      );
    },
    [values],
  );

  /* ==========================================================
     FIND DEEPEST SELECTED ANCHOR
  ========================================================== */

  const getAnchor = useCallback(
    (
      part: Part,
      side: Side,
    ): string => {
      let anchorId = "";

      for (const candidate of sortedParts) {
        if (
          candidate.position >= part.position
        ) {
          break;
        }

        const selected = selection(
          candidate.id,
          side,
        );

        if (selected) {
          anchorId = selected;
        }
      }

      /* ------------------------------------------------------
         For To:

         If To isn't selected at an earlier level,
         use the From selection.

         Example:

         Para From = 1
         Para To   = ""

         Surah To should still show Surahs
         belonging to Para 1.
      ------------------------------------------------------ */

      if (side === "to" && !anchorId) {
        for (const candidate of sortedParts) {
          if (
            candidate.position >= part.position
          ) {
            break;
          }

          const selected = selection(
            candidate.id,
            "from",
          );

          if (selected) {
            anchorId = selected;
          }
        }
      }

      return anchorId;
    },
    [sortedParts, selection],
  );

  /* ==========================================================
     DESCENDANTS

     Returns items belonging to a part and descendants
     of the selected ancestor.

     Order comes from itemsByPart, which already contains
     the TRUE hierarchical TOC order.
  ========================================================== */

  const descendantsForPart = useCallback(
    (
      partId: string,
      ancestorId: string,
    ): Toc[] => {
      const items =
        itemsByPart.get(partId) ?? [];

      return items.filter(item => {
        if (item.id === ancestorId) {
          return false;
        }

        return (
          ancestorIdsById
            .get(item.id)
            ?.has(ancestorId) ?? false
        );
      });
    },
    [
      itemsByPart,
      ancestorIdsById,
    ],
  );

  /* ==========================================================
     OPTIONS
  ========================================================== */

  const options = useCallback(
    (
      part: Part,
      side: Side,
    ): Toc[] => {
      /* ------------------------------------------------------
         First part/root part.
      ------------------------------------------------------ */

      if (part.position === 0) {
        return (
          rootItemsByPart.get(part.id) ?? []
        );
      }

      /* ------------------------------------------------------
         Find deepest selected ancestor.
      ------------------------------------------------------ */

      const anchorId = getAnchor(
        part,
        side,
      );

      if (!anchorId) {
        return [];
      }

      return descendantsForPart(
        part.id,
        anchorId,
      );
    },
    [
      rootItemsByPart,
      getAnchor,
      descendantsForPart,
    ],
  );

  /* ==========================================================
     PART NAME HELPERS
  ========================================================== */

  const isPartNamed = useCallback(
    (
      part: Part | undefined,
      name: string,
    ) => {
      return (
        part?.name
          .trim()
          .toLowerCase() ===
        name.toLowerCase()
      );
    },
    [],
  );

  /* ==========================================================
     AUTO-FILL ANCESTORS
  ========================================================== */

  const buildAutoFilledValues = useCallback(
    (
      nextValues: Record<
        string,
        string | TocRange
      >,
      selectedItemId: string,
      side: Side,
    ) => {
      const chain =
        ancestorsById.get(selectedItemId) ?? [];

      const selectedItem =
        itemById.get(selectedItemId);

      const selectedPart =
        selectedItem
          ? partById.get(
              selectedItem.subjectPartId,
            )
          : undefined;

      const selectingAyat =
        isPartNamed(
          selectedPart,
          "ayat",
        );

      for (const ancestor of chain) {
        const part =
          partById.get(
            ancestor.subjectPartId,
          );

        if (!part) {
          continue;
        }

        /* ----------------------------------------------------
           IMPORTANT:

           Selecting one Ayat must NOT automatically select
           its Ruku.

           Ruku is derived only after BOTH Ayat From and
           Ayat To are available.
        ---------------------------------------------------- */

        if (
          selectingAyat &&
          isPartNamed(part, "ruku")
        ) {
          continue;
        }

        const current =
          nextValues[part.id];

        const range: TocRange =
          typeof current === "object" &&
          current
            ? { ...current }
            : { from: "" };

        if (!range[side]) {
          range[side] = ancestor.id;
        }

        nextValues[part.id] = range;
      }
    },
    [
      ancestorsById,
      itemById,
      partById,
      isPartNamed,
    ],
  );

  /* ==========================================================
     AYAT -> RUKU

     Only runs when BOTH Ayat From and Ayat To exist.
  ========================================================== */

  const fillRukuFromBothAyats = useCallback(
    (
      nextValues: Record<
        string,
        string | TocRange
      >,
    ) => {
      const ayatPart =
        sortedParts.find(part =>
          isPartNamed(part, "ayat"),
        );

      const rukuPart =
        sortedParts.find(part =>
          isPartNamed(part, "ruku"),
        );

      if (!ayatPart || !rukuPart) {
        return;
      }

      const ayatValue =
        nextValues[ayatPart.id];

      if (
        typeof ayatValue !== "object" ||
        !ayatValue
      ) {
        return;
      }

      const fromAyat =
        ayatValue.from;

      const toAyat =
        ayatValue.to;

      /* ------------------------------------------------------
         Only fill Ruku when BOTH Ayats are selected.
      ------------------------------------------------------ */

      if (!fromAyat || !toAyat) {
        return;
      }

      const fromChain =
        ancestorsById.get(fromAyat) ?? [];

      const toChain =
        ancestorsById.get(toAyat) ?? [];

      const fromRuku =
        fromChain.find(
          item =>
            item.subjectPartId ===
            rukuPart.id,
        );

      const toRuku =
        toChain.find(
          item =>
            item.subjectPartId ===
            rukuPart.id,
        );

      if (!fromRuku || !toRuku) {
        return;
      }

      nextValues[rukuPart.id] = {
        from: fromRuku.id,
        to: toRuku.id,
      };
    },
    [
      sortedParts,
      ancestorsById,
      isPartNamed,
    ],
  );

  /* ==========================================================
     UPDATE
  ========================================================== */

  const update = useCallback(
    (
      partId: string,
      side: Side,
      id: string,
    ) => {
      const nextValues: Record<
        string,
        string | TocRange
      > = {
        ...values,
      };

      const current =
        values[partId];

      const range: TocRange =
        typeof current === "object" &&
        current
          ? { ...current }
          : { from: "" };

      if (side === "from") {
        range.from = id;
      } else {
        range.to = id || undefined;
      }

      nextValues[partId] = range;

      /* ------------------------------------------------------
         Clearing a field should only clear that field.

         Do not auto-fill anything.
      ------------------------------------------------------ */

      if (!id) {
        onChange(partId, range);
        return;
      }

      /* ------------------------------------------------------
         Auto-fill missing ancestors.
      ------------------------------------------------------ */

      buildAutoFilledValues(
        nextValues,
        id,
        side,
      );

      /* ------------------------------------------------------
         Special Ayat -> Ruku rule.
      ------------------------------------------------------ */

      fillRukuFromBothAyats(
        nextValues,
      );

      /* ------------------------------------------------------
         Apply only changed values.
      ------------------------------------------------------ */

      for (const part of sortedParts) {
        const before =
          values[part.id];

        const after =
          nextValues[part.id];

        const beforeFrom =
          typeof before === "object" &&
          before
            ? before.from
            : "";

        const beforeTo =
          typeof before === "object" &&
          before
            ? before.to ?? ""
            : "";

        const afterFrom =
          typeof after === "object" &&
          after
            ? after.from
            : "";

        const afterTo =
          typeof after === "object" &&
          after
            ? after.to ?? ""
            : "";

        if (
          beforeFrom !== afterFrom ||
          beforeTo !== afterTo
        ) {
          onChange(part.id, {
            from: afterFrom,
            ...(afterTo
              ? { to: afterTo }
              : {}),
          });
        }
      }
    },
    [
      values,
      sortedParts,
      buildAutoFilledValues,
      fillRukuFromBothAyats,
      onChange,
    ],
  );

  /* ==========================================================
     CLEAR
  ========================================================== */

  const clear = useCallback(
    (
      partId: string,
      side: Side,
    ) => {
      update(
        partId,
        side,
        "",
      );

      setActivePicker(null);
    },
    [update],
  );

  /* ==========================================================
     CLOSE ON OUTSIDE CLICK
  ========================================================== */

  useEffect(() => {
    if (!activePicker) {
      return;
    }

    const handlePointerDown = (
      event: PointerEvent,
    ) => {
      const target =
        event.target as Node | null;

      if (!target) {
        return;
      }

      if (
        containerRef.current?.contains(
          target,
        )
      ) {
        return;
      }

      setActivePicker(null);
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, [activePicker]);

  /* ==========================================================
     EMPTY STATE
  ========================================================== */

  if (!tocItems.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This subject has no table of contents yet.
        An administrator can add it from the subject page.
      </p>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      ref={containerRef}
      className="divide-y divide-border/70"
    >
      {sortedParts.map(part => {
        const fromPickerKey =
          `${part.id}:from`;

        const toPickerKey =
          `${part.id}:to`;

        const isFromOpen =
          activePicker ===
          fromPickerKey;

        const isToOpen =
          activePicker ===
          toPickerKey;

        const isRowOpen =
          isFromOpen || isToOpen;

        return (
          <section
            key={part.id}
            className={cn(
              `
                relative
                grid
                min-h-[5rem]
                grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)]
                items-start
                gap-2
                px-1
                py-3
                first:pt-0
                last:pb-0
                sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]
                sm:gap-3
              `,
              isRowOpen
                ? "z-50"
                : "z-0",
            )}
          >
            <h3
              className="
                min-w-0
                pt-6
                truncate
                text-sm
                font-medium
                text-foreground
              "
            >
              {part.name}
            </h3>

            <SearchPicker
              label="From"
              value={selection(
                part.id,
                "from",
              )}
              options={options(
                part,
                "from",
              )}
              open={isFromOpen}
              onOpen={() =>
                setActivePicker(
                  fromPickerKey,
                )
              }
              onClose={() => {
                if (
                  activePicker ===
                  fromPickerKey
                ) {
                  setActivePicker(null);
                }
              }}
              onChange={id =>
                update(
                  part.id,
                  "from",
                  id,
                )
              }
              onClear={() =>
                clear(
                  part.id,
                  "from",
                )
              }
            />

            <SearchPicker
              label="To"
              value={selection(
                part.id,
                "to",
              )}
              options={options(
                part,
                "to",
              )}
              open={isToOpen}
              onOpen={() =>
                setActivePicker(
                  toPickerKey,
                )
              }
              onClose={() => {
                if (
                  activePicker ===
                  toPickerKey
                ) {
                  setActivePicker(null);
                }
              }}
              onChange={id =>
                update(
                  part.id,
                  "to",
                  id,
                )
              }
              onClear={() =>
                clear(
                  part.id,
                  "to",
                )
              }
            />
          </section>
        );
      })}
    </div>
  );
}

/* ============================================================
   SEARCH PICKER
============================================================ */

type SearchPickerProps = {
  label: string;
  value: string;
  options: Toc[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (id: string) => void;
  onClear: () => void;
};

function SearchPicker({
  label,
  value,
  options,
  open,
  onOpen,
  onClose,
  onChange,
  onClear,
}: SearchPickerProps) {
  const selected = useMemo(
    () =>
      options.find(
        item => item.id === value,
      ),
    [options, value],
  );

  const [query, setQuery] =
    useState("");

  /* ----------------------------------------------------------
     When closed, display selected item.
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      setQuery(
        selected?.name ?? "",
      );
    }
  }, [
    open,
    selected?.name,
  ]);

  /* ----------------------------------------------------------
     Focus:

     Clear the search so ALL options are visible.
  ---------------------------------------------------------- */

  const handleFocus = () => {
    setQuery("");
    onOpen();
  };

  /* ----------------------------------------------------------
     Typing:

     Keep picker open and filter options.
  ---------------------------------------------------------- */

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue =
      event.target.value;

    setQuery(nextValue);

    if (!open) {
      onOpen();
    }
  };

  const normalizedQuery =
    query
      .trim()
      .toLocaleLowerCase();

  const matches =
    normalizedQuery.length === 0
      ? options
      : options.filter(item =>
          item.name
            .toLocaleLowerCase()
            .includes(
              normalizedQuery,
            ),
        );

  /* ----------------------------------------------------------
     SELECT
  ---------------------------------------------------------- */

  const handleSelect = (
    item: Toc,
  ) => {
    onChange(item.id);
    setQuery(item.name);
    onClose();
  };

  /* ----------------------------------------------------------
     CLEAR
  ---------------------------------------------------------- */

  const handleClear = () => {
    onClear();
    setQuery("");
    onClose();
  };

  return (
    <div
      data-toc-picker
      className="relative min-w-0"
    >
      <Label
        className="
          mb-1
          block
          truncate
          text-[11px]
          font-medium
          text-muted-foreground
        "
      >
        {label}
      </Label>

      <div className="relative">
        <Input
          value={query}
          onFocus={handleFocus}
          onChange={handleChange}
          placeholder="Search"
          autoComplete="off"
          className="
            h-9
            min-w-0
            px-2.5
            pr-2
            text-sm
          "
        />

        {open && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+4px)]
              z-[100]
              overflow-hidden
              rounded-md
              border
              border-border
              bg-popover
              text-popover-foreground
              shadow-lg
              ring-1
              ring-black/5
            "
          >
            <div
              className="
                max-h-52
                overflow-y-auto
                p-1
              "
            >
              {matches.length > 0 ? (
                matches.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={event => {
                      event.preventDefault();
                    }}
                    onTouchStart={event => {
                      event.preventDefault();
                    }}
                    onClick={() =>
                      handleSelect(item)
                    }
                    className="
                      block
                      w-full
                      rounded-sm
                      px-2.5
                      py-2
                      text-left
                      text-sm
                      text-popover-foreground
                      transition-colors
                      hover:bg-accent
                      hover:text-accent-foreground
                    "
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <p
                  className="
                    px-2.5
                    py-2
                    text-sm
                    text-muted-foreground
                  "
                >
                  No matching{" "}
                  {label.toLowerCase()}{" "}
                  value.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {value && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="
              text-[11px]
              font-medium
              text-muted-foreground
              underline
              underline-offset-2
              transition-colors
              hover:text-foreground
            "
          >
            Clear {label}
          </button>
        </div>
      )}
    </div>
  );
}