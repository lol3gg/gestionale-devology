"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subscribeLiveSync } from "@/lib/live/browser";

export function LiveRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function refresh() {
      if (timer.current != null) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        startTransition(() => {
          router.refresh();
        });
      }, 500);
    }

    const stop = subscribeLiveSync(refresh);
    return () => {
      stop();
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, [router, startTransition]);

  return null;
}
