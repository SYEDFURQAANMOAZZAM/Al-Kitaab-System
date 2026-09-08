"use client";

import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function TeacherSearch() {
  const router = useRouter();
  const params = useSearchParams();

  const handleSearch = useDebouncedCallback(
    (value: string) => {
      const search = new URLSearchParams(
        params.toString()
      );

      const trimmedValue = value.trim();

      if (trimmedValue) {
        search.set("search", trimmedValue);
      } else {
        search.delete("search");
      }

      // New search always starts at page 1
      search.delete("page");

      const queryString = search.toString();

      router.replace(
        queryString ? `?${queryString}` : "?"
      );
    },
    400
  );

  return (
    <div className="relative w-full sm:w-80">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4
        -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="search"
        defaultValue={params.get("search") ?? ""}
        onChange={(e) =>
          handleSearch(e.target.value)
        }
        placeholder="Search by name or email..."
        className="w-full rounded-lg border bg-background
        py-2 pl-10 pr-4 outline-none
        focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}