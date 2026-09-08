"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Part = { id: string; name: string; position: number };
type Toc = { id: string; name: string; parentId: string | null; patternArrId: string; position: number };
export type TocRange = { from: string; to?: string };

export function PatternTocRangeFields({ parts, tocItems, values, onChange }: { parts: Part[]; tocItems?: Toc[]; values: Record<string, string | TocRange>; onChange: (partId: string, value: TocRange) => void }) {
  if (!tocItems?.length) return <p className="text-sm text-muted-foreground">This pattern has no table of contents yet. An administrator can add it from the pattern page.</p>;
  const selection = (partId: string, side: "from" | "to") => { const value = values[partId]; return typeof value === "object" && value ? value[side] ?? "" : ""; };
  const options = (part: Part, side: "from" | "to") => {
    if (part.position === 0) return tocItems.filter(item => item.patternArrId === part.id && !item.parentId);
    const parentPart = parts[part.position - 1]; const previousFrom = selection(parentPart.id, "from");
const previousTo = selection(parentPart.id, "to");

const parentId =
  side === "to"
    ? previousTo || previousFrom
    : previousFrom;
    return tocItems.filter(item => item.patternArrId === part.id && item.parentId === parentId);
  };
  const update = (partId: string, side: "from" | "to", id: string) => { const current = values[partId]; const range: TocRange = typeof current === "object" && current ? { ...current } : { from: "" }; if (side === "from") range.from = id; else range.to = id || undefined; onChange(partId, range); };
  return (
    <div className="divide-y divide-border/70">
      {parts.map((part) => (
        <section key={part.id} className="grid min-h-[4.25rem] grid-cols-[2.2rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-1.5 px-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
          <h3 className="min-w-0 truncate text-sm font-medium text-foreground">{part.name}</h3>
          <SearchPicker label="From" value={selection(part.id, "from")} options={options(part, "from")} onChange={(id) => update(part.id, "from", id)} />
          <SearchPicker label="To" value={selection(part.id, "to")} options={options(part, "to")} optional onChange={(id) => update(part.id, "to", id)} />
        </section>
      ))}
    </div>
  );
}

function SearchPicker({ label, value, options, onChange, optional = false }: { label: string; value: string; options: Toc[]; onChange: (id: string) => void; optional?: boolean }) {
  const selected = options.find(item => item.id === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const typedWord = query.trim().length > 0;
  const matches = typedWord ? options.filter(item => item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : [];
  return (
    <div className="relative min-w-0 h-12">
      <Label htmlFor={`${label}-${value || "empty"}`} className="mb-0.5 block truncate text-[11px] font-medium text-muted-foreground">{label}</Label>
      <Input
        id={`${label}-${value || "empty"}`}
        value={query}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        placeholder={optional ? "Optional" : "Search"}
        className="h-9 min-w-0 px-2 text-sm"
        autoComplete="off"
      />
      {open && typedWord && <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">{matches.length ? matches.map(item => <button key={item.id} type="button" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(item.id); setQuery(item.name); setOpen(false); }} className="block w-full rounded px-2.5 py-1.5 text-left text-sm text-popover-foreground hover:bg-muted">{item.name}</button>) : <p className="px-2.5 py-1.5 text-sm text-muted-foreground">No matching {label.toLowerCase()} value.</p>}</div>}
      {optional && value && <button type="button" onClick={() => { onChange(""); setQuery(""); }} className={cn("absolute bottom-0 right-0 text-[11px] text-muted-foreground underline", "hover:text-foreground")}>Clear To</button>}
    </div>
  );
}
