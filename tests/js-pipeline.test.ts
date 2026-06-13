import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runJavaScriptPipeline } from "@/lib/js-pipeline";

describe("javascript pipeline fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces transactions and insights without the Python pipeline", () => {
    const result = runJavaScriptPipeline({
      rawRows: [
        {
          date: "2026-04-01",
          amount: 60000,
          description: "Monthly salary",
          merchant: "Employer",
          category: "Income",
          type: "credit",
          source: "csv"
        },
        {
          date: "2026-04-03",
          amount: 799,
          description: "Spotify subscription",
          merchant: "Spotify",
          type: "debit",
          source: "csv"
        },
        {
          date: "2026-03-03",
          amount: 799,
          description: "Spotify subscription",
          merchant: "Spotify",
          type: "debit",
          source: "csv"
        },
        {
          date: "2026-04-08",
          amount: 25000,
          description: "Luxury shopping spree",
          merchant: "Luxury Store",
          category: "Shopping",
          type: "debit",
          source: "csv"
        }
      ],
      budgets: [{ category: "Shopping", limit: 5000 }]
    });

    expect(result.pipelineOutput).toHaveLength(4);
    expect(result.insightsOutput.financial_health_score).toBeGreaterThanOrEqual(0);
    expect(result.insightsOutput.financial_health_score).toBeLessThanOrEqual(100);
    expect(result.insightsOutput.recurring_expenses).toEqual(
      expect.arrayContaining([expect.objectContaining({ merchant: "Spotify", cadence: "monthly" })])
    );
    expect(result.insightsOutput.alerts).toEqual(
      expect.arrayContaining([expect.stringContaining("budget")])
    );
    expect(result.insightsOutput.recommendations).toEqual(
      expect.arrayContaining([expect.stringContaining("Shopping")])
    );
  });
});
