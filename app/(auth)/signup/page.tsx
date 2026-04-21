import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";

export default function SignupPage() {
  return (
    <main className="container flex min-h-screen items-center justify-center py-16">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Launch Your Workspace</p>
          <h1 className="font-heading text-5xl font-semibold leading-tight text-foreground">
            Build healthier spending habits with intelligent finance analytics.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Upload bank exports or Google Sheets, let the pipeline classify and enrich them, then act on clear financial guidance.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </section>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
