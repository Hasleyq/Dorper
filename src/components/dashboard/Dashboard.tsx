import { useState, useEffect, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  Layers,
  Mars,
  Venus,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  Box,
} from 'lucide-react'
import {
  checkWithdrawal,
  formatDate,
  formatAge,
  SEX_ICONS,
  SEX_LABELS,
  SEX_VARIANTS,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from '@/lib/sheep-utils'
import type { SheepRecord, TransactionSummary, PenData } from '@/types/electron'

// ============================================
// Category labels & chart colors
// ============================================
const CATEGORY_LABELS: Record<string, string> = {
  FEED: 'Pasza',
  VET: 'Weterynarz',
  SALE: 'Sprzedaż',
  EQUIPMENT: 'Sprzęt',
}

const CATEGORY_COLORS: Record<string, string> = {
  FEED: '#f59e0b',
  VET: '#ef4444',
  SALE: '#22c55e',
  EQUIPMENT: '#3b82f6',
}

const PIE_COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

// ============================================
// Custom tooltip for pie chart
// ============================================
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0]
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
      <p className="font-medium">{data.name}</p>
      <p className="mt-0.5 text-lg font-bold">
        {Math.abs(data.value).toFixed(0)}{' '}
        <span className="text-xs font-normal text-muted-foreground">PLN</span>
      </p>
    </div>
  )
}

