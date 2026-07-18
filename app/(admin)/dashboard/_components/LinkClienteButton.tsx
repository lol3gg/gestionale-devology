"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

type LinkClienteButtonProps = {
  variant?: "sidebar" | "compact";
};

/**
 * Copia il link del form pubblico "/richiedi" da mandare ai clienti.
 * Usa sempre l'origine corrente (localhost in sviluppo, dominio Vercel in
 * produzione): nessun indirizzo da configurare a mano.
 */
export function LinkClienteButton({ variant = "sidebar" }: LinkClienteButtonProps) {
  const [copiato, setCopiato] = useState(false);

  async function copiaLink() {
    const link = `${window.location.origin}/richiedi`;

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback per browser/contesti senza permesso Clipboard API.
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={copiaLink}
        title="Copia link da mandare ai clienti"
        aria-label="Copia link da mandare ai clienti"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-elevated text-brand-soft shadow-sm transition hover:border-brand-accent/40 hover:text-brand-accent-light"
      >
        {copiato ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copiaLink}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
        copiato
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-brand-accent/30 bg-brand-accent/10 text-brand-accent-light hover:bg-brand-accent/15"
      }`}
    >
      {copiato ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copiato ? "Link copiato!" : "Copia link per il cliente"}
    </button>
  );
}
