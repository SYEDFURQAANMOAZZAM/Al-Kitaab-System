import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findAdminForUpdate(
  userId: string,
) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

export async function updateAdminRecord(
  userId: string,
  data: Prisma.UserUpdateInput,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export async function findAdminForForm(
  userId: string,
) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}