# Pattern vs Subject Conflict Report

## Executive summary

The current project is in a hybrid state: some code still follows the old Pattern domain, while newer progress code and migration history are already rewritten around Subject.

This means the application is not fully migrated and the Prisma schema, runtime code, generated client, and migration history are not aligned.

## 1) Schema conflicts

### A. Schema still defines the old Pattern model

The Prisma schema still declares the old model names and relations in [prisma/schema.prisma](prisma/schema.prisma):

- StudentPattern
- TeacherPattern
- BatchPattern
- Pattern
- PatternArr
- PatternTocItem
- StudentOverallProgress
- trackingStatus on Pattern

This is the main sign that the schema has not been updated to the Subject model.

Relevant section in [prisma/schema.prisma](prisma/schema.prisma):

- StudentPattern and TeacherPattern are still defined in the schema.
- Pattern, PatternArr, PatternTocItem, BatchPattern, and StudentOverallProgress are still in use.
- Pattern has a trackingStatus field with the Status enum, which contradicts the later migration that removes that enum.

### B. Runtime code is partly using Subject names

Newer progress code has already switched to the Subject naming style:

- [app/ServerActions/progress/subject-progress.ts](app/ServerActions/progress/subject-progress.ts)
- [app/ServerActions/progress/getBatchSubjects.ts](app/ServerActions/progress/getBatchSubjects.ts)
- [lib/progress/subject-completion.ts](lib/progress/subject-completion.ts)

Examples:

- Uses subject.findUnique, studentSubject, batchSubject, and trackingTerms.
- Expects subjectPartId and subjectId fields instead of patternArrId and patternId.
- Uses the SubjectTrackingTerm and StudentSubjectTracking model names in the migration logic.

This creates a split between the older schema and newer logic.

### C. Old Pattern-based UI still remains

The admin pages still operate on Pattern terminology and calls:

- [app/(user)/Admin/study-pattern/page.tsx](<app/(user)/Admin/study-pattern/page.tsx>)
- [app/ServerActions/patternOperations/fetchPatterns.ts](app/ServerActions/patternOperations/fetchPatterns.ts)
- [app/(user)/Admin/study-pattern/[id]/tracking/page.tsx](<app/(user)/Admin/study-pattern/[id]/tracking/page.tsx>)

Those files still call:

- prisma.pattern
- getPatterns()
- patternArr
- trackingStatus

This is inconsistent with the newer subject-based flow.

## 2) Code conflicts

### A. Mixed naming in the same project

The project contains both Pattern and Subject names in active code:

- Pattern-based: prisma.pattern, patternArr, StudentPattern, PatternTocItem
- Subject-based: prisma.subject, SubjectPart, studentSubject, subjectPartId, trackingTerms

This is the clearest conflict in the codebase.

### B. API and UI semantics are not aligned

The admin pages and server actions are still built around Study Pattern management, while the progress engine is built around Subject tracking.

Examples:

- Pattern listing page says “Study Patterns” and loads pattern records.
- Progress logic validates subject progress and uses subjectPartId.
- The same system is trying to represent one domain using two different names.

### C. Generated Prisma client is stale and still Pattern-based

The generated client still contains old model names such as Pattern, StudentPattern, PatternArr, PatternTocItem, and StudentOverallProgress in [generated/prisma/internal/prismaNamespace.ts](generated/prisma/internal/prismaNamespace.ts).

This strongly suggests the generated client was not regenerated after the Subject migration.

The generated output still exposes the old metadata, even though the migration file indicates a rename.

## 3) Migration conflicts

### A. Rename migration exists but the schema does not match it

The migration [prisma/migrations/20260919090000_pattern_to_subject/migration.sql](prisma/migrations/20260919090000_pattern_to_subject/migration.sql) explicitly renames:

- Pattern -> Subject
- PatternArr -> SubjectPart
- PatternTocItem -> SubjectTocItem
- StudentPattern -> StudentSubject
- TeacherPattern -> TeacherSubject
- BatchPattern -> BatchSubject

It also renames fields like:

- patternId -> subjectId
- patternArrId -> subjectPartId
- studentPatternId -> studentSubjectId

This migration clearly assumes the project has already moved to Subject semantics.

### B. The schema file contradicts the migration

However, [prisma/schema.prisma](prisma/schema.prisma) still defines the pre-migration model names and old fields. That means the migration history and schema are out of sync.

