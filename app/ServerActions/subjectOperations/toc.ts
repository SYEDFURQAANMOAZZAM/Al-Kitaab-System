"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRoleForAction } from "@/lib/auth/require-role";

/* =========================================================
   ADD TOC ITEM
========================================================= */

const AddTocSchema = z.object({
  subjectId: z
    .string()
    .trim()
    .min(1),

  subjectPartId: z
    .string()
    .trim()
    .min(1),

  parentId: z
    .string()
    .trim()
    .nullable(),

  name: z
    .string()
    .trim()
    .min(1, "TOC item name is required."),
});

export async function addTocItem(
  input: unknown,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  const parsed =
    AddTocSchema.safeParse(input);

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
    name,
  } = parsed.data;

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
  if (!parentId && part.position !== 0) {
    return {
      success: false,
      error:
        "Only the first SubjectPart can have root items.",
    };
  }

  /*
   * Validate parent.
   */
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
        error: "Parent SubjectPart not found.",
      };
    }

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

  /*
   * Find next sibling position.
   */
  const lastItem =
    await prisma.subjectTocItem.findFirst({
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

  const position =
    (lastItem?.position ?? -1) + 1;

  await prisma.subjectTocItem.create({
    data: {
      subjectId,
      subjectPartId,
      parentId,
      name,
      position,
    },
  });

  return {
    success: true,
  };
}

/* =========================================================
   UPDATE TOC ITEM
========================================================= */

const UpdateTocSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1),

  name: z
    .string()
    .trim()
    .min(1, "TOC item name is required."),
});

export async function updateTocItem(
  input: unknown,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  const parsed =
    UpdateTocSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid input.",
    };
  }

  const {
    id,
    name,
  } = parsed.data;

  const item =
    await prisma.subjectTocItem.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!item) {
    return {
      success: false,
      error: "TOC item not found.",
    };
  }

  await prisma.subjectTocItem.update({
    where: {
      id,
    },

    data: {
      name,
    },
  });

  return {
    success: true,
  };
}

/* =========================================================
   DELETE TOC ITEM
========================================================= */

export async function deleteTocItem(
  id: string,
) {
  await requireRoleForAction([
    "ADMIN",
    "TEACHER",
  ]);

  if (!id?.trim()) {
    return {
      success: false,
      error: "TOC item id is required.",
    };
  }

  const item =
    await prisma.subjectTocItem.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!item) {
    return {
      success: false,
      error: "TOC item not found.",
    };
  }

  /*
   * SubjectTocItem.parent relation uses
   * onDelete: Cascade, so children are
   * removed automatically.
   */
  await prisma.subjectTocItem.delete({
    where: {
      id,
    },
  });

  return {
    success: true,
  };
}