import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, DatabaseZap, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: DatabaseZap,
    title: "Full ETL pipeline",
    description: "Normalize messy banking exports, Sheets data, and API payloads into one analytics-ready model."
  },
  {
    icon: BrainCircuit,
    title: "Financial intelligence",
    description: "Generate recurring-expense detection, forecasts, anomaly alerts, and habit-level recommendations."
  },
  {
    icon: BarChart3,
    title: "Decision dashboards",
    description: "Track score trends, category distribution, goals, budgets, and what-if simulations in one cockpit."
  },
  {
    icon: ShieldCheck,
    title: "Secure multi-user SaaS",
    description: "JWT auth, isolated user data, protected routes, and a backend designed for Postgres + Prisma."
  }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid opacity-60" />
      <div className="absolute right-8 top-8 z-50">
        <ThemeToggle />
      </div>
      <div className="container relative flex min-h-screen flex-col justify-center py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
              FinSight Pro
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                Expense intelligence for modern teams
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-tight text-foreground md:text-6xl">
                Track every rupee. Understand every pattern. Improve every month.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                A production-ready expense analytics platform with automated ETL, financial health scoring,
                anomaly detection, recurring expense tracking, and actionable insights for smarter spending.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                <Link href="/signup">
                  Launch your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-6 text-base">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </section>

          <Card className="border-border bg-card/85 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Platform highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border bg-muted/30 p-4">
                  <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
