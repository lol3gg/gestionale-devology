"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { getPublicOrigin } from "@/lib/site";

export function CopiaLinkPortaleButton({
  token,
  nome,
}: {
  token: string | null;
  nome: string;
}) {
  const [copiato, setCopiato] = useState(false);

  if (!token) {
    return (
      <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-brand-muted ring-1 ring-inset ring-brand-border">
        Link non pronto
      </span>
    );
  }

  const linkToken = token;

  async function copiaLink() {
    const link = `${getPublicOrigin()}/collab/${linkToken}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
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

  return (
    <div className="flex w-full flex-col gap-1.5 sm:items-start">
      <button
        type="button"
        onClick={copiaLink}
        title={`Copia il link portale da mandare a ${nome}`}
        data-portale-path={`/collab/${linkToken}`}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:w-auto ${
          copiato
            ? "bg-emerald-600 text-white"
            : "bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white hover:brightness-110"
        }`}
      >
        {copiato ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copiato ? "Link copiato! Mandalo dal telefono" : "Copia link portale"}
      </button>
      <p className="break-all text-[10px] leading-snug text-brand-muted">
        Si apre sul telefono, senza login, con il nome di {nome}.
      </p>
    </div>
  );
}
