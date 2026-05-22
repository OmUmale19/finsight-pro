import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";

export async function hashPassword(password: string) {
  const saltRounds = process.env.NODE_ENV === "test" ? 4 : 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function requireUser() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });
}
