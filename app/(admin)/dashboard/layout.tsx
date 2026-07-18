import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "./_components/DashboardNav";
import { FullscreenToggle } from "./_components/FullscreenToggle";
import { LinkClienteButton } from "./_components/LinkClienteButton";
import { LogoutButton } from "./_components/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [{ data: userData }, { count: nuoveCount }, { count: archivioCount }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "nuovo"),
    supabase.from("richieste").select("id", { count: "exact", head: true }).eq("stato", "archiviato"),
  ]);

  const email = userData.user?.email ?? "Admin";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-brand-bg bg-brand-grid bg-[length:40px_40px]">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-brand-border bg-brand-elevated/80 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 border-b border-brand-border px-6 py-6">
          <Image
            src="/logo/devology-icon.svg"
            alt=""
            width={130}
            height={100}
            className="h-9 w-auto"
          />
          <div>
            <p className="text-sm font-bold leading-tight text-brand-text">Devology System</p>
            <p className="text-xs text-brand-muted">Pannello Admin</p>
          </div>
        </div>

        <DashboardNav nuoveCount={nuoveCount ?? 0} archivioCount={archivioCount ?? 0} />

        <div className="space-y-3 border-t border-brand-border p-4">
          <LinkClienteButton />

          <Link
            href="/"
            className="flex items-center gap-1.5 px-2 text-xs font-medium text-brand-muted transition hover:text-brand-accent-light"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Torna al sito pubblico
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-xs font-bold text-brand-accent-light ring-1 ring-inset ring-brand-accent/25">
              {initials}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-brand-soft">{email}</p>
            <LogoutButton compact />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Su desktop non c'è una topbar dedicata: il pulsante resta fisso in alto a destra
            (il link cliente è già disponibile nella sidebar, qui basta il fullscreen). */}
        <div className="fixed right-6 top-6 z-50 hidden lg:block">
          <FullscreenToggle />
        </div>

        <header className="flex items-center justify-between border-b border-brand-border bg-brand-elevated/80 px-4 py-4 backdrop-blur-xl lg:hidden">
          <span className="flex items-center gap-2.5 text-base font-bold tracking-[-0.02em] text-brand-text">
            <Image
              src="/logo/devology-icon.svg"
              alt=""
              width={130}
              height={100}
              className="h-7 w-auto"
            />
            Pannello Admin
          </span>
          <div className="flex items-center gap-2">
            <LinkClienteButton variant="compact" />
            <FullscreenToggle />
            <LogoutButton />
          </div>
        </header>

        <div className="border-b border-brand-border bg-brand-elevated/60 lg:hidden">
          <DashboardNav
            nuoveCount={nuoveCount ?? 0}
            archivioCount={archivioCount ?? 0}
            variant="mobile"
          />
        </div>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
