"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SETUP_PORTALE_COLLABORATORI_SQL } from "@/lib/collaboratori/setupPortaleSql";

export function SetupPortaleCollaboratoriNotice() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(SETUP_PORTALE_COLLABORATORI_SQL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-brand-accent/40 bg-brand-accent/10 p-4 text-sm text-brand-accent-light">
      <p>
        Per il portale collaboratori serve uno script unico su Supabase: apri{" "}
        <a
          href="https://supabase.com/dashboard/project/bjiqxqjlnkzjwqisljla/sql/new"
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          SQL Editor
        </a>
        , incolla lo script e clicca Run. Poi ricarica questa pagina.
      </p>
      <button
        type="button"
        onClick={copySql}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "SQL copiato" : "Copia script SQL"}
      </button>
    </div>
  );
}
