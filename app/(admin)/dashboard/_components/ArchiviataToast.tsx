"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive } from "lucide-react";

/** Banner temporaneo quando si arriva da un'archiviazione (?archiviata=1). */
export function ArchiviataToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("archiviata") !== "1") return;

    setVisible(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("archiviata");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });

    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-brand-soft"
    >
      <Archive className="h-4 w-4 shrink-0" />
      Richiesta archiviata
    </div>
  );
}
