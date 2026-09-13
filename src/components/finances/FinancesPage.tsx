import { useState, useEffect, useCallback } from 'react'
import { RowActions } from '@/components/ui/row-actions'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SheepCombobox } from '@/components/sheep/forms/SheepCombobox'
import { formatDate, toInputDate } from '@/lib/sheep-utils'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Download,
} from 'lucide-react'
import { DEFAULT_FINANCE_CATEGORIES } from '@/lib/sheep-utils'
import { useCustomOptions } from '@/lib/custom-options'
import { OptionSelectWithAdd } from '@/components/ui/option-select-with-add'
import type { TransactionData, TransactionSummary, SheepRecord } from '@/types/electron'

// ============================================
// Polish label maps
// ============================================
const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Przychód',
  EXPENSE: 'Wydatek',
}

const CATEGORY_LABELS: Record<string, string> = {
  FEED: 'Pasza',
  VET: 'Weterynarz',
  SALE: 'Sprzedaż',
  EQUIPMENT: 'Sprzęt',
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: v, key: k }))
const FIN_CUSTOM_KEY = '__INNE__'

const CATEGORY_COLORS: Record<string, 'default' | 'secondary' | 'warning' | 'active'> = {
  FEED: 'warning',
  VET: 'default',
  SALE: 'active',
  EQUIPMENT: 'secondary',
}

// ============================================
interface FinancesPageProps {
  onViewSheep?: (id: string) => void
}

