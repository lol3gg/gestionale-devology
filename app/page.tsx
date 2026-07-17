import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    title: "Analisi funzionale",
    description: "Raccogliamo requisiti, vincoli e priorità operative del tuo progetto.",
  },
  {
    title: "Sviluppo tecnico",
    description: "Architettura solida, codice pulito, release controllate.",
  },
  {
    title: "Metriche e miglioramento",
    description: "Ottimizzazione continua dopo il go-live, sui dati reali.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(211,17,43,0.18),transparent_55%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <Image
          src="/logo/devology-logo-full.svg"
          alt="Devology System"
          width={200}
          height={125}
          priority
          className="h-24 w-auto sm:h-28"
        />

        <h1 className="mt-8 text-[clamp(2.35rem,1.1rem+4vw,3.85rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-brand-text">
          Richieste clienti e gestione progetti,
          <br className="hidden sm:block" /> in un&apos;unica piattaforma.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-muted sm:text-lg">
          Raccontaci la tua esigenza: la analizziamo e ti proponiamo una soluzione digitale
          concreta e su misura. Il team Devology System segue la richiesta dal primo contatto
          fino al preventivo.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/richiedi"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] px-7 py-3 text-sm font-semibold text-white shadow-brand-md transition hover:brightness-110"
          >
            Richiedi un preventivo
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-brand-border-strong bg-brand-elevated px-7 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-accent/40 hover:text-brand-accent-light"
          >
            Accesso admin
          </Link>
        </div>

        <div className="mt-20 grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-brand border border-brand-border bg-brand-elevated/60 p-6 text-left backdrop-blur-sm"
            >
              <h2 className="text-sm font-bold text-brand-text">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative border-t border-brand-border py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} Devology System · Urbania (PU) · Marche
      </footer>
    </div>
  );
}
