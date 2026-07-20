import {
  AlertCircle,
  Ban,
  Briefcase,
  CreditCard,
  FileText,
  Inbox,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  Search,
  StickyNote,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { BilancioBox } from './components/BilancioBox'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DataBackupActions } from './components/DataBackupActions'
import { GuadagniModal } from './components/GuadagniModal'
import { LeadModal } from './components/LeadModal'
import { ListToolbar } from './components/ListToolbar'
import { SpeseModal } from './components/SpeseModal'
import { useGuadagni } from './hooks/useGuadagni'
import { useLeads } from './hooks/useLeads'
import { useSpese } from './hooks/useSpese'
import {
  ESITO_BADGE,
  ESITO_LABELS,
  STATO_BADGE,
  STATO_LABELS,
  formatDate,
  formatEuro,
} from './lib/labels'
import {
  collectMonths,
  formatMonthLabel,
  matchesLeadSearch,
  matchesMonth,
  sortGuadagni,
  sortLeads,
  sortSpese,
  type SortMode,
} from './lib/filters'
import type { Esito, Guadagno, Lead, Spesa, StatoChiamata } from './types'

type Tab = 'lead' | 'spese' | 'guadagni'
type LeadFilter = 'tutti' | StatoChiamata | 'annullati'

const ANNULLATI_ESITI: Esito[] = ['non_interessato', 'chiuso_perso']

const TABS: { id: Tab; label: string; icon: typeof Users; desc: string }[] = [
  { id: 'lead', label: 'Lead', icon: Users, desc: 'Contatti e chiamate' },
  { id: 'spese', label: 'Spese', icon: CreditCard, desc: 'Ricariche crediti' },
  { id: 'guadagni', label: 'Guadagni', icon: TrendingUp, desc: 'Bilancio e ROI' },
]

const LEAD_FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'da_chiamare', label: 'Da chiamare' },
  { id: 'chiamato', label: 'Chiamato' },
  { id: 'non_risposto', label: 'Non risposto' },
  { id: 'annullati', label: 'Annullati' },
]

type DeleteTarget =
  | { type: 'lead'; id: string; name: string }
  | { type: 'spesa'; id: string }
  | { type: 'guadagno'; id: string; name: string }

