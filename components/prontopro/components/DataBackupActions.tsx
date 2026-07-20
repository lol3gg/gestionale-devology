import { Download, Upload } from 'lucide-react'
import { useRef } from 'react'
import { exportAllData, importAllData } from '../lib/storage'

export function DataBackupActions() {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = url
    link.download = `prontopro-backup-${stamp}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      if (!text) return

      const ok = importAllData(text)
      if (ok) {
        window.location.reload()
        return
      }

      window.alert('File di backup non valido.')
    }
    reader.readAsText(file)
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={handleExport} className="pp-btn-ghost px-3 py-1.5 text-xs">
        <Download className="size-3.5" />
        Esporta backup
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="pp-btn-ghost px-3 py-1.5 text-xs"
      >
        <Upload className="size-3.5" />
        Importa backup
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImport(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
