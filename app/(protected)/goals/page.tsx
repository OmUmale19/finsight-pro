import { redirect } from "next/navigation";

import { FadeIn } from "@/components/fade-in";
import { BudgetForm } from "@/components/forms/budget-form";
import { GoalForm } from "@/components/forms/goal-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentSession } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

export default async function GoalsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData(session.userId);

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          eyebrow="Planning"
          title="Budgets, goals, and course correction"
          description="Create category guardrails, measure saving targets, and check whether today’s habits support tomorrow’s financial outcomes."
        />
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-2">
        <FadeIn delay={0.05}>
          <BudgetForm />
        </FadeIn>
        <FadeIn delay={0.1}>
          <GoalForm />
        </FadeIn>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FadeIn delay={0.15}>
          <Card className="border-border bg-card/85">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Budget performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.budgetUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No budgets created yet.</p>
              ) : (
                data.budgetUsage.map((budget) => (
                  <div key={budget.category} className="rounded-3xl border bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{budget.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} spent of {formatCurrency(budget.limit)}
                        </p>
                      </div>
                      <Badge variant={budget.exceeded ? "danger" : "secondary"}>
                        {budget.exceeded ? "Exceeded" : "Under limit"}
                      </Badge>
                    </div>
                    <Progress className="mt-4" value={Math.min(budget.percentUsed * 100, 100)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card className="border-border bg-card/85">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Goal progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.goalProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No savings goals created yet.</p>
              ) : (
                data.goalProgress.map((goal) => (
                  <div key={goal.name} className="rounded-3xl border bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{goal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <Badge variant={goal.progress >= 1 ? "secondary" : goal.daysRemaining < 30 ? "warning" : "default"}>
                        {goal.progress >= 1 ? "Completed" : `${Math.max(goal.daysRemaining, 0)} days left`}
                      </Badge>
                    </div>
                    <Progress className="mt-4" value={Math.min(goal.progress * 100, 100)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
