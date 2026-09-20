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
      return tocItems.filter(
        (item) =>
          item.subjectPartId === part.id &&
          !item.parentId,
      );
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

    return tocItems.filter(
      (item) =>
        item.subjectPartId === part.id &&
        item.parentId === parentId,
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
    const current =
      values[partId];

    const range: TocRange =
      typeof current === "object" &&
      current
        ? { ...current }
        : {
            from: "",
          };

    if (side === "from") {
      range.from = id;

      /*
       * If FROM changes or is cleared,
       * the existing TO may no longer belong
       * to the selected parent.
       */
      range.to = undefined;
    } else {
      range.to =
        id || undefined;
    }

    onChange(
      partId,
      range,
    );
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
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="divide-y divide-border/70">
      {parts.map((part) => (
        <section
          key={part.id}
          className="
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
          "
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
      ))}
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
  onChange: (id: string) => void;
  onClear: () => void;
};

function SearchPicker({
  label,
  value,
  options,
  onChange,
  onClear,
}: SearchPickerProps) {
  /* ==========================================================
     FIND SELECTED ITEM
  ========================================================== */

  const selected = options.find(
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

  const [open, setOpen] =
    useState(false);

  /* ==========================================================
     SYNC VALUE → QUERY
  ========================================================== */

  useEffect(() => {
    /*
     * When the picker is closed, keep the
     * displayed text synchronized with the
     * selected TOC item.
     *
     * requestAnimationFrame prevents the
     * synchronous setState-in-effect warning.
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
     * IMPORTANT:
     *
     * Do NOT clear the query here.
     *
     * If a value is already selected,
     * clicking the field should allow the
     * user to inspect it.
     */
    setOpen(true);
  };

  /* ==========================================================
     CHANGE
  ========================================================== */

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setQuery(
      event.target.value,
    );

    setOpen(true);
  };

  /* ==========================================================
     SELECT
  ========================================================== */

  const handleSelect = (
    item: Toc,
  ) => {
    onChange(item.id);

    setQuery(item.name);
    setOpen(false);
  };

  /* ==========================================================
     CLEAR
  ========================================================== */

  const handleClear = () => {
    onClear();

    setQuery("");
    setOpen(false);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className={cn(
        "relative min-w-0",
        open && "z-50",
      )}
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
          className="
            h-9
            min-w-0
            px-2.5
            pr-2
            text-sm
          "
          autoComplete="off"
        />

        {/* ==================================================
            DROPDOWN
        ================================================== */}

        {open &&
          trimmedQuery.length > 0 && (
            <div
              className="
                absolute
                left-0
                top-[calc(100%+4px)]
                z-[100]
                w-full
                overflow-hidden
                rounded-md
                border
                border-border
                bg-popover
                shadow-lg
                ring-1
                ring-black/5
              "
            >
              <div className="max-h-52 overflow-y-auto p-1">
                {matches.length > 0 ? (
                  matches.map(
                    (item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(
                          event,
                        ) =>
                          event.preventDefault()
                        }
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

      {/* ====================================================
          CLEAR
      ==================================================== */}

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

