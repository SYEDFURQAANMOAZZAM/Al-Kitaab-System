"use client";

import { Search, X } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { ButtonShadcn } from "@/components/button";

export default function StudentSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(
    searchParams.get("search") ?? ""
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function updateSearch(value: string) {
    setSearch(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(
        searchParams.toString()
      );

      const trimmedValue = value.trim();

      if (trimmedValue) {
        params.set("search", trimmedValue);
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      router.replace(
        `${pathname}?${params.toString()}`
      );
    }, 400);
  }

  function clearSearch() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setSearch("");

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.delete("search");
    params.set("page", "1");

    router.replace(
      `${pathname}?${params.toString()}`
    );
  }

  return (
    <div className="relative w-full sm:max-w-md">
      <Search
        className="
          pointer-events-none
          absolute left-3 top-1/2
          z-10 size-4
          -translate-y-1/2
          text-muted-foreground
        "
      />

      <Input
        name="search"
        value={search}
        onChange={(event) =>
          updateSearch(event.target.value)
        }
        placeholder="Search by name..."
        className="h-10 pl-9 pr-10"
      />

      {search.length > 0 && (
        <ButtonShadcn
          type="button"
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          aria-label="Clear search"
          className="
            absolute right-1 top-1/2
            z-20 size-8
            -translate-y-1/2
            rounded-md
            p-0
            text-muted-foreground
            hover:bg-muted
            hover:text-foreground
          "
        >
          <X className="size-4" />
        </ButtonShadcn>
      )}
    </div>
  );
}