export default function ProntoProAppInner() {
  const { items: leads, add: addLead, update: updateLead, remove: removeLead } =
    useLeads()
  const { items: spese, add: addSpesa, update: updateSpesa, remove: removeSpesa } =
    useSpese()
  const {
    items: guadagni,
    add: addGuadagno,
    update: updateGuadagno,
    remove: removeGuadagno,
  } = useGuadagni()

  const [tab, setTab] = useState<Tab>('lead')
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('tutti')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadSort, setLeadSort] = useState<SortMode>('data')
  const [speseSort, setSpeseSort] = useState<SortMode>('data')
  const [speseMonth, setSpeseMonth] = useState('')
  const [guadagniSort, setGuadagniSort] = useState<SortMode>('data')
  const [guadagniMonth, setGuadagniMonth] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [speseModalOpen, setSpeseModalOpen] = useState(false)
  const [editingSpesa, setEditingSpesa] = useState<Spesa | null>(null)
  const [guadagniModalOpen, setGuadagniModalOpen] = useState(false)
  const [editingGuadagno, setEditingGuadagno] = useState<Guadagno | null>(null)

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((l) => {
      if (leadFilter === 'annullati') {
        if (!ANNULLATI_ESITI.includes(l.esito)) return false
      } else if (leadFilter !== 'tutti' && l.statoChiamata !== leadFilter) {
        return false
      }
      return matchesLeadSearch(l, leadSearch)
    })
    return sortLeads(filtered, leadSort)
  }, [leads, leadFilter, leadSearch, leadSort])

  const speseMonths = useMemo(
    () => collectMonths(spese.map((s) => s.data)),
    [spese],
  )

  const filteredSpese = useMemo(() => {
    const filtered = spese.filter((s) => matchesMonth(s.data, speseMonth))
    return sortSpese(filtered, speseSort)
  }, [spese, speseMonth, speseSort])

  const guadagniMonths = useMemo(
    () => collectMonths(guadagni.map((g) => g.data)),
    [guadagni],
  )

  const filteredGuadagni = useMemo(() => {
    const filtered = guadagni.filter((g) => matchesMonth(g.data, guadagniMonth))
    return sortGuadagni(filtered, guadagniSort)
  }, [guadagni, guadagniMonth, guadagniSort])

  const totaleRicariche = filteredSpese.reduce((s, sp) => s + sp.importo, 0)
  const totaleGuadagniFiltrati = filteredGuadagni.reduce(
    (s, g) => s + g.importo,
    0,
  )

  const leadStats = {
    totale: leads.length,
    daChiamare: leads.filter((l) => l.statoChiamata === 'da_chiamare').length,
    preventivi: leads.filter((l) => l.esito === 'preventivo_inviato').length,
    vinti: leads.filter((l) => l.esito === 'chiuso_vinto').length,
    annullati: leads.filter((l) => ANNULLATI_ESITI.includes(l.esito)).length,
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'lead') removeLead(deleteTarget.id)
    if (deleteTarget.type === 'spesa') removeSpesa(deleteTarget.id)
    if (deleteTarget.type === 'guadagno') removeGuadagno(deleteTarget.id)
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <nav className="grid grid-cols-3 gap-1 rounded-xl border border-brand-border-strong bg-brand-surface p-1 sm:flex sm:flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition sm:min-h-0 sm:py-1.5 ${
              tab === id
                ? 'bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white shadow-sm'
                : 'text-brand-muted hover:bg-brand-border-strong hover:text-brand-text'
            }`}
          >
            <Icon className="size-4 shrink-0 opacity-90" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'lead' && (
        <div className="space-y-5 lg:space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon={Users}
              label="Totale lead"
              value={leadStats.totale}
              iconClasses="bg-brand-accent/15 text-brand-accent-light ring-brand-accent/25"
            />
            <StatCard
              icon={PhoneCall}
              label="Da chiamare"
              value={leadStats.daChiamare}
              iconClasses="bg-amber-500/15 text-amber-300 ring-amber-500/25"
            />
            <StatCard
              icon={FileText}
              label="Preventivi"
              value={leadStats.preventivi}
              iconClasses="bg-orange-500/15 text-orange-300 ring-orange-500/25"
            />
            <StatCard
              icon={Briefcase}
              label="Chiusi vinti"
              value={leadStats.vinti}
              iconClasses="bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
            />
            <StatCard
              icon={Ban}
              label="Annullati"
              value={leadStats.annullati}
              iconClasses="bg-brand-accent/15 text-brand-accent-light ring-brand-accent/25"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2">
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
                <input
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="Cerca nome, numero o note..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="pp-input pl-10"
                />
              </div>
              {leadSearch.trim() && (
                <p className="text-xs text-brand-muted">
                  {filteredLeads.length} risultat
                  {filteredLeads.length === 1 ? 'o' : 'i'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setEditingLead(null); setLeadModalOpen(true) }}
              className="pp-btn-primary shrink-0"
            >
              <Plus className="size-4" />
              Nuovo lead
            </button>
          </div>

          <div className="pp-panel p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <ListToolbar sort={leadSort} onSortChange={setLeadSort} />
              <div className="flex flex-wrap gap-1 rounded-xl border border-brand-border-strong bg-brand-surface p-1">
                {LEAD_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLeadFilter(f.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      leadFilter === f.id
                        ? 'bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white shadow-sm'
                        : 'text-brand-muted hover:bg-brand-border-strong hover:text-brand-text'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nessun lead"
              message={
                leadSearch || leadFilter !== 'tutti'
                  ? 'Prova a cambiare filtri o ricerca'
                  : 'Aggiungi il primo contatto da ProntoPro'
              }
              action={
                !leadSearch && leadFilter === 'tutti' ? (
                  <button
                    type="button"
                    onClick={() => { setEditingLead(null); setLeadModalOpen(true) }}
                    className="pp-btn-primary mt-4"
                  >
                    <Plus className="size-4" />
                    Aggiungi Lead
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={() => { setEditingLead(lead); setLeadModalOpen(true) }}
                  onDelete={() =>
                    setDeleteTarget({ type: 'lead', id: lead.id, name: lead.nome })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'spese' && (
        <div className="space-y-5 lg:space-y-6">
          <div className="xl:grid xl:grid-cols-12 xl:items-start xl:gap-6">
            <div className="space-y-5 xl:col-span-4">
              <div className="pp-panel p-6 text-center lg:p-8">
                <p className="pp-label">
                  {speseMonth
                    ? `Ricariche · ${formatMonthLabel(speseMonth)}`
                    : 'Totale ricariche'}
                </p>
                <p className="mt-2 text-4xl font-extrabold tracking-[-0.02em] tabular-nums text-brand-text lg:text-5xl">
                  {formatEuro(totaleRicariche)}
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  {filteredSpese.length} ricaric
                  {filteredSpese.length === 1 ? 'a' : 'he'}
                  {speseMonth ? ' nel periodo' : ' registrate'}
                </p>
              </div>

              <div className="pp-panel p-4">
                <ListToolbar
                  sort={speseSort}
                  onSortChange={setSpeseSort}
                  month={speseMonth}
                  onMonthChange={setSpeseMonth}
                  availableMonths={speseMonths}
                  showMonthFilter
                />
              </div>

              <button
                type="button"
                onClick={() => { setEditingSpesa(null); setSpeseModalOpen(true) }}
                className="pp-btn-primary w-full"
              >
                <Plus className="size-4" />
                Aggiungi Ricarica
              </button>
            </div>

            <div className="mt-5 space-y-5 xl:col-span-8 xl:mt-0">
              {spese.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Nessuna ricarica"
                  message="Registra le ricariche crediti ProntoPro"
                />
              ) : filteredSpese.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="Nessun risultato"
                  message="Nessuna ricarica per il mese selezionato"
                />
              ) : (
                <>
                  <div className="hidden sm:block">
                    <DataTable
                      headers={['Data', 'Importo', 'Nota', '']}
                      rows={filteredSpese.map((s) => [
                        formatDate(s.data),
                        <span key="imp" className="font-semibold text-brand-text">
                          {formatEuro(s.importo)}
                        </span>,
                        s.nota ? (
                          <span key="nota" className="whitespace-pre-wrap text-brand-soft">
                            {s.nota}
                          </span>
                        ) : (
                          <span key="nota" className="text-brand-muted">—</span>
                        ),
                        <RowActions
                          key="act"
                          onEdit={() => { setEditingSpesa(s); setSpeseModalOpen(true) }}
                          onDelete={() => setDeleteTarget({ type: 'spesa', id: s.id })}
                        />,
                      ])}
                    />
                  </div>
                  <div className="space-y-2 sm:hidden">
                    {filteredSpese.map((s) => (
                      <MobileRecordCard
                        key={s.id}
                        title={formatEuro(s.importo)}
                        subtitle={formatDate(s.data)}
                        detail={s.nota}
                        onEdit={() => { setEditingSpesa(s); setSpeseModalOpen(true) }}
                        onDelete={() => setDeleteTarget({ type: 'spesa', id: s.id })}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'guadagni' && (
        <div className="space-y-5 lg:space-y-6">
          <div className="xl:grid xl:grid-cols-12 xl:items-start xl:gap-6">
            <div className="space-y-5 xl:col-span-4">
              <BilancioBox guadagni={guadagni} spese={spese} leads={leads} />

              {guadagni.length > 0 && (
                <div className="pp-panel flex items-center justify-between px-5 py-4">
                  <p className="text-sm text-brand-soft">
                    {guadagniMonth
                      ? `Guadagni · ${formatMonthLabel(guadagniMonth)}`
                      : 'Totale guadagni lista'}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-emerald-300 lg:text-xl">
                    {formatEuro(totaleGuadagniFiltrati)}
                  </p>
                </div>
              )}

              <div className="pp-panel p-4">
                <ListToolbar
                  sort={guadagniSort}
                  onSortChange={setGuadagniSort}
                  month={guadagniMonth}
                  onMonthChange={setGuadagniMonth}
                  availableMonths={guadagniMonths}
                  showMonthFilter
                />
              </div>

              <button
                type="button"
                onClick={() => { setEditingGuadagno(null); setGuadagniModalOpen(true) }}
                className="pp-btn-primary w-full"
              >
                <Plus className="size-4" />
                Aggiungi Guadagno
              </button>
            </div>

            <div className="mt-5 space-y-5 xl:col-span-8 xl:mt-0">
              {guadagni.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Nessun guadagno"
                  message="Registra i progetti chiusi per vedere il bilancio"
                />
              ) : filteredGuadagni.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Nessun risultato"
                  message="Nessun guadagno per il mese selezionato"
                />
              ) : (
                <>
                  <div className="hidden sm:block">
                    <DataTable
                      headers={['Data', 'Cliente', 'Progetto', 'Importo', 'Nota', '']}
                      rows={filteredGuadagni.map((g) => [
                        formatDate(g.data),
                        <span key="c" className="font-medium text-brand-text">{g.cliente || '—'}</span>,
                        <span key="p" className="text-brand-soft">{g.progetto || '—'}</span>,
                        <span key="imp" className="font-semibold text-emerald-300">
                          {formatEuro(g.importo)}
                        </span>,
                        g.nota ? (
                          <span key="nota" className="whitespace-pre-wrap text-brand-soft">
                            {g.nota}
                          </span>
                        ) : (
                          <span key="nota" className="text-brand-muted">—</span>
                        ),
                        <RowActions
                          key="act"
                          onEdit={() => { setEditingGuadagno(g); setGuadagniModalOpen(true) }}
                          onDelete={() =>
                            setDeleteTarget({
                              type: 'guadagno',
                              id: g.id,
                              name: g.cliente || 'questo guadagno',
                            })
                          }
                        />,
                      ])}
                    />
                  </div>
                  <div className="space-y-2 sm:hidden">
                    {filteredGuadagni.map((g) => (
                      <MobileRecordCard
                        key={g.id}
                        title={g.cliente || 'Cliente'}
                        subtitle={`${formatDate(g.data)} · ${g.progetto || 'Progetto'}`}
                        detail={g.nota}
                        amount={formatEuro(g.importo)}
                        amountClass="text-emerald-300"
                        onEdit={() => { setEditingGuadagno(g); setGuadagniModalOpen(true) }}
                        onDelete={() =>
                          setDeleteTarget({
                            type: 'guadagno',
                            id: g.id,
                            name: g.cliente || 'questo guadagno',
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
        <p>
          Dati salvati nel browser di questo dispositivo · Usa Esporta/Importa per backup o
          trasferimento
        </p>
        <p className="mt-1">
          Se avevi già la dashboard standalone, importa qui il file di backup JSON
        </p>
        <DataBackupActions />
      </footer>

      <LeadModal
        open={leadModalOpen}
        lead={editingLead}
        onClose={() => setLeadModalOpen(false)}
        onSave={(data) =>
          editingLead ? updateLead(editingLead.id, data) : addLead(data)
        }
      />
      <SpeseModal
        open={speseModalOpen}
        spesa={editingSpesa}
        onClose={() => setSpeseModalOpen(false)}
        onSave={(data) =>
          editingSpesa ? updateSpesa(editingSpesa.id, data) : addSpesa(data)
        }
      />
      <GuadagniModal
        open={guadagniModalOpen}
        guadagno={editingGuadagno}
        onClose={() => setGuadagniModalOpen(false)}
        onSave={(data) =>
          editingGuadagno
            ? updateGuadagno(editingGuadagno.id, data)
            : addGuadagno(data)
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Conferma eliminazione"
        message={
          deleteTarget?.type === 'lead'
            ? `Vuoi eliminare il lead "${deleteTarget.name}"? L'azione non è reversibile.`
            : deleteTarget?.type === 'guadagno'
              ? `Vuoi eliminare il guadagno di "${deleteTarget.name}"?`
              : 'Vuoi eliminare questa ricarica?'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconClasses,
}: {
  icon: typeof Users
  label: string
  value: number
  iconClasses: string
}) {
  return (
    <div className="rounded-brand-lg border border-brand-border bg-brand-elevated p-4 shadow-brand-md sm:p-5">
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${iconClasses}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      </span>
      <p className="mt-3.5 text-2xl font-extrabold tracking-[-0.02em] tabular-nums text-brand-text sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-brand-muted">{label}</p>
    </div>
  )
}

