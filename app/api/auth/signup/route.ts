import { Prisma } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/session";
import { signupSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid signup payload", 400, parsed.error.flatten());
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPassword(parsed.data.password)
      }
    });

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    await setAuthCookie(token);

    return ok({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("An account already exists with this email", 409);
    }

    return fail("Unable to create account", 500, error instanceof Error ? error.message : error);
  }
}