In practical terms:

- The database migration says one model layout exists.
- The Prisma schema says a different model layout exists.
- The generated client reflects the old layout again.

### C. Some migration steps are logically inconsistent with the current schema

The migration also removes the old Status enum and converts it into SubjectTrackingTerm + StudentSubjectTracking.

But the schema still contains:

- enum Status
- field trackingStatus on Pattern
- model StudentOverallProgress with patternId and studentPatternId

So the migration is implementing a newer architecture, while the schema still declares the older one.

## 4) Concrete conflict examples

### Example 1: model name conflict

Schema says:

- Pattern
- PatternArr
- PatternTocItem

Migration says:

- Subject
- SubjectPart
- SubjectTocItem

This is not a harmless rename; it changes the domain model and all query contracts.

### Example 2: field naming conflict

Schema says:

- patternId
- patternArrId
- studentPatternId

Migration says:

- subjectId
- subjectPartId
- studentSubjectId

The application code is currently mixing both names.

### Example 3: tracking/status conflict

Schema says:

- Pattern.trackingStatus: Status

Migration says:

- remove the enum
- create SubjectTrackingTerm and StudentSubjectTracking

This is a direct conflict between a per-pattern global status and a per-subject tracking structure.

## 5) Root cause

The project appears to be mid-migration. The codebase contains old Pattern-era models and new Subject-era logic side by side. This usually happens when:

- migration was added but Prisma schema was not updated afterward,
- generated client was not regenerated,
- some feature branches or server actions were updated before the core schema was fully reconciled.

## 6) Risks

- Prisma migrations may fail or produce bad diffs if the schema is changed again without reconciling model names.
- Runtime queries may fail because the DB and Prisma schema disagree.
- The generated client can be stale and no longer match the real database structure.
- UI and API logic may break due to invalid field names like patternId versus subjectId.
- The project may have silent data inconsistencies if legacy Pattern data and newer Subject data coexist.

## 7) Server actions inconsistencies with schema and migrations

The server actions are one of the strongest indicators that the project is not in a single consistent state.

### A. Pattern-based actions still target the old schema

Files still write queries against the old Pattern model and relationship names:

- [app/ServerActions/patternOperations/fetchPatterns.ts](app/ServerActions/patternOperations/fetchPatterns.ts)
- [app/ServerActions/patternOperations/toc.ts](app/ServerActions/patternOperations/toc.ts)
- [app/ServerActions/patternOperations/createPattern.ts](app/ServerActions/patternOperations/createPattern.ts)
- [app/ServerActions/patternOperations/updatePattern.ts](app/ServerActions/patternOperations/updatePattern.ts)
- [app/ServerActions/patternOperations/deletePattern.ts](app/ServerActions/patternOperations/deletePattern.ts)
- [app/ServerActions/patternOperations/bulkToc.ts](app/ServerActions/patternOperations/bulkToc.ts)
- [app/ServerActions/patternOperations/parser.ts](app/ServerActions/patternOperations/parser.ts)

These actions use names such as:

- prisma.pattern
- patternArr
- patternTocItem
- patternId
- trackingStatus
- StudentPattern
- StudentOverallProgress

This is directly at odds with the rename migration in [prisma/migrations/20260919090000_pattern_to_subject/migration.sql](prisma/migrations/20260919090000_pattern_to_subject/migration.sql), which renames those tables and fields to their Subject equivalents.

### B. Progress actions are split between old and new domains

The newer progress flow has been partially refactored to Subject semantics, but it still coexists with older Pattern logic:

- [app/ServerActions/progress/subject-progress.ts](app/ServerActions/progress/subject-progress.ts)
- [app/ServerActions/progress/getBatchSubjects.ts](app/ServerActions/progress/getBatchSubjects.ts)
- [lib/progress/subject-completion.ts](lib/progress/subject-completion.ts)

However, older Progress actions still operate on Pattern objects:

- [app/ServerActions/progress/progress.ts](app/ServerActions/progress/progress.ts)
- [app/ServerActions/progress/saveGlobalLearnings.ts](app/ServerActions/progress/saveGlobalLearnings.ts)
- [app/ServerActions/progress/getProgress.ts](app/ServerActions/progress/getProgress.ts)
- [app/ServerActions/progress/getBatchPatterns.tsx](app/ServerActions/progress/getBatchPatterns.tsx)
- [app/ServerActions/progress/getCommonPatterns.tsx](app/ServerActions/progress/getCommonPatterns.tsx)

