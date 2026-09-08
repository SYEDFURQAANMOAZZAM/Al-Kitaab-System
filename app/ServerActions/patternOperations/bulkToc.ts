"use server";

import { z } from "zod";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

import { parseToc } from "@/app/(user)/Admin/study-pattern/[id]/bulktoc/parser";

const BulkTocSchema = z.object({
  patternId: z
    .string()
    .trim()
    .min(1, "Pattern id is required."),

  text: z
    .string()
    .trim()
    .min(1, "TOC text is required."),
});

type TocInsertRow = {
  id: string;
  patternId: string;
  patternArrId: string;
  parentId: string | null;
  name: string;
  position: number;
};

export async function importToc(
  input: unknown,
) {
  /*
   * --------------------------------------------------------
   * 1. AUTHENTICATION / AUTHORIZATION
   * --------------------------------------------------------
   */
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  /*
   * --------------------------------------------------------
   * 2. INPUT VALIDATION
   * --------------------------------------------------------
   */
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
    patternId,
    text,
  } = parsedInput.data;

  /*
   * --------------------------------------------------------
   * 3. LOAD PATTERN + PATTERN ARR
   * --------------------------------------------------------
   */
  const pattern =
    await prisma.pattern.findUnique({
      where: {
        id: patternId,
      },

      select: {
        id: true,

        patternArr: {
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

  if (!pattern) {
    return {
      success: false,
      error: "Pattern not found.",
    };
  }

  /*
   * --------------------------------------------------------
   * 4. PARSE + VALIDATE EVERYTHING
   *
   * NOTHING is written to the database here.
   * --------------------------------------------------------
   */
  let parsedToc;

  try {
    parsedToc = parseToc(
      text,
      pattern.patternArr,
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

  /*
   * --------------------------------------------------------
   * 5. BUILD ALL DATABASE ROWS IN MEMORY
   *
   * NO DATABASE INSERTS HERE.
   *
   * We generate IDs ourselves so children can know
   * their parentId before anything is inserted.
   * --------------------------------------------------------
   */

  const rows: TocInsertRow[] = [];

  /*
   * parser index -> generated database ID
   *
   * Example:
   *
   * parser index 0 -> "uuid-A"
   * parser index 1 -> "uuid-B"
   */
  const ids = new Map<number, string>();

  /*
   * Position counter per parent.
   *
   * ROOT = top-level items
   * other keys = parent database IDs
   */
  const nextPosition =
    new Map<string, number>();

  for (
    let index = 0;
    index < parsedToc.length;
    index++
  ) {
    const item =
      parsedToc[index];

    /*
     * ------------------------------------------------------
     * Resolve parentId COMPLETELY IN MEMORY
     * ------------------------------------------------------
     */
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

    /*
     * ------------------------------------------------------
     * Calculate position
     * ------------------------------------------------------
     */
    const positionKey =
      parentId ?? "ROOT";

    const position =
      nextPosition.get(
        positionKey,
      ) ?? 0;

    /*
     * ------------------------------------------------------
     * Generate DB ID BEFORE INSERT
     * ------------------------------------------------------
     */
    const id = randomUUID();

    /*
     * Save parser-index -> DB-ID mapping.
     *
     * Children can now reference this ID.
     */
    ids.set(index, id);

    /*
     * ------------------------------------------------------
     * Build row in memory
     * ------------------------------------------------------
     */
    rows.push({
      id,

      patternId:
        pattern.id,

      patternArrId:
        item.partId,

      parentId,

      name:
        item.name,

      position,
    });

    /*
     * Next sibling gets next position.
     */
    nextPosition.set(
      positionKey,
      position + 1,
    );
  }

  /*
   * --------------------------------------------------------
   * 6. NOTHING HAS BEEN SAVED YET
   *
   * At this point:
   *
   * Parser
   *    ↓
   * Validation
   *    ↓
   * Parent IDs resolved
   *    ↓
   * Positions resolved
   *    ↓
   * All rows ready
   *
   * If something is wrong, throw/return BEFORE transaction.
   * --------------------------------------------------------
   */

  if (!rows.length) {
    return {
      success: false,
      error: "No TOC items found.",
    };
  }

  /*
   * --------------------------------------------------------
   * 7. SINGLE BULK DATABASE INSERT
   * --------------------------------------------------------
   *
   * createMany() sends the rows as a bulk operation rather
   * than doing one INSERT per TOC item.
   * --------------------------------------------------------
   */
  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.patternTocItem.createMany({
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
      "Bulk TOC import failed:",
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