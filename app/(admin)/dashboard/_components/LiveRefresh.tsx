"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { subscribeLiveSync } from "@/lib/live/browser";

export function LiveRefresh() {
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    function refresh() {
      if (timer.current != null) return;
      timer.current = window.setTimeout(() => {
        timer.current = null;
        router.refresh();
      }, 200);
    }

    const stop = subscribeLiveSync(refresh);

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
