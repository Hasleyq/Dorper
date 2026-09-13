import { useState, useEffect, useCallback } from 'react'
import { RowActions } from '@/components/ui/row-actions'
import { MassHealthDialog } from '@/components/health/MassHealthDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AddHealthDialog } from '@/components/sheep/forms/AddHealthDialog'
import { formatDate, HEALTH_TYPE_LABELS, toInputDate } from '@/lib/sheep-utils'
import { addDays } from 'date-fns'
import {
  Syringe,
  Bug,
  Stethoscope,
  Scissors,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Download,
  Pill,
} from 'lucide-react'
import { DEFAULT_HEALTH_TYPES } from '@/lib/sheep-utils'
import { useCustomOptions } from '@/lib/custom-options'
import { OptionSelectWithAdd } from '@/components/ui/option-select-with-add'
import type { GlobalHealthRecord, SheepRecord } from '@/types/electron'

// ============================================
// Health type styling
// ============================================
const HEALTH_TYPE_STYLES: Record<
  string,
  { variant: 'default' | 'secondary' | 'warning' | 'active'; icon: React.ElementType }
> = {
  VACCINE: { variant: 'default', icon: Syringe },
  Szczepienie: { variant: 'default', icon: Syringe },
  BOLUS: { variant: 'active', icon: Pill },
  Bolus: { variant: 'active', icon: Pill },
  DEWORMING: { variant: 'warning', icon: Bug },
  Odrobaczanie: { variant: 'warning', icon: Bug },
  VET_VISIT: { variant: 'active', icon: Stethoscope },
  'Wizyta wet.': { variant: 'active', icon: Stethoscope },
  HOOF: { variant: 'secondary', icon: Scissors },
  'Korekcja racic': { variant: 'secondary', icon: Scissors },
}

