import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";
import { runWhatIfSimulation } from "@/lib/finance";
import { whatIfSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = whatIfSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid simulation payload", 400, parsed.error.flatten());
    }

    const dashboardData = await getDashboardData(user.id);
    const result = runWhatIfSimulation(dashboardData.summary.categoryTotals, parsed.data.scenarios);
    return ok(result);
  } catch (error) {
    return fail("Unable to run simulation", 500, error instanceof Error ? error.message : error);
  }
}
