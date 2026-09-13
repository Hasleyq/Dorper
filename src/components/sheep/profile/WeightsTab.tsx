import { useState } from 'react'
import { RowActions } from '@/components/ui/row-actions'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, calculateADG, WEIGHT_TYPE_LABELS } from '@/lib/sheep-utils'
import { TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { AddWeightDialog } from '@/components/sheep/forms/AddWeightDialog'
import { Button } from '@/components/ui/button'
import type { SheepDetail } from '@/types/electron'

interface WeightsTabProps {
  sheep: SheepDetail
  onRefresh?: () => void
}

// ============================================
// Custom chart tooltip
// ============================================
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
      <p className="font-mono text-xs text-muted-foreground">{data.dateLabel}</p>
      <p className="mt-1 text-lg font-bold">
        {data.weight.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">kg</span>
      </p>
      <Badge variant="secondary" className="mt-1 text-[10px]">
        {data.typeLabel}
      </Badge>
    </div>
  )
}

// ============================================
// Weight type color mapping
// ============================================
const WEIGHT_TYPE_COLORS: Record<string, string> = {
  BIRTH: 'text-pink-400',
  WEANING: 'text-amber-400',
  ADULT: 'text-emerald-400',
  CUSTOM: 'text-blue-400',
}

export function WeightsTab({ sheep, onRefresh }: WeightsTabProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingWeight, setEditingWeight] = useState<any>(null)
  const weights = sheep.weights || []
  const adg = calculateADG(weights)

  // Prepare chart data (sorted by date ascending — handler returns asc)
  const chartData = weights.map((w) => ({
    date: new Date(w.date).getTime(),
    dateLabel: formatDate(w.date),
    weight: w.weight,
    type: w.type,
    typeLabel: WEIGHT_TYPE_LABELS[w.type] || w.type,
  }))

  const birthWeight = weights.find((w) => w.type === 'BIRTH')
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null
  const totalGain =
    birthWeight && latestWeight ? latestWeight.weight - birthWeight.weight : null

  return (
    <div className="space-y-6">
      {/* Header + Add button */}
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Dodaj pomiar
        </Button>
      </div>
      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Aktualna waga</p>
          <p className="mt-1 text-2xl font-bold">
            {latestWeight ? `${latestWeight.weight.toFixed(1)}` : '—'}
            {latestWeight && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Waga urodzeniowa</p>
          <p className="mt-1 text-2xl font-bold">
            {birthWeight ? `${birthWeight.weight.toFixed(1)}` : '—'}
            {birthWeight && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Przyrost całkowity</p>
          <p className="mt-1 flex items-center gap-1 text-2xl font-bold">
            {totalGain !== null ? (
              <>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                {totalGain.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">kg</span>
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">ADG (dzienne przyrosty)</p>
          <p className="mt-1 text-2xl font-bold">
            {adg ? `${adg.toFixed(3)}` : '—'}
            {adg && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">kg/dzień</span>
            )}
          </p>
          {adg && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Obliczono: urodzenie → odsadzenie
            </p>
          )}
        </div>
      </div>

      {/* Weight Chart */}
      {chartData.length >= 2 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Krzywa wzrostu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={{ stroke: '#27272a' }}
              />
              <YAxis
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={{ stroke: '#27272a' }}
                unit=" kg"
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{
                  fill: '#d97706',
                  stroke: '#09090b',
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{
                  fill: '#d97706',
                  stroke: '#fafafa',
                  strokeWidth: 2,
                  r: 7,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Wykres wymaga co najmniej 2 pomiarów wagowych.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Obecny wpis: {chartData[0].typeLabel} — {chartData[0].weight.toFixed(1)} kg
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Brak danych wagowych</p>
        </div>
      )}

      {/* Weight History Table */}
      {weights.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold">Historia ważeń</h3>
          </div>
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Typ</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">
                    Waga
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-right">
                    Zmiana
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weights.map((w, idx) => {
                  const prev = idx > 0 ? weights[idx - 1] : null
                  const diff = prev ? w.weight - prev.weight : null

                  return (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(w.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {WEIGHT_TYPE_LABELS[w.type] || w.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {w.weight.toFixed(1)} kg
                      </TableCell>
                      <TableCell className="text-right">
                        {diff !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-sm ${
                              diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-muted-foreground'
                            }`}
                          >
                            {diff > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : diff < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RowActions
                        onEdit={() => {
                          setEditingWeight(w)
                          setShowAdd(true)
                        }}
                        onDelete={async () => {
                          if (!window.electronAPI) return
                          await window.electronAPI.weights.delete(w.id!)
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
      )}
      {/* Add Weight Dialog */}
      <AddWeightDialog
        open={showAdd}
        onOpenChange={(v) => { setShowAdd(v); if (!v) setEditingWeight(null) }}
        sheepId={sheep.id}
        onSuccess={() => onRefresh?.()}
        editingRecord={editingWeight}
      />
    </div>
  )
}