export function HealthPage() {
  const [records, setRecords] = useState<GlobalHealthRecord[]>([])
  const [allSheep, setAllSheep] = useState<SheepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showMass, setShowMass] = useState(false)
  const [selectedSheepId, setSelectedSheepId] = useState<string | undefined>(undefined)
  const [editingRecord, setEditingRecord] = useState<GlobalHealthRecord | null>(null)

  // Fetch all health records globally
  const fetchRecords = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const [healthData, sheepData] = await Promise.all([
        window.electronAPI.health.getAllGlobal(),
        window.electronAPI.sheep.getAll(),
      ])
      setRecords(healthData)
      setAllSheep(sheepData)
    } catch (err) {
      console.error('Failed to fetch health records:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Filter records by search
  const filtered = records.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const sheepLabel = (r.sheep?.name || r.sheep?.earTag || '').toLowerCase()
    return (
      sheepLabel.includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.medication || '').toLowerCase().includes(q)
    )
  })

  // Stats
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0)
  const activeWithdrawals = records.filter((r) => {
    if (!r.withdrawalDays || r.withdrawalDays <= 0) return false
    const end = addDays(new Date(r.date), r.withdrawalDays)
    return end > new Date()
  }).length

  const handleExportCsv = async () => {
    if (!window.electronAPI || filtered.length === 0) return
    const header = 'Data;Owca;Kolczyk;Typ;Opis;Lek;Koszt;Karencja (dni)'
    const rows = filtered.map((r) =>
      [
        formatDate(r.date),
        r.sheep?.name || '',
        r.sheep?.earTag || '',
        HEALTH_TYPE_LABELS[r.type] || r.type,
        (r.description || '').replace(/;/g, ','),
        (r.medication || '').replace(/;/g, ','),
        r.cost?.toFixed(2) || '',
        r.withdrawalDays || '',
      ].join(';')
    )
    const csv = [header, ...rows].join('\n')
    await window.electronAPI.dialog.saveCsv(csv, 'zdrowie_eksport.csv')
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Zdrowie stada</h2>
          <p className="text-sm text-muted-foreground">
            Kompletna kartoteka zdrowia wszystkich owiec
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Odśwież</span>
          </Button>
          <Button size="sm" onClick={() => { setSelectedSheepId(undefined); setEditingRecord(null); setShowAdd(true) }}>
            <Plus className="h-4 w-4" />
            Dodaj wpis
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowMass(true)}>
            <Plus className="h-4 w-4" />
            Grupowy wpis
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Eksport CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Łączna liczba wpisów</p>
          <p className="mt-1 text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Łączne koszty leczenia</p>
          <p className="mt-1 text-2xl font-bold">
            {totalCost > 0 ? totalCost.toLocaleString('pl-PL') : '0'}
            <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
          </p>
        </div>
        <div className={`rounded-xl border bg-card p-4 ${activeWithdrawals > 0 ? 'border-red-500/30' : 'border-border'}`}>
          <p className="text-xs text-muted-foreground">Aktywne karencje</p>
          <p className={`mt-1 text-2xl font-bold ${activeWithdrawals > 0 ? 'text-red-400' : ''}`}>
            {activeWithdrawals}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po owcy, opisie lub leku..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie danych...</span>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Owca</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Typ zabiegu</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Opis</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Koszt</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-center">Karencja</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => {
                const style = HEALTH_TYPE_STYLES[record.type] || HEALTH_TYPE_STYLES.VET_VISIT
                const Icon = style.icon
                const hasWithdrawal = record.withdrawalDays && record.withdrawalDays > 0
                const withdrawalEnd = hasWithdrawal
                  ? addDays(new Date(record.date), record.withdrawalDays!)
                  : null
                const isStillActive = withdrawalEnd ? withdrawalEnd > new Date() : false

                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{formatDate(record.date)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{record.sheep?.name || record.sheep?.earTag || '—'}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{record.sheep?.earTag}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant={style.variant} className="text-xs">
                          {HEALTH_TYPE_LABELS[record.type] || record.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] text-sm">
                      <p className="truncate">{record.description}</p>
                      {record.medication && (
                        <p className="truncate text-[10px] text-muted-foreground">Lek: {record.medication}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {record.cost ? `${record.cost.toFixed(0)} PLN` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasWithdrawal ? (
                        isStillActive ? (
                          <Badge variant="danger" className="text-[10px]">
                            do {formatDate(withdrawalEnd!)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            zakończona
                          </Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        onEdit={() => {
                          setEditingRecord(record)
                          setShowAdd(true)
                        }}
                        onDelete={async () => {
                          if (!window.electronAPI) return
                          await window.electronAPI.health.delete(record.id)
                          fetchRecords()
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Brak wyników dla podanego zapytania' : 'Brak wpisów zdrowotnych w systemie'}
          </p>
        </div>
      )}

      {/* Add Health Record Dialog — with sheep combobox via sheepId=undefined */}
      <GlobalAddHealthDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        allSheep={allSheep}
        onSuccess={fetchRecords}
        editingRecord={editingRecord}
      />
      <MassHealthDialog
        open={showMass}
        onOpenChange={setShowMass}
        allSheep={allSheep}
        onSuccess={fetchRecords}
      />
    </div>
  )
}

// ============================================
// Global Add Health Dialog (includes sheep selector)
// ============================================
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SheepCombobox } from '@/components/sheep/forms/SheepCombobox'
import { AlertTriangle } from 'lucide-react'

const GH_TYPE_OPTIONS = [
  'Szczepienie', 'Odrobaczanie', 'Wizyta wet.', 'Korekcja racic',
  'Pobranie krwi', 'Kąpiel', 'Strzyżenie', 'Antybiotyk',
]
const GH_CUSTOM_KEY = '__INNE__'

const globalHealthSchema = z.object({
  date: z.string().min(1, 'Data jest wymagana'),
  type: z.string().min(1, 'Typ zabiegu jest wymagany'),
  description: z.string().min(1, 'Opis jest wymagany'),
  medication: z.string().optional(),
  withdrawalDays: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().min(0, 'Nie może być ujemne').optional()),
  cost: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : undefined))
    .pipe(z.number().min(0, 'Nie może być ujemne').optional()),
})

type GlobalHealthFormValues = z.input<typeof globalHealthSchema>

function GlobalAddHealthDialog({
  open,
  onOpenChange,
  allSheep,
  onSuccess,
  editingRecord,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSheep: SheepRecord[]
  onSuccess: () => void
  editingRecord?: GlobalHealthRecord | null
}) {
  const [submitting, setSubmitting] = useState(false)
  const [sheepId, setSheepId] = useState<string | undefined>(undefined)
  const [sheepError, setSheepError] = useState(false)
  const isEditing = !!editingRecord?.id
  const { options: healthOptions, addOption: addHealthOption } = useCustomOptions(
    'health_types',
    DEFAULT_HEALTH_TYPES
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<GlobalHealthFormValues>({
    resolver: zodResolver(globalHealthSchema),
    defaultValues: {
      date: toInputDate(null),
      type: '',
      description: '',
      medication: '',
      withdrawalDays: '',
      cost: '',
    },
  })

  const currentType = watch('type')

  // Pre-fill when editing
  useEffect(() => {
    if (editingRecord) {
      const t = String(editingRecord.type ?? '')
      reset({
        date: toInputDate(editingRecord.date),
        type: t,
        description: String(editingRecord.description ?? ''),
        medication: String(editingRecord.medication ?? ''),
        withdrawalDays: editingRecord.withdrawalDays != null ? String(editingRecord.withdrawalDays) : '',
        cost: editingRecord.cost != null ? String(editingRecord.cost) : '',
      })
      setSheepId(editingRecord.sheepId)
    } else {
      reset({
        date: toInputDate(null),
        type: '',
        description: '',
        medication: '',
        withdrawalDays: '',
        cost: '',
      })
      setSheepId(undefined)
    }
  }, [editingRecord, reset])

  const withdrawalDaysValue = watch('withdrawalDays')

  const onSubmit = async (data: any) => {
    if (!sheepId) {
      setSheepError(true)
      return
    }
    setSheepError(false)
    if (!window.electronAPI) return

    try {
      setSubmitting(true)
      if (isEditing) {
        await window.electronAPI.health.update(editingRecord!.id, {
          date: data.date,
          type: data.type,
          description: data.description,
          medication: data.medication || undefined,
          withdrawalDays: data.withdrawalDays || undefined,
          cost: data.cost || undefined,
        })
      } else {
        await window.electronAPI.health.create({
          sheepId,
          date: data.date,
          type: data.type,
          description: data.description,
          medication: data.medication || undefined,
          withdrawalDays: data.withdrawalDays || undefined,
          cost: data.cost || undefined,
        })
      }
      reset()
      setSheepId(undefined)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to add health record:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj wpis zdrowotny' : 'Dodaj wpis zdrowotny'}</DialogTitle>
          <DialogDescription>
            Wybierz owcę i zarejestruj wizytę, szczepienie lub leczenie.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Sheep selector */}
          <div className="space-y-1.5">
            <Label>Owca *</Label>
            <SheepCombobox
              value={sheepId}
              onChange={(v) => { setSheepId(v); setSheepError(false) }}
              sheep={allSheep}
              placeholder="Wybierz owcę..."
              error={sheepError}
            />
            {sheepError && (
              <p className="text-xs text-red-400">Wybierz owcę, której dotyczy wpis</p>
            )}
          </div>

          {/* Date + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ghDate">Data wizyty *</Label>
              <Input id="ghDate" type="date" {...register('date')} className={errors.date ? 'border-red-500' : ''} />
              {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Typ zabiegu *</Label>
              <OptionSelectWithAdd
                value={currentType || ''}
                onValueChange={(val) => setValue('type', val, { shouldValidate: true })}
                options={healthOptions}
                onAddOption={addHealthOption}
                placeholder="Wybierz lub dodaj typ..."
                error={!!errors.type}
                addPlaceholder="Wpisz nowy typ zabiegu..."
              />
              {errors.type && <p className="text-xs text-red-400">{errors.type.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ghDesc">Opis *</Label>
            <Input id="ghDesc" placeholder="np. Szczepienie przeciwko enterotoksemii" {...register('description')} className={errors.description ? 'border-red-500' : ''} />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          {/* Medication + Withdrawal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ghMed">Lek / preparat</Label>
              <Input id="ghMed" placeholder="np. Covexin 10" {...register('medication')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ghWd">Okres karencji (dni)</Label>
              <Input id="ghWd" type="number" min="0" placeholder="np. 28" {...register('withdrawalDays')} />
            </div>
          </div>

          {withdrawalDaysValue && parseInt(String(withdrawalDaysValue), 10) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Ustawienie karencji zablokuje sprzedaż/ubój przez {withdrawalDaysValue} dni od daty wizyty.
            </div>
          )}

          {/* Cost */}
          <div className="space-y-1.5">
            <Label htmlFor="ghCost">Koszt (PLN)</Label>
            <Input id="ghCost" type="number" step="0.01" min="0" placeholder="np. 150.00" {...register('cost')} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Zapisz zmiany' : 'Dodaj wpis'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
