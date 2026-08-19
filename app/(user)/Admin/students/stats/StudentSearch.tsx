"use client";

import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState } from "react";

export default function StudentSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(
    params.get("search") ?? ""
  );

  const handleSearch = useDebouncedCallback(
    (value: string) => {
      const searchParams = new URLSearchParams(params);

      const trimmedValue = value.trim();

      if (trimmedValue) {
        searchParams.set("search", trimmedValue);
      } else {
        searchParams.delete("search");
      }

      searchParams.delete("page");

      const queryString = searchParams.toString();

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname
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
        value={search}
        onChange={(e) => {
          const value = e.target.value;

          setSearch(value);
          handleSearch(value);
        }}
        placeholder="Search by name or email..."
        className="w-full rounded-lg border bg-background
        py-2 pl-10 pr-4 outline-none
        focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}