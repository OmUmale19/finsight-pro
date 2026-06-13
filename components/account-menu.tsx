"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, ShieldCheck, SlidersHorizontal, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
        Account
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-56 rounded-2xl border border-border bg-card p-2 shadow-soft">
          <Link
            href="/profile"
            className="flex items-center rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            <UserCircle2 className="mr-2 h-4 w-4" />
            Edit profile
          </Link>
          <Link
            href="/profile#security"
            className="flex items-center rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </Link>
          <Link
            href="/profile#preferences"
            className="flex items-center rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Preferences
          </Link>
          <Link
            href="/profile"
            className="flex items-center rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Account settings
          </Link>
          <button
            type="button"
            className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
