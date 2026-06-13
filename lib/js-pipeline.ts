import { computeBudgetUsage, summarizeTransactions } from "@/lib/finance";
import { categorizeTransaction, classifyTransactionType } from "@/lib/categorization";

type RawPipelineRow = {
  amount?: number | string;
  currency?: string;
  date?: string | Date;
  category?: string;
  merchant?: string;
  description?: string;
  type?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type PipelineTransaction = {
  amount: number;
  currency?: string;
  date: string;
  category: string;
  merchant: string;
  description?: string;
  type?: string;
  source?: string;
  is_anomaly?: boolean;
  is_recurring?: boolean;
  metadata?: Record<string, unknown>;
};

export type PipelineInsights = {
  financial_health_score: number;
  persona: string;
  explanation: string[];
  smart_insights: string[];
  waste_signals: string[];
  alerts: string[];
  recommendations: string[];
  recurring_expenses: Array<{ merchant: string; amount: number; cadence: string }>;
  anomalies: Array<{ merchant: string; amount: number; date: string; reason: string }>;
  forecast_next_month: number;
  category_totals: Record<string, number>;
  month_totals: Array<{ month: string; total: number }>;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle] ?? 0;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function detectCadence(intervals: number[]) {
  if (intervals.length === 0) {
    return null;
  }

  const avgInterval = average(intervals);
  if (avgInterval >= 25 && avgInterval <= 35) {
    return "monthly";
  }
  if (avgInterval >= 6 && avgInterval <= 8) {
    return "weekly";
  }
  return null;
}

function normalizeTransaction(row: RawPipelineRow): PipelineTransaction | null {
  const parsedAmount = Number(row.amount ?? 0);
  const rawDate = row.date instanceof Date ? row.date : new Date(String(row.date ?? ""));

  if (!Number.isFinite(parsedAmount) || Number.isNaN(rawDate.getTime())) {
    return null;
  }

  const description = String(row.description ?? "").trim();
  const merchant = String(row.merchant ?? description.split(/[/-]/)[0] ?? "Unknown merchant").trim() || "Unknown merchant";
  const category = categorizeTransaction({
    merchant,
    description,
    category: row.category
  });
  const normalizedType = classifyTransactionType(parsedAmount, String(row.type ?? "")) === "CREDIT" ? "credit" : "debit";

  return {
    amount: Math.abs(parsedAmount),
    currency: String(row.currency ?? "INR"),
    date: rawDate.toISOString(),
    category,
    merchant,
    description,
    type: normalizedType,
    source: String(row.source ?? "csv"),
    metadata: row.metadata ?? {}
  };
}

export function runJavaScriptPipeline({
  rawRows,
  budgets
}: {
  rawRows: unknown[];
  budgets: Array<{ category: string; limit: number }>;
}) {
  const transactions = rawRows
    .map((row) => normalizeTransaction((row ?? {}) as RawPipelineRow))
    .filter((row): row is PipelineTransaction => Boolean(row))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const txDates = new Map<string, Date>();
  const financeTransactions = transactions.map((transaction) => {
    const date = new Date(transaction.date);
    txDates.set(transaction.date, date);
    return {
      amount: transaction.amount,
      date,
      category: transaction.category,
      merchant: transaction.merchant,
      type: transaction.type === "credit" ? ("CREDIT" as const) : ("DEBIT" as const)
    };
  });

  const summary = summarizeTransactions(financeTransactions);
  const budgetUsage = computeBudgetUsage(financeTransactions, budgets);
  const debitTransactions = transactions.filter((transaction) => transaction.type !== "credit");

  const recurringMap = new Map<string, { cadence: string; amount: number }>();
  const groupedByMerchant = debitTransactions.reduce<Record<string, PipelineTransaction[]>>((acc, transaction) => {
    const key = transaction.merchant.trim().toLowerCase();
    acc[key] ??= [];
    acc[key].push(transaction);
    return acc;
  }, {});

  const recurringExpenses = Object.entries(groupedByMerchant)
    .map(([, merchantTransactions]) => {
      if (merchantTransactions.length < 2) {
        return null;
      }

      const sorted = merchantTransactions
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const intervals = sorted.slice(1).map((transaction, index) => {
        const previous = sorted[index];
        return Math.round(
          (new Date(transaction.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24)
        );
      });
      const cadence = detectCadence(intervals);
      const amounts = sorted.map((transaction) => transaction.amount);
      const avgAmount = average(amounts);
      const maxVariance = avgAmount * 0.12;
      const stableAmounts = Math.max(...amounts) - Math.min(...amounts) <= Math.max(50, maxVariance);

      if (!cadence || !stableAmounts) {
        return null;
      }

      recurringMap.set(sorted[0]!.merchant.trim().toLowerCase(), {
        cadence,
        amount: round(avgAmount)
      });

      return {
        merchant: sorted[0]!.merchant,
        amount: round(avgAmount),
        cadence
      };
    })
    .filter((expense): expense is { merchant: string; amount: number; cadence: string } => Boolean(expense));

  const debitAmounts = debitTransactions.map((transaction) => transaction.amount);
  const meanAmount = average(debitAmounts);
  const amountStdDev = standardDeviation(debitAmounts);
  const medianAmount = median(debitAmounts);
  const anomalyThreshold = Math.max(medianAmount * 2.5, meanAmount + amountStdDev * 1.5, 3000);

  const anomalies = debitTransactions
    .filter((transaction) => transaction.amount >= anomalyThreshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((transaction) => ({
      merchant: transaction.merchant,
      amount: transaction.amount,
      date: transaction.date.slice(0, 10),
      reason: "High-value outlier compared with your recent spending baseline."
    }));

  const anomalyKeys = new Set(anomalies.map((item) => `${item.merchant}-${item.date}-${item.amount}`));

  const enrichedTransactions = transactions.map((transaction) => ({
    ...transaction,
    is_recurring: recurringMap.has(transaction.merchant.trim().toLowerCase()),
    is_anomaly: anomalyKeys.has(`${transaction.merchant}-${transaction.date.slice(0, 10)}-${transaction.amount}`)
  }));

  const budgetExceeded = budgetUsage.filter((budget) => budget.exceeded);
  const totalSpent = summary.totalSpent;
  const totalIncome = summary.totalIncome;
  const savingsRate = totalIncome > 0 ? summary.savings / totalIncome : 0;
  const latestMonths = summary.monthTotals.slice(-2);
  const forecastNextMonth =
    latestMonths.length === 0
      ? 0
      : latestMonths.length === 1
        ? round(latestMonths[0]!.total)
        : round(latestMonths[latestMonths.length - 1]!.total * 0.65 + latestMonths[latestMonths.length - 2]!.total * 0.35);

  const score = clamp(
    round(
      60 +
        savingsRate * 25 +
        summary.essentialRatio * 10 -
        summary.nonEssentialRatio * 18 -
        budgetExceeded.length * 6 -
        anomalies.length * 4
    ),
    0,
    100
  );

  const persona =
    savingsRate >= 0.25 && summary.nonEssentialRatio <= 0.3
      ? "Saver"
      : summary.nonEssentialRatio >= 0.45 || summary.lateNightSpend >= totalSpent * 0.12
        ? "Impulse Spender"
        : "Balanced";

  const sortedCategories = Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  const smartInsights = [
    summary.weekendSpend > summary.weekdaySpend * 1.15 && summary.weekdaySpend > 0
      ? `Weekend spending runs ${formatPercent(summary.weekendSpend / summary.weekdaySpend - 1)} above weekday spend.`
      : null,
    topCategory && totalSpent > 0
      ? `${topCategory[0]} accounts for ${formatPercent(topCategory[1] / totalSpent)} of tracked spending.`
      : null,
    recurringExpenses.length > 0 ? `${recurringExpenses.length} recurring expense pattern(s) were detected.` : null,
    totalIncome > 0 ? `Current savings rate is ${formatPercent(savingsRate)} of recorded income.` : null
  ].filter((value): value is string => Boolean(value));

  const wasteSignals = [
    summary.nonEssentialRatio > 0.4
      ? `Non-essential categories now make up ${formatPercent(summary.nonEssentialRatio)} of total spend.`
      : null,
    budgetExceeded.map((budget) => `${budget.category} is over budget by INR ${Math.round(budget.spent - budget.limit)}.`),
    (summary.categoryTotals.Subscriptions ?? 0) > totalSpent * 0.12
      ? "Subscription spending is taking a noticeable share of your monthly outflow."
      : null
  ].flat().filter((value): value is string => Boolean(value));

  const alerts = [
    anomalies.length > 0 ? `${anomalies.length} unusual transaction(s) were flagged for review.` : null,
    budgetExceeded.length > 0 ? `${budgetExceeded.length} budget category(ies) are over limit.` : null,
    totalIncome > 0 && totalSpent > totalIncome ? "Spending is outpacing income for the imported period." : null
  ].filter((value): value is string => Boolean(value));

  const recommendations = [
    budgetExceeded.length > 0 ? `Revisit the ${budgetExceeded[0]!.category} budget cap before the next cycle.` : null,
    recurringExpenses.length > 0 ? "Review recurring merchants and cancel any subscriptions you no longer use." : null,
    summary.nonEssentialRatio > 0.35 ? "Set a tighter cap for non-essential spending next month." : null,
    anomalies.length > 0 ? "Verify the flagged high-value transactions and tag any one-off expenses." : null
  ].filter((value): value is string => Boolean(value));

  const explanation = [
    totalIncome > 0
      ? `Savings rate is ${formatPercent(savingsRate)}, based on INR ${Math.round(totalIncome)} income and INR ${Math.round(totalSpent)} spend.`
      : `Total tracked spend for the imported period is INR ${Math.round(totalSpent)}.`,
    budgetExceeded.length > 0
      ? `${budgetExceeded.length} budget category(ies) exceeded their configured limit.`
      : "Active budgets are currently within their configured limits.",
    topCategory ? `${topCategory[0]} is the largest spending category in the latest dataset.` : "More transaction history will improve category-level insights."
  ];

  const insights: PipelineInsights = {
    financial_health_score: score,
    persona,
    explanation,
    smart_insights: smartInsights,
    waste_signals: wasteSignals,
    alerts,
    recommendations,
    recurring_expenses: recurringExpenses,
    anomalies,
    forecast_next_month: forecastNextMonth,
    category_totals: Object.fromEntries(Object.entries(summary.categoryTotals).map(([key, value]) => [key, round(value)])),
    month_totals: summary.monthTotals.map((item) => ({
      month: item.month,
      total: round(item.total)
    }))
  };

  return {
    pipelineOutput: enrichedTransactions,
    insightsOutput: {
      ...insights,
      transactions: enrichedTransactions
    }
  };
}
