import Image from "next/image";
import { ShieldOff } from "lucide-react";

export function LinkNonValido() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(211,17,43,0.16),transparent_55%)]" />
      <div className="relative w-full max-w-sm text-center">
        <Image
          src="/logo/devology-logo-full.svg"
          alt="Devology System"
          width={200}
          height={125}
          priority
          className="mx-auto h-14 w-auto"
        />
        <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/15 ring-1 ring-inset ring-brand-accent/35">
          <ShieldOff className="h-7 w-7 text-brand-accent-light" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-brand-text">
          Link non valido o disattivato
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          Questo indirizzo non è più attivo. Chiedi un nuovo link a Devology System.
        </p>
      </div>
    </main>
  );
}
