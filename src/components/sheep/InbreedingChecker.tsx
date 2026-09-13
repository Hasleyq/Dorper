import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SheepCombobox } from './forms/SheepCombobox'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  Loader2,
  Dna,
} from 'lucide-react'
import type { SheepRecord, InbreedingResult } from '@/types/electron'

// ============================================
// Result display config
// ============================================
const RESULT_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ElementType; label: string }
> = {
  NONE: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    icon: ShieldCheck,
    label: 'Bezpieczne — brak pokrewieństwa',
  },
  LOW: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: AlertTriangle,
    label: 'Niskie ryzyko — daleki wspólny przodek',
  },
  HIGH: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20',
    icon: ShieldAlert,
    label: 'Wysokie ryzyko — bliskie pokrewieństwo',
  },
  CRITICAL: {
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    icon: ShieldAlert,
    label: 'KRYTYCZNE — Chów wsobny!',
  },
}

export function InbreedingChecker({ onViewSheep }: { onViewSheep?: (id: string) => void }) {
  const [allSheep, setAllSheep] = useState<SheepRecord[]>([])
  const [ramId, setRamId] = useState<string | undefined>(undefined)
  const [eweId, setEweId] = useState<string | undefined>(undefined)
  const [result, setResult] = useState<InbreedingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  // Fetch all sheep for selectors
  useEffect(() => {
    async function fetchSheep() {
      if (!window.electronAPI) return
      try {
        setLoading(true)
        const sheep = await window.electronAPI.sheep.getAll()
        setAllSheep(sheep)
      } catch (err) {
        console.error('Failed to fetch sheep:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSheep()
  }, [])

  // Check inbreeding
  const handleCheck = useCallback(async () => {
    if (!ramId || !eweId || !window.electronAPI) return

    try {
      setChecking(true)
      setResult(null)
      const checkResult = await window.electronAPI.breeding.checkInbreeding(ramId, eweId)
      setResult(checkResult)
    } catch (err) {
      console.error('Inbreeding check failed:', err)
    } finally {
      setChecking(false)
    }
  }, [ramId, eweId])

  // Reset result when selection changes
  useEffect(() => {
    setResult(null)
  }, [ramId, eweId])

  const selectedRam = allSheep.find((s) => s.id === ramId)
  const selectedEwe = allSheep.find((s) => s.id === eweId)
  const resultConfig = result ? RESULT_CONFIG[result.warningLevel] : null
  const ResultIcon = resultConfig?.icon || ShieldCheck

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kalkulator inbredu</h2>
        <p className="text-sm text-muted-foreground">
          Sprawdź pokrewieństwo przed planowanym kryciem (do 4 pokoleń)
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Dna className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Kontrola pokrewieństwa (4 pokolenia)</h3>
            <p className="text-xs text-muted-foreground">
              Wybierz tryka i owcę, aby system sprawdził wspólnych przodków do 4 pokoleń wstecz (uwzględniając bazę oraz rodowody 4-pokoleniowe).
            </p>
          </div>
        </div>
      </div>

      {/* Selection area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ram selector */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">♂</span>
            <h3 className="text-sm font-semibold">Tryk (ojciec)</h3>
          </div>
          <SheepCombobox
            value={ramId}
            onChange={setRamId}
            sheep={allSheep}
            filterSex="MALE"
            placeholder="Wybierz tryka..."
          />
          {selectedRam && (
            <div
              onClick={() => onViewSheep && onViewSheep(selectedRam.id)}
              className={`mt-3 rounded-lg bg-sky-500/5 border border-sky-500/10 p-3 transition-colors ${
                onViewSheep ? 'cursor-pointer hover:bg-sky-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{selectedRam.name || selectedRam.earTag}</p>
                {onViewSheep && <span className="text-[10px] text-primary">Zobacz profil →</span>}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{selectedRam.earTag}</p>
            </div>
          )}
        </div>

        {/* Ewe selector */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">♀</span>
            <h3 className="text-sm font-semibold">Owca (matka)</h3>
          </div>
          <SheepCombobox
            value={eweId}
            onChange={setEweId}
            sheep={allSheep}
            filterSex="FEMALE"
            placeholder="Wybierz owcę..."
          />
          {selectedEwe && (
            <div
              onClick={() => onViewSheep && onViewSheep(selectedEwe.id)}
              className={`mt-3 rounded-lg bg-pink-500/5 border border-pink-500/10 p-3 transition-colors ${
                onViewSheep ? 'cursor-pointer hover:bg-pink-500/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{selectedEwe.name || selectedEwe.earTag}</p>
                {onViewSheep && <span className="text-[10px] text-primary">Zobacz profil →</span>}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{selectedEwe.earTag}</p>
            </div>
          )}
        </div>
      </div>

      {/* Check button */}
      <div className="flex justify-center">
        <Button
          size="default"
          onClick={handleCheck}
          disabled={!ramId || !eweId || checking}
          className="min-w-[200px] gap-2"
        >
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {checking ? 'Sprawdzanie...' : 'Sprawdź pokrewieństwo'}
        </Button>
      </div>

      {/* ==================== RESULT ==================== */}
      {result && resultConfig && (
        <div
          className={`rounded-xl border p-6 ${resultConfig.bg} ${resultConfig.border} animate-fade-in`}
        >
          {/* Result header */}
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${resultConfig.bg}`}
            >
              <ResultIcon className={`h-6 w-6 ${resultConfig.color}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${resultConfig.color}`}>
                {resultConfig.label}
              </h3>
              {result.message && (
                <p className="mt-0.5 text-sm text-muted-foreground">{result.message}</p>
              )}
            </div>
          </div>

          {/* Common ancestors with lineage paths */}
          {result.isRelated && result.commonAncestors && result.commonAncestors.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Wspólni przodkowie — ścieżki pokrewieństwa
              </h4>
              {result.commonAncestors.map((ancestor) => (
                <div
                  key={ancestor.id}
                  className="rounded-lg border border-border bg-card/50 p-4 space-y-3"
                >
                  {/* Ancestor header */}
                  <div
                    onClick={() => {
                      if (onViewSheep && ancestor.id && !ancestor.id.startsWith('name:')) {
                        // find if id exists in allSheep
                        const found = allSheep.find(s => s.id === ancestor.id || s.earTag === ancestor.earTag)
                        if (found) onViewSheep(found.id)
                      }
                    }}
                    className={`flex items-center gap-3 ${
                      onViewSheep ? 'cursor-pointer group' : ''
                    }`}
                  >
                    <Badge variant={ancestor.sex === 'MALE' ? 'male' : 'female'} className="text-xs">
                      {ancestor.sex === 'MALE' ? '♂' : '♀'}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {ancestor.name || ancestor.earTag}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">{ancestor.earTag}</p>
                    </div>
                  </div>

                  {/* Lineage paths */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {/* Ram path(s) */}
                    <div className="rounded-md bg-sky-500/5 border border-sky-500/10 p-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        Linia tryka ♂
                      </p>
                      {(ancestor as any).ramPaths?.map((path: string[], pidx: number) => (
                        <div key={pidx} className="flex flex-wrap items-center gap-1 text-xs">
                          {path.map((name: string, idx: number) => (
                            <span key={idx} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-muted-foreground">→</span>}
                              <span className={idx === path.length - 1 ? 'font-bold text-amber-400' : 'text-muted-foreground'}>
                                {name}
                              </span>
                            </span>
                          ))}
                        </div>
                      )) || <p className="text-[10px] text-muted-foreground/50">Brak danych</p>}
                    </div>

                    {/* Ewe path(s) */}
                    <div className="rounded-md bg-pink-500/5 border border-pink-500/10 p-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-pink-600">
                        Linia owcy ♀
                      </p>
                      {(ancestor as any).ewePaths?.map((path: string[], pidx: number) => (
                        <div key={pidx} className="flex flex-wrap items-center gap-1 text-xs">
                          {path.map((name: string, idx: number) => (
                            <span key={idx} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-muted-foreground">→</span>}
                              <span className={idx === path.length - 1 ? 'font-bold text-amber-400' : 'text-muted-foreground'}>
                                {name}
                              </span>
                            </span>
                          ))}
                        </div>
                      )) || <p className="text-[10px] text-muted-foreground/50">Brak danych</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risk breakdown */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Poziom ryzyka</p>
              <p className={`mt-1 text-sm font-bold ${resultConfig.color}`}>
                {result.warningLevel === 'NONE' && 'Brak'}
                {result.warningLevel === 'LOW' && 'Niski'}
                {result.warningLevel === 'HIGH' && 'Wysoki'}
                {result.warningLevel === 'CRITICAL' && 'Krytyczny'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Pokrewieństwo</p>
              <p className="mt-1 text-sm font-bold">
                {result.isRelated ? 'Tak' : 'Nie'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Wspólnych przodków</p>
              <p className="mt-1 text-sm font-bold">
                {result.commonAncestors?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
