"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type TransactionRow = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  type: "DEBIT" | "CREDIT";
  isAnomaly: boolean;
  isRecurring: boolean;
};

export function TransactionTable({ transactions }: { transactions: TransactionRow[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filteredTransactions = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    if (!keyword) {
      return transactions;
    }

    return transactions.filter(
      (transaction) =>
        transaction.merchant.toLowerCase().includes(keyword) ||
        transaction.category.toLowerCase().includes(keyword)
    );
  }, [deferredSearch, transactions]);

  return (
    <Card className="border-border bg-card/85">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-heading text-2xl">Transactions</CardTitle>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search merchant or category" />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b text-sm text-muted-foreground">
              <th className="pb-4 font-medium">Merchant</th>
              <th className="pb-4 font-medium">Category</th>
              <th className="pb-4 font-medium">Date</th>
              <th className="pb-4 font-medium">Amount</th>
              <th className="pb-4 font-medium">Signals</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-slate-100 text-sm">
                <td className="py-4 font-medium text-slate-900">{transaction.merchant}</td>
                <td className="py-4 text-muted-foreground">{transaction.category}</td>
                <td className="py-4 text-muted-foreground">{new Date(transaction.date).toLocaleDateString("en-IN")}</td>
                <td className="py-4 font-medium text-slate-900">{formatCurrency(transaction.amount)}</td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={transaction.type === "DEBIT" ? "neutral" : "secondary"}>{transaction.type}</Badge>
                    {transaction.isRecurring ? <Badge variant="warning">Recurring</Badge> : null}
                    {transaction.isAnomaly ? <Badge variant="danger">Anomaly</Badge> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
