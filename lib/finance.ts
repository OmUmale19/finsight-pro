import { endOfMonth, format, isWeekend, startOfMonth } from "date-fns";

import { ESSENTIAL_CATEGORIES, NON_ESSENTIAL_CATEGORIES } from "@/lib/constants";

type Tx = {
  amount: number;
  date: Date;
  category: string;
  merchant: string;
  type: "DEBIT" | "CREDIT";
};

export function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function summarizeTransactions(transactions: Tx[]) {
  const spending = transactions.filter((tx) => tx.type === "DEBIT");
  const income = transactions.filter((tx) => tx.type === "CREDIT");

  const totalSpent = spending.reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0);
  const savings = Math.max(totalIncome - totalSpent, 0);

  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const currentMonthTransactions = spending.filter((tx) => tx.date >= currentMonthStart && tx.date <= currentMonthEnd);

  const weekendSpend = currentMonthTransactions.filter((tx) => isWeekend(tx.date)).reduce((sum, tx) => sum + tx.amount, 0);
  const weekdaySpend = currentMonthTransactions.filter((tx) => !isWeekend(tx.date)).reduce((sum, tx) => sum + tx.amount, 0);
  const lateNightSpend = currentMonthTransactions
    .filter((tx) => tx.date.getHours() >= 21)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const categoryTotals = spending.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
    return acc;
  }, {});

  const monthTotalsMap = spending.reduce<Record<string, number>>((acc, tx) => {
    const key = monthKey(tx.date);
    acc[key] = (acc[key] ?? 0) + tx.amount;
    return acc;
  }, {});

  const essentialTotal = spending
    .filter((tx) => ESSENTIAL_CATEGORIES.includes(tx.category))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const nonEssentialTotal = spending
    .filter((tx) => NON_ESSENTIAL_CATEGORIES.includes(tx.category))
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalSpent,
    totalIncome,
    savings,
    weekendSpend,
    weekdaySpend,
    lateNightSpend,
    categoryTotals,
    monthTotals: Object.entries(monthTotalsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total })),
    essentialRatio: totalSpent === 0 ? 0 : essentialTotal / totalSpent,
    nonEssentialRatio: totalSpent === 0 ? 0 : nonEssentialTotal / totalSpent,
    transactionsCount: transactions.length
  };
}

export function computeBudgetUsage(
  transactions: Array<{ amount: number; category: string; type: "DEBIT" | "CREDIT"; date: Date }>,
  budgets: Array<{ category: string; limit: number }>
) {
  const currentMonthStart = startOfMonth(new Date());
  const usageMap = transactions
    .filter((tx) => tx.type === "DEBIT" && tx.date >= currentMonthStart)
    .reduce<Record<string, number>>((acc, tx) => {
      acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
      return acc;
    }, {});

  return budgets.map((budget) => {
    const spent = usageMap[budget.category] ?? 0;
    return {
      category: budget.category,
      limit: budget.limit,
      spent,
      remaining: Math.max(budget.limit - spent, 0),
      percentUsed: budget.limit === 0 ? 0 : spent / budget.limit,
      exceeded: spent > budget.limit
    };
  });
}

export function calculateGoalProgress(goals: Array<{ name: string; targetAmount: number; currentAmount: number; deadline: Date }>) {
  return goals.map((goal) => {
    const progress = goal.targetAmount === 0 ? 0 : goal.currentAmount / goal.targetAmount;
    const daysRemaining = Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      ...goal,
      progress,
      daysRemaining
    };
  });
}

export function runWhatIfSimulation(
  categoryTotals: Record<string, number>,
  scenarios: Array<{ category: string; reductionPercent: number }>
) {
  const impacts = scenarios.map((scenario) => {
    const baseline = categoryTotals[scenario.category] ?? 0;
    const savings = baseline * (scenario.reductionPercent / 100);
    return {
      category: scenario.category,
      reductionPercent: scenario.reductionPercent,
      baseline,
      projected: baseline - savings,
      savings
    };
  });

  return {
    impacts,
    totalSavings: impacts.reduce((sum, item) => sum + item.savings, 0)
  };
}
