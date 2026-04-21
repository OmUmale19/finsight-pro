import { describe, expect, it } from "vitest";

import { categorizeTransaction, classifyTransactionType } from "@/lib/categorization";
import { parseCsvContent } from "@/lib/ingestion";

describe("ingestion and categorization", () => {
  it("categorizes known merchants with rule-based mapping", () => {
    expect(categorizeTransaction({ merchant: "Swiggy", description: "Dinner order" })).toBe("Food");
    expect(categorizeTransaction({ merchant: "Uber", description: "Office commute" })).toBe("Transport");
  });

  it("parses CSV uploads into canonical transaction rows", async () => {
    const rows = await parseCsvContent(
      "date,amount,description\n2026-04-01,499,Swiggy order\n2026-04-02,850,Uber ride",
      "csv"
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      amount: 499,
      category: "Food"
    });
  });

  it("normalizes debit and credit transaction type inference", () => {
    expect(classifyTransactionType(500, "")).toBe("DEBIT");
    expect(classifyTransactionType(-500, "")).toBe("CREDIT");
  });
});
