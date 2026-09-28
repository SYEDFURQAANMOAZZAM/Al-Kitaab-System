
"use client";

import { useRouter } from "next/navigation";

type CreateBatchProps = {
  branchId: string;
};

export default function CreateBatch({
  branchId,
}: CreateBatchProps) {
  const router = useRouter();

  function handleCreate() {
    router.push(`/admin/branches/${branchId}/batches/new`);
  }

  return (
    <button
      type="button"
      onClick={handleCreate}
      className="
        inline-flex
        h-9
        items-center
        justify-center
        rounded-md
        border
        border-border
        bg-background
        px-4
        text-sm
        font-medium
        text-foreground
        shadow-sm
        transition-colors
        hover:bg-accent
        hover:text-accent-foreground
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
        disabled:pointer-events-none
        disabled:opacity-50
      "
    >
      Add Batch
    </button>
  );
}
