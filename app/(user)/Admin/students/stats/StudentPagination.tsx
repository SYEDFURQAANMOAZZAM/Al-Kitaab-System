"use client";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
    if (page < 1 || page > totalPages) {
      return;
    }

    if (page === currentPage) {
      return;
    }

    const searchParams = new URLSearchParams(
      params.toString()
    );

    searchParams.set("page", page.toString());

    router.push(`?${searchParams.toString()}`);
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {/* Previous */}

      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() =>
          goToPage(currentPage - 1)
        }
        className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Pages */}

      {pages.map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => goToPage(page)}
          aria-current={
            page === currentPage
              ? "page"
              : undefined
          }
          className={`rounded-md border px-4 py-2 text-sm ${
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() =>
          goToPage(currentPage + 1)
        }
        className="rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}