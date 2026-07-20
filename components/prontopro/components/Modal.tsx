import { X } from 'lucide-react'
import { useEffect, type FormEvent, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md sm:max-h-[90vh] sm:max-w-lg sm:rounded-brand-lg lg:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-brand-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <h2 className="text-lg font-semibold tracking-tight text-brand-text">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>
              )}
            </div>
            <button type="button" onClick={onClose} className="pp-btn-icon shrink-0">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="pp-label">{label}</span>
      {children}
    </label>
  )
}

export const inputClass = 'pp-input'

export function FormActions({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void
  submitLabel: string
}) {
  return (
    <div className="mt-6 flex gap-2 border-t border-brand-border pt-5">
      <button type="button" onClick={onCancel} className="pp-btn-ghost flex-1">
        Annulla
      </button>
      <button type="submit" className="pp-btn-primary flex-1">
        {submitLabel}
      </button>
    </div>
  )
}

export function useFormSubmit(handler: () => void) {
  return (e: FormEvent) => {
    e.preventDefault()
    handler()
  }
}
