"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { ButtonShadcn } from "@/components/button";

interface Props {
  currentPage: number;
  totalPages: number;
}

export default function TeacherPagination({
  currentPage,
  totalPages,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasPrevious = currentPage > 1;
  const hasNext =
    currentPage < totalPages;

  function goToPage(page: number) {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set(
      "page",
      String(page)
    );

    router.push(
      `${pathname}?${params.toString()}`
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Page information */}
      <p className="text-sm text-muted-foreground">
        Page{" "}
        <span className="font-medium text-foreground">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground">
          {totalPages}
        </span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <ButtonShadcn
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={() =>
            goToPage(
              currentPage - 1
            )
          }
        >
          <ChevronLeft className="size-4" />
          Previous
        </ButtonShadcn>

        <ButtonShadcn
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() =>
            goToPage(
              currentPage + 1
            )
          }
        >
          Next
          <ChevronRight className="size-4" />
        </ButtonShadcn>
      </div>
    </div>
  );
}