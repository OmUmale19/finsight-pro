"use client";

import { Fragment, useDeferredValue, useMemo, useState } from "react";
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

function parseTransactionDate(value: string) {
  const slashDateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDateMatch) {
    const [, day, month, year] = slashDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

function formatTransactionDate(value: string) {
  return parseTransactionDate(value).toLocaleDateString("en-IN");
}

function getMonthKey(value: string) {
  const date = parseTransactionDate(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function getMonthLabel(value: string) {
  return parseTransactionDate(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

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

  const groupedTransactions = useMemo(() => {
    const groups: Array<{ monthKey: string; monthLabel: string; items: TransactionRow[] }> = [];

    for (const transaction of filteredTransactions) {
      const monthKey = getMonthKey(transaction.date);
      const lastGroup = groups.at(-1);

      if (!lastGroup || lastGroup.monthKey !== monthKey) {
        groups.push({
          monthKey,
          monthLabel: getMonthLabel(transaction.date),
          items: [transaction]
        });
        continue;
      }

      lastGroup.items.push(transaction);
    }

    return groups;
  }, [filteredTransactions]);

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
            {groupedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            ) : (
              groupedTransactions.map((group) => (
                <Fragment key={group.monthKey}>
                  <tr className="border-b border-border/60">
                    <td colSpan={5} className="bg-muted/25 py-3 text-sm font-semibold text-foreground">
                      {group.monthLabel}
                    </td>
                  </tr>
                  {group.items.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border text-sm">
                      <td className="py-4 font-medium text-foreground">{transaction.merchant}</td>
                      <td className="py-4 text-muted-foreground">{transaction.category}</td>
                      <td className="py-4 text-muted-foreground">{formatTransactionDate(transaction.date)}</td>
                      <td className="py-4 font-medium text-foreground">{formatCurrency(transaction.amount)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={transaction.type === "DEBIT" ? "neutral" : "secondary"}>{transaction.type}</Badge>
                          {transaction.isRecurring ? <Badge variant="warning">Recurring</Badge> : null}
                          {transaction.isAnomaly ? <Badge variant="danger">Anomaly</Badge> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
