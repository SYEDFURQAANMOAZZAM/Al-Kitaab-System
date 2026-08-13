"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

type Option = {
  label: string;
  value: string;
};

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      {/* =====================================================
          TRIGGER
      ===================================================== */}

      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className="
          flex min-h-14 w-full cursor-pointer
          flex-wrap items-center gap-2
          rounded-xl border border-slate-300
          bg-white px-4 py-2
          text-left shadow-sm
          transition
          hover:border-emerald-500
          focus:outline-none
          focus:ring-2
          focus:ring-emerald-500
        "
      >
        {/* =================================================
            SELECTED ITEMS
        ================================================= */}

        {value.length === 0 ? (
          <span className="text-slate-400">
            {placeholder}
          </span>
        ) : (
          value.map((item) => {
            const option = options.find(
              (o) => o.value === item
            );

            return (
              <span
                key={item}
                className="
                  flex items-center gap-1
                  rounded-full
                  bg-emerald-100
                  px-3 py-1
                  text-sm font-medium
                  text-emerald-700
                "
              >
                {option?.label ?? item}

                {/* Remove selected item */}

                <button
                  type="button"
                  aria-label={`Remove ${option?.label ?? item}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(item);
                  }}
                  className="
                    rounded-full
                    p-0.5
                    hover:bg-emerald-200
                  "
                >
                  <X size={14} />
                </button>
              </span>
            );
          })
        )}

        {/* =================================================
            ARROW
        ================================================= */}

        <ChevronsUpDown
          size={18}
          className={`
            ml-auto shrink-0
            text-slate-500
            transition-transform
            duration-200
            ${open ? "rotate-180" : ""}
          `}
        />
      </div>

      {/* =====================================================
          DROPDOWN
      ===================================================== */}

      <div
        className={`
          absolute left-0 top-full z-50
          -mt-px
          flex max-h-72
          w-full flex-col
          origin-top
          overflow-hidden
          rounded-b-xl
          border border-slate-300
          bg-white
          shadow-xl
          transition-all duration-200
          ${
            open
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0"
          }
        `}
      >
        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            onClick={(e) =>
              e.stopPropagation()
            }
            className="
              w-full rounded-lg
              border border-slate-200
              px-3 py-2
              text-sm
              outline-none
              focus:ring-2
              focus:ring-emerald-500
            "
          />
        </div>

        {/* =================================================
            OPTIONS
        ================================================= */}

        <div
          role="listbox"
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            py-1
          "
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No batches found.
            </p>
          ) : (
            filtered.map((option) => {
              const selected =
                value.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() =>
                    toggle(option.value)
                  }
                  className={`
                    flex w-full
                    items-center
                    justify-between
                    px-4 py-3
                    text-left
                    transition
                    hover:bg-emerald-50
                    ${
                      selected
                        ? "bg-emerald-50 text-emerald-700"
                        : ""
                    }
                  `}
                >
                  <span>{option.label}</span>

                  {selected && (
                    <Check
                      size={18}
                      className="text-emerald-600"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}