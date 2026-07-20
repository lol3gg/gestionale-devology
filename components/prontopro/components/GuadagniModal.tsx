import { useEffect, useState } from 'react'
import type { Guadagno, GuadagnoInput } from '../types'
import { todayISO } from '../lib/labels'
import {
  Field,
  FormActions,
  Modal,
  inputClass,
  useFormSubmit,
} from './Modal'

interface GuadagniModalProps {
  open: boolean
  guadagno: Guadagno | null
  onClose: () => void
  onSave: (data: GuadagnoInput) => void
}

function emptyGuadagno(): GuadagnoInput {
  return { data: todayISO(), importo: 0, cliente: '', progetto: '', nota: '' }
}

function guadagnoToInput(g: Guadagno): GuadagnoInput {
  return {
    data: g.data,
    importo: g.importo,
    cliente: g.cliente,
    progetto: g.progetto,
    nota: g.nota,
  }
}

export function GuadagniModal({
  open,
  guadagno,
  onClose,
  onSave,
}: GuadagniModalProps) {
  const [form, setForm] = useState<GuadagnoInput>(emptyGuadagno())

  useEffect(() => {
    if (open) setForm(guadagno ? guadagnoToInput(guadagno) : emptyGuadagno())
  }, [open, guadagno])

  const handleSubmit = useFormSubmit(() => {
    if (!form.importo || form.importo <= 0) return
    onSave(form)
    onClose()
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={guadagno ? 'Modifica Guadagno' : 'Nuovo Guadagno'}
      subtitle="Registra un progetto chiuso o incassato"
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
          />
        </Field>
        <Field label="Cliente">
          <input
            className={inputClass}
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            placeholder="Nome cliente"
          />
        </Field>
        <Field label="Progetto">
          <input
            className={inputClass}
            value={form.progetto}
            onChange={(e) => setForm({ ...form, progetto: e.target.value })}
            placeholder="Sito web aziendale"
          />
        </Field>
        <Field label="Nota">
          <input
            className={inputClass}
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
          />
        </Field>
        <FormActions
          onCancel={onClose}
          submitLabel={guadagno ? 'Salva' : 'Aggiungi'}
        />
      </form>
    </Modal>
  )
}
