import { Prisma } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/session";
import { profileSecuritySchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = profileSecuritySchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid security payload", 400, parsed.error.flatten());
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!currentUser) {
      return fail("User not found", 404);
    }

    const shouldChangePassword = parsed.data.currentPassword.length > 0 || parsed.data.newPassword.length > 0;

    if (shouldChangePassword) {
      const isValidPassword = await verifyPassword(parsed.data.currentPassword, currentUser.passwordHash);
      if (!isValidPassword) {
        return fail("Current password is incorrect", 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: parsed.data.email.toLowerCase(),
        ...(shouldChangePassword
          ? {
              passwordHash: await hashPassword(parsed.data.newPassword)
            }
          : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      }
    });

    const token = await signAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl
    });

    await setAuthCookie(token);

    return ok({
      email: updatedUser.email,
      passwordChanged: shouldChangePassword
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("An account already exists with this email", 409);
    }

    return fail("Unable to update account security", 500, error instanceof Error ? error.message : error);
  }
}
