import { useEffect, useState } from 'react'
import type { Lead, LeadInput } from '../types'
import {
  ESITO_LABELS,
  STATO_LABELS,
  emptyLead,
  leadToInput,
} from '../lib/labels'
import {
  Field,
  FormActions,
  Modal,
  inputClass,
  useFormSubmit,
} from './Modal'

interface LeadModalProps {
  open: boolean
  lead: Lead | null
  onClose: () => void
  onSave: (data: LeadInput) => void
}

export function LeadModal({ open, lead, onClose, onSave }: LeadModalProps) {
  const [form, setForm] = useState<LeadInput>(emptyLead())

  useEffect(() => {
    if (open) {
      setForm(lead ? leadToInput(lead) : emptyLead())
    }
  }, [open, lead])

  const set = <K extends keyof LeadInput>(key: K, val: LeadInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = useFormSubmit(() => {
    if (!form.nome.trim()) return
    onSave({ ...form, nome: form.nome.trim() })
    onClose()
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? 'Modifica Lead' : 'Nuovo Lead'}
      subtitle={lead ? 'Aggiorna i dati del contatto' : 'Inserisci un nuovo contatto da ProntoPro'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Nome *">
          <input
            className={inputClass}
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            required
            placeholder="Mario Rossi"
          />
        </Field>

        <Field label="Numero">
          <input
            className={inputClass}
            type="tel"
            value={form.numero}
            onChange={(e) => set('numero', e.target.value)}
            placeholder="333 1234567"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Prezzo pagato lead €">
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.prezzoLead || ''}
              onChange={(e) => set('prezzoLead', parseFloat(e.target.value) || 0)}
            />
          </Field>
          <Field label="Valore stimato progetto €">
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.valoreProgetto || ''}
              onChange={(e) =>
                set('valoreProgetto', parseFloat(e.target.value) || 0)
              }
            />
          </Field>
        </div>

        <Field label="Servizio richiesto">
          <input
            className={inputClass}
            value={form.servizio}
            onChange={(e) => set('servizio', e.target.value)}
            placeholder="Sito web, app mobile..."
          />
        </Field>

        <Field label="Dettagli su cosa voleva">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={form.dettagli}
            onChange={(e) => set('dettagli', e.target.value)}
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Stato chiamata">
            <select
              className={inputClass}
              value={form.statoChiamata}
              onChange={(e) =>
                set('statoChiamata', e.target.value as LeadInput['statoChiamata'])
              }
            >
              {(Object.keys(STATO_LABELS) as LeadInput['statoChiamata'][]).map(
                (k) => (
                  <option key={k} value={k}>
                    {STATO_LABELS[k]}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Esito">
            <select
              className={inputClass}
              value={form.esito}
              onChange={(e) => set('esito', e.target.value as LeadInput['esito'])}
            >
              {(Object.keys(ESITO_LABELS) as LeadInput['esito'][]).map((k) => (
                <option key={k} value={k}>
                  {ESITO_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Come siamo rimasti">
          <textarea
            className={`${inputClass} min-h-[60px] resize-y`}
            value={form.comeSiamoRimasti}
            onChange={(e) => set('comeSiamoRimasti', e.target.value)}
            placeholder="Richiamo giovedì, manda brief..."
            rows={2}
          />
        </Field>

        <Field label="Note">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Appunti personali, promemoria, dettagli utili..."
            rows={3}
          />
        </Field>

        <FormActions onCancel={onClose} submitLabel={lead ? 'Salva' : 'Aggiungi'} />
      </form>
    </Modal>
  )
}