function Badge({ className, children }: { className: string; children: string }) {
  return <span className={`pp-badge ${className}`}>{children}</span>
}

function LeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = lead.nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isUrgent = lead.statoChiamata === 'da_chiamare'

  return (
    <article className="pp-panel p-4 transition hover:border-brand-accent/30 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ring-inset ${
              isUrgent
                ? 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                : 'bg-brand-surface text-brand-soft ring-brand-border'
            }`}
          >
            {initials || '?'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
              <h3 className="text-base font-semibold text-brand-text sm:text-lg">
                {lead.nome}
              </h3>
              {lead.servizio && (
                <span className="text-sm text-brand-muted">· {lead.servizio}</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge className={STATO_BADGE[lead.statoChiamata]}>
                {STATO_LABELS[lead.statoChiamata]}
              </Badge>
              <Badge className={ESITO_BADGE[lead.esito]}>
                {ESITO_LABELS[lead.esito]}
              </Badge>
              {lead.prezzoLead > 0 && (
                <span className="text-xs tabular-nums text-brand-muted">
                  Lead {formatEuro(lead.prezzoLead)}
                </span>
              )}
              {lead.valoreProgetto > 0 && (
                <span className="text-xs font-medium tabular-nums text-emerald-300">
                  Progetto {formatEuro(lead.valoreProgetto)}
                </span>
              )}
            </div>

            {(lead.dettagli || lead.comeSiamoRimasti || lead.note) && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {lead.dettagli && (
                  <LeadInfoBlock icon={FileText} label="Richiesta" text={lead.dettagli} />
                )}
                {lead.comeSiamoRimasti && (
                  <LeadInfoBlock
                    icon={AlertCircle}
                    label="Follow-up"
                    text={lead.comeSiamoRimasti}
                    highlight
                  />
                )}
                {lead.note && (
                  <LeadInfoBlock icon={StickyNote} label="Note" text={lead.note} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end">
          {lead.numero && (
            <a
              href={`tel:${lead.numero.replace(/\s/g, '')}`}
              className="pp-btn-primary"
            >
              <Phone className="size-3.5" />
              {lead.numero}
            </a>
          )}
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} className="pp-btn-icon" title="Modifica">
              <Pencil className="size-4" />
            </button>
            <button type="button" onClick={onDelete} className="pp-btn-icon-danger" title="Elimina">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function LeadInfoBlock({
  icon: Icon,
  label,
  text,
  highlight,
}: {
  icon: typeof StickyNote
  label: string
  text: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        highlight
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-brand-border bg-brand-surface'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`size-3.5 ${highlight ? 'text-amber-300' : 'text-brand-muted'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
          {label}
        </span>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-brand-soft">{text}</p>
    </div>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: (string | ReactNode)[][]
}) {
  return (
    <div className="overflow-hidden rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border bg-brand-surface/60">
            {headers.map((h, i) => (
              <th key={i} className="pp-label px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-brand-border/80 transition-colors last:border-0 even:bg-brand-surface/30 hover:bg-brand-accent/5"
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3.5 text-brand-soft">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileRecordCard({
  title,
  subtitle,
  detail,
  amount,
  amountClass = 'text-brand-text',
  onEdit,
  onDelete,
}: {
  title: string
  subtitle: string
  detail?: string
  amount?: string
  amountClass?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="pp-panel flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className={`font-semibold ${amount ? 'text-brand-text' : amountClass}`}>
          {title}
        </p>
        <p className="mt-0.5 text-xs text-brand-muted">{subtitle}</p>
        {amount && (
          <p className={`mt-1 text-sm font-semibold tabular-nums ${amountClass}`}>
            {amount}
          </p>
        )}
        {detail && (
          <div className="mt-2 rounded-lg border border-brand-border bg-brand-surface px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
              Nota
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-brand-soft">
              {detail}
            </p>
          </div>
        )}
      </div>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <button type="button" onClick={onEdit} className="pp-btn-icon">
        <Pencil className="size-3.5" />
      </button>
      <button type="button" onClick={onDelete} className="pp-btn-icon-danger">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: typeof Inbox
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="pp-panel flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-surface ring-1 ring-inset ring-brand-border">
        <Icon className="size-5 text-brand-muted" />
      </div>
      <p className="font-semibold text-brand-text">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-brand-muted">{message}</p>
      {action}
    </div>
  )
}
