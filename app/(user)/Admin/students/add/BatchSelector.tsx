"use client";

import { Fragment, useMemo } from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

/* =========================================================
   TYPES

   BatchOption / BranchGroup are intentionally a minimal
   subset of Prisma's Batch / Branch models (just id + name
   [+ batches]). Prisma's fuller Batch type (with `patterns`,
   `branchId`, etc., as used by UserForm's `Branch` type)
   satisfies these structurally, so no schema changes are
   needed here — this component just doesn't need to know
   about patterns.
========================================================= */

export type BatchOption = {
  id: string;
  name: string;
};

export type BranchGroup = {
  id: string;
  name: string;
  batches: BatchOption[];
};

type SelectedBatch = BatchOption & {
  branchId: string;
  branchName: string;
};

type BatchSelectorProps = {
  branches: BranchGroup[];

  selectedBranchIds: string[];
  onBranchChange: (branchIds: string[]) => void;

  selectedBatchIds: string[];
  onBatchChange: (batchIds: string[]) => void;

  branchPlaceholder?: string;
  batchPlaceholder?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function BatchSelector({
  branches,
  selectedBranchIds,
  onBranchChange,
  selectedBatchIds,
  onBatchChange,
  branchPlaceholder = "Select branches...",
  batchPlaceholder = "Select batches...",
}: BatchSelectorProps) {
  /* =======================================================
     SELECTED BRANCHES
  ======================================================= */

  const selectedBranches = useMemo(
    () =>
      branches.filter((branch) =>
        selectedBranchIds.includes(branch.id)
      ),
    [branches, selectedBranchIds]
  );

  /* =======================================================
     AVAILABLE BATCHES
     
     Flatten selected branches into batch items while
     retaining branch information for grouping/display.
  ======================================================= */

  const availableBatches = useMemo<SelectedBatch[]>(
    () =>
      selectedBranches.flatMap((branch) =>
        branch.batches.map((batch) => ({
          id: batch.id,
          name: batch.name,
          branchId: branch.id,
          branchName: branch.name,
        }))
      ),
    [selectedBranches]
  );

  /* =======================================================
     SELECTED BATCHES
  ======================================================= */

  const selectedBatches = useMemo(
    () =>
      selectedBatchIds
        .map((id) =>
          availableBatches.find((batch) => batch.id === id)
        )
        .filter(
          (batch): batch is SelectedBatch => Boolean(batch)
        ),
    [selectedBatchIds, availableBatches]
  );

  /* =======================================================
     GROUP BATCHES BY BRANCH
  ======================================================= */

  const batchGroups = useMemo(
    () =>
      selectedBranches
        .map((branch) => ({
          id: branch.id,
          name: branch.name,
          items: availableBatches.filter(
            (batch) => batch.branchId === branch.id
          ),
        }))
        .filter((group) => group.items.length > 0),
    [selectedBranches, availableBatches]
  );

  /* =======================================================
     BRANCH CHANGE
     
     If a branch is removed, remove its batches too.
  ======================================================= */

  const handleBranchChange = (branchIds: string[]) => {
    onBranchChange(branchIds);

    const validBranchIds = new Set(branchIds);

    const validBatchIds = selectedBatches
      .filter((batch) => validBranchIds.has(batch.branchId))
      .map((batch) => batch.id);

    onBatchChange(validBatchIds);
  };
 const branchAnchor = useComboboxAnchor();
const batchAnchor = useComboboxAnchor();
  return (
    <div className="space-y-6">

      {/* =====================================================
          BRANCHES
      ===================================================== */}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Branches
        </label>

        <Combobox
          items={branches}
          multiple
          value={selectedBranches}
          onValueChange={(items: BranchGroup[]) =>
            handleBranchChange(
              items.map((branch) => branch.id)
            )
          }
          itemToStringValue={(branch: BranchGroup) =>
            branch.name
          }
        >
          <ComboboxChips
           ref={branchAnchor}
            className="
              min-h-12
              rounded-xl
              border-input
              overflow-y-auto
              bg-background
              px-3
              py-2
              focus-within:border-ring
              focus-within:ring-2
              focus-within:ring-ring/20
            "
          >
            <ComboboxValue>
              {selectedBranches.map((branch) => (
                <ComboboxChip
                  key={branch.id}
                  className="
                    gap-1.5
                    rounded-full
                    border-primary/30
                    bg-primary/10
                    pl-3
                    pr-1.5
                    text-primary
                  "
                >
                  {branch.name}
                </ComboboxChip>
              ))}
            </ComboboxValue>

            <ComboboxChipsInput
              placeholder={
                selectedBranches.length === 0
                  ? branchPlaceholder
                  : ""
              }
            />
          </ComboboxChips>

          <ComboboxContent anchor={branchAnchor} className="rounded-xl">
            <ComboboxEmpty>
              No branches found.
            </ComboboxEmpty>

            <ComboboxList>
              <ComboboxCollection>
                {(branch: BranchGroup) => (
                  <ComboboxItem
                    key={branch.id}
                    value={branch}
                  >
                    {branch.name}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* =====================================================
          BATCHES
      ===================================================== */}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Batches
        </label>

        <Combobox
          items={availableBatches}
          multiple
          value={selectedBatches}
          onValueChange={(items: SelectedBatch[]) =>
            onBatchChange(
              items.map((batch) => batch.id)
            )
          }
          itemToStringValue={(batch: SelectedBatch) =>
            `${batch.branchName} ${batch.name}`
          }
        >
          <ComboboxChips
            ref={batchAnchor}
            className="
              min-h-12
              rounded-xl
              border-input
              bg-background
              overflow-y-auto
              px-3
              py-2
              focus-within:border-ring
              focus-within:ring-2
              focus-within:ring-ring/20
            "
          >
            <ComboboxValue>
              {selectedBatches.map((batch) => (
                <ComboboxChip
                  key={batch.id}
                  className="
                    gap-1.5
                    rounded-full
                    border-primary/30
                    bg-primary/10
                    pl-3
                    pr-1.5
                    text-primary
                  "
                >
                  <span className="text-xs text-primary">
                    {batch.branchName} →
                  </span>

                  {batch.name}
                </ComboboxChip>
              ))}
            </ComboboxValue>

            <ComboboxChipsInput
              placeholder={
                selectedBatches.length === 0
                  ? batchPlaceholder
                  : ""
              }
            />
          </ComboboxChips>

          <ComboboxContent anchor={batchAnchor} className="rounded-xl">
            <ComboboxEmpty>
              {selectedBranches.length === 0
                ? "Select branches first."
                : "No batches found."}
            </ComboboxEmpty>

            <ComboboxList>
              {batchGroups.map((group, index) => (
                <Fragment key={group.id}>
                  <ComboboxGroup items={group.items}>
                    <ComboboxLabel>
                      {group.name}
                    </ComboboxLabel>

                    <ComboboxCollection>
                      {(batch: SelectedBatch) => (
                        <ComboboxItem
                          key={batch.id}
                          value={batch}
                        >
                          {batch.name}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>

                  {index < batchGroups.length - 1 && (
                    <ComboboxSeparator />
                  )}
                </Fragment>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}