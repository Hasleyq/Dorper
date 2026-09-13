import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Check } from 'lucide-react'
import { DEFAULT_HEALTH_TYPES } from '@/lib/sheep-utils'
import { useCustomOptions } from '@/lib/custom-options'
import { OptionSelectWithAdd } from '@/components/ui/option-select-with-add'
import type { SheepRecord } from '@/types/electron'

interface MassHealthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSheep: SheepRecord[]
  onSuccess: () => void
}

export function MassHealthDialog({ open, onOpenChange, allSheep, onSuccess }: MassHealthDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const { options: healthOptions, addOption: addHealthOption } = useCustomOptions(
    'health_types',
    DEFAULT_HEALTH_TYPES
  )

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [medication, setMedication] = useState('')
  const [withdrawalDays, setWithdrawalDays] = useState('')
  const [cost, setCost] = useState('')

  const activeSheep = allSheep.filter((s) => s.status === 'ACTIVE')

  const toggleSheep = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === activeSheep.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(activeSheep.map((s) => s.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.size === 0 || !type || !description || !window.electronAPI) return

    try {
      setSubmitting(true)
      await window.electronAPI.health.createMass({
        sheepIds: Array.from(selectedIds),
        date,
        type,
        description,
        medication: medication || undefined,
        withdrawalDays: withdrawalDays ? parseInt(withdrawalDays) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
      })
      // Reset
      setSelectedIds(new Set())
      setType('')
      setDescription('')
      setMedication('')
      setWithdrawalDays('')
      setCost('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Mass create failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grupowy wpis zdrowotny</DialogTitle>
          <DialogDescription>
            Wybierz owce i wypełnij formularz — wpis zostanie dodany do każdej zaznaczonej owcy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Sheep selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Wybierz owce ({selectedIds.size}/{activeSheep.length})</Label>
              <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                {selectedIds.size === activeSheep.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto rounded-lg border border-border p-2 bg-background">
              {activeSheep.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSheep(s.id)}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-all ${
                    selectedIds.has(s.id)
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                    selectedIds.has(s.id) ? 'bg-primary border-primary text-white' : 'border-border'
                  }`}>
                    {selectedIds.has(s.id) && <Check className="h-3 w-3" />}
                  </div>
                  <span className="truncate font-medium">{s.name || s.earTag}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{s.earTag}</span>
                </button>
              ))}
            </div>
            {selectedIds.size === 0 && (
              <p className="text-xs text-red-400">Zaznacz co najmniej jedną owcę</p>
            )}
          </div>

          {/* Health form */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="massDate">Data *</Label>
              <Input id="massDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Typ zabiegu *</Label>
              <OptionSelectWithAdd
                value={type}
                onValueChange={setType}
                options={healthOptions}
                onAddOption={addHealthOption}
                placeholder="Wybierz lub dodaj typ..."
                addPlaceholder="Wpisz nowy typ zabiegu..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="massDesc">Opis *</Label>
            <Input id="massDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis zabiegu..." required />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="massMed">Lek</Label>
              <Input id="massMed" value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="Nazwa leku" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="massWd">Karencja (dni)</Label>
              <Input id="massWd" type="number" min="0" value={withdrawalDays} onChange={(e) => setWithdrawalDays(e.target.value)} placeholder="np. 28" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="massCost">Koszt (PLN)</Label>
              <Input id="massCost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="np. 50" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.size} {selectedIds.size === 1 ? 'owca' : selectedIds.size < 5 ? 'owce' : 'owiec'} zaznaczonych
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
              <Button type="submit" size="sm" disabled={submitting || selectedIds.size === 0}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Dodaj do {selectedIds.size} owiec
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
