"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@base-ui/react/button";

type AdminActionsProps = {
  userId: string;
};

export default function AdminActions({
  userId,
}: AdminActionsProps) {
  return (
    <Button
      nativeButton={false}
      render={
        <Link href={`/admin/admins/${userId}/edit`} />
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
    >
      <Pencil className="h-3.5 w-3.5" />
      <span>Edit</span>
    </Button>
  );
}