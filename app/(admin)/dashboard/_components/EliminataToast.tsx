"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

/** Mostra un banner temporaneo "Richiesta eliminata" quando ?eliminata=1 è nell'URL. */
export function EliminataToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("eliminata") !== "1") return;

    setVisible(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("eliminata");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });

    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300"
    >
      <Check className="h-4 w-4 shrink-0" />
      Richiesta eliminata
    </div>
  );
}
