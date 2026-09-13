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
import { SheepCombobox } from './SheepCombobox'
import { Loader2 } from 'lucide-react'
import type { SheepRecord } from '@/types/electron'

// ============================================
// Validation schema (Polish messages)
// ============================================
const sheepSchema = z.object({
  earTag: z.string().min(1, 'Numer kolczyka jest wymagany'),
  name: z.string().optional(),
  sex: z.enum(['MALE', 'FEMALE'], {
    required_error: 'Płeć jest wymagana',
  }),
  birthDate: z.string().min(1, 'Data urodzenia jest wymagana'),
  lineage: z.string().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'DEAD']).optional(),
})

type SheepFormValues = z.infer<typeof sheepSchema>

interface SheepFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allSheep: SheepRecord[]
  editSheep?: SheepRecord | null
  onSuccess: () => void
}

export function SheepForm({
  open,
  onOpenChange,
  allSheep,
  editSheep,
  onSuccess,
}: SheepFormProps) {
  const isEdit = !!editSheep
  const [submitting, setSubmitting] = useState(false)
  const [motherId, setMotherId] = useState<string | undefined>(undefined)
  const [fatherId, setFatherId] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SheepFormValues>({
    resolver: zodResolver(sheepSchema),
    defaultValues: {
      earTag: '',
      name: '',
      sex: 'FEMALE' as const,
      birthDate: '',
      lineage: '',
      status: 'ACTIVE' as const,
    },
  })

  // Pre-fill form for edit mode
  useEffect(() => {
    if (open && editSheep) {
      reset({
        earTag: editSheep.earTag,
        name: editSheep.name || '',
        sex: editSheep.sex as 'MALE' | 'FEMALE',
        birthDate: editSheep.birthDate
          ? new Date(editSheep.birthDate).toISOString().split('T')[0]
          : '',
        lineage: editSheep.lineage || '',
        status: editSheep.status as 'ACTIVE' | 'SOLD' | 'DEAD',
      })
      setMotherId(editSheep.motherId || undefined)
      setFatherId(editSheep.fatherId || undefined)
    } else if (open) {
      reset({
        earTag: '',
        name: '',
        sex: 'FEMALE',
        birthDate: '',
        lineage: '',
        status: 'ACTIVE',
      })
      setMotherId(undefined)
      setFatherId(undefined)
    }
  }, [open, editSheep, reset])

  const onSubmit = async (data: SheepFormValues) => {
    if (!window.electronAPI) return

    try {
      setSubmitting(true)

      const payload = {
        ...data,
        name: data.name || undefined,
        lineage: data.lineage || undefined,
        motherId: motherId || undefined,
        fatherId: fatherId || undefined,
      }

      if (isEdit && editSheep) {
        await window.electronAPI.sheep.update(editSheep.id, payload)
      } else {
        await window.electronAPI.sheep.create(payload as any)
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to save sheep:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edytuj owcę' : 'Dodaj nową owcę'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Zmień dane wybranej sztuki w rejestrze.'
              : 'Uzupełnij dane nowej sztuki do rejestru hodowlanego.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Row: Ear Tag + Sex */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="earTag">Numer kolczyka *</Label>
              <Input
                id="earTag"
                placeholder="np. PL-DRP-007"
                {...register('earTag')}
                className={errors.earTag ? 'border-red-500' : ''}
              />
              {errors.earTag && (
                <p className="text-xs text-red-400">{errors.earTag.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Płeć *</Label>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger error={!!errors.sex}>
                      <SelectValue placeholder="Wybierz płeć" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">♀ Owca</SelectItem>
                      <SelectItem value="MALE">♂ Tryk</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sex && (
                <p className="text-xs text-red-400">{errors.sex.message}</p>
              )}
            </div>
          </div>

          {/* Row: Name + Birth Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">ID</Label>
              <Input
                id="name"
                placeholder="np. DRP-007"
                {...register('name')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Data urodzenia *</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
                className={errors.birthDate ? 'border-red-500' : ''}
              />
              {errors.birthDate && (
                <p className="text-xs text-red-400">{errors.birthDate.message}</p>
              )}
            </div>
          </div>

          {/* Lineage */}
          <div className="space-y-1.5">
            <Label htmlFor="lineage">Linia hodowlana</Label>
            <Input
              id="lineage"
              placeholder="np. Zeus × Hera — F1"
              {...register('lineage')}
            />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktywna</SelectItem>
                      <SelectItem value="SOLD">Sprzedana</SelectItem>
                      <SelectItem value="DEAD">Padła</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Parent selectors */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ojciec</Label>
              <SheepCombobox
                value={fatherId}
                onChange={setFatherId}
                sheep={allSheep}
                filterSex="MALE"
                placeholder="Wybierz tryka..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Matka</Label>
              <SheepCombobox
                value={motherId}
                onChange={setMotherId}
                sheep={allSheep}
                filterSex="FEMALE"
                placeholder="Wybierz matkę..."
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
              {isEdit ? 'Zapisz zmiany' : 'Dodaj owcę'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
