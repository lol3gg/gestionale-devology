import { useCallback, useEffect, useRef, useState } from 'react'

type SetValue<T> = T | ((prev: T) => T)

interface StorageOptions<T> {
  load: () => { data: T; hadStoredData: boolean }
  save: (data: T) => boolean
  storageKey: string
  backupKey: string
}

export function usePersistentStorage<T>({
  load,
  save,
  storageKey,
  backupKey,
}: Omit<StorageOptions<T>, 'initialValue'>): [T, (val: SetValue<T>) => void] {
  const initial = useRef(load())
  const skipSaveRef = useRef(!initial.current.hadStoredData)
  const [stored, setStored] = useState<T>(initial.current.data)

  const persist = useCallback(
    (value: T) => {
      save(value)
    },
    [save],
  )

  const setValue = useCallback(
    (val: SetValue<T>) => {
      setStored((prev) => {
        const next = typeof val === 'function' ? (val as (prev: T) => T)(prev) : val
        skipSaveRef.current = false
        persist(next)
        return next
      })
    },
    [persist],
  )

  useEffect(() => {
    if (skipSaveRef.current) return
    persist(stored)
  }, [stored, persist])

  useEffect(() => {
    const watchedKeys = new Set([storageKey, backupKey])
    const onStorage = (event: StorageEvent) => {
      if (!event.key || !watchedKeys.has(event.key)) return
      if (event.newValue === null) return

      const loaded = load()
      setStored(loaded.data)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [load, storageKey, backupKey])

  useEffect(() => {
    const flush = () => {
      if (!skipSaveRef.current) persist(stored)
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [persist, stored])

  return [stored, setValue]
}

/** @deprecated Usa usePersistentStorage con lib/storage.ts */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (val: SetValue<T>) => void] {
  const load = useCallback(
    () => ({
      data: (() => {
        try {
          const raw = localStorage.getItem(key)
          if (raw === null) return initialValue
          return JSON.parse(raw) as T
        } catch {
          return initialValue
        }
      })(),
      hadStoredData: localStorage.getItem(key) !== null,
    }),
    [key, initialValue],
  )

  const save = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
      } catch {
        return false
      }
    },
    [key],
  )

  return usePersistentStorage({
    load,
    save,
    storageKey: key,
    backupKey: `${key}_backup`,
  })
}
