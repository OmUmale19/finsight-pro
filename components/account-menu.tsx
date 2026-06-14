"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-center rounded-2xl">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
