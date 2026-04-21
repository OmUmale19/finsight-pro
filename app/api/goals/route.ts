import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { goalSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    orderBy: { deadline: "asc" }
  });

  return ok(goals);
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return fail("Invalid goal payload", 400, parsed.error.flatten());
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        targetAmount: parsed.data.targetAmount,
        currentAmount: parsed.data.currentAmount,
        deadline: new Date(parsed.data.deadline)
      }
    });

    return ok(goal);
  } catch (error) {
    return fail("Unable to save goal", 500, error instanceof Error ? error.message : error);
  }
}
