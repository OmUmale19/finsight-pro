import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const data = await getDashboardData(user.id);
  return ok(data);
}
