export type UploadSource = "csv" | "google-sheet" | "api";

export type ParsedTransactionInput = {
  amount: number;
  date: string;
  description?: string;
  merchant?: string;
  category?: string;
  currency?: string;
  type?: "debit" | "credit";
  source?: UploadSource;
};

export type InsightSummary = {
  score: number;
  explanation: string[];
  alerts: string[];
  recommendations: string[];
  recurringExpenses: Array<{
    merchant: string;
    amount: number;
    cadence: string;
  }>;
  anomalies: Array<{
    merchant: string;
    amount: number;
    date: string;
    reason: string;
  }>;
  forecastNextMonth: number;
  persona: "Saver" | "Balanced" | "Impulse Spender";
  wasteSignals: string[];
  smartInsights: string[];
  categoryTotals: Record<string, number>;
  monthTotals: Array<{
    month: string;
    total: number;
  }>;
};
