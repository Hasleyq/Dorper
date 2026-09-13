import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RowActions } from '@/components/ui/row-actions'
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Baby,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { CalendarEventData } from '@/types/electron'

// ============================================
// Day names (Mon-Sun, Polish)
// ============================================
const DAY_NAMES = ['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie']

// ============================================
// Color configs
// ============================================
const EVENT_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  WITHDRAWAL: { dot: 'bg-red-500', text: 'text-red-400', label: 'Karencja' },
  LAMBING: { dot: 'bg-emerald-500', text: 'text-emerald-400', label: 'Wykot' },
  REMINDER: { dot: 'bg-primary', text: 'text-primary', label: 'Przypomnienie' },
}

// ============================================
interface CalendarPageProps {
  onViewSheep?: (id: string) => void
}

export function CalendarPage({ onViewSheep }: CalendarPageProps = {}) {
  const [events, setEvents] = useState<CalendarEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const fetchEvents = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const data = await window.electronAPI.calendar.getEvents()
      setEvents(data)
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  // Build grid days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  // Monday=0 ... Sunday=6 (ISO fix)
  let startOffset = (firstDayOfMonth.getDay() + 6) % 7 // convert Sun=0 to Mon=0
  const totalDays = lastDayOfMonth.getDate()
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7

  // Build events-by-date lookup
  const eventsByDate: Record<string, CalendarEventData[]> = {}
  events.forEach((e) => {
    const key = new Date(e.date).toISOString().split('T')[0]
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(e)
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1))
    setSelectedDay(null)
  }

  // Stats
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.date) >= now).length
  const withdrawals = events.filter((e) => e.type === 'WITHDRAWAL' && new Date(e.date) >= now).length
  const lambings = events.filter((e) => e.type === 'LAMBING' && new Date(e.date) >= now).length

  // Selected day events
  const selectedDayEvents = selectedDay ? (eventsByDate[selectedDay] || []) : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Kalendarz hodowcy</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Terminy karencji, prognozowane wykoty i przypomnienia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Dodaj przypomnienie
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Nadchodzące zdarzenia</p>
          <p className="mt-1 text-2xl font-bold">{upcoming}</p>
        </div>
        <div className={`rounded-xl border p-4 ${withdrawals > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            <p className="text-xs text-muted-foreground">Aktywne karencje</p>
          </div>
          <p className={`mt-1 text-2xl font-bold ${withdrawals > 0 ? 'text-red-400' : ''}`}>{withdrawals}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-1.5">
            <Baby className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Oczekiwane wykoty</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{lambings}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground">Przypomnienia</p>
          </div>
          <p className="mt-1 text-2xl font-bold">
            {events.filter((e) => e.type === 'REMINDER').length}
          </p>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Poprzedni
        </Button>
        <h3 className="text-sm font-semibold capitalize">{monthName}</h3>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
          Następny
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie kalendarza...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          {/* Calendar Grid */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAY_NAMES.map((d) => (
                <div key={d} className="px-1 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }, (_, i) => {
                const dayNum = i - startOffset + 1
                const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays
                const dateStr = isCurrentMonth
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                  : ''
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDay
                const dayEvents = isCurrentMonth ? (eventsByDate[dateStr] || []) : []
                const hasEvents = dayEvents.length > 0

                return (
                  <button
                    key={i}
                    onClick={() => isCurrentMonth && setSelectedDay(isSelected ? null : dateStr)}
                    disabled={!isCurrentMonth}
                    className={`
                      relative flex flex-col items-center min-h-[72px] border-b border-r border-border/50 p-1 transition-all
                      ${!isCurrentMonth ? 'bg-muted/10 cursor-default' : 'hover:bg-secondary/50 cursor-pointer'}
                      ${isToday ? 'bg-primary/10' : ''}
                      ${isSelected ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''}
                    `}
                  >
                    {isCurrentMonth && (
                      <>
                        <span className={`text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                          {dayNum}
                        </span>
                        {/* Event dots */}
                        {hasEvents && (
                          <div className="mt-auto flex flex-col gap-0.5 w-full px-0.5">
                            {dayEvents.slice(0, 3).map((ev, idx) => {
                              const style = EVENT_STYLES[ev.type] || EVENT_STYLES.REMINDER
                              return (
                                <div key={idx} className={`h-1.5 rounded-full ${style.dot} opacity-80`} title={ev.title} />
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[9px] text-muted-foreground text-center">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Day Detail Sidebar */}
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-4">
              {selectedDay ? (
                <>
                  <h4 className="text-sm font-semibold mb-3">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pl-PL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayEvents.map((ev) => {
                        const style = EVENT_STYLES[ev.type] || EVENT_STYLES.REMINDER
                        return (
                          <div
                            key={ev.id}
                            className="flex items-start gap-2 rounded-lg border border-border p-2.5"
                          >
                            <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ev.title}</p>
                              {ev.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{ev.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-[9px]">{style.label}</Badge>
                                {ev.sheepId && onViewSheep && (
                                  <button
                                    type="button"
                                    onClick={() => onViewSheep(ev.sheepId!)}
                                    className="text-[10px] text-primary hover:underline font-medium"
                                  >
                                    Profil owcy →
                                  </button>
                                )}
                              </div>
                            </div>
                            {ev.type === 'REMINDER' && !ev.auto && (
                              <RowActions
                                onDelete={async () => {
                                  if (!window.electronAPI) return
                                  await window.electronAPI.calendar.delete(ev.id!)
                                  fetchEvents()
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Brak zdarzeń tego dnia</p>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Kliknij na dzień, aby zobaczyć szczegóły
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legenda</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>Koniec karencji</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Estymowany wykot</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span>Przypomnienie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Dialog */}
      <AddReminderDialog open={showAdd} onOpenChange={setShowAdd} onSuccess={fetchEvents} />
    </div>
  )
}

// ============================================
// Add Reminder Dialog
// ============================================
function AddReminderDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date || !window.electronAPI) return

    try {
      setSubmitting(true)
      await window.electronAPI.calendar.create({
        date,
        title,
        description: description || undefined,
        color: 'blue',
        type: 'REMINDER',
      })
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to create reminder:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Dodaj przypomnienie</DialogTitle>
          <DialogDescription>
            Dodaj zadanie lub termin do kalendarza hodowcy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reminderTitle">Tytuł *</Label>
            <Input
              id="reminderTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Kupić paszę, Wizyta weterynarza..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminderDate">Data *</Label>
            <Input
              id="reminderDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminderDesc">Opis (opcjonalnie)</Label>
            <Input
              id="reminderDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dodatkowe szczegóły..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" size="sm" disabled={submitting || !title}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Dodaj
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
