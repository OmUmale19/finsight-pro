import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>
  );
}
