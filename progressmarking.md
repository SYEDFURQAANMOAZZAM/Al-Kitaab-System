# Progress marking changes

## Purpose

The progress feature now uses a pattern's table of contents (TOC) instead of
free-text values. It supports hierarchical learning references such as:

```text
Hifz
  Para 1
    Ruku 1
      Ayah 1
      Ayah 2
    Ruku 2
```

`PatternArr` remains the definition of the levels and their order, for example
`Para -> Ruku -> Ayah` or `Surah -> Ruku -> Ayah`.

## Database changes

The migration `prisma/migrations/20260905090000_pattern_toc_and_overall_progress/migration.sql`
adds the following.

### `Pattern.trackingStatus`

Each pattern has a selected tracking status. It defaults to `SABAQ`, but an
Admin can select `SABAQ`, `PARASABAQ`, or `AMUQTA`. Only daily entries with the
selected status update the student's overall progress for that pattern.

### `PatternTocItem`

This new table stores the pattern TOC.

- `patternId` identifies the study pattern.
- `patternArrId` identifies the level: Para, Ruku, Ayah, etc.
- `parentId` creates the hierarchy.
- `name` is the displayed value, such as `1`, `Para 1`, or `Ayah 7`.
- `position` controls the order among siblings.

Deleting a Pattern or PatternArr cascades to its TOC items.

### `StudentOverallProgress`

This new table stores the latest long-term tracked position for each
student-pattern pair.

- `currentValues` contains the complete selected From/To values.
- `currentPrimaryTocItemId` stores the latest selected item for the first
  PatternArr level, such as the current Para or Surah.
- `trackingStatus` records the status that caused the update.

The row is linked to `StudentPattern` with cascade delete. Removing a pattern
from a student therefore removes that student's overall progress for the
pattern automatically.

## Study Pattern pages

The Pattern details page now has two buttons.

- **Add TOC** opens `/Admin/study-pattern/[id]/toc`.
  - Add a value for the first parameter, such as Para 1.
  - Add the next parameter below it, such as Ruku 1.
  - Continue until the final level, such as Ayah 1.
  - The editor only permits a child level directly below the preceding level.
- **Tracking: status** opens `/Admin/study-pattern/[id]/tracking`.
  - Select the status that should update long-term progress.
  - This is configurable per pattern; it is not hard-coded to Sabaq.

The TOC editor is responsive and uses a vertical mobile-first layout.

## Daily progress marking

The Admin batch Progress page and the canonical Teacher batch Progress page now
use TOC selectors for each PatternArr level.

For every level the marker can select:

- **From** — required when a value is being recorded.
- **To** — optional.

The selectors cascade. For example, selecting `Para 1` limits the Ruku choices
to children of Para 1; selecting a Ruku limits Ayah choices to that Ruku.
From and To have independent cascades, allowing a range such as:

```text
From: Para 1, Ruku 8
To:   Para 2, Ruku 8
```

The selected ranges are saved in the existing daily `Progress.learnings` JSON.
Each daily Progress row remains unique by student, batch, and India date.

## Overall-progress update

When an individual or global daily learning is saved:

1. The daily `Progress` row is created or updated.
2. The server reads that learning's Pattern and its configured tracking status.
3. If the learning status matches it, the corresponding `StudentOverallProgress`
   record is upserted.
4. Its main current position uses the first PatternArr's `To` selection, falling
   back to `From` if To is not selected.

## Files added

- `components/PatternTocRangeFields.tsx`
- `app/ServerActions/patternOperations/toc.ts`
- `app/(user)/Admin/study-pattern/[id]/toc/page.tsx`
- `app/(user)/Admin/study-pattern/[id]/toc/toc-editor.tsx`
- `app/(user)/Admin/study-pattern/[id]/tracking/page.tsx`
- `app/(user)/Admin/study-pattern/[id]/tracking/tracking-selector.tsx`
- `prisma/migrations/20260905090000_pattern_toc_and_overall_progress/migration.sql`

## Files updated

- `prisma/schema.prisma`
- `app/ServerActions/progress/progress.ts`
- `app/ServerActions/progress/saveGlobalLearnings.ts`
- `app/ServerActions/progress/getCommonPatterns.tsx`
- `app/ServerActions/progress/getBatchPatterns.tsx`
- `app/(user)/Admin/study-pattern/[id]/page.tsx`
- `app/(user)/Admin/branches/[batchId]/progress/ProgressForm.tsx`
- `app/(user)/Teacher/batches/[batchId]/(attendanceAndProgress)/progress/ProgressForm.tsx`

## Required deployment step

Apply the migration before using this feature:

```bash
pnpm prisma migrate deploy
```
