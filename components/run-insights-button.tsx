"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RunInsightsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/insights/run", {
      method: "POST"
    });
    const payload = await response.json();

    setLoading(false);
    if (!payload.success) {
      setMessage(payload.error ?? "Unable to run insights.");
      return;
    }

    setMessage("Insights refreshed.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button size="lg" onClick={handleClick} disabled={loading}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {loading ? "Running..." : "Re-run insights"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
