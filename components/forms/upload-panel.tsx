"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatabaseZap, FileJson, FileUp, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const sourceCards = [
  { id: "csv", label: "CSV Upload", icon: FileUp },
  { id: "google-sheet", label: "Google Sheets", icon: Table2 },
  { id: "api", label: "JSON API Payload", icon: FileJson }
] as const;

export function UploadPanel() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<(typeof sourceCards)[number]["id"]>("csv");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("sourceType", sourceType);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setError(result.error ?? "Upload failed");
      setLoading(false);
      return;
    }

    setSuccess(`Imported ${result.data.imported} records and refreshed insights.`);
    setLoading(false);
    router.refresh();
  }

  return (
    <Card className="border-border bg-card/85 shadow-soft backdrop-blur">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-2xl">Ingest new financial data</CardTitle>
            <CardDescription>
              Upload a CSV, sync a public Google Sheet, or submit a JSON payload to trigger the ETL pipeline.
            </CardDescription>
          </div>
          <div className="hidden rounded-2xl bg-primary/10 p-3 text-primary md:block">
            <DatabaseZap className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {sourceCards.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSourceType(id)}
              className={cn(
                "rounded-3xl border p-4 text-left transition",
                sourceType === id ? "border-primary bg-primary/5 shadow-sm" : "bg-white hover:bg-slate-50"
              )}
            >
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <p className="font-medium">{label}</p>
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {sourceType === "csv" ? (
            <div className="space-y-2">
              <Label htmlFor="file">CSV file</Label>
              <Input id="file" name="file" type="file" accept=".csv" required />
            </div>
          ) : null}

          {sourceType === "google-sheet" ? (
            <div className="space-y-2">
              <Label htmlFor="googleSheetUrl">Public Google Sheets URL</Label>
              <Input
                id="googleSheetUrl"
                name="googleSheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                required
              />
            </div>
          ) : null}

          {sourceType === "api" ? (
            <div className="space-y-2">
              <Label htmlFor="apiPayload">JSON array payload</Label>
              <Textarea
                id="apiPayload"
                name="apiPayload"
                placeholder='[{"date":"2026-04-01","amount":"499","description":"Swiggy order"}]'
                required
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Running ETL..." : "Upload and process"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
