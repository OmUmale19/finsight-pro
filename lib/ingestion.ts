import Papa from "papaparse";

import { categorizeTransaction, classifyTransactionType } from "@/lib/categorization";
import { ParsedTransactionInput, UploadSource } from "@/lib/types";

const HEADER_ALIASES: Record<string, string[]> = {
  amount: ["amount", "amt", "transaction_amount", "value"],
  date: ["date", "transaction_date", "posted_on", "timestamp"],
  description: ["description", "narration", "remarks", "details"],
  merchant: ["merchant", "vendor", "payee"],
  category: ["category", "expense_category"],
  currency: ["currency", "ccy"],
  type: ["type", "transaction_type", "dr_cr"]
};

function resolveField(row: Record<string, unknown>, field: keyof typeof HEADER_ALIASES) {
  const aliases = HEADER_ALIASES[field];
  const match = Object.entries(row).find(([key]) => aliases.includes(key.trim().toLowerCase()));
  return match?.[1];
}

export function normalizeRows(rows: Record<string, unknown>[], source: UploadSource): ParsedTransactionInput[] {
  const normalized: ParsedTransactionInput[] = [];

  rows.forEach((row) => {
    const amountValue = resolveField(row, "amount");
    const parsedAmount = Number(String(amountValue ?? "0").replace(/[^\d.-]/g, ""));
    const rawDate = resolveField(row, "date");
    const description = String(resolveField(row, "description") ?? "").trim();
    const merchant = String(resolveField(row, "merchant") ?? description.split(/[/-]/)[0] ?? "").trim();
    const existingCategory = String(resolveField(row, "category") ?? "").trim();
    const normalizedCategory = categorizeTransaction({
      merchant,
      description,
      category: existingCategory
    });

    if (!rawDate || Number.isNaN(parsedAmount)) {
      return;
    }

    normalized.push({
      amount: Math.abs(parsedAmount),
      date: new Date(String(rawDate)).toISOString(),
      description,
      merchant: merchant || "Unknown merchant",
      category: normalizedCategory,
      currency: String(resolveField(row, "currency") ?? "INR"),
      type: classifyTransactionType(parsedAmount, String(resolveField(row, "type") ?? "")) === "DEBIT" ? "debit" : "credit",
      source
    });
  });

  return normalized;
}

export async function parseCsvContent(csvText: string, source: UploadSource) {
  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message ?? "Failed to parse CSV");
  }

  return normalizeRows(result.data, source);
}

export function extractGoogleSheetCsvUrl(input: string) {
  if (input.includes("/export?format=csv")) {
    return input;
  }

  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("Enter a valid public Google Sheets URL");
  }

  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
}