export function FinancesPage({ onViewSheep }: FinancesPageProps = {}) {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [allSheep, setAllSheep] = useState<SheepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTxn, setEditingTxn] = useState<TransactionData | null>(null)

  const fetchData = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const [txns, sum, sheep] = await Promise.all([
        window.electronAPI.transactions.getAll(),
        window.electronAPI.transactions.getSummary(),
        window.electronAPI.sheep.getAll(),
      ])
      setTransactions(txns)
      setSummary(sum)
      setAllSheep(sheep)
    } catch (err) {
      console.error('Failed to fetch finances:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter
  const filtered = transactions.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (t.description || '').toLowerCase().includes(q) ||
      (t.sheep?.name || '').toLowerCase().includes(q) ||
      (t.sheep?.earTag || '').toLowerCase().includes(q) ||
      CATEGORY_LABELS[t.category]?.toLowerCase().includes(q)
    )
  })

  const netProfit = summary?.netProfit ?? 0
  const isProfit = netProfit >= 0

  const handleExportCsv = async () => {
    if (!window.electronAPI || filtered.length === 0) return
    const header = 'Data;Typ;Kategoria;Kwota;Opis;Owca'
    const rows = filtered.map((t) =>
      [
        formatDate(t.date),
        TYPE_LABELS[t.type] || t.type,
        CATEGORY_LABELS[t.category] || t.category,
        t.amount.toFixed(2),
        (t.description || '').replace(/;/g, ','),
        t.sheep?.name || t.sheep?.earTag || '',
      ].join(';')
    )
    const csv = [header, ...rows].join('\n')
    await window.electronAPI.dialog.saveCsv(csv, 'finanse_eksport.csv')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanse hodowli</h2>
          <p className="text-sm text-muted-foreground">
            Przychody, wydatki i bilans finansowy hodowli
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Odśwież</span>
          </Button>
          <Button size="sm" onClick={() => { setEditingTxn(null); setShowAdd(true) }}>
            <Plus className="h-4 w-4" />
            Dodaj transakcję
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Eksport CSV</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Przychody</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {(summary?.totalIncome ?? 0).toLocaleString('pl-PL')}
            <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-xs text-muted-foreground">Koszty</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {(summary?.totalExpenses ?? 0).toLocaleString('pl-PL')}
            <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${isProfit ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <p className="text-xs text-muted-foreground">Zysk netto</p>
          <p className={`mt-2 text-2xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{netProfit.toLocaleString('pl-PL')}
            <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj po opisie, kategorii lub owcy..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Transactions Table */}
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
                <TableHead className="text-xs uppercase tracking-wider">Typ</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Kategoria</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-right">Kwota</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Opis</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Powiązana owca</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm">{formatDate(txn.date)}</TableCell>
                  <TableCell>
                    <Badge variant={txn.type === 'INCOME' ? 'active' : 'danger'} className="text-xs">
                      {TYPE_LABELS[txn.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={CATEGORY_COLORS[txn.category] || 'secondary'} className="text-xs">
                      {CATEGORY_LABELS[txn.category] || txn.category}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm font-medium ${txn.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {txn.type === 'INCOME' ? '+' : '-'}{txn.amount.toLocaleString('pl-PL')} PLN
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm">
                    <p className="truncate">{txn.description || '—'}</p>
                  </TableCell>
                  <TableCell>
                    {txn.sheep ? (
                      <div
                        className={onViewSheep && txn.sheep.id ? 'cursor-pointer group' : ''}
                        onClick={() => onViewSheep && txn.sheep?.id && onViewSheep(txn.sheep.id)}
                        title={onViewSheep && txn.sheep.id ? 'Kliknij, aby otworzyć profil owcy' : undefined}
                      >
                        <p className={`text-sm font-medium ${onViewSheep && txn.sheep.id ? 'group-hover:text-primary group-hover:underline' : ''}`}>
                          {txn.sheep.name || txn.sheep.earTag}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">{txn.sheep.earTag}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => {
                        setEditingTxn(txn)
                        setShowAdd(true)
                      }}
                      onDelete={async () => {
                        if (!window.electronAPI) return
                        await window.electronAPI.transactions.delete(txn.id!)
                        fetchData()
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Brak wyników' : 'Brak transakcji w systemie'}
          </p>
        </div>
      )}

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        allSheep={allSheep}
        onSuccess={fetchData}
        editingTxn={editingTxn}
      />
    </div>
  )
}

// ============================================
// Add Transaction Dialog
// ============================================
const transactionSchema = z.object({
  date: z.string().min(1, 'Data jest wymagana'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Kategoria jest wymagana'),
  amount: z
    .string()
    .min(1, 'Kwota jest wymagana')
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive('Kwota musi być dodatnia')),
  description: z.string().optional(),
})

type TransactionFormValues = z.input<typeof transactionSchema>

function AddTransactionDialog({
  open,
  onOpenChange,
  allSheep,
  onSuccess,
  editingTxn,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSheep: SheepRecord[]
  onSuccess: () => void
  editingTxn?: TransactionData | null
}) {
  const [submitting, setSubmitting] = useState(false)
  const [sheepId, setSheepId] = useState<string | undefined>(undefined)
  const isEditing = !!editingTxn?.id
  const { options: categoryOptions, addOption: addCategoryOption } = useCustomOptions(
    'finance_categories',
    DEFAULT_FINANCE_CATEGORIES
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE',
      category: '',
      amount: '',
      description: '',
    },
  })

  const currentCategory = watch('category')

  // Pre-fill when editing
  useEffect(() => {
    if (editingTxn) {
      const cat = String(editingTxn.category ?? '')
      reset({
        date: toInputDate(editingTxn.date),
        type: (editingTxn.type === 'INCOME' || editingTxn.type === 'EXPENSE') ? editingTxn.type : 'EXPENSE',
        category: cat,
        amount: editingTxn.amount != null ? String(editingTxn.amount) : '',
        description: String(editingTxn.description ?? ''),
      })
      setSheepId(editingTxn.sheepId || undefined)
    } else {
      reset({
        date: toInputDate(null),
        type: 'EXPENSE',
        category: '',
        amount: '',
        description: '',
      })
      setSheepId(undefined)
    }
  }, [editingTxn, reset])

  const onSubmit = async (data: any) => {
    if (!window.electronAPI) return
    try {
      setSubmitting(true)
      if (isEditing) {
        await window.electronAPI.transactions.update(editingTxn!.id!, {
          date: data.date,
          type: data.type,
          category: data.category,
          amount: data.amount,
          description: data.description || undefined,
          sheepId: sheepId || undefined,
        })
      } else {
        await window.electronAPI.transactions.create({
          date: data.date,
          type: data.type,
          category: data.category,
          amount: data.amount,
          description: data.description || undefined,
          sheepId: sheepId || undefined,
        })
      }
      reset()
      setSheepId(undefined)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to create transaction:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj transakcję' : 'Dodaj transakcję'}</DialogTitle>
          <DialogDescription>Zarejestruj nowy przychód lub wydatek hodowli.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Type + Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Typ *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Wydatek</SelectItem>
                      <SelectItem value="INCOME">Przychód</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kategoria *</Label>
              <OptionSelectWithAdd
                value={currentCategory || ''}
                onValueChange={(val) => setValue('category', val, { shouldValidate: true })}
                options={categoryOptions}
                onAddOption={addCategoryOption}
                placeholder="Wybierz lub dodaj kategorię..."
                error={!!errors.category}
                addPlaceholder="Wpisz nową kategorię..."
              />
              {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
            </div>
          </div>

          {/* Amount + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="txnAmount">Kwota (PLN) *</Label>
              <Input
                id="txnAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="np. 500.00"
                {...register('amount')}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txnDate">Data *</Label>
              <Input
                id="txnDate"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="txnDesc">Opis</Label>
            <Input id="txnDesc" placeholder="np. Zakup paszy dla stada" {...register('description')} />
          </div>

          {/* Optional sheep */}
          <div className="space-y-1.5">
            <Label>Powiązana owca (opcjonalnie)</Label>
            <SheepCombobox
              value={sheepId}
              onChange={setSheepId}
              sheep={allSheep}
              placeholder="Wybierz owcę..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Zapisz zmiany' : 'Dodaj transakcję'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
