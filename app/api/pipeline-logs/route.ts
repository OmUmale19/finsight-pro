import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const logs = await prisma.pipelineLog.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 20
  });

  return ok(logs);
}
