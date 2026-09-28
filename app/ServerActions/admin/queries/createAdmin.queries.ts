import { prisma } from "@/lib/prisma";

export async function createAdminRecord(data: {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.passwordHash,
      role: "ADMIN",
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