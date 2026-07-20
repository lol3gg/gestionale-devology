import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Elimina',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-full max-w-sm rounded-brand-lg border border-brand-border bg-brand-elevated shadow-brand-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-brand-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-accent/15 ring-1 ring-inset ring-brand-accent/30">
              <AlertTriangle className="size-5 text-brand-accent-light" />
            </div>
            <button type="button" onClick={onCancel} className="pp-btn-icon shrink-0">
              <X className="size-4" />
            </button>
          </div>
          <h3 className="mt-3 text-base font-semibold text-brand-text">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-soft">{message}</p>
        </div>

        <div className="flex gap-2 p-4">
          <button type="button" onClick={onCancel} className="pp-btn-ghost flex-1">
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className="pp-btn-danger flex-1"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
