import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profilePreferencesSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = profilePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid preferences payload", 400, parsed.error.flatten());
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailNotifications: parsed.data.emailNotifications,
        weeklyDigest: parsed.data.weeklyDigest,
        productUpdates: parsed.data.productUpdates
      },
      select: {
        emailNotifications: true,
        weeklyDigest: true,
        productUpdates: true
      }
    });

    return ok(updatedUser);
  } catch (error) {
    return fail("Unable to update preferences", 500, error instanceof Error ? error.message : error);
  }
}
