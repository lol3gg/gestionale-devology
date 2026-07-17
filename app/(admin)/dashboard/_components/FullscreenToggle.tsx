"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

type FullscreenToggleProps = {
  className?: string;
};

export function FullscreenToggle({ className = "" }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Alcuni browser/contesti (es. iframe senza permesso) possono rifiutare
      // la richiesta: non c'è altro da fare, l'utente resta nella visuale normale.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "Esci da schermo intero" : "Visualizza a schermo intero"}
      title={isFullscreen ? "Esci da schermo intero" : "Visualizza a schermo intero"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-elevated text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light ${className}`}
    >
      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    </button>
  );
}
