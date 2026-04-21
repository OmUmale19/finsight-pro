import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  return ok(user);
}
