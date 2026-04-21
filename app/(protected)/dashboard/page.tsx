import { redirect } from "next/navigation";

import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { WhatIfSimulator } from "@/components/dashboard/what-if-simulator";
import { FadeIn } from "@/components/fade-in";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentSession } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData(session.userId);
  const insightSummary = (data.insight?.summaryJson as Record<string, unknown> | null) ?? null;
  const explanation =
    ((data.insight?.explanation as string[] | null) ?? [
      "Upload transaction data to calculate a financial score and insight narrative."
    ]);

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          eyebrow="Overview"
          title="Your financial operating system"
          description="Monitor score trends, total outflow, budgets, recurring expenses, and forecasting signals in one real-time dashboard."
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <OverviewCards
          totalSpent={data.summary.totalSpent}
          totalIncome={data.summary.totalIncome}
          savings={data.summary.savings}
          transactionsCount={data.summary.transactionsCount}
        />
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <FadeIn delay={0.1}>
          <HealthScoreCard
            score={data.insight?.financialScore ?? 0}
            persona={data.insight?.persona ?? "Balanced"}
            explanation={explanation}
          />
        </FadeIn>
        <FadeIn delay={0.14}>
          <Card className="border-border bg-card/85">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Budgets at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.budgetUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add budgets to start monitoring category overspend risk.</p>
              ) : (
                data.budgetUsage.map((budget) => (
                  <div key={budget.category} className="space-y-2 rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{budget.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                        </p>
                      </div>
                      {budget.exceeded ? <Badge variant="danger">Exceeded</Badge> : <Badge variant="secondary">On track</Badge>}
                    </div>
                    <Progress value={Math.min(budget.percentUsed * 100, 100)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FadeIn delay={0.18}>
          <CategoryPieChart categoryTotals={data.summary.categoryTotals} />
        </FadeIn>
        <FadeIn delay={0.22}>
          <MonthlyTrendChart monthTotals={data.summary.monthTotals} />
        </FadeIn>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FadeIn delay={0.26}>
          <TransactionTable transactions={data.transactions} />
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="space-y-6">
            <WhatIfSimulator categoryTotals={data.summary.categoryTotals} />
            <Card className="border-border bg-card/85">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Recent alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active alerts right now.</p>
                ) : (
                  data.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-medium">{alert.title}</p>
                        <Badge variant={alert.severity === "CRITICAL" ? "danger" : "warning"}>{alert.severity}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      </div>

      {insightSummary ? null : (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardContent className="p-6 text-sm text-slate-700">
            Upload a CSV or Google Sheet on the Upload Data page to run the ETL pipeline and unlock insights, anomalies, recurring expenses, and forecasting.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
