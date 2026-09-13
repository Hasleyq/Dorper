import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Box,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
  Mars,
  Venus,
  Pencil,
  Plus,
  Trash2,
  Search,
  LogOut,
  Layers,
  BarChart3,
  Archive,
  RotateCcw,
  Calendar,
  Baby,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { formatDate, toInputDate } from '@/lib/sheep-utils'
import type { PenData } from '@/types/electron'

// ============================================
// Pen card accent colors (top bar stripe)
// ============================================
const PEN_ACCENT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
]

interface PensPageProps {
  onViewSheep?: (id: string) => void
}

// ============================================
// Pens Page — Active & Archived Pens Management
// ============================================
export function PensPage({ onViewSheep }: PensPageProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [pens, setPens] = useState<PenData[]>([])
  const [archivedPens, setArchivedPens] = useState<PenData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs state
  const [moveDialog, setMoveDialog] = useState<{
    sheepId: string
    sheepName: string
    currentPenId: string
  } | null>(null)
  const [selectedPenId, setSelectedPenId] = useState<string>('')
  const [moving, setMoving] = useState(false)

  const [editPen, setEditPen] = useState<PenData | null>(null)
  const [showAddPen, setShowAddPen] = useState(false)
  const [deletePen, setDeletePen] = useState<PenData | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [archiveTargetPen, setArchiveTargetPen] = useState<PenData | null>(null)
  const [restoringPenId, setRestoringPenId] = useState<string | null>(null)

  // Fetch active & archived pens
  const fetchPens = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const [activeData, archivedData] = await Promise.all([
        window.electronAPI.pens.getAll(),
        window.electronAPI.pens.getArchived(),
      ])
      setPens(activeData)
      setArchivedPens(archivedData)
    } catch (err) {
      console.error('Failed to fetch pens:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPens()
  }, [fetchPens])

  // Move sheep between pens
  const handleMove = async () => {
    if (!moveDialog || !selectedPenId || !window.electronAPI) return
    try {
      setMoving(true)
      await window.electronAPI.pens.moveSheep(moveDialog.sheepId, selectedPenId)
      setMoveDialog(null)
      setSelectedPenId('')
      fetchPens()
    } catch (err) {
      console.error('Move failed:', err)
    } finally {
      setMoving(false)
    }
  }

  // Remove sheep from pen (set penId to null)
  const handleRemoveFromPen = async (sheepId: string) => {
    if (!window.electronAPI) return
    try {
      await window.electronAPI.pens.moveSheep(sheepId, null)
      fetchPens()
    } catch (err) {
      console.error('Remove from pen failed:', err)
    }
  }

  // Delete pen (active or archived)
  const handleDeletePen = async () => {
    if (!deletePen || !window.electronAPI) return
    try {
      setDeleting(true)
      await window.electronAPI.pens.delete(deletePen.id)
      setDeletePen(null)
      fetchPens()
    } catch (err) {
      console.error('Delete pen failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Restore pen from archive
  const handleRestorePen = async (id: string) => {
    if (!window.electronAPI) return
    try {
      setRestoringPenId(id)
      await window.electronAPI.pens.restore(id)
      await fetchPens()
    } catch (err) {
      console.error('Failed to restore pen:', err)
    } finally {
      setRestoringPenId(null)
    }
  }

  // Stats
  const totalSheep = pens.reduce((sum, p) => sum + p.sheep.length, 0)
  const avgOccupancy = pens.length > 0 ? (totalSheep / pens.length).toFixed(1) : '0'

  // Filter sheep inside active pens by search query
  const filteredActivePens = pens.map((pen) => {
    if (!searchQuery.trim()) return pen
    const q = searchQuery.toLowerCase()
    const filteredSheep = pen.sheep.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        s.earTag.toLowerCase().includes(q)
    )
    return { ...pen, sheep: filteredSheep }
  })

  // Filter archived pens by search query
  const filteredArchivedPens = archivedPens.filter((pen) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const nameMatch = (pen.name || '').toLowerCase().includes(q)
    const descMatch = (pen.description || '').toLowerCase().includes(q)
    const ramMatch =
      pen.history?.ram &&
      ((pen.history.ram.earTag || '').toLowerCase().includes(q) ||
        (pen.history.ram.name || '').toLowerCase().includes(q))
    const eweMatch =
      pen.history?.ewes &&
      pen.history.ewes.some(
        (e) =>
          (e.earTag || '').toLowerCase().includes(q) ||
          (e.name || '').toLowerCase().includes(q)
      )
    const lambMatch =
      pen.history?.lambs &&
      pen.history.lambs.some(
        (l) =>
          (l.earTag || '').toLowerCase().includes(q) ||
          (l.name || '').toLowerCase().includes(q)
      )
    const notesMatch = (pen.history?.notes || '').toLowerCase().includes(q)
    return nameMatch || descMatch || ramMatch || eweMatch || lambMatch || notesMatch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Box className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Zarządzanie kojcami</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Wizualny podgląd rozmieszczenia stada, kojce rozrodcze oraz historia i archiwum boksów
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPens} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button size="sm" onClick={() => setShowAddPen(true)}>
            <Plus className="h-4 w-4" />
            Dodaj boks
          </Button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setActiveTab('active')}
          >
            <Box className="h-4 w-4" />
            Aktywne kojce
            <Badge
              variant={activeTab === 'active' ? 'secondary' : 'outline'}
              className="ml-1 text-[11px] px-1.5 py-0"
            >
              {pens.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'archived' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setActiveTab('archived')}
          >
            <Archive className="h-4 w-4" />
            Archiwum boksów
            <Badge
              variant={activeTab === 'archived' ? 'secondary' : 'outline'}
              className="ml-1 text-[11px] px-1.5 py-0"
            >
              {archivedPens.length}
            </Badge>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'active'
                ? 'Szukaj owcy po kolczyku lub nazwie...'
                : 'Szukaj w archiwum (tryk, matka, jagnię, notatka)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Stats Row (shown in active tab) */}
      {activeTab === 'active' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{pens.length}</p>
              <p className="text-[11px] text-muted-foreground">Aktywne boksy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {totalSheep}
                <span className="ml-1 text-sm font-normal text-muted-foreground">szt.</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Owiec w boksach</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{avgOccupancy}</p>
              <p className="text-[11px] text-muted-foreground">Średnio na boks</p>
            </div>
          </div>
        </div>
      )}

      {/* Content for ACTIVE PENS */}
      {activeTab === 'active' && (
        <>
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Ładowanie kojców...</span>
              </div>
            </div>
          ) : pens.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
              <Box className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Brak aktywnych boksów</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Dodaj pierwszy boks, aby zorganizować krycie i rozmieszczenie stada.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setShowAddPen(true)}>
                <Plus className="h-4 w-4" />
                Dodaj pierwszy boks
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivePens.map((pen, idx) => {
                // Strict rule: ram (MALE) ALWAYS first!
                const sortedSheep = [...pen.sheep].sort((a, b) => {
                  if (a.sex === 'MALE' && b.sex !== 'MALE') return -1
                  if (a.sex !== 'MALE' && b.sex === 'MALE') return 1
                  return (a.earTag || '').localeCompare(b.earTag || '')
                })

                return (
                  <div
                    key={pen.id}
                    className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/40 flex flex-col justify-between"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                      animation: 'fadeIn 0.3s ease-out both',
                    }}
                  >
                    <div>
                      {/* Colored top stripe */}
                      <div className={`h-1.5 ${PEN_ACCENT_COLORS[idx % PEN_ACCENT_COLORS.length]}`} />

                      {/* Pen header */}
                      <div className="flex items-start justify-between px-5 pt-4 pb-2 border-b border-border/40">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                            <Box className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold leading-tight">{pen.name}</h3>
                            {pen.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{pen.description}</p>
                            )}
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>Od: {formatDate(pen.startDate || pen.createdAt || new Date())}</span>
                            </div>
                          </div>
                        </div>

                        {/* Top action icons */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-80 hover:opacity-100 transition-opacity"
                            title="Edytuj boks"
                            onClick={() => setEditPen(pen)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-80 hover:opacity-100 transition-opacity text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                            title="Zakończ i zarchiwizuj boks"
                            onClick={() => setArchiveTargetPen(pen)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-80 hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            title="Usuń boks"
                            onClick={() => setDeletePen(pen)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Badge variant="secondary" className="text-xs font-bold ml-1">
                            {pen.sheep.length} szt.
                          </Badge>
                        </div>
                      </div>

                      {/* Sheep List */}
                      <div className="px-5 py-4">
                        {sortedSheep.length > 0 ? (
                          <div className="space-y-2">
                            {sortedSheep.map((s) => {
                              const isRam = s.sex === 'MALE'
                              return (
                                <div
                                  key={s.id}
                                  className={`flex items-center gap-2 rounded-xl p-2.5 transition-all ${
                                    isRam
                                      ? 'bg-sky-500/10 border border-sky-500/25 shadow-sm'
                                      : 'bg-secondary/40 hover:bg-secondary/70 border border-transparent'
                                  }`}
                                >
                                  {/* Sex Icon & Badge */}
                                  <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                                      isRam
                                        ? 'bg-sky-500/20 text-sky-400'
                                        : 'bg-pink-500/20 text-pink-400'
                                    }`}
                                  >
                                    {isRam ? (
                                      <Mars className="h-4 w-4" />
                                    ) : (
                                      <Venus className="h-4 w-4" />
                                    )}
                                  </div>

                                  {/* Sheep Information — Clickable to open Sheep Profile */}
                                  <div
                                    className={`flex-1 min-w-0 ${
                                      onViewSheep ? 'cursor-pointer group' : ''
                                    }`}
                                    onClick={() => onViewSheep && onViewSheep(s.id)}
                                    title={onViewSheep ? 'Kliknij, aby otworzyć profil owcy' : undefined}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <p
                                        className={`text-sm font-semibold truncate ${
                                          onViewSheep
                                            ? 'group-hover:text-primary group-hover:underline'
                                            : ''
                                        }`}
                                      >
                                        {s.name || s.earTag}
                                      </p>
                                      {isRam && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-bold px-1.5 py-0 border-sky-500/40 text-sky-400 bg-sky-500/10"
                                        >
                                          TRYK
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="font-mono text-[11px] text-muted-foreground truncate">
                                      {s.earTag}
                                    </p>
                                  </div>

                                  {/* Action: Remove from pen */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-red-400"
                                    title="Usuń z boksu"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveFromPen(s.id)
                                    }}
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                  </Button>

                                  {/* Action: Move to another pen */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 shrink-0"
                                    title="Przenieś do innego boksu"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setMoveDialog({
                                        sheepId: s.id,
                                        sheepName: s.name || s.earTag,
                                        currentPenId: pen.id,
                                      })
                                      setSelectedPenId('')
                                    }}
                                  >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center">
                            <p className="text-xs text-muted-foreground">Boks jest pusty</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Quick Archive Button */}
                    <div className="px-5 pb-4 pt-1 border-t border-border/30 bg-muted/5 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {pen.sheep.filter((s) => s.sex === 'MALE').length} tryk ·{' '}
                        {pen.sheep.filter((s) => s.sex === 'FEMALE').length} owiec
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30"
                        onClick={() => setArchiveTargetPen(pen)}
                      >
                        <Archive className="h-3 w-3" />
                        Zakończ boks
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Content for ARCHIVED PENS */}
      {activeTab === 'archived' && (
        <>
          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Ładowanie archiwum...</span>
              </div>
            </div>
          ) : archivedPens.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
              <Archive className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">Brak zarchiwizowanych boksów</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Gdy zakończysz cykl krycia w aktywnym boksie, kliknij „Zakończ boks”. Cała historia
                (tryk, matki, urodzone jagnięta, daty i notatki) zostanie tutaj trwale zachowana.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArchivedPens.map((pen, idx) => {
                const history = pen.history
                const ram = history?.ram
                const ewes = history?.ewes || []
                const lambs = history?.lambs || []
                const lambsCount = history?.lambsCount ?? lambs.length

                return (
                  <div
                    key={pen.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                      animation: 'fadeIn 0.3s ease-out both',
                    }}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="h-1.5 bg-purple-500" />

                      {/* Header */}
                      <div className="p-5 pb-3 border-b border-border/40">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold">{pen.name}</h3>
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                                Zarchiwizowany
                              </Badge>
                            </div>
                            {pen.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{pen.description}</p>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            title="Usuń wpis archiwalny"
                            onClick={() => setDeletePen(pen)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 bg-secondary/30 p-2 rounded-lg">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>
                            Od:{' '}
                            <strong className="text-foreground">
                              {formatDate(history?.startDate || pen.startDate || pen.createdAt || new Date())}
                            </strong>{' '}
                            — Do:{' '}
                            <strong className="text-foreground">
                              {formatDate(history?.endDate || pen.endDate || new Date())}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* History Breakdown */}
                      <div className="p-5 space-y-4">
                        {/* Breeding Ram */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-1.5">
                            <Mars className="h-4 w-4" />
                            <span>Tryk kryjący</span>
                          </div>
                          {ram ? (
                            <div
                              className={`flex items-center justify-between rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-2 ${
                                onViewSheep && ram.id ? 'cursor-pointer hover:bg-sky-500/20 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (onViewSheep && ram.id) onViewSheep(ram.id)
                              }}
                              title={onViewSheep && ram.id ? 'Otwórz profil tryka' : undefined}
                            >
                              <div>
                                <p className="text-sm font-semibold">{ram.name || ram.earTag}</p>
                                <p className="font-mono text-[10px] text-muted-foreground">{ram.earTag}</p>
                              </div>
                              {onViewSheep && ram.id && (
                                <span className="text-[10px] text-sky-400 font-medium">Profil →</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Brak tryka w historii</p>
                          )}
                        </div>

                        {/* Ewes */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-400">
                              <Venus className="h-4 w-4" />
                              <span>Matki w boksie ({ewes.length})</span>
                            </div>
                          </div>
                          {ewes.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                              {ewes.map((ewe, i) => (
                                <div
                                  key={i}
                                  className={`inline-flex items-center gap-1 rounded-md bg-pink-500/10 border border-pink-500/20 px-2 py-1 text-xs ${
                                    onViewSheep && ewe.id ? 'cursor-pointer hover:bg-pink-500/20' : ''
                                  }`}
                                  onClick={() => {
                                    if (onViewSheep && ewe.id) onViewSheep(ewe.id)
                                  }}
                                  title={onViewSheep && ewe.id ? 'Otwórz profil owcy' : undefined}
                                >
                                  <Venus className="h-3 w-3 text-pink-400" />
                                  <span className="font-mono font-medium">{ewe.earTag}</span>
                                  {ewe.name && <span className="text-[10px] text-muted-foreground">({ewe.name})</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Brak matek w historii</p>
                          )}
                        </div>

                        {/* Lambs born */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <Baby className="h-4 w-4" />
                              <span>Urodzone jagnięta ({lambsCount})</span>
                            </div>
                          </div>
                          {lambs.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                              {lambs.map((lamb, i) => (
                                <div
                                  key={i}
                                  className={`inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs ${
                                    onViewSheep && lamb.id ? 'cursor-pointer hover:bg-emerald-500/20' : ''
                                  }`}
                                  onClick={() => {
                                    if (onViewSheep && lamb.id) onViewSheep(lamb.id)
                                  }}
                                  title={onViewSheep && lamb.id ? 'Otwórz profil jagnięcia' : undefined}
                                >
                                  {lamb.sex === 'MALE' ? (
                                    <Mars className="h-3 w-3 text-sky-400" />
                                  ) : (
                                    <Venus className="h-3 w-3 text-pink-400" />
                                  )}
                                  <span className="font-mono font-medium">{lamb.earTag}</span>
                                  {lamb.name && <span className="text-[10px] text-muted-foreground">({lamb.name})</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {lambsCount > 0 ? `Odnotowano ${lambsCount} jagniąt` : 'Brak zarejestrowanych jagniąt'}
                            </p>
                          )}
                        </div>

                        {/* Notes */}
                        {history?.notes && (
                          <div className="rounded-xl bg-secondary/30 p-3 border border-border/40">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
                              <FileText className="h-3.5 w-3.5" />
                              <span>Notatki z cyklu</span>
                            </div>
                            <p className="text-xs text-foreground/90 whitespace-pre-wrap">{history.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Restore action bar */}
                    <div className="p-4 border-t border-border/30 bg-muted/5 flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        disabled={restoringPenId === pen.id}
                        onClick={() => handleRestorePen(pen.id)}
                      >
                        {restoringPenId === pen.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Przywróć boks do aktywnych
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Move Dialog */}
      <Dialog open={!!moveDialog} onOpenChange={(v) => { if (!v) setMoveDialog(null) }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Przenieś owcę</DialogTitle>
            <DialogDescription>
              Przenieś <strong>{moveDialog?.sheepName}</strong> do innego boksu.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Docelowy boks</Label>
              <Select value={selectedPenId} onValueChange={setSelectedPenId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz boks..." />
                </SelectTrigger>
                <SelectContent>
                  {pens
                    .filter((p) => p.id !== moveDialog?.currentPenId)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sheep.length} szt.)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMoveDialog(null)}>
                Anuluj
              </Button>
              <Button size="sm" disabled={!selectedPenId || moving} onClick={handleMove}>
                {moving && <Loader2 className="h-4 w-4 animate-spin" />}
                Przenieś
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Pen Dialog */}
      {archiveTargetPen && (
        <ArchivePenDialog
          pen={archiveTargetPen}
          open={!!archiveTargetPen}
          onOpenChange={(v) => { if (!v) setArchiveTargetPen(null) }}
          onSuccess={() => {
            fetchPens()
            setActiveTab('archived')
          }}
        />
      )}

      {/* Delete Pen Confirmation */}
      <AlertDialog open={!!deletePen} onOpenChange={(v) => { if (!v) setDeletePen(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń boks „{deletePen?.name}”</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePen && deletePen.sheep.length > 0
                ? `Ten boks zawiera ${deletePen.sheep.length} owiec. Zostaną one odłączone od boksu (nie usunięte). Czy na pewno chcesz kontynuować?`
                : 'Czy na pewno chcesz usunąć ten boks? Tej operacji nie można cofnąć.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePen} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Usuń boks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Pen Dialog */}
      <PenFormDialog
        pen={editPen}
        open={!!editPen}
        onOpenChange={(v) => { if (!v) setEditPen(null) }}
        onSuccess={fetchPens}
        mode="edit"
      />

      {/* Add Pen Dialog */}
      <PenFormDialog
        pen={null}
        open={showAddPen}
        onOpenChange={setShowAddPen}
        onSuccess={fetchPens}
        mode="create"
      />
    </div>
  )
}

// ============================================
// Archive Pen Dialog
// ============================================
function ArchivePenDialog({
  pen,
  open,
  onOpenChange,
  onSuccess,
}: {
  pen: PenData
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const ram = pen.sheep.find((s) => s.sex === 'MALE')
  const ewes = pen.sheep.filter((s) => s.sex === 'FEMALE')

  const [startDate, setStartDate] = useState(
    toInputDate(pen.startDate || pen.createdAt || new Date())
  )
  const [endDate, setEndDate] = useState(toInputDate(new Date()))
  const [notes, setNotes] = useState('')
  const [releaseSheep, setReleaseSheep] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleArchive = async () => {
    if (!window.electronAPI) return
    try {
      setSaving(true)
      await window.electronAPI.pens.archive(pen.id, {
        startDate,
        endDate,
        notes: notes.trim(),
        releaseSheep,
      })
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Failed to archive pen:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-500" />
            Zakończ i zarchiwizuj boks „{pen.name}”
          </DialogTitle>
          <DialogDescription>
            Zapisz pełny stan boksu (tryk, stado matek, daty i notatki). Po zarchiwizowaniu boks trafi do
            historii, do której masz stały wgląd.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary of occupants */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skład boksu w momencie zakończenia
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-sky-400">Tryk:</span>
              {ram ? (
                <Badge variant="outline" className="text-xs font-mono border-sky-500/30 text-sky-400 bg-sky-500/10">
                  {ram.name || ram.earTag} ({ram.earTag})
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground italic">Brak tryka</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-pink-400">Matki:</span>
              <span className="text-xs font-semibold">{ewes.length} szt.</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {ewes.slice(0, 3).map((e) => e.earTag).join(', ')}
                {ewes.length > 3 ? ` +${ewes.length - 3} więcej` : ''}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="archiveStartDate">Data rozpoczęcia</Label>
              <Input
                id="archiveStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="archiveEndDate">Data zakończenia</Label>
              <Input
                id="archiveEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="archiveNotes">Notatki / Podsumowanie krycia</Label>
            <textarea
              id="archiveNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="np. Sezon krycia jesień 2026. Tryk krył 6 matek, brak powtórek, wysoka skuteczność."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Release sheep option */}
          <div className="flex items-start gap-2.5 rounded-lg border border-border p-3 bg-secondary/15">
            <input
              type="checkbox"
              id="releaseSheepCheckbox"
              checked={releaseSheep}
              onChange={(e) => setReleaseSheep(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="releaseSheepCheckbox" className="text-xs leading-tight cursor-pointer">
              <span className="font-semibold block text-foreground">
                Zwolnij zwierzęta z boksu
              </span>
              <span className="text-muted-foreground">
                Odłącza tryka i owce od tego boksu, aby można było wykorzystać go dla innej grupy stada.
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleArchive} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
            Zarchiwizuj boks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// Pen Form Dialog (create + edit in one)
// ============================================
function PenFormDialog({
  pen,
  open,
  onOpenChange,
  onSuccess,
  mode,
}: {
  pen: PenData | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  mode: 'create' | 'edit'
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(toInputDate(new Date()))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pen && mode === 'edit') {
      setName(pen.name || '')
      setDescription(pen.description || '')
      setStartDate(toInputDate(pen.startDate || pen.createdAt || new Date()))
    } else if (mode === 'create') {
      setName('')
      setDescription('')
      setStartDate(toInputDate(new Date()))
    }
  }, [pen, mode, open])

  const handleSave = async () => {
    if (!name.trim() || !window.electronAPI) return
    try {
      setSaving(true)
      if (mode === 'edit' && pen) {
        await window.electronAPI.pens.update(pen.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
        })
      } else {
        await window.electronAPI.pens.create({
          name: name.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
        })
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error(`Failed to ${mode} pen:`, err)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj boks' : 'Dodaj nowy boks'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Zmień nazwę, opis lub datę utworzenia boksu.' : 'Utwórz nowy boks dla swojego stada.'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="penFormName">Nazwa boksu *</Label>
            <Input
              id="penFormName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Boks 1 - Krycie jesienne"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="penFormDesc">Opis / Przeznaczenie</Label>
            <Input
              id="penFormDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Boks dla matek z jagniętami / krycie trykiem RAM-01"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="penFormStartDate">Data utworzenia / zasiedlenia</Label>
            <Input
              id="penFormStartDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button size="sm" disabled={!name.trim() || saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit ? 'Zapisz zmiany' : 'Utwórz boks'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
