import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Database,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Info,
  HardDrive,
  Cpu,
  Calendar,
} from 'lucide-react'
import type { DatabaseInfo } from '@/types/electron'

export function SettingsPage() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [backupResult, setBackupResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const fetchDbInfo = useCallback(async () => {
    if (!window.electronAPI?.database) return
    try {
      const info = await window.electronAPI.database.info()
      setDbInfo(info)
    } catch (err) {
      console.error('Failed to fetch db info:', err)
    }
  }, [])

  useEffect(() => {
    fetchDbInfo()
  }, [fetchDbInfo])

  const handleBackup = async () => {
    if (!window.electronAPI?.database) return
    try {
      setBackingUp(true)
      setBackupResult(null)
      const result = await window.electronAPI.database.backup()

      if (result.success) {
        setBackupResult({
          success: true,
          message: `Kopia zapasowa została zapisana: ${result.path}`,
        })
      } else {
        if (result.error === 'Anulowano przez użytkownika.') {
          setBackupResult(null) // Silently ignore cancel
        } else {
          setBackupResult({
            success: false,
            message: result.error || 'Nieznany błąd.',
          })
        }
      }
    } catch (err) {
      setBackupResult({
        success: false,
        message: 'Nie udało się utworzyć kopii zapasowej.',
      })
    } finally {
      setBackingUp(false)
    }
  }

  const today = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ustawienia</h2>
        <p className="text-sm text-muted-foreground">
          Zarządzanie bazą danych i informacje o systemie
        </p>
      </div>

      {/* ============================================ */}
      {/* Section 1: Data Security */}
      {/* ============================================ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Bezpieczeństwo danych</h3>
            <p className="text-xs text-muted-foreground">
              Kopia zapasowa chroni dane hodowli przed utratą
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Kopia zapasowa bazy danych</p>
              <p className="text-xs text-muted-foreground">
                Zapisz plik dev.db w bezpiecznym miejscu na dysku
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleBackup}
              disabled={backingUp}
              className="min-w-[200px] gap-2"
            >
              {backingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {backingUp ? 'Tworzenie kopii...' : 'Zrób kopię zapasową bazy danych'}
            </Button>
          </div>

          {/* Backup Result Toast */}
          {backupResult && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm animate-fade-in ${
                backupResult.success
                  ? 'border-emerald-500/20 bg-emerald-50 text-emerald-700'
                  : 'border-red-500/20 bg-red-50 text-red-700'
              }`}
            >
              {backupResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <p className="break-all">{backupResult.message}</p>
            </div>
          )}
        </div>

        {/* DB file info */}
        {dbInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            <span>Rozmiar bazy: {dbInfo.sizeKb} KB</span>
            <span className="text-border">•</span>
            <span className="font-mono truncate max-w-[400px]" title={dbInfo.path}>
              {dbInfo.path}
            </span>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Section 2: System Info */}
      {/* ============================================ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10">
            <Info className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Informacje o systemie</h3>
            <p className="text-xs text-muted-foreground">
              Szczegóły techniczne aplikacji
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-slate-50 divide-y divide-border">
          <InfoRow
            icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
            label="Wersja aplikacji"
            value="v1.0.0"
          />
          <InfoRow
            icon={<Cpu className="h-4 w-4 text-muted-foreground" />}
            label="Środowisko"
            value="Electron + React + TypeScript"
          />
          <InfoRow
            icon={<Database className="h-4 w-4 text-muted-foreground" />}
            label="Baza danych"
            value="SQLite (lokalna)"
          />
          <InfoRow
            icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
            label="Ścieżka do bazy"
            value={dbInfo?.path || 'Lokalna'}
            mono
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            label="Data dzisiejsza"
            value={today}
          />
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground/60">
        Dorper Manager v1.0.0 — System hodowlany dla ras mięsnych
      </p>
    </div>
  )
}

// ============================================
// Reusable info row
// ============================================
function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span
        className={`text-sm font-medium ${mono ? 'font-mono text-xs max-w-[300px] truncate' : ''}`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}
