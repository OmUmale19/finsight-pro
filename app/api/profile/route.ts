import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validators";
import { setAuthCookie, signAuthToken } from "@/lib/session";

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  return ok(user);
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid profile payload", 400, parsed.error.flatten());
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name.trim(),
        avatarUrl: toNullable(parsed.data.avatarUrl),
        jobTitle: toNullable(parsed.data.jobTitle),
        company: toNullable(parsed.data.company),
        location: toNullable(parsed.data.location),
        bio: toNullable(parsed.data.bio)
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        jobTitle: true,
        company: true,
        location: true,
        bio: true,
        emailNotifications: true,
        weeklyDigest: true,
        productUpdates: true,
        createdAt: true
      }
    });

    const token = await signAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl
    });

    await setAuthCookie(token);

    return ok(updatedUser);
  } catch (error) {
    return fail("Unable to update profile", 500, error instanceof Error ? error.message : error);
  }
}
