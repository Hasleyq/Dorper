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
import { InbreedingChecker } from '@/components/sheep/InbreedingChecker'
import { toInputDate } from '@/lib/sheep-utils'
import { formatDate } from '@/lib/sheep-utils'
import {
  Plus,
  RefreshCw,
  Loader2,
  Baby,
} from 'lucide-react'
import type { SheepRecord, LitterData } from '@/types/electron'

// ============================================
// Breeding Page — wraps Inbreeding Checker + Lambing Log
// ============================================
export function BreedingPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Inbreeding Checker */}
      <InbreedingChecker />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Lambing Log */}
      <LambingLog />
    </div>
  )
}

// ============================================
// Lambing Log (Dziennik Wykotów)
// ============================================
function LambingLog() {
  const [litters, setLitters] = useState<LitterData[]>([])
  const [allSheep, setAllSheep] = useState<SheepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingLitter, setEditingLitter] = useState<LitterData | null>(null)

  const fetchData = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const [littersData, sheepData] = await Promise.all([
        window.electronAPI.litters.getAll(),
        window.electronAPI.sheep.getAll(),
      ])
      setLitters(littersData)
      setAllSheep(sheepData)
    } catch (err) {
      console.error('Failed to fetch litters:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Stats
  const totalBorn = litters.reduce((sum, l) => sum + (l.bornCount || 0), 0)
  const totalWeaned = litters.reduce((sum, l) => sum + (l.weanedCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Dziennik wykotów</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Rejestr urodzeń i odchowu jagniąt
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Dodaj wykot
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Łączna liczba wykotów</p>
          <p className="mt-1 text-2xl font-bold">{litters.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Urodzone jagnięta</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{totalBorn}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Odchowane jagnięta</p>
          <p className="mt-1 text-2xl font-bold">
            {totalWeaned}
            {totalBorn > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({((totalWeaned / totalBorn) * 100).toFixed(0)}%)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie danych...</span>
          </div>
        </div>
      ) : litters.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider">Data wykotu</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Owca ♀</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Ojciec ♂</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-center">Urodzone</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-center">Odchowane</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-center">Przeżywalność</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {litters.map((litter) => {
                const survivalRate =
                  litter.bornCount > 0 && litter.weanedCount
                    ? ((litter.weanedCount / litter.bornCount) * 100).toFixed(0)
                    : null

                return (
                  <TableRow key={litter.id}>
                    <TableCell className="font-mono text-sm">
                      {litter.lambingDate ? formatDate(litter.lambingDate) : '—'}
                    </TableCell>
                    <TableCell>
                      {litter.mother ? (
                        <div>
                          <p className="text-sm font-medium">{litter.mother.name || litter.mother.earTag}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{litter.mother.earTag}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {litter.father ? (
                        <div>
                          <p className="text-sm font-medium">{litter.father.name || litter.father.earTag}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{litter.father.earTag}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="text-xs font-mono">
                        {litter.bornCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {litter.weanedCount != null ? (
                        <Badge variant="active" className="text-xs font-mono">
                          {litter.weanedCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {survivalRate ? (
                        <span className={`text-sm font-medium ${parseInt(survivalRate) >= 80 ? 'text-emerald-400' : parseInt(survivalRate) >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {survivalRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        onEdit={() => {
                          setEditingLitter(litter)
                          setShowAdd(true)
                        }}
                        onDelete={async () => {
                          if (!window.electronAPI) return
                          await window.electronAPI.litters.delete(litter.id!)
                          fetchData()
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
          <p className="text-sm text-muted-foreground">Brak wpisów w dzienniku wykotów</p>
        </div>
      )}

      {/* Add Litter Dialog */}
      <AddLitterDialog
        open={showAdd}
        onOpenChange={(v) => { setShowAdd(v); if (!v) setEditingLitter(null) }}
        allSheep={allSheep}
        onSuccess={fetchData}
        editingLitter={editingLitter}
      />
    </div>
  )
}

// ============================================
// Add Litter Dialog
// ============================================
const litterSchema = z.object({
  lambingDate: z.string().min(1, 'Data wykotu jest wymagana'),
  bornCount: z
    .string()
    .min(1, 'Liczba jest wymagana')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1, 'Musi być co najmniej 1')),
  weanedCount: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .pipe(z.number().int().min(0).optional()),
})

type LitterFormValues = z.input<typeof litterSchema>

function AddLitterDialog({
  open,
  onOpenChange,
  allSheep,
  onSuccess,
  editingLitter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSheep: SheepRecord[]
  onSuccess: () => void
  editingLitter?: LitterData | null
}) {
  const [submitting, setSubmitting] = useState(false)
  const [motherId, setMotherId] = useState<string | undefined>(undefined)
  const [fatherId, setFatherId] = useState<string | undefined>(undefined)
  const [motherError, setMotherError] = useState(false)
  const isEditing = !!editingLitter?.id

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LitterFormValues>({
    resolver: zodResolver(litterSchema),
    defaultValues: {
      lambingDate: new Date().toISOString().split('T')[0],
      bornCount: '',
      weanedCount: '',
    },
  })

  // Pre-fill when editing
  useEffect(() => {
    if (editingLitter) {
      reset({
        lambingDate: toInputDate(editingLitter.lambingDate),
        bornCount: editingLitter.bornCount != null ? String(editingLitter.bornCount) : '',
        weanedCount: editingLitter.weanedCount != null ? String(editingLitter.weanedCount) : '',
      })
      setMotherId(editingLitter.motherId)
      setFatherId(editingLitter.fatherId || undefined)
    } else {
      reset({ lambingDate: toInputDate(null), bornCount: '', weanedCount: '' })
      setMotherId(undefined)
      setFatherId(undefined)
    }
  }, [editingLitter, reset])

  const onSubmit = async (data: any) => {
    if (!motherId) {
      setMotherError(true)
      return
    }
    setMotherError(false)
    if (!window.electronAPI) return

    try {
      setSubmitting(true)
      if (isEditing) {
        await window.electronAPI.litters.update(editingLitter!.id!, {
          lambingDate: data.lambingDate,
          bornCount: data.bornCount,
          weanedCount: data.weanedCount || undefined,
          fatherId: fatherId || undefined,
        })
      } else {
        await window.electronAPI.litters.create({
          lambingDate: data.lambingDate,
          bornCount: data.bornCount,
          weanedCount: data.weanedCount || undefined,
          motherId,
          fatherId: fatherId || undefined,
        })
      }
      reset()
      setMotherId(undefined)
      setFatherId(undefined)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to create litter:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Dodaj wykot</DialogTitle>
          <DialogDescription>
            Zarejestruj nowe narodziny jagniąt w stadzie.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Mother selector (required) */}
          <div className="space-y-1.5">
            <Label>Owca ♀ *</Label>
            <SheepCombobox
              value={motherId}
              onChange={(v) => { setMotherId(v); setMotherError(false) }}
              sheep={allSheep}
              filterSex="FEMALE"
              placeholder="Wybierz owcę..."
              error={motherError}
            />
            {motherError && (
              <p className="text-xs text-red-400">Owca jest wymagana</p>
            )}
          </div>

          {/* Father selector (optional) */}
          <div className="space-y-1.5">
            <Label>Ojciec ♂ (opcjonalnie)</Label>
            <SheepCombobox
              value={fatherId}
              onChange={setFatherId}
              sheep={allSheep}
              filterSex="MALE"
              placeholder="Wybierz tryka..."
            />
          </div>

          {/* Date + Born count */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lambDate">Data wykotu *</Label>
              <Input
                id="lambDate"
                type="date"
                {...register('lambingDate')}
                className={errors.lambingDate ? 'border-red-500' : ''}
              />
              {errors.lambingDate && (
                <p className="text-xs text-red-400">{errors.lambingDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bornCount">Liczba urodzonych *</Label>
              <Input
                id="bornCount"
                type="number"
                min="1"
                placeholder="np. 2"
                {...register('bornCount')}
                className={errors.bornCount ? 'border-red-500' : ''}
              />
              {errors.bornCount && (
                <p className="text-xs text-red-400">{errors.bornCount.message}</p>
              )}
            </div>
          </div>

          {/* Weaned count */}
          <div className="space-y-1.5">
            <Label htmlFor="weanedCount">Liczba odchowanych (opcjonalnie)</Label>
            <Input
              id="weanedCount"
              type="number"
              min="0"
              placeholder="Uzupełnij po odsadzeniu"
              {...register('weanedCount')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Dodaj wykot
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
