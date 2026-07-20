import ProntoProApp from "@/components/prontopro/ProntoProApp";

export default function ProntoProPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent-light">
          Pannello Admin
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-brand-text sm:text-3xl">
          ProntoPro
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Lead, ricariche crediti e guadagni dalla campagna ProntoPro.
        </p>
      </div>

      <ProntoProApp />
    </div>
  );
}
