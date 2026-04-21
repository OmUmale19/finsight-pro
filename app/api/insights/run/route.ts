import { PipelineStatus, UploadSource } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/etl-runner";
import { persistPipelineResults } from "@/lib/insights-persistence";

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const rawTransactions = await prisma.rawTransaction.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
    take: 500
  });

  if (rawTransactions.length === 0) {
    return fail("Upload data before running insights", 400);
  }

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id }
  });

  const pipelineLog = await prisma.pipelineLog.create({
    data: {
      userId: user.id,
      source: UploadSource.CSV,
      status: PipelineStatus.RUNNING
    }
  });

  try {
    const { pipelineOutput, insightsOutput } = await runPipeline({
      rawRows: rawTransactions.map((item) => item.rawJson),
      budgets: budgets.map((budget) => ({ category: budget.category, limit: budget.limit }))
    });

    const enrichedTransactions =
      (insightsOutput as {
        transactions?: Array<{
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
        }>;
      }).transactions ?? pipelineOutput;

    await persistPipelineResults({
      userId: user.id,
      rawRows: [],
      persistRawRows: false,
      source: UploadSource.CSV,
      pipelineLogId: pipelineLog.id,
      transactions: enrichedTransactions as Array<{
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
      }>,
      insights: insightsOutput as {
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
      }
    });

    await prisma.pipelineLog.update({
      where: { id: pipelineLog.id },
      data: {
        status: PipelineStatus.SUCCESS,
        finishedAt: new Date(),
        rowsProcessed: Array.isArray(enrichedTransactions) ? enrichedTransactions.length : 0
      }
    });

    return ok({ rerun: true });
  } catch (error) {
    await prisma.pipelineLog.update({
      where: { id: pipelineLog.id },
      data: {
        status: PipelineStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return fail("Unable to run insights", 500, error instanceof Error ? error.message : error);
  }
}
