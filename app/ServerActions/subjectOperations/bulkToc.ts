"use server";

import { randomUUID } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { parseToc } from "./parser";

/* =========================================================
   INPUT
========================================================= */

const BulkTocSchema = z.object({
  subjectId: z
    .string()
    .trim()
    .min(1, "Subject id is required."),

  text: z
    .string()
    .trim()
    .min(1, "TOC text is required."),
});

/* =========================================================
   DATABASE ROW
========================================================= */

type TocInsertRow = {
  id: string;
  subjectId: string;
  subjectPartId: string;
  parentId: string | null;
  name: string;
  position: number;
};

/* =========================================================
   IMPORT TOC
========================================================= */

export async function importToc(
  input: unknown,
) {
  /* -------------------------------------------------------
     1. AUTHORIZATION
  ------------------------------------------------------- */

  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  /* -------------------------------------------------------
     2. VALIDATE INPUT
  ------------------------------------------------------- */

  const parsedInput =
    BulkTocSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      error:
        parsedInput.error.issues[0]?.message ??
        "Invalid input.",
    };
  }

  const {
    subjectId,
    text,
  } = parsedInput.data;

  /* -------------------------------------------------------
     3. LOAD SUBJECT
  ------------------------------------------------------- */

  const subject =
    await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },

      select: {
        id: true,

        parts: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });

  if (!subject) {
    return {
      success: false,
      error: "Subject not found.",
    };
  }

  if (subject.parts.length === 0) {
    return {
      success: false,
      error:
        "This subject has no subject parts.",
    };
  }

  /* -------------------------------------------------------
     4. PARSE TOC
  ------------------------------------------------------- */

  let parsedToc;

  try {
    parsedToc = parseToc(
      text,
      subject.parts,
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Invalid TOC format.",
    };
  }

  /* -------------------------------------------------------
     5. LOAD EXISTING POSITIONS
     
     IMPORTANT:
     Existing TOC is preserved.
     
     New items are appended after existing
     siblings.
  ------------------------------------------------------- */

  const existingItems =
    await prisma.subjectTocItem.findMany({
      where: {
        subjectId,
      },

      select: {
        parentId: true,
        position: true,
      },
    });

  /*
   * parentId -> next position
   *
   * ROOT is represented by "ROOT".
   */
  const nextPosition =
    new Map<string, number>();

  for (const item of existingItems) {
    const key =
      item.parentId ?? "ROOT";

    const current =
      nextPosition.get(key) ?? 0;

    nextPosition.set(
      key,
      Math.max(
        current,
        item.position + 1,
      ),
    );
  }

  /* -------------------------------------------------------
     6. BUILD ROWS IN MEMORY
  ------------------------------------------------------- */

  const rows: TocInsertRow[] = [];

  /*
   * parser index -> generated DB ID
   */
  const ids = new Map<number, string>();

  try {
    for (
      let index = 0;
      index < parsedToc.length;
      index++
    ) {
      const item =
        parsedToc[index];

      let parentId:
        | string
        | null = null;

      if (
        item.parentIndex !== null
      ) {
        parentId =
          ids.get(
            item.parentIndex,
          ) ?? null;

        if (!parentId) {
          throw new Error(
            `Could not resolve parent for line ${item.sourceLine}.`,
          );
        }
      }

      const positionKey =
        parentId ?? "ROOT";

      const position =
        nextPosition.get(
          positionKey,
        ) ?? 0;

      const id = randomUUID();

      ids.set(index, id);

      rows.push({
        id,
        subjectId: subject.id,
        subjectPartId:
          item.partId,
        parentId,
        name: item.name,
        position,
      });

      nextPosition.set(
        positionKey,
        position + 1,
      );
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to prepare TOC items.",
    };
  }

  /* -------------------------------------------------------
     7. FINAL VALIDATION
  ------------------------------------------------------- */

  if (!rows.length) {
    return {
      success: false,
      error: "No TOC items found.",
    };
  }

  /* -------------------------------------------------------
     8. BULK INSERT
     
     Existing TOC is untouched.
  ------------------------------------------------------- */

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.subjectTocItem.createMany({
          data: rows,
        });
      },
      {
        timeout: 60_000,
      },
    );

    return {
      success: true,
      count: rows.length,
    };
  } catch (error) {
    console.error(
      "Bulk Subject TOC import failed:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save TOC.",
    };
  }
}