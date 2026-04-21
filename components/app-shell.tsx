"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Goal, Lightbulb, UploadCloud } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/upload", label: "Upload Data", icon: UploadCloud },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/goals", label: "Goals & Budgets", icon: Goal }
] as const;

export function AppShell({
  user,
  children
}: {
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container grid min-h-screen gap-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[2rem] border border-border bg-card/80 p-5 shadow-soft backdrop-blur flex flex-col">
          <div className="mb-8 space-y-3">
            <Badge>FinSight Pro</Badge>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Expense intelligence</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ETL, scoring, anomaly alerts, forecasting, and budget planning in one workspace.
              </p>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = currentPath === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-3xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <ThemeToggle />
            </div>
            <p className="font-medium text-foreground truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="mt-4">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
