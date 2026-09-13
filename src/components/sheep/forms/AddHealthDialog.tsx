import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toInputDate } from '@/lib/sheep-utils'
import type { HealthRecordData } from '@/types/electron'

// ============================================
// Predefined types
// ============================================
const TYPE_OPTIONS = [
  'Szczepienie',
  'Odrobaczanie',
  'Wizyta wet.',
  'Korekcja racic',
  'Pobranie krwi',
  'Kąpiel',
  'Strzyżenie',
  'Antybiotyk',
]

const CUSTOM_KEY = '__INNE__'

// ============================================
// Validation schema
// ============================================
const healthSchema = z.object({
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

type HealthFormValues = z.input<typeof healthSchema>

interface AddHealthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sheepId: string
  onSuccess: () => void
  editingRecord?: HealthRecordData | null
}

export function AddHealthDialog({
  open,
  onOpenChange,
  sheepId,
  onSuccess,
  editingRecord,
}: AddHealthDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [typeSelect, setTypeSelect] = useState<string>('')
  const [customType, setCustomType] = useState<string>('')
  const isEditing = !!editingRecord?.id
  const showCustomInput = typeSelect === CUSTOM_KEY

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      date: toInputDate(null),
      type: '',
      description: '',
      medication: '',
      withdrawalDays: '',
      cost: '',
    },
  })

  // Sync Select → form value
  useEffect(() => {
    if (typeSelect === CUSTOM_KEY) {
      setValue('type', customType)
    } else {
      setValue('type', typeSelect)
    }
  }, [typeSelect, customType, setValue])

  // Pre-fill when editing
  useEffect(() => {
    if (editingRecord) {
      const t = String(editingRecord.type ?? '')
      if (TYPE_OPTIONS.includes(t)) {
        setTypeSelect(t)
        setCustomType('')
      } else {
        setTypeSelect(CUSTOM_KEY)
        setCustomType(t)
      }
      reset({
        date: toInputDate(editingRecord.date),
        type: t,
        description: String(editingRecord.description ?? ''),
        medication: String(editingRecord.medication ?? ''),
        withdrawalDays: editingRecord.withdrawalDays != null ? String(editingRecord.withdrawalDays) : '',
        cost: editingRecord.cost != null ? String(editingRecord.cost) : '',
      })
    } else {
      setTypeSelect('')
      setCustomType('')
      reset({
        date: toInputDate(null),
        type: '',
        description: '',
        medication: '',
        withdrawalDays: '',
        cost: '',
      })
    }
  }, [editingRecord, reset])

  const withdrawalDaysValue = watch('withdrawalDays')

  const onSubmit = async (data: any) => {
    if (!window.electronAPI) return
    try {
      setSubmitting(true)
      if (isEditing) {
        await window.electronAPI.health.update(editingRecord!.id!, {
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
      setTypeSelect('')
      setCustomType('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to save health record:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj wpis zdrowotny' : 'Dodaj wpis zdrowotny'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Zmień dane istniejącego wpisu zdrowotnego.'
              : 'Zarejestruj wizytę weterynaryjną, szczepienie lub leczenie.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Date + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="healthDate">Data wizyty *</Label>
              <Input
                id="healthDate"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Typ zabiegu *</Label>
              <Select value={typeSelect} onValueChange={setTypeSelect}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Wybierz typ..." />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_KEY}>Inne...</SelectItem>
                </SelectContent>
              </Select>
              {showCustomInput && (
                <Input
                  placeholder="Wpisz własny typ zabiegu..."
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="mt-1.5"
                  autoFocus
                />
              )}
              {errors.type && <p className="text-xs text-red-400">{errors.type.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Opis *</Label>
            <Input
              id="description"
              placeholder="np. Szczepienie przeciwko enterotoksemii"
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          {/* Medication + Withdrawal */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="medication">Lek / preparat</Label>
              <Input id="medication" placeholder="np. Covexin 10" {...register('medication')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="withdrawalDays">Okres karencji (dni)</Label>
              <Input
                id="withdrawalDays"
                type="number"
                min="0"
                placeholder="np. 28"
                {...register('withdrawalDays')}
                className={errors.withdrawalDays ? 'border-red-500' : ''}
              />
              {errors.withdrawalDays && <p className="text-xs text-red-400">{errors.withdrawalDays.message}</p>}
            </div>
          </div>

          {/* Withdrawal warning */}
          {withdrawalDaysValue && parseInt(String(withdrawalDaysValue), 10) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Ustawienie karencji zablokuje sprzedaż/ubój przez {withdrawalDaysValue} dni od daty wizyty.
            </div>
          )}

          {/* Cost */}
          <div className="space-y-1.5">
            <Label htmlFor="cost">Koszt (PLN)</Label>
            <Input id="cost" type="number" step="0.01" min="0" placeholder="np. 150.00" {...register('cost')} />
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
