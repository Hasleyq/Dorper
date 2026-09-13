import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Building,
  Upload,
  Trash2,
  Save,
  Image as ImageIcon,
} from 'lucide-react'
import { useFlockSettings } from '@/lib/flock-settings'
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

  const { settings: flockSettings, saveSettings: saveFlockSettings, saving: savingFlock } = useFlockSettings()
  const [formFlock, setFormFlock] = useState(flockSettings)
  const [flockSavedMsg, setFlockSavedMsg] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unionFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFormFlock(flockSettings)
  }, [flockSettings])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFormFlock((prev) => ({ ...prev, logoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleUnionLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setFormFlock((prev) => ({ ...prev, unionLogoUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveFlock = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveFlockSettings(formFlock)
    setFlockSavedMsg(true)
    setTimeout(() => setFlockSavedMsg(false), 3000)
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
          Dane hodowli, logo na certyfikat, bezpieczeństwo bazy i system
        </p>
      </div>

      {/* ============================================ */}
      {/* Section 0: Flock Profile & Certificate Logo */}
      {/* ============================================ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <Building className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Dane hodowli & Logo na Certyfikat</h3>
              <p className="text-xs text-muted-foreground">
                Informacje te i logo zostaną automatycznie umieszczone na certyfikatach hodowlanych PDF
              </p>
            </div>
          </div>
          {flockSavedMsg && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Zapisano dane hodowli
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFlock} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="flockName">Nazwa hodowli</Label>
              <Input
                id="flockName"
                value={formFlock.flockName}
                onChange={(e) => setFormFlock({ ...formFlock, flockName: e.target.value })}
                placeholder="np. DORPER BARWAŁD / KULLA GÅRD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="breederName">Właściciel / Hodowca</Label>
              <Input
                id="breederName"
                value={formFlock.breederName}
                onChange={(e) => setFormFlock({ ...formFlock, breederName: e.target.value })}
                placeholder="np. Bartosz Wróbel"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="address">Adres / Miejscowość</Label>
              <Input
                id="address"
                value={formFlock.address}
                onChange={(e) => setFormFlock({ ...formFlock, address: e.target.value })}
                placeholder="np. 34-130 Barwałd Górny"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flockId">Numer stada / Numer gospodarstwa (PL / SE)</Label>
              <Input
                id="flockId"
                value={formFlock.flockId}
                onChange={(e) => setFormFlock({ ...formFlock, flockId: e.target.value })}
                placeholder="np. PL-123456789 lub SE8353"
              />
            </div>
          </div>

          {/* Logos upload grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 1. Breed / Flock Logo (Top Left) */}
            <div className="rounded-lg border border-border p-4 bg-slate-50 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Logo rasy / hodowli (lewy górny róg PDF)
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-card overflow-hidden shadow-inner">
                  {formFlock.logoUrl ? (
                    <img
                      src={formFlock.logoUrl}
                      alt="Logo hodowli"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5 text-xs h-7"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {formFlock.logoUrl ? 'Zmień logo' : 'Wgraj logo'}
                    </Button>
                    {formFlock.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormFlock({ ...formFlock, logoUrl: null })}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 text-xs h-7"
                      >
                        <Trash2 className="h-3 w-3" />
                        Usuń
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Domyślnie załadowane oficjalne logo Dorper.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Union Logo (Footer) */}
            <div className="rounded-lg border border-border p-4 bg-slate-50 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Logo Związku Hodowców (stopka PDF)
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-card overflow-hidden shadow-inner">
                  {formFlock.unionLogoUrl ? (
                    <img
                      src={formFlock.unionLogoUrl}
                      alt="Logo związku"
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5 text-center sm:text-left">
                  <input
                    type="file"
                    ref={unionFileInputRef}
                    onChange={handleUnionLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => unionFileInputRef.current?.click()}
                      className="gap-1.5 text-xs h-7"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {formFlock.unionLogoUrl ? 'Zmień logo' : 'Wgraj logo'}
                    </Button>
                    {formFlock.unionLogoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormFlock({ ...formFlock, unionLogoUrl: null })}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 text-xs h-7"
                      >
                        <Trash2 className="h-3 w-3" />
                        Usuń
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Domyślnie: RZHOiK NOWY TARG.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={savingFlock} className="gap-2">
              {savingFlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Zapisz dane hodowli
            </Button>
          </div>
        </form>
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
