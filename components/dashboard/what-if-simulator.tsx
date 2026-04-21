"use client";

import { startTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function WhatIfSimulator({
  categoryTotals
}: {
  categoryTotals: Record<string, number>;
}) {
  const defaultCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const [scenarios, setScenarios] = useState(
    defaultCategories.map(([category]) => ({
      category,
      reductionPercent: 10
    }))
  );
  const [result, setResult] = useState<null | {
    impacts: Array<{ category: string; reductionPercent: number; baseline: number; projected: number; savings: number }>;
    totalSavings: number;
  }>(null);

  async function runSimulation() {
    const response = await fetch("/api/what-if", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarios })
    });
    const payload = await response.json();
    if (payload.success) {
      startTransition(() => {
        setResult(payload.data);
      });
    }
  }

  return (
    <Card className="border-border bg-card/85">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">What-if simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {scenarios.map((scenario, index) => (
            <div key={scenario.category} className="rounded-3xl border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{scenario.category}</p>
                  <p className="text-sm text-muted-foreground">Baseline: {formatCurrency(categoryTotals[scenario.category] ?? 0)}</p>
                </div>
                <div className="w-full max-w-xs">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={scenario.reductionPercent}
                    onChange={(event) =>
                      setScenarios((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, reductionPercent: Number(event.target.value) } : item
                        )
                      )
                    }
                    className="w-full accent-primary"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">Reduce by {scenario.reductionPercent}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={runSimulation}>Run projection</Button>

        {result ? (
          <div className="rounded-3xl border bg-slate-950 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Projected savings</p>
            <p className="mt-3 font-heading text-4xl font-semibold">{formatCurrency(result.totalSavings)}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {result.impacts.map((impact) => (
                <p key={impact.category}>
                  {impact.category}: save {formatCurrency(impact.savings)} and lower monthly spend to {formatCurrency(impact.projected)}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
