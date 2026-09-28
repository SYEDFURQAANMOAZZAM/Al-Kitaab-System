import { prisma } from "@/lib/prisma";

export async function getAdmins() {
  return prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}