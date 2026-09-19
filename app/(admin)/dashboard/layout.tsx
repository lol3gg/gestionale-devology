import type { ReactNode } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "./_components/DashboardNav";
import { DashboardSidebar } from "./_components/DashboardSidebar";
import { FullscreenToggle } from "./_components/FullscreenToggle";
import { ThemeToggle } from "./_components/ThemeToggle";
import { LinkClienteButton } from "./_components/LinkClienteButton";
import { LockDashboardScroll } from "./_components/LockDashboardScroll";
import { LogoutButton } from "./_components/LogoutButton";
import { RegisterServiceWorker } from "./_components/RegisterServiceWorker";
import { addGiorni, oggiIsoRoma } from "@/lib/calendario/date";
import { GIORNI_RICHIAMO_PREVENTIVO } from "@/lib/preventivi/richiamo";
import { STATI_PREVENTIVO_ATTIVI } from "@/lib/preventivi/stato";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const limiteRichiamo = addGiorni(oggiIsoRoma(), -GIORNI_RICHIAMO_PREVENTIVO);
  const [{ data: userData }, { count: nuoveCount }, { count: archivioCount }, richiamiResult] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "nuovo"),
      supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "archiviato"),
      supabase
        .from("preventivi")
        .select("id", { count: "exact", head: true })
        .in("stato", STATI_PREVENTIVO_ATTIVI)
        .lte("data_invio", limiteRichiamo),
    ]);
  const richiamiCount = richiamiResult.error ? 0 : richiamiResult.count ?? 0;

  const email = userData.user?.email ?? "Admin";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-brand-bg bg-brand-grid bg-[length:40px_40px]">
      <LockDashboardScroll />
      <RegisterServiceWorker />
      <DashboardSidebar
        email={email}
        initials={initials}
        nuoveCount={nuoveCount ?? 0}
        archivioCount={archivioCount ?? 0}
        richiamiCount={richiamiCount}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Desktop: controlli fissi in alto a destra. */}
        <div className="fixed right-6 top-6 z-50 hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <FullscreenToggle />
        </div>

        {/* Mobile header compatto */}
        <header className="z-40 flex items-center justify-between gap-3 border-b border-brand-border bg-brand-elevated/90 px-3 py-3 backdrop-blur-xl pt-safe sm:px-4 lg:hidden">
          <span className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-[-0.02em] text-brand-text">
            <Image
              src="/logo/devology-icon.svg"
              alt=""
              width={130}
              height={100}
              className="h-7 w-auto shrink-0"
            />
            <span className="truncate">Admin</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <LinkClienteButton variant="compact" />
            <ThemeToggle />
            <LogoutButton compact />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-10 lg:py-10 lg:pb-10">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>

        {/* Mobile: tab bar fissa in basso */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-brand-elevated/95 backdrop-blur-xl lg:hidden">
          <DashboardNav
            nuoveCount={nuoveCount ?? 0}
            archivioCount={archivioCount ?? 0}
            richiamiCount={richiamiCount}
            variant="bottom"
          />
        </div>
      </div>
    </div>
  );
}
