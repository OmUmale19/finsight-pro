"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Goal, Lightbulb, Settings, UploadCloud } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/upload", label: "Upload Data", icon: UploadCloud },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/goals", label: "Goals & Budgets", icon: Goal },
  { href: "/profile", label: "Profile Settings", icon: Settings }
] as const;

export function AppShell({
  user,
  children
}: {
  user: { name: string; email: string; avatarUrl?: string | null; jobTitle?: string | null; company?: string | null };
  children: ReactNode;
}) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container grid min-h-screen gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-[2rem] border border-border bg-card/80 p-5 shadow-soft backdrop-blur lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-hidden">
          <div className="mb-8 space-y-3">
            <Badge>FinSight Pro</Badge>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">Expense intelligence</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                ETL, scoring, anomaly alerts, forecasting, and budget planning in one workspace.
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
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

          <div className="mt-6 shrink-0 rounded-3xl border border-border bg-muted/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <ThemeToggle />
            </div>

            <div className="flex items-start gap-3">
              <ProfileAvatar name={user.name} avatarUrl={user.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                {user.jobTitle || user.company ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[user.jobTitle, user.company].filter(Boolean).join(" at ")}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/profile">Manage profile</Link>
              </Button>
              <AccountMenu />
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
