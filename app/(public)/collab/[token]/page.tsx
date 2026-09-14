import Image from "next/image";
import { ShieldOff, Users } from "lucide-react";
import { getCollaboratorePortale } from "@/lib/collaboratori/portale";

export const dynamic = "force-dynamic";

function leggiTokenParam(raw: string | string[]) {
  const value = Array.isArray(raw) ? raw.join("") : raw;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PortaleCollaboratorePage({
  params,
}: {
  params: { token: string };
}) {
  const collaboratore = await getCollaboratorePortale(leggiTokenParam(params.token));

  if (!collaboratore) {
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

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <Image
          src="/logo/devology-logo-full.svg"
          alt="Devology System"
          width={200}
          height={125}
          priority
          className="h-10 w-auto"
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Portale collaboratore
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          Ciao, {collaboratore.nome}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Questo spazio è solo tuo. Non serve login: tieni salvato il link.
        </p>

        <section className="mt-6 rounded-brand-lg border border-brand-border bg-brand-elevated p-5 shadow-brand-md">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand-muted ring-1 ring-inset ring-brand-border">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-brand-text">I tuoi contatti</h2>
              <p className="text-xs text-brand-muted">Nessun contatto caricato per ora.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
