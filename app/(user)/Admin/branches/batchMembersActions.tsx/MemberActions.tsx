"use client";

import { useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getBranchesWithBatches } from "@/app/ServerActions/getGroups/getBranchesAndBatches";

import ChangeBatchDialog from "./ChangeBatchDialog";
import RemoveMemberDialog from "./RemoveMemberDialog";

type Branch = {
  id: string;
  name: string;
  batches: {
    id: string;
    name: string;
  }[];
};

type MemberRole = "STUDENT" | "TEACHER";

type MemberActionsProps = {
  member: {
    id: string;
    name: string | null;
  };

  batchId: string;
  role: MemberRole;

  onChanged: () => void;
};

export default function MemberActions({
  member,
  batchId,
  role,
  onChanged,
}: MemberActionsProps) {
  const [
    changeBatchOpen,
    setChangeBatchOpen,
  ] = useState(false);

  const [
    removeDialogOpen,
    setRemoveDialogOpen,
  ] = useState(false);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [
    loadingBranches,
    startBranchTransition,
  ] = useTransition();

  const handleChangeBatch = () => {
    startBranchTransition(async () => {
      try {
        const result =
          await getBranchesWithBatches();

        setBranches(result);
        setChangeBatchOpen(true);
      } catch (error) {
        console.error(
          "Failed to load branches:",
          error,
        );
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="
            shrink-0 rounded-lg p-2
            text-muted-foreground
            hover:bg-slate-100
            hover:text-slate-900
          "
          aria-label={`Actions for ${
            member.name ?? "member"
          }`}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <Link
                href={role==="TEACHER"
                                 ?`/Admin/teachers/status/${member.id}/profile`
                                :`/Admin/students/stats/${member.id}/profile`}
              />
            }
          >
            View Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            render={
              <Link
                href={role==="TEACHER"
                                 ?`/Admin/teachers/status/${member.id}/performance`
                                :`/Admin/students/stats/${member.id}/performance`}
              />
            }
          >
            Performance
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleChangeBatch}
            disabled={loadingBranches}
          >
            {loadingBranches
              ? "Loading..."
              : "Change Batch"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              setRemoveDialogOpen(true)
            }
          >
            Remove from Batch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeBatchDialog
        memberId={member.id}
        memberName={member.name}
        currentBatchId={batchId}
        role={role}
        branches={branches}
        open={changeBatchOpen}
        onOpenChange={setChangeBatchOpen}
        onChanged={onChanged}
      />

      <RemoveMemberDialog
        memberId={member.id}
        memberName={member.name}
        batchId={batchId}
        role={role}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onRemoved={onChanged}
      />
    </>
  );
}