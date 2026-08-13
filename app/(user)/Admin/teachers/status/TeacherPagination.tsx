"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
}

export default function TeacherPagination({
  currentPage,
  totalPages,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;

    const search = new URLSearchParams(params);

    search.set("page", page.toString());

    router.push(`?${search.toString()}`);
  }

  function getPages(): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, i) => i + 1
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Previous */}

      <button
        disabled={currentPage === 1}
        onClick={() =>
          goToPage(currentPage - 1)
        }
        className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Pages */}

      {getPages().map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`min-w-10 rounded-md border px-3 py-2 text-sm ${
              page === currentPage
                ? "bg-emerald-600 text-white"
                : "hover:bg-muted"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}

      <button
        disabled={currentPage === totalPages}
        onClick={() =>
          goToPage(currentPage + 1)
        }
        className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}