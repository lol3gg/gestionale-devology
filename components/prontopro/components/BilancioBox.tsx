import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { Guadagno, Lead, Spesa } from '../types'
import { formatEuro } from '../lib/labels'

interface BilancioBoxProps {
  guadagni: Guadagno[]
  spese: Spesa[]
  leads: Lead[]
}

export function BilancioBox({ guadagni, spese, leads }: BilancioBoxProps) {
  const totaleGuadagni = guadagni.reduce((s, g) => s + g.importo, 0)
  const totaleSpese = spese.reduce((s, sp) => s + sp.importo, 0)
  const netto = totaleGuadagni - totaleSpese
  const costoMedioLead = leads.length > 0 ? totaleSpese / leads.length : 0
  const roi =
    totaleSpese > 0 ? ((totaleGuadagni - totaleSpese) / totaleSpese) * 100 : 0

  return (
    <div className="pp-panel overflow-hidden">
      <div className="border-b border-brand-border px-5 py-5 sm:px-6">
        <p className="pp-label">Bilancio complessivo</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-brand-muted">Guadagno netto</p>
            <p
              className={`mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${
                netto >= 0 ? 'text-emerald-300' : 'text-brand-accent-light'
              }`}
            >
              {formatEuro(netto)}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
              roi >= 0
                ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                : 'bg-brand-accent/15 text-brand-accent-light ring-brand-accent/30'
            }`}
          >
            {roi >= 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            ROI {roi.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid divide-y divide-brand-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <BilancioRow icon={Wallet} label="Guadagni" value={formatEuro(totaleGuadagni)} />
        <BilancioRow icon={PiggyBank} label="Spese" value={formatEuro(totaleSpese)} />
        <BilancioRow icon={Target} label="Costo / lead" value={formatEuro(costoMedioLead)} />
        <BilancioRow icon={TrendingUp} label="Lead" value={String(leads.length)} />
      </div>
    </div>
  )
}

function BilancioRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-surface ring-1 ring-inset ring-brand-border">
        <Icon className="size-4 text-brand-muted" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-brand-text">
          {value}
        </p>
      </div>
    </div>
  )
}
