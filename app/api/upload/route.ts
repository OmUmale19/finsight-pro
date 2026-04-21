import { PipelineStatus, UploadSource } from "@prisma/client";

import { fail, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/etl-runner";
import { extractGoogleSheetCsvUrl, normalizeRows, parseCsvContent } from "@/lib/ingestion";
import { persistPipelineResults } from "@/lib/insights-persistence";
import { storeUploadedFile } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const formData = await request.formData();
  const sourceType = String(formData.get("sourceType") ?? "csv");

  let rawRows: unknown[] = [];
  let source: UploadSource = UploadSource.CSV;
  let fileName: string | undefined;

  try {
    if (sourceType === "csv") {
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return fail("Upload a CSV file", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      await storeUploadedFile(user.id, file.name, buffer);
      rawRows = await parseCsvContent(buffer.toString("utf8"), "csv");
      source = UploadSource.CSV;
    } else if (sourceType === "google-sheet") {
      const sheetUrl = String(formData.get("googleSheetUrl") ?? "");
      if (!sheetUrl) {
        return fail("Add a Google Sheets URL", 400);
      }

      const csvUrl = extractGoogleSheetCsvUrl(sheetUrl);
      const response = await fetch(csvUrl, { next: { revalidate: 0 } });
      if (!response.ok) {
        return fail("Unable to fetch Google Sheet. Make sure it is publicly accessible.", 400);
      }

      rawRows = await parseCsvContent(await response.text(), "google-sheet");
      source = UploadSource.GOOGLE_SHEET;
      fileName = "google-sheet-import.csv";
    } else if (sourceType === "api") {
      const payload = String(formData.get("apiPayload") ?? "[]");
      const parsedPayload = JSON.parse(payload);
      if (!Array.isArray(parsedPayload)) {
        return fail("API payload must be a JSON array", 400);
      }

      rawRows = normalizeRows(parsedPayload, "api");
      source = UploadSource.API;
      fileName = "api-import.json";
    } else {
      return fail("Unsupported source type", 400);
    }

    const [budgets, existingRawTransactions] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: user.id }
      }),
      prisma.rawTransaction.findMany({
        where: { userId: user.id },
        orderBy: { uploadedAt: "desc" },
        take: 1000
      })
    ]);

    const pipelineLog = await prisma.pipelineLog.create({
      data: {
        userId: user.id,
        source,
        status: PipelineStatus.RUNNING
      }
    });

    try {
      const { pipelineOutput, insightsOutput } = await runPipeline({
        rawRows: [...existingRawTransactions.map((item) => item.rawJson), ...rawRows],
        budgets: budgets.map((budget) => ({
          category: budget.category,
          limit: budget.limit
        }))
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
        rawRows,
        source,
        fileName,
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
    } catch (error) {
      await prisma.pipelineLog.update({
        where: { id: pipelineLog.id },
        data: {
          status: PipelineStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown ETL failure"
        }
      });

      throw error;
    }

    return ok({
      imported: rawRows.length,
      source
    });
  } catch (error) {
    return fail("Unable to process upload", 500, error instanceof Error ? error.message : error);
  }
}
