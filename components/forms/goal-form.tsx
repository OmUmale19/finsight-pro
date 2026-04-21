"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    setLoading(false);
    setMessage(result.success ? "Goal saved." : result.error ?? "Unable to save goal.");
    if (result.success) {
      router.refresh();
      form.reset();
    }
  }

  return (
    <Card className="border-border bg-card/85">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Create a savings goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Goal name</Label>
            <Input id="name" name="name" placeholder="Emergency fund" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target amount</Label>
            <Input id="targetAmount" name="targetAmount" type="number" min="1" placeholder="100000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Current amount</Label>
            <Input id="currentAmount" name="currentAmount" type="number" min="0" placeholder="25000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" name="deadline" type="date" required />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save goal"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
