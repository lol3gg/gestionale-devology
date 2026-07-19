"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DashboardNav } from "./DashboardNav";
import { LinkClienteButton } from "./LinkClienteButton";
import { LogoutButton } from "./LogoutButton";

const STORAGE_KEY = "devology-sidebar-collapsed";

type DashboardSidebarProps = {
  email: string;
  initials: string;
  nuoveCount: number;
  archivioCount: number;
};

export function DashboardSidebar({
  email,
  initials,
  nuoveCount,
  archivioCount,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      // localStorage non disponibile: resta espansa
    }
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Evita flash di larghezza al primo paint dopo aver letto localStorage.
  const widthClass = !hydrated ? "w-72" : collapsed ? "w-[4.75rem]" : "w-72";

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-brand-border bg-brand-elevated/80 backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex ${widthClass}`}
    >
      <div
        className={`flex items-center border-b border-brand-border py-5 ${
          collapsed ? "flex-col gap-3 px-2" : "gap-3 px-4"
        }`}
      >
        <Image
          src="/logo/devology-icon.svg"
          alt=""
          width={130}
          height={100}
          className={`w-auto shrink-0 ${collapsed ? "h-8" : "h-9"}`}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-brand-text">
              Devology System
            </p>
            <p className="text-xs text-brand-muted">Pannello Admin</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Espandi menu laterale" : "Restringi menu laterale"}
          title={collapsed ? "Espandi menu" : "Restringi menu"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-soft transition hover:border-brand-accent/40 hover:text-brand-accent-light"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <DashboardNav
        nuoveCount={nuoveCount}
        archivioCount={archivioCount}
        collapsed={collapsed}
      />

      <div className={`space-y-3 border-t border-brand-border ${collapsed ? "p-2" : "p-4"}`}>
        <LinkClienteButton variant={collapsed ? "compact" : "sidebar"} />

        <div
          className={`flex items-center rounded-xl border border-brand-border bg-brand-surface ${
            collapsed ? "flex-col gap-2 p-2" : "gap-3 p-3"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-xs font-bold text-brand-accent-light ring-1 ring-inset ring-brand-accent/25">
            {initials}
          </span>
          {!collapsed && (
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-brand-soft">{email}</p>
          )}
          <LogoutButton compact />
        </div>
      </div>
    </aside>
  );
}
