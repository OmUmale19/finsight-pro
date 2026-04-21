import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function HealthScoreCard({
  score,
  persona,
  explanation
}: {
  score: number;
  persona: string;
  explanation: string[];
}) {
  const scoreState =
    score >= 75 ? { badge: "secondary" as const, label: "Healthy" } : score >= 50 ? { badge: "warning" as const, label: "Watch" } : { badge: "danger" as const, label: "Needs attention" };

  return (
    <Card className="border-border bg-card/85">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="font-heading text-2xl">Financial health score</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">A blended score based on savings rate, stability, essentials mix, and budget adherence.</p>
        </div>
        <Badge variant={scoreState.badge}>{scoreState.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-heading text-6xl font-semibold">{score}</p>
            <p className="mt-2 inline-flex items-center text-sm text-muted-foreground">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Persona: {persona}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-muted-foreground">
            {score >= 70 ? <TrendingUp className="mb-2 h-5 w-5 text-emerald-500" /> : <TrendingDown className="mb-2 h-5 w-5 text-amber-500" />}
            Track this over time to see if your spending discipline is strengthening.
          </div>
        </div>
        <Progress value={score} />
        <div className="space-y-2">
          {explanation.map((item) => (
            <p key={item} className="text-sm leading-6 text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
