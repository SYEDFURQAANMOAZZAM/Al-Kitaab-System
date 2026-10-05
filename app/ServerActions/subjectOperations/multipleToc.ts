"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

/* =========================================================
   ADD MULTIPLE TOC ITEMS
========================================================= */

const AddMultipleTocSchema = z.object({
  subjectId: z
    .string()
    .trim()
    .min(1, "Subject ID is required."),

  subjectPartId: z
    .string()
    .trim()
    .min(1, "Subject part ID is required."),

  parentId: z
    .string()
    .trim()
    .nullable(),

  prefix: z
    .string()
    .trim(),

  from: z
    .number()
    .int("From must be a whole number."),

  to: z
    .number()
    .int("To must be a whole number."),

  suffix: z
    .string()
    .trim(),
});

export async function addMultipleTocItems(
  input: unknown,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  const parsed =
    AddMultipleTocSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid input.",
    };
  }

  const {
    subjectId,
    subjectPartId,
    parentId,
    prefix,
    from,
    to,
    suffix,
  } = parsed.data;

  /* =======================================================
     RANGE VALIDATION
  ======================================================= */

  if (from > to) {
    return {
      success: false,
      error:
        "The starting number cannot be greater than the ending number.",
    };
  }

  const count = to - from + 1;

  /*
   * Protect against accidentally creating
   * thousands of records.
   */
  if (count > 1000) {
    return {
      success: false,
      error:
        "You can add a maximum of 1000 TOC items at once.",
    };
  }

  /*
   * At least something must be generated.
   */
  if (!prefix && !suffix) {
    return {
      success: false,
      error:
        "Enter text before or after the number.",
    };
  }

  /* =======================================================
     VALIDATE SUBJECT PART
  ======================================================= */

  const part =
    await prisma.subjectPart.findFirst({
      where: {
        id: subjectPartId,
        subjectId,
      },

      select: {
        id: true,
        position: true,
      },
    });

  if (!part) {
    return {
      success: false,
      error: "Subject part not found.",
    };
  }

  /*
   * Root items can only belong to
   * the first SubjectPart.
   */
  if (
    !parentId &&
    part.position !== 0
  ) {
    return {
      success: false,
      error:
        "Only the first SubjectPart can have root items.",
    };
  }

  /* =======================================================
     VALIDATE PARENT
  ======================================================= */

  if (parentId) {
    const parent =
      await prisma.subjectTocItem.findFirst({
        where: {
          id: parentId,
          subjectId,
        },

        select: {
          id: true,
          subjectPartId: true,
        },
      });

    if (!parent) {
      return {
        success: false,
        error: "Parent TOC item not found.",
      };
    }

    const parentPart =
      await prisma.subjectPart.findFirst({
        where: {
          id: parent.subjectPartId,
          subjectId,
        },

        select: {
          position: true,
        },
      });

    if (!parentPart) {
      return {
        success: false,
        error:
          "Parent SubjectPart not found.",
      };
    }

    /*
     * Children can only be created under
     * the immediately previous SubjectPart.
     */
    if (
      parentPart.position + 1 !==
      part.position
    ) {
      return {
        success: false,
        error:
          "A TOC item can only be added under the immediately previous SubjectPart.",
      };
    }
  }

  /* =======================================================
     CREATE ITEMS
  ======================================================= */

  try {
    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Find the current last sibling.
           */
          const lastItem =
            await tx.subjectTocItem.findFirst({
              where: {
                subjectId,
                subjectPartId,
                parentId,
              },

              orderBy: {
                position: "desc",
              },

              select: {
                position: true,
              },
            });

          const firstPosition =
            (lastItem?.position ?? -1) + 1;

          const data = Array.from(
            { length: count },
            (_, index) => {
              const number =
                from + index;

              return {
                subjectId,
                subjectPartId,
                parentId,
                name: `${prefix}${number}${suffix}`,
                position:
                  firstPosition + index,
              };
            },
          );

          await tx.subjectTocItem.createMany({
            data,
          });

          return {
            count: data.length,
            firstPosition,
            lastPosition:
              firstPosition +
              data.length -
              1,
          };
        },
      );

    return {
      success: true,
      count: result.count,
    };
  } catch (error) {
    console.error(
      "addMultipleTocItems error:",
      error,
    );

    return {
      success: false,
      error:
        "Failed to add TOC items. Please try again later.",
    };
  }
}