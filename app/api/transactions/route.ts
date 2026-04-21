import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              {
                merchant: { contains: search, mode: "insensitive" }
              },
              {
                description: { contains: search, mode: "insensitive" }
              }
            ]
          }
        : {})
    },
    orderBy: { date: "desc" },
    take: 200
  });

  return ok(transactions);
}
