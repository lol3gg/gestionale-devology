import { useEffect, useState } from 'react'
import type { Spesa, SpesaInput } from '../types'
import { todayISO } from '../lib/labels'
import {
  Field,
  FormActions,
  Modal,
  inputClass,
  useFormSubmit,
} from './Modal'

interface SpeseModalProps {
  open: boolean
  spesa: Spesa | null
  onClose: () => void
  onSave: (data: SpesaInput) => void
}

function emptySpesa(): SpesaInput {
  return { data: todayISO(), importo: 0, nota: '' }
}

function spesaToInput(s: Spesa): SpesaInput {
  return {
    data: s.data,
    importo: s.importo,
    nota: s.nota,
  }
}

export function SpeseModal({ open, spesa, onClose, onSave }: SpeseModalProps) {
  const [form, setForm] = useState<SpesaInput>(emptySpesa())

  useEffect(() => {
    if (open) setForm(spesa ? spesaToInput(spesa) : emptySpesa())
  }, [open, spesa])

  const handleSubmit = useFormSubmit(() => {
    if (!form.importo || form.importo <= 0) return
    onSave(form)
    onClose()
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={spesa ? 'Modifica Ricarica' : 'Nuova Ricarica'}
      subtitle="Registra un acquisto crediti ProntoPro"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Data">
          <input
            className={inputClass}
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
        </Field>
        <Field label="Importo € *">
          <input
            className={inputClass}
            type="number"
            min="0.01"
            step="0.01"
            value={form.importo || ''}
            onChange={(e) =>
              setForm({ ...form, importo: parseFloat(e.target.value) || 0 })
            }
            required
            placeholder="50"
          />
        </Field>
        <Field label="Nota">
          <input
            className={inputClass}
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            placeholder="Ricarica crediti ProntoPro"
          />
        </Field>
        <FormActions onCancel={onClose} submitLabel={spesa ? 'Salva' : 'Aggiungi'} />
      </form>
    </Modal>
  )
}
