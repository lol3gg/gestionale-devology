"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, FileText, Inbox, Wallet } from "lucide-react";

/**
 * Sezioni "di primo livello" note, usate per capire se la rotta corrente
 * (es. "/dashboard/xyz") appartiene a "Richieste" (una richiesta specifica)
 * oppure a una sezione dedicata.
 */
const SEZIONI_DEDICATE = ["preventivi", "contabilita", "archivio"];

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Richieste",
    icon: Inbox,
    badgeKey: "nuove" as const,
    isActive: (pathname: string) => {
      const primoSegmento = pathname.split("/")[2];
      return pathname === "/dashboard" || (!!primoSegmento && !SEZIONI_DEDICATE.includes(primoSegmento));
    },
  },
  {
    href: "/dashboard/archivio",
    label: "Archivio",
    icon: Archive,
    badgeKey: "archivio" as const,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/archivio"),
  },
  {
    href: "/dashboard/preventivi",
    label: "Preventivi",
    icon: FileText,
    badgeKey: null,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/preventivi"),
  },
  {
    href: "/dashboard/contabilita",
    label: "Contabilità",
    icon: Wallet,
    badgeKey: null,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/contabilita"),
  },
];

type DashboardNavProps = {
  nuoveCount: number;
  archivioCount?: number;
  variant?: "sidebar" | "mobile";
};

export function DashboardNav({
  nuoveCount,
  archivioCount = 0,
  variant = "sidebar",
}: DashboardNavProps) {
  const pathname = usePathname() ?? "";
  const isMobile = variant === "mobile";

  return (
    <nav
      className={
        isMobile ? "flex items-center gap-2 overflow-x-auto px-4 py-2.5" : "flex-1 space-y-1 px-4 py-6"
      }
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.isActive(pathname);
        const Icon = item.icon;
        const badgeCount =
          item.badgeKey === "nuove" ? nuoveCount : item.badgeKey === "archivio" ? archivioCount : 0;
        const showBadge = !!item.badgeKey && badgeCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              isMobile ? "shrink-0" : "justify-between"
            } ${
              isActive
                ? "bg-gradient-to-r from-brand-accent/15 to-transparent text-brand-text shadow-brand-inset ring-1 ring-inset ring-brand-accent/25"
                : "text-brand-soft hover:bg-brand-surface hover:text-brand-text"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-accent-light" : "text-brand-muted"}`} />
              {item.label}
            </span>
            {showBadge && (
              <span
                className={`inline-flex min-w-[1.375rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  item.badgeKey === "nuove"
                    ? "bg-brand-accent text-white"
                    : "bg-white/10 text-brand-soft ring-1 ring-inset ring-white/15"
                }`}
              >
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
