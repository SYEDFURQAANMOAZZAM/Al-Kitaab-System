"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";

import { Dialog } from "@base-ui/react/dialog";
import { Input } from "@base-ui/react/input";

import { Role } from "@/generated/prisma/enums";

import { searchBatchMembers } from "@/app/ServerActions/getGroups/searchBatchMembers";
import { addMemberToBatch } from "@/app/ServerActions/handleGroups/addMemberToBatch";

type Member = {
  id: string;
  name: string | null;
  email: string;
};

type AddMemberButtonProps = {
  batchId: string;
  role: Role;
  onAdded?: () => void;
};

export default function AddMemberButton({
  batchId,
  role,
  onAdded,
}: AddMemberButtonProps) {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [searchPending, startSearchTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);

  /*
   * Search whenever the query changes.
   *
   * Only search after 4 characters.
   */
  useEffect(() => {
  const search = query.trim();

  if (search.length < 4) {
    return;
  }

  const timer = setTimeout(() => {
    startSearchTransition(async () => {
      const result = await searchBatchMembers({
        batchId,
        role,
        query: search,
      });

      setMembers(result);
    });
  }, 300);

  return () => {
    clearTimeout(timer);
  };
}, [query, batchId, role]);

  const reset = () => {
    setQuery("");
    setMembers([]);
    setSelectedMember(null);
    setError(null);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      reset();
    }
  };

  const handleAdd = () => {
    if (!selectedMember) {
      return;
    }

    setError(null);

    startAddTransition(async () => {
      const result = await addMemberToBatch({
        batchId,
        userId: selectedMember.id,
        role,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to add member.");
        return;
      }

      onAdded?.();
      setOpen(false);
      reset();

    });
  };

  const roleName = role === Role.STUDENT ? "student" : "teacher";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Trigger
        className="
          mr-3 flex shrink-0
          items-center gap-1.5
          rounded-lg border
          px-3 py-1.5
          text-xs font-medium
          text-foreground
          hover:bg-accent
          sm:text-sm
        "
      >
        <Plus className="h-3.5 w-3.5" />
        Add
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          className="
            fixed inset-0 z-50
            bg-black/40
          "
        />

        <Dialog.Viewport
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            p-4
          "
        >
          <Dialog.Popup
            className="
              w-full max-w-md
              rounded-xl
              border
              bg-popover
              p-5
              shadow-xl
          "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-popover-foreground">
                  Add {roleName}
                </Dialog.Title>

                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Search for an existing {roleName} and add them to this batch.
                </Dialog.Description>
              </div>

              <Dialog.Close
                className="
                  rounded-md p-1
                  text-muted-foreground
                  hover:bg-accent
                "
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="mt-5">
              <label
                htmlFor="member-search"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Search
              </label>

              <div className="relative">
                <Search
                  className="
                    pointer-events-none
                    absolute left-3 top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />

                <Input
                  id="member-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedMember(null);
                    setError(null);
                  }}
                  placeholder={`Search ${roleName} name...`}
                  className="
                    h-10 w-full
                    rounded-lg border
                    pl-9 pr-3
                    text-sm
                    outline-none
                    focus:border-ring
                    focus:ring-2
                    focus:ring-ring/20
                  "
                />
              </div>

              {query.length > 0 && query.length < 4 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Type at least 4 characters to search.
                </p>
              )}
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto">
              {searchPending && (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              )}

              {!searchPending &&
                query.trim().length >= 4 &&
                members.length === 0 && (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    No {roleName}s found.
                  </p>
                )}

              {!searchPending &&
                members.map((member) => {
                  const selected =
                    selectedMember?.id === member.id;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className={`
                        mb-1 w-full
                        rounded-lg border
                        px-3 py-2.5
                        text-left
                        transition
                        ${
                          selected
                            ? "border-ring bg-accent"
                            : "border-transparent hover:bg-accent"
                        }
                      `}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {member.name ?? "Unnamed"}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </button>
                  );
                })}
            </div>

            {selectedMember && (
              <div className="mt-4 rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Selected {roleName}
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedMember.name ?? "Unnamed"}
                </p>
              </div>
            )}

            {error && (
              <p className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                className="
                  rounded-lg border
                  px-3 py-2
                  text-sm font-medium
                  text-foreground
                  hover:bg-accent
                "
              >
                Cancel
              </Dialog.Close>

              <button
                type="button"
                disabled={!selectedMember || addPending}
                onClick={handleAdd}
                className="
                  rounded-lg
                  bg-primary
                  px-4 py-2
                  text-sm font-medium
                  text-primary-foreground
                  hover:bg-primary/90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {addPending ? "Adding..." : "Add to batch"}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}