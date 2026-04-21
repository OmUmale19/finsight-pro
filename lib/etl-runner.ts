import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { env } from "@/lib/env";

type PythonResult<T> = {
  output: T;
  stderr: string;
};

async function runPythonScript<T>(scriptPath: string, args: string[]): Promise<PythonResult<T>> {
  return new Promise((resolve, reject) => {
    const child = spawn(env.PYTHON_BIN, [scriptPath, ...args], {
      cwd: process.cwd(),
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python process failed with code ${code}`));
        return;
      }

      try {
        resolve({
          output: JSON.parse(stdout) as T,
          stderr
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function runPipeline<TTransactions, TInsights>({
  rawRows,
  budgets
}: {
  rawRows: unknown[];
  budgets: Array<{ category: string; limit: number }>;
}) {
  const tempDir = path.resolve(env.ETL_TEMP_DIR);
  await mkdir(tempDir, { recursive: true });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rawPath = path.join(tempDir, `${runId}-raw.json`);
  const cleanedPath = path.join(tempDir, `${runId}-cleaned.json`);
  const budgetsPath = path.join(tempDir, `${runId}-budgets.json`);

  await writeFile(rawPath, JSON.stringify(rawRows, null, 2), "utf8");
  await writeFile(budgetsPath, JSON.stringify(budgets, null, 2), "utf8");

  try {
    const { output: pipelineOutput } = await runPythonScript<TTransactions>(path.resolve("etl", "etl_pipeline.py"), [
      "--input",
      rawPath
    ]);

    await writeFile(cleanedPath, JSON.stringify(pipelineOutput, null, 2), "utf8");

    const { output: insightsOutput } = await runPythonScript<TInsights>(path.resolve("etl", "insights_engine.py"), [
      "--input",
      cleanedPath,
      "--budgets",
      budgetsPath
    ]);

    return {
      pipelineOutput,
      insightsOutput
    };
  } finally {
    await Promise.allSettled([rm(rawPath, { force: true }), rm(cleanedPath, { force: true }), rm(budgetsPath, { force: true })]);
  }
}
