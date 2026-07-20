import { Calendar, ChevronDown, Euro } from 'lucide-react'
import type { SortMode } from '../lib/filters'
import { formatMonthLabel } from '../lib/filters'

interface ListToolbarProps {
  sort: SortMode
  onSortChange: (sort: SortMode) => void
  month?: string
  onMonthChange?: (month: string) => void
  availableMonths?: string[]
  showMonthFilter?: boolean
}

export function ListToolbar({
  sort,
  onSortChange,
  month = '',
  onMonthChange,
  availableMonths = [],
  showMonthFilter = false,
}: ListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3">
        <span className="pp-label shrink-0">Ordina</span>
        <div className="inline-flex rounded-xl border border-brand-border-strong bg-brand-surface p-0.5">
          <SortButton
            active={sort === 'data'}
            onClick={() => onSortChange('data')}
            icon={Calendar}
            label="Data"
          />
          <SortButton
            active={sort === 'importo'}
            onClick={() => onSortChange('importo')}
            icon={Euro}
            label="Importo"
          />
        </div>
      </div>

      {showMonthFilter && onMonthChange && (
        <div className="flex items-center gap-3">
          <span className="pp-label shrink-0">Periodo</span>
          <div className="relative min-w-[160px]">
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="pp-input appearance-none pr-9 [color-scheme:dark]"
            >
              <option value="">Tutti i mesi</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
          </div>
        </div>
      )}
    </div>
  )
}

function SortButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Calendar
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-gradient-to-b from-[#e01431] via-brand-accent to-[#b00f26] text-white shadow-sm'
          : 'text-brand-muted hover:bg-brand-border-strong hover:text-brand-text'
      }`}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
