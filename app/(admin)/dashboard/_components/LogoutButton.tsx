"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        title="Logout"
        aria-label="Logout"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-elevated text-brand-muted shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-strong px-3 py-1.5 text-sm font-medium text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" />
      {isLoading ? "Disconnessione..." : "Logout"}
    </button>
  );
}
