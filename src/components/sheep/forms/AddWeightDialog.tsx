import { useState, useEffect } from 'react'
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
import { WEIGHT_TYPE_LABELS, toInputDate } from '@/lib/sheep-utils'
import { Loader2 } from 'lucide-react'
import type { WeightRecordData } from '@/types/electron'

// ============================================
// Validation schema
// ============================================
const weightSchema = z.object({
  weight: z
    .string()
    .min(1, 'Waga jest wymagana')
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive('Waga musi być dodatnia')),
  date: z.string().min(1, 'Data jest wymagana'),
  type: z.enum(['BIRTH', 'WEANING', 'ADULT', 'CUSTOM']),
})

type WeightFormValues = z.input<typeof weightSchema>

interface AddWeightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sheepId: string
  onSuccess: () => void
  editingRecord?: WeightRecordData | null
}

export function AddWeightDialog({
  open,
  onOpenChange,
  sheepId,
  onSuccess,
  editingRecord,
}: AddWeightDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const isEditing = !!editingRecord?.id

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<WeightFormValues>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: '',
      date: toInputDate(null),
      type: 'CUSTOM',
    },
  })

  // Pre-fill when editing — safe conversions
  useEffect(() => {
    if (editingRecord) {
      reset({
        weight: editingRecord.weight != null ? String(editingRecord.weight) : '',
        date: toInputDate(editingRecord.date),
        type: (['BIRTH', 'WEANING', 'ADULT', 'CUSTOM'].includes(editingRecord.type ?? '') 
          ? editingRecord.type as 'BIRTH' | 'WEANING' | 'ADULT' | 'CUSTOM' 
          : 'CUSTOM'),
      })
    } else {
      reset({
        weight: '',
        date: toInputDate(null),
        type: 'CUSTOM',
      })
    }
  }, [editingRecord, reset])

  const onSubmit = async (data: any) => {
    if (!window.electronAPI) return

    try {
      setSubmitting(true)

      if (isEditing) {
        await window.electronAPI.weights.update(editingRecord!.id!, {
          weight: data.weight,
          date: data.date,
          type: data.type,
        })
      } else {
        await window.electronAPI.weights.create({
          sheepId,
          weight: data.weight,
          date: data.date,
          type: data.type,
        })
      }

      reset()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to save weight:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj pomiar wagi' : 'Dodaj pomiar wagi'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Zmień dane istniejącego pomiaru.' : 'Wprowadź nowy wpis wagowy dla tej sztuki.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Weight */}
          <div className="space-y-1.5">
            <Label htmlFor="weight">Waga (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="np. 45.0"
              {...register('weight')}
              className={errors.weight ? 'border-red-500' : ''}
            />
            {errors.weight && (
              <p className="text-xs text-red-400">{errors.weight.message}</p>
            )}
          </div>

          {/* Date + Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="weightDate">Data pomiaru *</Label>
              <Input
                id="weightDate"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-xs text-red-400">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Typ pomiaru</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WEIGHT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Zapisz zmiany' : 'Dodaj pomiar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