This creates a hard conflict:

- the subject-based progress system expects subjectId, subjectPartId, studentSubject, and trackingTerms
- the older progress actions still call prisma.pattern, studentPattern, and patternArr
- the migration history says the database should have Subject tables, but the actions still query Pattern tables

### C. The server-action layer is not aligned with the schema

The schema file still contains old model names in [prisma/schema.prisma](prisma/schema.prisma):

- Pattern
- PatternArr
- PatternTocItem
- StudentPattern
- TeacherPattern
- BatchPattern
- StudentOverallProgress
- Status enum and trackingStatus field

Yet the migration history indicates that these were renamed and transformed into subject-specific tables. That means the server actions are writing code against a model that may no longer exist in the intended database state, or against a database that is not the one Prisma is modeling.

This makes the server layer impossible to trust without a schema/migration cleanup.

## 8) Admin page inconsistencies with schema and migrations

The admin pages are also still built around the old Pattern domain, even though the migration renamed this domain to Subject.

### A. Study-pattern pages still use Pattern terminology

Examples:

- [app/(user)/Admin/study-pattern/page.tsx](<app/(user)/Admin/study-pattern/page.tsx>)
- [app/(user)/Admin/study-pattern/[id]/tracking/page.tsx](<app/(user)/Admin/study-pattern/[id]/tracking/page.tsx>)
- [app/(user)/Admin/study-pattern/[id]/tracking/tracking-selector.tsx](<app/(user)/Admin/study-pattern/[id]/tracking/tracking-selector.tsx>)

These pages still:

- render “Study Patterns”
- call getPatterns
- query prisma.pattern
- access pattern.trackingStatus
- call setPatternTrackingStatus

This is not compatible with the migration’s Subject rename.

### B. Admin pages are not using the same model naming as the newer progress pages

The newer progress pages and actions use Subject terms:

- [app/ServerActions/progress/getBatchSubjects.ts](app/ServerActions/progress/getBatchSubjects.ts)
- [app/ServerActions/progress/subject-progress.ts](app/ServerActions/progress/subject-progress.ts)
- [lib/progress/subject-completion.ts](lib/progress/subject-completion.ts)

But the admin screens still use Pattern objects, PatternArr, and PatternTocItem.

This means the admin UI and the daily-progress UI are effectively modeling different versions of the same domain.

### C. Admin pages are inconsistent with migration status

The migration in [prisma/migrations/20260919090000_pattern_to_subject/migration.sql](prisma/migrations/20260919090000_pattern_to_subject/migration.sql) renames the entity and its fields, but the admin pages still ask for old names and old fields. If that migration is applied, these pages would likely break because:

- pattern is no longer the canonical table
- patternArr is no longer the canonical relation
- trackingStatus is removed from the subject model
- the admin flow is still built to manage a global Pattern status, while the migration introduces subject-local tracking terms

## 9) Combined impact: schema + server actions + admin pages

The inconsistency is not isolated to one layer. It is a full-stack mismatch:

- schema still declares Pattern-era tables
- migrations say Subject-era tables should exist
- server actions partly target one model and partly the other
- admin pages still operate on old Pattern flows
- generated Prisma client still exposes old model names

This means the application architecture is currently split into at least two incompatible versions of the same feature set.

## 10) Recommended cleanup order

1. Choose the final domain name and keep it consistent everywhere.
2. Align the Prisma schema with the intended final database design.
3. Regenerate the Prisma client after the schema is stable.
4. Rewrite all pattern-specific server actions to the final subject-based names or remove them if obsolete.
5. Update all admin pages to the same canonical domain terminology.
6. Re-run migrations in a clean environment and validate the database schema against the app queries.
7. Remove or archive dead Pattern-era files after the final migration is verified.

## Final verdict

The project is not just in a Pattern-vs-Subject naming conflict. It is in a broader architectural mismatch across:

- Prisma schema
- migration history
- generated Prisma client
- server actions
- admin pages

The app currently contains both the old Pattern implementation and the new Subject implementation, and the active code paths do not agree on which model is authoritative. This needs a coordinated migration cleanup before adding more features or running production data work.