// ============================================
// Stat card component
// ============================================
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  alert,
  suffix,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent: string
  alert?: boolean
  suffix?: string
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-3.5 sm:p-5 transition-all duration-300 ${
        alert ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{label}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight">
            {value}
            {suffix && (
              <span className="ml-1 text-xs sm:text-sm font-normal text-muted-foreground">{suffix}</span>
            )}
          </p>
        </div>
        <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Dashboard Component
// ============================================
export function Dashboard() {
  const [sheep, setSheep] = useState<SheepRecord[]>([])
  const [financials, setFinancials] = useState<TransactionSummary | null>(null)
  const [pensData, setPensData] = useState<PenData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      if (!window.electronAPI) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [sheepData, financialData, pens] = await Promise.all([
          window.electronAPI.sheep.getAll(),
          window.electronAPI.transactions.getSummary(),
          window.electronAPI.pens.getAll(),
        ])
        setSheep(sheepData)
        setFinancials(financialData)
        setPensData(pens)
      } catch (err) {
        console.error('Dashboard data fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  // Compute stats
  const stats = useMemo(() => {
    const active = sheep.filter((s) => s.status === 'ACTIVE')
    const rams = active.filter((s) => s.sex === 'MALE')
    const ewes = active.filter((s) => s.sex === 'FEMALE')
    const withWithdrawal = sheep.filter((s) =>
      checkWithdrawal(s.healthRecords || []).isActive
    )
    // Recently added (last 5 by createdAt)
    const recentSheep = [...sheep]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

    return {
      total: active.length,
      rams: rams.length,
      ewes: ewes.length,
      withdrawals: withWithdrawal,
      withdrawalCount: withWithdrawal.length,
      recentSheep,
    }
  }, [sheep])

  // Expense chart data (by category, absolute values)
  const expenseChartData = useMemo(() => {
    if (!financials?.byCategory) return []
    return Object.entries(financials.byCategory)
      .filter(([_, val]) => val < 0) // expenses are negative in byCategory
      .map(([cat, val]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        value: Math.abs(val),
        color: CATEGORY_COLORS[cat] || '#6b7280',
      }))
  }, [financials])

  // Income chart data (for the bar chart)
  const financeBarData = useMemo(() => {
    if (!financials) return []
    return [
      { name: 'Przychody', value: financials.totalIncome, fill: '#22c55e' },
      { name: 'Koszty', value: financials.totalExpenses, fill: '#ef4444' },
    ]
  }, [financials])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Ładowanie panelu...</span>
        </div>
      </div>
    )
  }

  const netProfit = financials?.netProfit ?? 0
  const isProfit = netProfit >= 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header with Logo */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-emerald-950/10 via-card to-background p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src="/logo.png"
                alt="dorper.pl logo"
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ring-2 ring-emerald-600/40 shadow-md transition-transform hover:scale-105 duration-300"
              />
              <span
                className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card"
                title="System aktywny"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Hodowla Owiec Dorper
                </span>
                <span className="text-xs font-mono font-medium text-emerald-600">
                  dorper.pl
                </span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Panel główny
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Kompleksowy przegląd stada, rozrodu, zdrowia oraz finansów
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Baza danych aktywna</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STATS ROW ==================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Stado ogółem"
          value={stats.total}
          icon={Layers}
          accent="bg-primary/15 text-primary"
          suffix="szt."
        />
        <StatCard
          label="Aktywne tryki"
          value={stats.rams}
          icon={Mars}
          accent="bg-sky-500/15 text-sky-400"
          suffix="♂"
        />
        <StatCard
          label="Aktywne owce"
          value={stats.ewes}
          icon={Venus}
          accent="bg-pink-500/15 text-pink-400"
          suffix="♀"
        />
        <StatCard
          label="Aktywne karencje"
          value={stats.withdrawalCount}
          icon={ShieldAlert}
          accent={
            stats.withdrawalCount > 0
              ? 'bg-red-500/15 text-red-400'
              : 'bg-emerald-500/15 text-emerald-400'
          }
          alert={stats.withdrawalCount > 0}
        />
        <StatCard
          label="Boksy / Kojce"
          value={pensData.length}
          icon={Box}
          accent="bg-purple-500/15 text-purple-400"
          suffix={`(${pensData.reduce((s, p) => s + p.sheep.length, 0)} szt.)`}
        />
      </div>

      {/* ==================== MAIN CONTENT ROW ==================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Summary — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Finance Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-muted-foreground">Przychody</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {(financials?.totalIncome ?? 0).toLocaleString('pl-PL', {
                  minimumFractionDigits: 0,
                })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <p className="text-xs text-muted-foreground">Koszty</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-red-400">
                {(financials?.totalExpenses ?? 0).toLocaleString('pl-PL', {
                  minimumFractionDigits: 0,
                })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
              </p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                isProfit
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <p className="text-xs text-muted-foreground">Zysk netto</p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  isProfit ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {isProfit ? '+' : ''}
                {netProfit.toLocaleString('pl-PL', { minimumFractionDigits: 0 })}
                <span className="ml-1 text-sm font-normal text-muted-foreground">PLN</span>
              </p>
            </div>
          </div>

          {/* Income vs Expense Bar Chart */}
          {financials && (financials.totalIncome > 0 || financials.totalExpenses > 0) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Przychody vs Koszty</h3>
              <div style={{ minWidth: 200, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={financeBarData} barGap={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v.toLocaleString('pl-PL')}`}
                  />
                  <Tooltip
                    content={({ active, payload }: any) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-xl">
                          <p className="text-xs text-muted-foreground">{payload[0].payload.name}</p>
                          <p className="mt-0.5 text-lg font-bold">
                            {payload[0].value.toLocaleString('pl-PL')}{' '}
                            <span className="text-xs font-normal text-muted-foreground">PLN</span>
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                    {financeBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expense Breakdown Donut */}
          {expenseChartData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Struktura kosztów</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-[180px] h-[180px] shrink-0">
                <div style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#ffffff"
                      >
                        {expenseChartData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={entry.color || PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                </div>
                <div className="space-y-3 flex-1">
                  {expenseChartData.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              cat.color || PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </div>
                      <span className="font-mono text-sm font-medium">
                        {cat.value.toLocaleString('pl-PL')} PLN
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Withdrawal Alerts */}
          {stats.withdrawalCount > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-700">Aktywne karencje</h3>
              </div>
              <div className="space-y-2">
                {stats.withdrawals.map((s) => {
                  const wd = checkWithdrawal(s.healthRecords || [])
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name || s.earTag}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {s.earTag}
                        </p>
                      </div>
                      <Badge variant="danger" className="text-[10px]">
                        {wd.daysRemaining}d
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recently Added */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Ostatnio dodane</h3>
            </div>
            {stats.recentSheep.length > 0 ? (
              <div className="space-y-2">
                {stats.recentSheep.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs">{SEX_ICONS[s.sex]}</span>
                      <div>
                        <p className="text-sm font-medium">{s.name || s.earTag}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {s.earTag}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={STATUS_VARIANTS[s.status]}
                        className="text-[9px]"
                      >
                        {STATUS_LABELS[s.status]}
                      </Badge>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatAge(s.birthDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Brak danych w rejestrze
              </p>
            )}
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold">Informacje o systemie</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Wersja systemu</span>
                <span className="font-mono">v1.0.0</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Baza danych</span>
                <span className="font-mono">SQLite (lokalna)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Łącznie w rejestrze</span>
                <span className="font-mono">{sheep.length} szt.</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ostatnia aktualizacja</span>
                <span className="font-mono">{formatDate(new Date())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
