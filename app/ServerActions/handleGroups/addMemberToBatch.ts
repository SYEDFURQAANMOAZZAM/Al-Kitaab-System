"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { requireRoleForAction } from "@/lib/auth/require-role";

type AddMemberParams = {
  batchId: string;
  userId: string;
  role: Role;
};

export async function addMemberToBatch({
  batchId,
  userId,
  role,
}: AddMemberParams) {
   requireRoleForAction(["ADMIN","TEACHER"])
  if (!batchId || !userId) {
    return {
      success: false,
      error: "Invalid batch or member.",
    };
  }

  try {
    // Make sure the batch exists
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
      },
      select: {
        id: true,
      },
    });

    if (!batch) {
      return {
        success: false,
        error: "Batch not found.",
      };
    }

    // Get the existing user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Member not found.",
      };
    }

    // Make sure the requested role matches the user's actual role
    if (user.role !== role) {
      return {
        success: false,
        error: "Invalid member role.",
      };
    }

    // -------------------------
    // ADD STUDENT
    // -------------------------

    if (role === Role.STUDENT) {
      const student = await prisma.student.findUnique({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      });

      if (!student) {
        return {
          success: false,
          error: "Student record not found.",
        };
      }

      // Check whether already enrolled
      const alreadyInBatch =
        await prisma.studentEnrollment.findUnique({
          where: {
            studentId_batchId: {
              studentId: student.id,
              batchId: batchId,
            },
          },
        });

      if (alreadyInBatch) {
        return {
          success: false,
          error: "Student is already in this batch.",
        };
      }

      // Add EXISTING student to batch
      await prisma.studentEnrollment.create({
        data: {
          studentId: student.id,
          batchId: batchId,
        },
      });
    }

    // -------------------------
    // ADD TEACHER
    // -------------------------

    if (role === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      });

      if (!teacher) {
        return {
          success: false,
          error: "Teacher record not found.",
        };
      }

      // Check whether already assigned
      const alreadyInBatch =
        await prisma.teacherAssignment.findUnique({
          where: {
            teacherId_batchId: {
              teacherId: teacher.id,
              batchId: batchId,
            },
          },
        });

      if (alreadyInBatch) {
        return {
          success: false,
          error: "Teacher is already assigned to this batch.",
        };
      }

      // Add EXISTING teacher to batch
      await prisma.teacherAssignment.create({
        data: {
          teacherId: teacher.id,
          batchId: batchId,
        },
      });
    }
    revalidatePath("/Admin/branches");
    return {
      success: true,
    };
  } catch (error) {
    console.error("addMemberToBatch:", error);

    return {
      success: false,
      error: "Failed to add member to batch.",
    };
  }
}