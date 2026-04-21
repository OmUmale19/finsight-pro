import { redirect } from "next/navigation";

import { FadeIn } from "@/components/fade-in";
import { UploadPanel } from "@/components/forms/upload-panel";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentSession } from "@/lib/session";

export default async function UploadPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData(session.userId);

  return (
    <div className="space-y-6">
      <FadeIn>
        <PageHeader
          eyebrow="Ingestion"
          title="Feed the ETL pipeline"
          description="Import CSV exports, Google Sheets, or API payloads. Each run is logged with status, processed rows, and error tracking."
        />
      </FadeIn>

      <FadeIn delay={0.05}>
        <UploadPanel />
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-border bg-card/85">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Pipeline run history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.pipelineLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ETL runs yet. Upload data to create your first pipeline log.</p>
            ) : (
              data.pipelineLogs.map((log) => (
                <div key={log.id} className="rounded-3xl border bg-slate-50 p-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="font-medium">
                        {log.source ?? "Unknown source"} • {new Date(log.startedAt).toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Rows processed: {log.rowsProcessed}</p>
                      {log.errorMessage ? <p className="mt-2 text-sm text-rose-600">{log.errorMessage}</p> : null}
                    </div>
                    <Badge variant={log.status === "SUCCESS" ? "secondary" : log.status === "FAILED" ? "danger" : "warning"}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
