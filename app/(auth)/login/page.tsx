import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">FinSight Pro</p>
          <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground">
            Make your money data finally work for you.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Sign in to monitor spending trends, automate ETL pipelines, spot anomalies, and improve your financial health score.
          </p>
          <p className="text-sm text-muted-foreground">
            New here? <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
        </section>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
