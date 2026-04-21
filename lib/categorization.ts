import { CATEGORY_RULES } from "@/lib/constants";

export function categorizeTransaction(input: { merchant?: string; description?: string; category?: string }) {
  const existing = input.category?.trim();
  if (existing && existing !== "Uncategorized") {
    return existing;
  }

  const text = `${input.merchant ?? ""} ${input.description ?? ""}`.toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.matchers.some((matcher) => text.includes(matcher)));

  return match?.category ?? "Uncategorized";
}

export function classifyTransactionType(amount: number, explicitType?: string) {
  if (explicitType?.toLowerCase() === "credit") {
    return "CREDIT" as const;
  }

  return amount >= 0 ? "DEBIT" as const : "CREDIT" as const;
}
