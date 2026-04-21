import { AlertSeverity, Prisma, TransactionType, UploadSource } from "@prisma/client";

import { prisma } from "@/lib/db";

type PipelineTransaction = {
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

type InsightsPayload = {
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

function normalizeSource(source?: string): UploadSource {
  if (source === "GOOGLE_SHEET") {
    return "GOOGLE_SHEET";
  }
  if (source === "API") {
    return "API";
  }
  return "CSV";
}

function normalizeType(type?: string): TransactionType {
  return type === "CREDIT" ? "CREDIT" : "DEBIT";
}

export async function persistPipelineResults({
  userId,
  rawRows,
  persistRawRows = true,
  source,
  fileName,
  pipelineLogId,
  transactions,
  insights
}: {
  userId: string;
  rawRows: unknown[];
  persistRawRows?: boolean;
  source: UploadSource;
  fileName?: string;
  pipelineLogId: string;
  transactions: PipelineTransaction[];
  insights: InsightsPayload;
}) {
  const rawEntries = rawRows.map((row) => ({
    userId,
    source,
    rawJson: row as Prisma.InputJsonValue,
    fileName,
    pipelineLogId
  }));

  const transactionEntries = transactions.map((transaction) => ({
    userId,
    amount: transaction.amount,
    currency: transaction.currency ?? "INR",
    date: new Date(transaction.date),
    category: transaction.category,
    normalizedCategory: transaction.category,
    merchant: transaction.merchant,
    description: transaction.description ?? "",
    type: normalizeType(transaction.type),
    source: normalizeSource(transaction.source),
    isRecurring: Boolean(transaction.is_recurring),
    isAnomaly: Boolean(transaction.is_anomaly),
    metadata: (transaction.metadata ?? {}) as Prisma.InputJsonValue
  }));

  await prisma.$transaction(async (tx) => {
    if (persistRawRows && rawEntries.length > 0) {
      await tx.rawTransaction.createMany({
        data: rawEntries
      });
    }

    await tx.transaction.deleteMany({
      where: { userId }
    });

    if (transactionEntries.length > 0) {
      await tx.transaction.createMany({
        data: transactionEntries
      });
    }

    await tx.insight.upsert({
      where: { userId },
      create: {
        userId,
        financialScore: insights.financial_health_score,
        persona: insights.persona,
        flags: {
          wasteSignals: insights.waste_signals,
          recurringCount: insights.recurring_expenses.length,
          anomalyCount: insights.anomalies.length
        },
        explanation: insights.explanation,
        summaryJson: insights
      },
      update: {
        financialScore: insights.financial_health_score,
        persona: insights.persona,
        flags: {
          wasteSignals: insights.waste_signals,
          recurringCount: insights.recurring_expenses.length,
          anomalyCount: insights.anomalies.length
        },
        explanation: insights.explanation,
        summaryJson: insights
      }
    });

    await tx.alert.deleteMany({
      where: {
        userId,
        type: {
          in: ["anomaly", "budget", "waste", "insight"]
        }
      }
    });

    const alertRows = [
      ...insights.alerts.map((message) => ({
        userId,
        title: "Financial alert",
        message,
        type: "insight",
        severity: "WARNING" as AlertSeverity
      })),
      ...insights.anomalies.map((anomaly) => ({
        userId,
        title: "Anomaly detected",
        message: `${anomaly.merchant}: INR ${Math.round(anomaly.amount)} on ${anomaly.date}`,
        type: "anomaly",
        severity: "CRITICAL" as AlertSeverity,
        metadata: anomaly as unknown as Prisma.InputJsonValue
      })),
      ...insights.waste_signals.map((message) => ({
        userId,
        title: "Wasteful spending signal",
        message,
        type: "waste",
        severity: "WARNING" as AlertSeverity
      }))
    ];

    if (alertRows.length > 0) {
      await tx.alert.createMany({
        data: alertRows
      });
    }
  });
}
