"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0284c7", "#0f766e", "#f59e0b", "#dc2626", "#7c3aed", "#14b8a6", "#f97316"];

export function CategoryPieChart({ categoryTotals }: { categoryTotals: Record<string, number> }) {
  const data = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  return (
    <Card className="border-border bg-card/85">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Category distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              innerRadius={70} 
              outerRadius={100} 
              paddingAngle={4}
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: '1rem',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => formatCurrency(value)} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
