import { describe, expect, it } from "vitest";

import { computeBudgetUsage, runWhatIfSimulation, summarizeTransactions } from "@/lib/finance";

const transactions = [
  { amount: 52000, date: new Date("2026-04-01"), category: "Income", merchant: "Salary", type: "CREDIT" as const },
  { amount: 1500, date: new Date("2026-04-02"), category: "Food", merchant: "Swiggy", type: "DEBIT" as const },
  { amount: 4000, date: new Date("2026-04-03"), category: "Shopping", merchant: "Amazon", type: "DEBIT" as const },
  { amount: 2500, date: new Date("2026-04-04"), category: "Transport", merchant: "Uber", type: "DEBIT" as const }
];

describe("finance helpers", () => {
  it("summarizes spend, income, and category totals", () => {
    const summary = summarizeTransactions(transactions);

    expect(summary.totalSpent).toBe(8000);
    expect(summary.totalIncome).toBe(52000);
    expect(summary.categoryTotals.Food).toBe(1500);
  });

  it("computes budget usage and flags exceeded categories", () => {
    const usage = computeBudgetUsage(
      transactions.filter((transaction) => transaction.type === "DEBIT"),
      [
        { category: "Food", limit: 1200 },
        { category: "Transport", limit: 3000 }
      ]
    );

    expect(usage[0]?.exceeded).toBe(true);
    expect(usage[1]?.remaining).toBe(500);
  });

  it("runs what-if projections for category reductions", () => {
    const result = runWhatIfSimulation(
      {
        Food: 5000,
        Shopping: 8000
      },
      [
        { category: "Food", reductionPercent: 20 },
        { category: "Shopping", reductionPercent: 10 }
      ]
    );

    expect(result.totalSavings).toBe(1800);
    expect(result.impacts[0]?.projected).toBe(4000);
  });
});
