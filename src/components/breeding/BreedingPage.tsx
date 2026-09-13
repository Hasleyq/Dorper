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
export function BreedingPage({ onViewSheep }: { onViewSheep?: (id: string) => void } = {}) {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* Inbreeding Checker */}
      <InbreedingChecker onViewSheep={onViewSheep} />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Lambing Log */}
      <LambingLog onViewSheep={onViewSheep} />
    </div>
  )
}

// ============================================
// Lambing Log (Dziennik Wykotów)
// ============================================
function LambingLog({ onViewSheep }: { onViewSheep?: (id: string) => void }) {
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
                <TableHead className="text-xs uppercase tracking-wider min-w-[200px]">Jagnięta (Nr kolczyka)</TableHead>
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
                        onViewSheep ? (
                          <button
                            type="button"
                            onClick={() => onViewSheep(litter.mother!.id)}
                            className="text-left group"
                          >
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {litter.mother.name || litter.mother.earTag}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">{litter.mother.earTag}</p>
                          </button>
                        ) : (
                          <div>
                            <p className="text-sm font-medium">{litter.mother.name || litter.mother.earTag}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{litter.mother.earTag}</p>
                          </div>
                        )
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {litter.father ? (
                        onViewSheep ? (
                          <button
                            type="button"
                            onClick={() => onViewSheep(litter.father!.id)}
                            className="text-left group"
                          >
                            <p className="text-sm font-medium group-hover:text-primary transition-colors">
                              {litter.father.name || litter.father.earTag}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">{litter.father.earTag}</p>
                          </button>
                        ) : (
                          <div>
                            <p className="text-sm font-medium">{litter.father.name || litter.father.earTag}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{litter.father.earTag}</p>
                          </div>
                        )
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>

                    {/* Jagnięta (Nr kolczyka) - divided horizontally per lamb if multiple */}
                    <TableCell className="p-2">
                      {litter.lambs && litter.lambs.length > 0 ? (
                        <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 bg-muted/20 overflow-hidden">
                          {litter.lambs.map((lamb, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1 text-xs"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="text-xs font-bold shrink-0"
                                  title={lamb.sex === 'MALE' ? 'Tryczek' : 'Jarka'}
                                >
                                  {lamb.sex === 'MALE' ? (
                                    <span className="text-sky-400">♂</span>
                                  ) : (
                                    <span className="text-pink-400">♀</span>
                                  )}
                                </span>
                                {lamb.id && onViewSheep ? (
                                  <button
                                    type="button"
                                    onClick={() => onViewSheep(lamb.id!)}
                                    className="font-mono text-xs font-semibold text-primary hover:underline hover:text-primary/80 truncate text-left"
                                    title="Otwórz profil owcy"
                                  >
                                    {lamb.earTag}
                                  </button>
                                ) : (
                                  <span className="font-mono text-xs font-medium text-foreground truncate">
                                    {lamb.earTag}
                                  </span>
                                )}
                              </div>
                              {lamb.name && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                  {lamb.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs italic">
                          Brak kolczyków ({litter.bornCount} szt.)
                        </span>
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

interface LambInputItem {
  earTag: string
  sex: 'MALE' | 'FEMALE'
  name: string
}

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
  const [lambs, setLambs] = useState<LambInputItem[]>([])
  const isEditing = !!editingLitter?.id

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LitterFormValues>({
    resolver: zodResolver(litterSchema),
    defaultValues: {
      lambingDate: new Date().toISOString().split('T')[0],
      bornCount: '1',
      weanedCount: '',
    },
  })

  const watchedBornCount = watch('bornCount')

  // Keep lambs array in sync with bornCount
  useEffect(() => {
    const count = parseInt(String(watchedBornCount || '0'), 10)
    if (isNaN(count) || count <= 0) return

    setLambs((prev) => {
      const next: LambInputItem[] = []
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i])
        } else {
          next.push({
            earTag: '',
            sex: i % 2 === 0 ? 'FEMALE' : 'MALE',
            name: '',
          })
        }
      }
      return next
    })
  }, [watchedBornCount])

  // Pre-fill when editing
  useEffect(() => {
    if (editingLitter) {
      reset({
        lambingDate: toInputDate(editingLitter.lambingDate),
        bornCount: editingLitter.bornCount != null ? String(editingLitter.bornCount) : '1',
        weanedCount: editingLitter.weanedCount != null ? String(editingLitter.weanedCount) : '',
      })
      setMotherId(editingLitter.motherId)
      setFatherId(editingLitter.fatherId || undefined)

      if (editingLitter.lambs && editingLitter.lambs.length > 0) {
        setLambs(
          editingLitter.lambs.map((l) => ({
            earTag: l.earTag || '',
            sex: (l.sex as any) || 'FEMALE',
            name: l.name || '',
          }))
        )
      } else if (editingLitter.lambsData) {
        try {
          const parsed = JSON.parse(editingLitter.lambsData)
          setLambs(parsed)
        } catch {
          setLambs([])
        }
      }
    } else {
      reset({ lambingDate: toInputDate(null), bornCount: '1', weanedCount: '' })
      setMotherId(undefined)
      setFatherId(undefined)
      setLambs([{ earTag: '', sex: 'FEMALE', name: '' }])
    }
  }, [editingLitter, reset])

  const updateLamb = (index: number, field: keyof LambInputItem, value: any) => {
    setLambs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const onSubmit = async (data: any) => {
    if (!motherId) {
      setMotherError(true)
      return
    }
    setMotherError(false)
    if (!window.electronAPI) return

    try {
      setSubmitting(true)
      const validLambs = lambs.filter((l) => l.earTag.trim() || l.name.trim())
      const lambsData = validLambs.length > 0 ? JSON.stringify(validLambs) : null

      if (isEditing) {
        await window.electronAPI.litters.update(editingLitter!.id!, {
          lambingDate: data.lambingDate,
          bornCount: data.bornCount,
          weanedCount: data.weanedCount || undefined,
          fatherId: fatherId || undefined,
          lambsData,
        })
      } else {
        await window.electronAPI.litters.create({
          lambingDate: data.lambingDate,
          bornCount: data.bornCount,
          weanedCount: data.weanedCount || undefined,
          motherId,
          fatherId: fatherId || undefined,
          lambsData,
        })
      }
      reset()
      setMotherId(undefined)
      setFatherId(undefined)
      setLambs([])
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj wykot' : 'Dodaj wykot'}</DialogTitle>
          <DialogDescription>
            Zarejestruj nowe narodziny jagniąt w stadzie oraz przypisz im numery kolczyków.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Mother selector (required) */}
          <div className="space-y-1.5">
            <Label>Owca ♀ (matka) *</Label>
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
                max="5"
                placeholder="np. 2"
                {...register('bornCount')}
                className={errors.bornCount ? 'border-red-500' : ''}
              />
              {errors.bornCount && (
                <p className="text-xs text-red-400">{errors.bornCount.message}</p>
              )}
            </div>
          </div>

          {/* Dynamic Lamb Ear Tags Section */}
          {lambs.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Numery kolczyków urodzonych jagniąt ({lambs.length})
                </Label>
                <span className="text-[11px] text-muted-foreground">Podaj kolczyk i płeć</span>
              </div>

              <div className="space-y-2.5">
                {lambs.map((lamb, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border/80 bg-background/50 p-2.5"
                  >
                    <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                      <div className="flex rounded-md border border-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateLamb(idx, 'sex', 'FEMALE')}
                          className={`px-2 py-0.5 text-xs font-bold transition-colors ${
                            lamb.sex === 'FEMALE'
                              ? 'bg-pink-500 text-white'
                              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                          title="Jarka (owca)"
                        >
                          ♀
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLamb(idx, 'sex', 'MALE')}
                          className={`px-2 py-0.5 text-xs font-bold transition-colors ${
                            lamb.sex === 'MALE'
                              ? 'bg-sky-500 text-white'
                              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                          title="Tryczek"
                        >
                          ♂
                        </button>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-5">
                      <Input
                        value={lamb.earTag}
                        onChange={(e) => updateLamb(idx, 'earTag', e.target.value)}
                        placeholder="Nr kolczyka (np. PL123...)"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-4">
                      <Input
                        value={lamb.name}
                        onChange={(e) => updateLamb(idx, 'name', e.target.value)}
                        placeholder="Nazwa / ID (opcjonalnie)"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEditing ? 'Zapisz zmiany' : 'Dodaj wykot'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
