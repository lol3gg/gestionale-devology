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
  collapsed?: boolean;
};

export function DashboardNav({
  nuoveCount,
  archivioCount = 0,
  variant = "sidebar",
  collapsed = false,
}: DashboardNavProps) {
  const pathname = usePathname() ?? "";
  const isMobile = variant === "mobile";
  const isIconOnly = !isMobile && collapsed;

  return (
    <nav
      className={
        isMobile
          ? "flex items-center gap-2 overflow-x-auto px-4 py-2.5"
          : isIconOnly
            ? "flex-1 space-y-1 px-2 py-4"
            : "flex-1 space-y-1 px-4 py-6"
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
            title={isIconOnly ? item.label : undefined}
            aria-label={isIconOnly ? item.label : undefined}
            className={`relative flex items-center rounded-xl text-sm font-semibold transition ${
              isMobile
                ? "shrink-0 gap-2.5 px-3.5 py-2.5 justify-between"
                : isIconOnly
                  ? "justify-center px-2 py-2.5"
                  : "justify-between gap-2.5 px-3.5 py-2.5"
            } ${
              isActive
                ? "bg-gradient-to-r from-brand-accent/15 to-transparent text-brand-text shadow-brand-inset ring-1 ring-inset ring-brand-accent/25"
                : "text-brand-soft hover:bg-brand-surface hover:text-brand-text"
            }`}
          >
            <span className={`flex items-center ${isIconOnly ? "" : "gap-2.5"}`}>
              <Icon className={`h-4 w-4 ${isActive ? "text-brand-accent-light" : "text-brand-muted"}`} />
              {!isIconOnly && item.label}
            </span>
            {showBadge && !isIconOnly && (
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
            {showBadge && isIconOnly && (
              <span
                className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${
                  item.badgeKey === "nuove" ? "bg-brand-accent" : "bg-brand-soft"
                }`}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
