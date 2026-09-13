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
} from 'lucide-react'
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

// ============================================
// Pens Page — Complete CRUD
// ============================================
export function PensPage() {
  const [pens, setPens] = useState<PenData[]>([])
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

  // Fetch pens from DB (no auto-seed)
  const fetchPens = useCallback(async () => {
    if (!window.electronAPI) return
    try {
      setLoading(true)
      const data = await window.electronAPI.pens.getAll()
      setPens(data)
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

  // Delete pen
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

  // Stats
  const totalSheep = pens.reduce((sum, p) => sum + p.sheep.length, 0)
  const avgOccupancy = pens.length > 0 ? (totalSheep / pens.length).toFixed(1) : '0'

  // Filter sheep inside pens by search query
  const filteredPens = pens.map((pen) => {
    if (!searchQuery.trim()) return pen
    const q = searchQuery.toLowerCase()
    const filteredSheep = pen.sheep.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        s.earTag.toLowerCase().includes(q)
    )
    return { ...pen, sheep: filteredSheep }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Zarządzanie kojcami</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Wizualny podgląd rozmieszczenia stada
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

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{pens.length}</p>
            <p className="text-[11px] text-muted-foreground">Łączna liczba boksów</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{totalSheep}<span className="ml-1 text-sm font-normal text-muted-foreground">szt.</span></p>
            <p className="text-[11px] text-muted-foreground">Owiec w boksach</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{avgOccupancy}</p>
            <p className="text-[11px] text-muted-foreground">Średnio na boks</p>
          </div>
        </div>
      </div>

      {/* Search */}
      {pens.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj owcy po kolczyku lub nazwie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Pens Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie kojców...</span>
          </div>
        </div>
      ) : pens.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
          <Box className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Brak boksów</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Dodaj pierwszy boks, aby rozpocząć zarządzanie rozmieszczeniem stada.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setShowAddPen(true)}>
            <Plus className="h-4 w-4" />
            Dodaj pierwszy boks
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPens.map((pen, idx) => (
            <div
              key={pen.id}
              className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border/80"
              style={{ animationDelay: `${idx * 60}ms`, animation: 'fadeIn 0.4s ease-out both' }}
            >
              {/* Colored top stripe */}
              <div className={`h-1.5 ${PEN_ACCENT_COLORS[idx % PEN_ACCENT_COLORS.length]}`} />

              {/* Pen header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <Box className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{pen.name}</h3>
                    {pen.description && (
                      <p className="text-[11px] text-muted-foreground">{pen.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edytuj boks"
                    onClick={() => setEditPen(pen)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-50"
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
              <div className="px-5 pb-5 pt-1">
                {pen.sheep.length > 0 ? (
                  <div className="space-y-1.5">
                    {pen.sheep.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
                      >
                        {/* Sex icon */}
                        {s.sex === 'MALE' ? (
                          <Mars className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        ) : (
                          <Venus className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.name || s.earTag}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{s.earTag}</p>
                        </div>

                        {/* Remove from pen */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                          title="Usuń z boksu"
                          onClick={() => handleRemoveFromPen(s.id)}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                        </Button>

                        {/* Move to another pen */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0"
                          title="Przenieś do innego boksu"
                          onClick={() => {
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
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center">
                    <p className="text-xs text-muted-foreground">Boks jest pusty</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Move Dialog */}
      <Dialog open={!!moveDialog} onOpenChange={(v) => { if (!v) setMoveDialog(null) }}>
        <DialogContent className="sm:max-w-[350px]">
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
              <Button variant="outline" size="sm" onClick={() => setMoveDialog(null)}>Anuluj</Button>
              <Button size="sm" disabled={!selectedPenId || moving} onClick={handleMove}>
                {moving && <Loader2 className="h-4 w-4 animate-spin" />}
                Przenieś
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Pen Confirmation */}
      <AlertDialog open={!!deletePen} onOpenChange={(v) => { if (!v) setDeletePen(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń boks „{deletePen?.name}"</AlertDialogTitle>
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pen && mode === 'edit') {
      setName(pen.name || '')
      setDescription(pen.description || '')
    } else if (mode === 'create') {
      setName('')
      setDescription('')
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
        })
      } else {
        await window.electronAPI.pens.create({
          name: name.trim(),
          description: description.trim() || undefined,
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj boks' : 'Dodaj nowy boks'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Zmień nazwę lub opis boksu.' : 'Utwórz nowy boks dla swojego stada.'}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="penFormName">Nazwa *</Label>
            <Input
              id="penFormName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Boks główny"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="penFormDesc">Opis</Label>
            <Input
              id="penFormDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Boks dla matek z jagniętami"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button size="sm" disabled={!name.trim() || saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Zapisz zmiany' : 'Utwórz boks'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
