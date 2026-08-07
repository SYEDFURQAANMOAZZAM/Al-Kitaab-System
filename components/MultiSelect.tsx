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
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
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
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-14 w-full flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-left shadow-sm transition hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {value.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700"
            >
              {options.find((o) => o.value === item)?.label}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(item);
                }}
                className="rounded-full p-0.5 hover:bg-emerald-200"
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}

        <ChevronsUpDown
          size={18}
          className={`ml-auto text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown — flush-attached to trigger, corners clipped so nothing bleeds past the rounded edge */}

      <div
        className={`absolute left-0 top-full z-50 -mt-px flex max-h-72 w-full origin-top flex-col overflow-hidden rounded-b-xl border border-slate-300 bg-white shadow-xl transition-all duration-200 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* Search */}

        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Options — explicit max-height + overflow guarantees scrolling regardless of item count */}

        <div
          role="listbox"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No batches found.
            </p>
          ) : (
            filtered.map((option) => {
              const selected = value.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-emerald-50 ${
                    selected ? "bg-emerald-50 text-emerald-700" : ""
                  }`}
                >
                  <span>{option.label}</span>

                  {selected && (
                    <Check size={18} className="text-emerald-600" />
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
