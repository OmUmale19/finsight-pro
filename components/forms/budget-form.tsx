"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BudgetForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    setLoading(false);
    setMessage(result.success ? "Budget saved." : result.error ?? "Unable to save budget.");
    if (result.success) {
      router.refresh();
      form.reset();
    }
  }

  return (
    <Card className="border-border bg-card/85">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Add budget guardrails</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" placeholder="Food" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limit">Monthly limit</Label>
            <Input id="limit" name="limit" type="number" min="1" placeholder="6000" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save budget"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
