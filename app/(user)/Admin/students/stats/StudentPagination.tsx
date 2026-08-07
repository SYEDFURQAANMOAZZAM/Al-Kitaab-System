"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
}

export default function StudentPagination({
  currentPage,
  totalPages,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function goToPage(page: number) {
    const search = new URLSearchParams(params);

    search.set("page", page.toString());

    router.push(`?${search.toString()}`);
  }

  const pages = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="rounded-md border p-2 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          className={`rounded-md border px-4 py-2 text-sm ${
            page === currentPage
              ? "bg-emerald-600 text-white"
              : "hover:bg-muted"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="rounded-md border p-2 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}