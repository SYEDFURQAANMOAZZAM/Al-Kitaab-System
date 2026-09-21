"use client";

import {
  useEffect,
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

type Props = {
  parts: Part[];
  tocItems?: Toc[];
  values: Record<string, string | TocRange>;
  onChange: (
    partId: string,
    value: TocRange,
  ) => void;
};

/* ============================================================
   COMPONENT
============================================================ */

export function SubjectTocRangeFields({
  parts,
  tocItems,
  values,
  onChange,
}: Props) {
  /*
   * Which picker is currently open.
   *
   * Example:
   * "part-id:from"
   * "part-id:to"
   *
   * Keeping this state here prevents multiple dropdowns
   * from creating competing stacking contexts.
   */
  const [activePicker, setActivePicker] =
    useState<string | null>(null);

  /* ==========================================================
     GET SELECTED VALUE
  ========================================================== */

  const selection = (
    partId: string,
    side: "from" | "to",
  ): string => {
    const value = values[partId];

    if (
      typeof value === "object" &&
      value
    ) {
      return value[side] ?? "";
    }

    return "";
  };

  /* ==========================================================
     GET OPTIONS
  ========================================================== */

  const options = (
    part: Part,
    side: "from" | "to",
  ): Toc[] => {
    /*
     * First part:
     * show root TOC items.
     */
    if (part.position === 0) {
      return tocItems?.filter(
        (item) =>
          item.subjectPartId === part.id &&
          !item.parentId,
      ) ?? [];
    }

    /*
     * Every following part depends
     * on the previous part.
     */
    const parentPart =
      parts[part.position - 1];

    if (!parentPart) {
      return [];
    }

    const previousFrom =
      selection(
        parentPart.id,
        "from",
      );

    const previousTo =
      selection(
        parentPart.id,
        "to",
      );

    /*
     * FROM:
     * use previous FROM.
     *
     * TO:
     * use previous TO if available,
     * otherwise previous FROM.
     */
    const parentId =
      side === "to"
        ? previousTo || previousFrom
        : previousFrom;

    if (!parentId) {
      return [];
    }

    return (
      tocItems?.filter(
        (item) =>
          item.subjectPartId === part.id &&
          item.parentId === parentId,
      ) ?? []
    );
  };

  /* ==========================================================
     UPDATE
  ========================================================== */

  const update = (
    partId: string,
    side: "from" | "to",
    id: string,
  ) => {
    const current = values[partId];

    const range: TocRange =
      typeof current === "object" && current
        ? { ...current }
        : {
            from: "",
          };

    if (side === "from") {
      // Change From
      range.from = id;

      // IMPORTANT:
      // Do NOT clear To.
      //
      // If To was already selected, keep it.
    } else {
      // Change To
      range.to = id || undefined;
    }

    onChange(partId, range);
  };

  /* ==========================================================
     CLEAR
  ========================================================== */

  const clear = (
    partId: string,
    side: "from" | "to",
  ) => {
    update(
      partId,
      side,
      "",
    );

    setActivePicker(null);
  };

  /* ==========================================================
     NO TOC
  ========================================================== */

  if (!tocItems?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        This subject has no table of contents yet.
        An administrator can add it from the subject
        page.
      </p>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="divide-y divide-border/70">
      {parts.map((part) => {
        const fromPickerKey =
          `${part.id}:from`;

        const toPickerKey =
          `${part.id}:to`;

        const isFromOpen =
          activePicker === fromPickerKey;

        const isToOpen =
          activePicker === toPickerKey;

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
              /*
               * The currently active row is placed above
               * every other range row.
               *
               * This is the important part that prevents
               * the next row from overlapping the dropdown.
               */
              isRowOpen
                ? "z-50"
                : "z-0",
            )}
          >
            {/* ==================================================
                PART NAME
            ================================================== */}

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

            {/* ==================================================
                FROM
            ================================================== */}

            <SearchPicker
              pickerKey={fromPickerKey}
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
              onChange={(id) =>
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

            {/* ==================================================
                TO
            ================================================== */}

            <SearchPicker
              pickerKey={toPickerKey}
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
              onChange={(id) =>
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
  pickerKey: string;
  label: string;
  value: string;
  options: Toc[];
  open: boolean;

  onOpen: () => void;
  onClose: () => void;

  onChange: (id: string) => void;
  onClear: () => void;
};

/* ============================================================
   SEARCH PICKER COMPONENT
============================================================ */

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
  /* ==========================================================
     FIND SELECTED ITEM
  ========================================================== */

  const selected =
    options.find(
      (item) =>
        item.id === value,
    );

  /* ==========================================================
     SEARCH TEXT
  ========================================================== */

  const [query, setQuery] =
    useState(
      selected?.name ?? "",
    );

  /* ==========================================================
     SYNC VALUE → QUERY
  ========================================================== */

  useEffect(() => {
    /*
     * Only synchronize the selected value
     * when the dropdown is closed.
     *
     * This prevents typing from being overwritten.
     */
    if (!open) {
      const nextQuery =
        selected?.name ?? "";

      const frame =
        requestAnimationFrame(() => {
          setQuery(nextQuery);
        });

      return () =>
        cancelAnimationFrame(frame);
    }

    return undefined;
  }, [
    value,
    selected?.name,
    open,
  ]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const trimmedQuery =
    query.trim();

  /*
   * IMPORTANT:
   *
   * No query = no options.
   *
   * This means focusing an empty field
   * never displays the dropdown.
   */
  const matches =
    trimmedQuery.length > 0
      ? options.filter(
          (item) =>
            item.name
              .toLocaleLowerCase()
              .includes(
                trimmedQuery.toLocaleLowerCase(),
              ),
        )
      : [];

  /* ==========================================================
     FOCUS
  ========================================================== */

  const handleFocus = () => {
    /*
     * DO NOT open here.
     *
     * The dropdown should only appear
     * after the user types.
     */
  };

  /* ==========================================================
     CHANGE
  ========================================================== */

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue =
      event.target.value;

    setQuery(nextValue);

    const trimmed =
      nextValue.trim();

    /*
     * Open only when at least one
     * character has been entered.
     */
    if (trimmed.length > 0) {
      onOpen();
    } else {
      onClose();
    }
  };

  /* ==========================================================
     SELECT
  ========================================================== */

  const handleSelect = (
    item: Toc,
  ) => {
    onChange(item.id);

    setQuery(item.name);

    onClose();
  };

  /* ==========================================================
     CLEAR
  ========================================================== */

  const handleClear = () => {
    onClear();

    setQuery("");

    onClose();
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="
        relative
        min-w-0
      "
    >
      {/* ======================================================
          LABEL
      ====================================================== */}

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

      {/* ======================================================
          INPUT
      ====================================================== */}

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

        {/* ====================================================
            DROPDOWN
        ==================================================== */}

        {open &&
          trimmedQuery.length > 0 && (
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
                  matches.map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(
                          event,
                        ) => {
                          /*
                           * Prevent the input from
                           * losing focus before click.
                           */
                          event.preventDefault();
                        }}
                        onClick={() =>
                          handleSelect(
                            item,
                          )
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
                    ),
                  )
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

      {/* ======================================================
          CLEAR
      ====================================================== */}

      {value && (
        <div
          className="
            flex
            justify-end
            pt-1
          "
        >
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