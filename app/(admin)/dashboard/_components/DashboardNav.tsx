"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, FileText, Inbox, Megaphone, Wallet } from "lucide-react";

/**
 * Sezioni "di primo livello" note, usate per capire se la rotta corrente
 * (es. "/dashboard/xyz") appartiene a "Richieste" (una richiesta specifica)
 * oppure a una sezione dedicata.
 */
const SEZIONI_DEDICATE = ["preventivi", "contabilita", "archivio", "prontopro"];

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Richieste",
    shortLabel: "Richieste",
    icon: Inbox,
    badgeKey: "nuove" as const,
    isActive: (pathname: string) => {
      const primoSegmento = pathname.split("/")[2];
      return pathname === "/dashboard" || (!!primoSegmento && !SEZIONI_DEDICATE.includes(primoSegmento));
    },
  },
  {
    href: "/dashboard/archivio",
    label: "Archivio cliente",
    shortLabel: "Archivio",
    icon: Archive,
    badgeKey: "archivio" as const,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/archivio"),
  },
  {
    href: "/dashboard/preventivi",
    label: "Preventivi",
    shortLabel: "Preventivi",
    icon: FileText,
    badgeKey: null,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/preventivi"),
  },
  {
    href: "/dashboard/contabilita",
    label: "Contabilità",
    shortLabel: "Contab.",
    icon: Wallet,
    badgeKey: null,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/contabilita"),
  },
  {
    href: "/dashboard/prontopro",
    label: "ProntoPro",
    shortLabel: "ProntoPro",
    icon: Megaphone,
    badgeKey: null,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/prontopro"),
  },
];

type DashboardNavProps = {
  nuoveCount: number;
  archivioCount?: number;
  variant?: "sidebar" | "mobile" | "bottom";
  collapsed?: boolean;
};

export function DashboardNav({
  nuoveCount,
  archivioCount = 0,
  variant = "sidebar",
  collapsed = false,
}: DashboardNavProps) {
  const pathname = usePathname() ?? "";
  const isBottom = variant === "bottom";
  const isMobile = variant === "mobile";
  const isIconOnly = !isMobile && !isBottom && collapsed;

  return (
    <nav
      className={
        isBottom
          ? "grid grid-cols-5 gap-0 px-0.5 pb-safe pt-1"
          : isMobile
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

        if (isBottom) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[9px] font-semibold leading-tight transition active:scale-[0.97] sm:text-[10px] ${
                isActive ? "text-brand-accent-light" : "text-brand-muted"
              }`}
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-brand-accent-light" : "text-brand-muted"}`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {showBadge && (
                  <span
                    className={`absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${
                      item.badgeKey === "nuove"
                        ? "bg-brand-accent text-white"
                        : "bg-brand-soft text-brand-bg"
                    }`}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-0.5">{item.shortLabel}</span>
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-accent" />
              )}
            </Link>
          );
        }

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
