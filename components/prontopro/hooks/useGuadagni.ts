import { useCallback } from 'react'
import type { Guadagno, GuadagnoInput } from '../types'
import { loadGuadagni, saveGuadagni, STORAGE_KEYS } from '../lib/storage'
import { usePersistentStorage } from './useLocalStorage'

export function useGuadagni() {
  const [items, setItems] = usePersistentStorage<Guadagno[]>({
    load: loadGuadagni,
    save: saveGuadagni,
    storageKey: STORAGE_KEYS.guadagni,
    backupKey: STORAGE_KEYS.guadagniBackup,
  })

  const add = useCallback(
    (item: GuadagnoInput) => {
      const guadagno: Guadagno = { ...item, id: crypto.randomUUID() }
      setItems((prev) => [guadagno, ...prev])
    },
    [setItems],
  )

  const update = useCallback(
    (id: string, item: GuadagnoInput) => {
      setItems((prev) => prev.map((g) => (g.id === id ? { ...item, id } : g)))
    },
    [setItems],
  )

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((g) => g.id !== id))
    },
    [setItems],
  )

  return { items, add, update, remove }
}
