"use client";

import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function StudentSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const handleSearch = useDebouncedCallback(
    (value: string) => {
      const searchParams = new URLSearchParams(params);

      const trimmedValue = value.trim();

      if (trimmedValue) {
        searchParams.set("search", trimmedValue);
      } else {
        searchParams.delete("search");
      }

      // Search always starts from page 1
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
        defaultValue={params.get("search") ?? ""}
        onChange={(e) =>
          handleSearch(e.target.value)
        }
        placeholder="Search by name or email..."
        className="w-full rounded-lg border bg-background
        py-2 pl-10 pr-4 outline-none
        focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}