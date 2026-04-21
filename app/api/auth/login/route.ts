import { fail, ok } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/session";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid login payload", 400, parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() }
    });

    if (!user) {
      return fail("Invalid email or password", 401);
    }

    const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValidPassword) {
      return fail("Invalid email or password", 401);
    }

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
    return fail("Unable to login", 500, error instanceof Error ? error.message : error);
  }
}
