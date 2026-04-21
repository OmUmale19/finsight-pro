"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function MonthlyTrendChart({
  monthTotals,
  mode = "line"
}: {
  monthTotals: Array<{ month: string; total: number }>;
  mode?: "line" | "bar";
}) {
  const Chart = mode === "line" ? LineChart : BarChart;

  return (
    <Card className="border-border bg-card/85">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Monthly spending trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={monthTotals}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '1rem',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value: number) => formatCurrency(value)} 
            />
            {mode === "line" ? (
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={{ r: 4, fill: 'hsl(var(--primary))' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ) : (
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
            )}
          </Chart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
