import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, RefreshCw, ClipboardList, CheckCircle2, Mars, Venus, ShieldAlert, Loader2, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable } from '@/components/sheep/data-table'
import { getSheepColumns } from '@/components/sheep/columns'
import { SheepForm } from '@/components/sheep/forms/SheepForm'
import { checkWithdrawal } from '@/lib/sheep-utils'
import type { SheepRecord } from '@/types/electron'

// ============================================
// Filter button group component
// ============================================
function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}:</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value === value ? '' : opt.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
            value === opt.value
              ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ============================================
// Stats card component
// ============================================
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent || 'bg-secondary'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
interface SheepRegistryProps {
  onViewSheep?: (id: string) => void
}

export function SheepRegistry({ onViewSheep }: SheepRegistryProps) {
  const [sheep, setSheep] = useState<SheepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sexFilter, setSexFilter] = useState('')
  const [isElectronAvailable, setIsElectronAvailable] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSheep, setEditingSheep] = useState<SheepRecord | null>(null)
  const [deletingSheep, setDeletingSheep] = useState<SheepRecord | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch sheep data from IPC
  const fetchSheep = useCallback(async () => {
    if (!window.electronAPI) {
      setIsElectronAvailable(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      if (statusFilter) filters.status = statusFilter
      if (sexFilter) filters.sex = sexFilter
      if (searchQuery.trim()) filters.search = searchQuery.trim()

      const result = await window.electronAPI.sheep.getAll(filters)
      setSheep(result)
    } catch (err) {
      console.error('Failed to fetch sheep:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sexFilter, searchQuery])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchSheep()
  }, [fetchSheep])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(debouncedSearch), 300)
    return () => clearTimeout(timer)
  }, [debouncedSearch])

  // Compute stats
  const stats = useMemo(() => {
    // Use un-filtered full set for global stats
    const total = sheep.length
    const active = sheep.filter((s) => s.status === 'ACTIVE').length
    const rams = sheep.filter((s) => s.sex === 'MALE' && s.status === 'ACTIVE').length
    const ewes = sheep.filter((s) => s.sex === 'FEMALE' && s.status === 'ACTIVE').length
    const withWithdrawal = sheep.filter((s) => checkWithdrawal(s.healthRecords || []).isActive).length
    return { total, active, rams, ewes, withWithdrawal }
  }, [sheep])

  const handleExportCsv = async () => {
    if (!window.electronAPI || sheep.length === 0) return
    const { formatDate: fd, SEX_LABELS: sx, STATUS_LABELS: st } = await import('@/lib/sheep-utils')
    const header = 'Kolczyk;ID;Płeć;Data urodzenia;Status;Linia;Matka;Ojciec'
    const rows = sheep.map((s) =>
      [
        s.earTag,
        s.name || '',
        sx[s.sex] || s.sex,
        fd(s.birthDate),
        st[s.status] || s.status,
        s.lineage || '',
        s.mother?.earTag || '',
        s.father?.earTag || '',
      ].join(';')
    )
    const csv = [header, ...rows].join('\n')
    await window.electronAPI.dialog.saveCsv(csv, 'rejestr_stada.csv')
  }

  // Delete sheep handler
  const handleDeleteSheep = async () => {
    if (!deletingSheep || !window.electronAPI) return
    try {
      setDeleteLoading(true)
      await window.electronAPI.sheep.delete(deletingSheep.id)
      setDeletingSheep(null)
      fetchSheep()
    } catch (err) {
      console.error('Failed to delete sheep:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Column definitions with action handlers
  const columns = useMemo(
    () =>
      getSheepColumns(
        (s) => onViewSheep?.(s.id),
        (s) => { setEditingSheep(s); setShowForm(true) },
        (s) => setDeletingSheep(s)
      ),
    [onViewSheep]
  )

  // Electron not available — show instructions
  if (!isElectronAvailable) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-lg font-semibold">Brak połączenia z bazą danych</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Uruchom aplikację przez Electron:
          </p>
          <code className="mt-3 inline-block rounded-md bg-background px-3 py-1.5 font-mono text-sm text-primary">
            npm run electron:dev
          </code>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rejestr stada</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Zarządzaj kompletną bazą danych owiec Dorper
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSheep} disabled={loading} className="shrink-0">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Odśwież</span>
          </Button>
          <Button size="sm" onClick={() => { setEditingSheep(null); setShowForm(true) }} className="shrink-0">
            <Plus className="h-4 w-4" />
            Dodaj owcę
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={sheep.length === 0} className="shrink-0">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Eksportuj do CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Łącznie w rejestrze"
          value={stats.total}
          icon={ClipboardList}
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          label="Aktywne"
          value={stats.active}
          icon={CheckCircle2}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="Tryki"
          value={stats.rams}
          icon={Mars}
          accent="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          label="Owce"
          value={stats.ewes}
          icon={Venus}
          accent="bg-pink-500/15 text-pink-400"
        />
        {stats.withWithdrawal > 0 && (
          <StatCard
            label="Karencja aktywna"
            value={stats.withWithdrawal}
            icon={ShieldAlert}
            accent="bg-red-500/15 text-red-400"
          />
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj po kolczyku lub ID..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <FilterGroup
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ACTIVE', label: 'Aktywne' },
              { value: 'SOLD', label: 'Sprzedane' },
              { value: 'DEAD', label: 'Padłe' },
            ]}
          />
          <div className="h-4 w-px bg-border" />
          <FilterGroup
            label="Płeć"
            value={sexFilter}
            onChange={setSexFilter}
            options={[
              { value: 'MALE', label: '♂ Tryki' },
              { value: 'FEMALE', label: '♀ Owce' },
            ]}
          />
        </div>
      </div>

      {/* Active withdrawal notice */}
      {stats.withWithdrawal > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm">
          <Badge variant="danger" className="shrink-0">⚠ Uwaga</Badge>
          <span className="text-red-700">
            {stats.withWithdrawal === 1
              ? '1 sztuka ma aktywną karencję lekową — niewskazana do sprzedaży/uboju.'
              : `${stats.withWithdrawal} sztuki mają aktywną karencję lekową — niewskazane do sprzedaży/uboju.`}
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie danych...</span>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={sheep} pageSize={10} />
      )}
    </div>

      {/* Sheep Add/Edit Form */}
      <SheepForm
        open={showForm}
        onOpenChange={setShowForm}
        allSheep={sheep}
        editSheep={editingSheep}
        onSuccess={fetchSheep}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSheep} onOpenChange={(v) => { if (!v) setDeletingSheep(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń owcę „{deletingSheep?.name || deletingSheep?.earTag}”</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć tę owcę z rejestru? Wraz z nią zostaną usunięte wszystkie powiązane dane
              (wagi, zdrowie, zdjęcia). Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSheep} disabled={deleteLoading}>
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Usuń owcę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
