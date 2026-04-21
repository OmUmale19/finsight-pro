import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { budgetSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    orderBy: { category: "asc" }
  });

  return ok(budgets);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid budget payload", 400, parsed.error.flatten());
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: user.id,
          category: parsed.data.category
        }
      },
      create: {
        userId: user.id,
        ...parsed.data
      },
      update: {
        limit: parsed.data.limit
      }
    });

    return ok(budget);
  } catch (error) {
    return fail("Unable to save budget", 500, error instanceof Error ? error.message : error);
  }
}
