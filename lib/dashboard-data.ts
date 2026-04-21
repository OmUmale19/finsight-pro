import { prisma } from "@/lib/db";
import { calculateGoalProgress, computeBudgetUsage, summarizeTransactions } from "@/lib/finance";

export async function getDashboardData(userId: string) {
  const [transactions, budgets, goals, insight, alerts, pipelineLogs] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 500
    }),
    prisma.budget.findMany({
      where: { userId },
      orderBy: { category: "asc" }
    }),
    prisma.goal.findMany({
      where: { userId },
      orderBy: { deadline: "asc" }
    }),
    prisma.insight.findUnique({
      where: { userId }
    }),
    prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.pipelineLog.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10
    })
  ]);

  const normalizedTransactions = transactions.map((tx) => ({
    amount: tx.amount,
    date: tx.date,
    category: tx.category,
    merchant: tx.merchant,
    type: tx.type
  }));

  const summary = summarizeTransactions(normalizedTransactions);
  const budgetUsage = computeBudgetUsage(
    transactions.map((tx) => ({
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      date: tx.date
    })),
    budgets.map((budget) => ({
      category: budget.category,
      limit: budget.limit
    }))
  );

  const goalProgress = calculateGoalProgress(
    goals.map((goal) => ({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline
    }))
  );

  return {
    summary,
    budgetUsage,
    goalProgress,
    insight,
    alerts,
    pipelineLogs,
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      merchant: transaction.merchant,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date.toISOString(),
      type: transaction.type,
      isAnomaly: transaction.isAnomaly,
      isRecurring: transaction.isRecurring
    }))
  };
}
