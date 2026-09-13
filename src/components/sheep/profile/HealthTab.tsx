import { useState } from 'react'
import { RowActions } from '@/components/ui/row-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, checkWithdrawal, HEALTH_TYPE_LABELS } from '@/lib/sheep-utils'
import { addDays } from 'date-fns'
import { ShieldCheck, ShieldAlert, Syringe, Bug, Stethoscope, Scissors, Plus } from 'lucide-react'
import { AddHealthDialog } from '@/components/sheep/forms/AddHealthDialog'
import type { SheepDetail } from '@/types/electron'

interface HealthTabProps {
  sheep: SheepDetail
  onRefresh?: () => void
}

// ============================================
// Health type badge styling
// ============================================
const HEALTH_TYPE_STYLES: Record<
  string,
  { variant: 'default' | 'secondary' | 'warning' | 'active'; icon: React.ElementType }
> = {
  VACCINE: { variant: 'default', icon: Syringe },
  DEWORMING: { variant: 'warning', icon: Bug },
  VET_VISIT: { variant: 'active', icon: Stethoscope },
  HOOF: { variant: 'secondary', icon: Scissors },
}

export function HealthTab({ sheep, onRefresh }: HealthTabProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingHealth, setEditingHealth] = useState<any>(null)
  const healthRecords = sheep.healthRecords || []
  const withdrawal = checkWithdrawal(healthRecords)

  // Compute total vet cost
  const totalCost = healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header + Add button */}
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Dodaj wpis
        </Button>
      </div>
      {/* Withdrawal Alert */}
      {withdrawal.isActive && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-700">Aktywna karencja lekowa</h3>
              <p className="text-xs text-red-600">
                {withdrawal.medication && <span className="font-medium">{withdrawal.medication}</span>}
                {withdrawal.medication && ' · '}
                Do {formatDate(withdrawal.endDate!)} · Pozostało {withdrawal.daysRemaining} dni
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-red-500">
            Uwaga: sprzedaż i ubój tej sztuki są niewskazane do czasu zakończenia okresu karencji.
            Dotyczy mięsa i produktów pochodzenia zwierzęcego.
          </p>
        </div>
      )}

      {/* No active withdrawal — clean status */}
      {!withdrawal.isActive && healthRecords.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-700">Brak aktywnej karencji</h3>
              <p className="text-xs text-emerald-600">Sztuka może być sprzedana lub przeznaczona do uboju.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Łączna liczba wpisów</p>
          <p className="mt-1 text-2xl font-bold">{healthRecords.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Koszty leczenia</p>
          <p className="mt-1 text-2xl font-bold">
            {totalCost > 0 ? `${totalCost.toFixed(0)}` : '—'}
            {totalCost > 0 && <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status karencji</p>
          <p className="mt-1">
            {withdrawal.isActive ? (
              <Badge variant="danger">⚠ Aktywna ({withdrawal.daysRemaining}d)</Badge>
            ) : (
              <Badge variant="active">✓ Czysta</Badge>
            )}
          </p>
        </div>
      </div>

      {/* Health Records Table */}
      {healthRecords.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold">Historia zdrowia</h3>
          </div>
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Typ</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Opis</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Lek</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">Koszt</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-center">Karencja</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthRecords.map((record) => {
                  const style = HEALTH_TYPE_STYLES[record.type] || HEALTH_TYPE_STYLES.VET_VISIT
                  const Icon = style.icon
                  const hasWithdrawal = record.withdrawalDays && record.withdrawalDays > 0
                  const withdrawalEnd = hasWithdrawal
                    ? addDays(new Date(record.date), record.withdrawalDays!)
                    : null
                  const isStillActive = withdrawalEnd ? withdrawalEnd > new Date() : false

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <Badge variant={style.variant} className="text-xs">
                            {HEALTH_TYPE_LABELS[record.type] || record.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] text-sm">
                        <p className="truncate">{record.description}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.medication || (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {record.cost ? `${record.cost.toFixed(0)} PLN` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasWithdrawal ? (
                          isStillActive ? (
                            <Badge variant="danger" className="text-[10px]">
                              🔒 do {formatDate(withdrawalEnd!)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              ✓ zakończona
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          onEdit={() => {
                            setEditingHealth(record)
                            setShowAdd(true)
                          }}
                          onDelete={async () => {
                            if (!window.electronAPI) return
                            await window.electronAPI.health.delete(record.id!)
                            onRefresh?.()
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Brak wpisów zdrowotnych</p>
        </div>
      )}
      {/* Add Health Dialog */}
      <AddHealthDialog
        open={showAdd}
        onOpenChange={(v) => { setShowAdd(v); if (!v) setEditingHealth(null) }}
        sheepId={sheep.id}
        onSuccess={() => onRefresh?.()}
        editingRecord={editingHealth}
      />
    </div>
  )
}
