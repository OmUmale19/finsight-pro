import { Activity, PiggyBank, Target, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function OverviewCards({
  totalSpent,
  totalIncome,
  savings,
  transactionsCount
}: {
  totalSpent: number;
  totalIncome: number;
  savings: number;
  transactionsCount: number;
}) {
  const items = [
    { label: "Total spending", value: formatCurrency(totalSpent), icon: Wallet },
    { label: "Total income", value: formatCurrency(totalIncome), icon: PiggyBank },
    { label: "Net savings", value: formatCurrency(savings), icon: Target },
    { label: "Transactions", value: transactionsCount.toString(), icon: Activity }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="border-border bg-card/85">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
