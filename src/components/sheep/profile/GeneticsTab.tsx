import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { SEX_ICONS, SEX_LABELS, SEX_VARIANTS, formatDate, formatAge } from '@/lib/sheep-utils'
import { Maximize2 } from 'lucide-react'
import { PedigreeFlow } from './PedigreeFlow'
import type { SheepDetail } from '@/types/electron'

interface GeneticsTabProps {
  sheep: SheepDetail
}

// ============================================
// Pedigree ancestor card
// ============================================
function AncestorCard({
  label,
  ancestor,
  depth,
}: {
  label: string
  ancestor: { id: string; earTag: string; name?: string | null; sex?: string } | null | undefined
  depth: 'parent' | 'grandparent'
}) {
  const isGrandparent = depth === 'grandparent'

  if (!ancestor) {
    return (
      <div
        className={`flex flex-col justify-center rounded-lg border border-dashed border-border bg-card/30 p-3 ${
          isGrandparent ? 'min-h-[60px]' : 'min-h-[72px]'
        }`}
      >
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground/40">Nieznany</p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col justify-center rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 ${
        isGrandparent ? 'min-h-[60px]' : 'min-h-[72px]'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold">{ancestor.name || ancestor.earTag}</p>
        {ancestor.sex && (
          <Badge variant={SEX_VARIANTS[ancestor.sex]} className="text-[10px] px-1 py-0">
            {SEX_ICONS[ancestor.sex]}
          </Badge>
        )}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">{ancestor.earTag}</p>
    </div>
  )
}

// ============================================
// Connecting line component (CSS-based)
// ============================================
function ConnectingLine() {
  return <div className="flex items-center justify-center"><div className="h-px w-6 bg-border" /></div>
}

export function GeneticsTab({ sheep }: GeneticsTabProps) {
  const [flowModalOpen, setFlowModalOpen] = useState(false)

  const father = sheep.father
  const mother = sheep.mother

  // Grandparents from father
  const paternalGrandfather = (father as any)?.father || null
  const paternalGrandmother = (father as any)?.mother || null

  // Grandparents from mother
  const maternalGrandfather = (mother as any)?.father || null
  const maternalGrandmother = (mother as any)?.mother || null

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div className="rounded-xl border border-border bg-card p-4 flex-1">
          <h3 className="text-sm font-semibold">Rodowód — 2 pokolenia</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Drzewo genealogiczne na podstawie danych rejestru hodowlanego
          </p>
        </div>
        <div className="ml-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlowModalOpen(true)}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Pokaż pełne drzewo
          </Button>
        </div>
      </div>

      {/* Pedigree Tree — Horizontal layout */}
      <div className="overflow-x-auto">
        <div className="inline-grid min-w-[800px] grid-cols-[1fr_24px_1fr_24px_1fr] items-stretch gap-y-2">
          {/* ROW 1: Paternal Grandfather */}
          <div className="col-start-5 row-start-1">
            <AncestorCard label="Dziadek (po ojcu)" ancestor={paternalGrandfather} depth="grandparent" />
          </div>

          {/* ROW 1-2: Father */}
          <div className="col-start-3 row-span-2 row-start-1 flex items-center">
            <div className="w-full">
              <AncestorCard label="Ojciec" ancestor={father} depth="parent" />
            </div>
          </div>

          {/* Line: Father → PG */}
          <div className="col-start-4 row-start-1 flex items-center">
            <ConnectingLine />
          </div>

          {/* ROW 2: Paternal Grandmother */}
          <div className="col-start-5 row-start-2">
            <AncestorCard label="Babka (po ojcu)" ancestor={paternalGrandmother} depth="grandparent" />
          </div>
          <div className="col-start-4 row-start-2 flex items-center">
            <ConnectingLine />
          </div>

          {/* Subject (spans all father + mother rows) */}
          <div className="col-start-1 row-span-4 row-start-1 flex items-center">
            <div className="w-full rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-primary/60">Osobnik</p>
              <p className="mt-1 text-lg font-bold">{sheep.name || sheep.earTag}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={SEX_VARIANTS[sheep.sex]}>
                  {SEX_ICONS[sheep.sex]} {SEX_LABELS[sheep.sex]}
                </Badge>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{sheep.earTag}</p>
              <p className="text-xs text-muted-foreground">{formatAge(sheep.birthDate)} · ur. {formatDate(sheep.birthDate)}</p>
            </div>
          </div>

          {/* Line: Subject → Father */}
          <div className="col-start-2 row-span-2 row-start-1 flex items-center">
            <ConnectingLine />
          </div>

          {/* Spacer row */}
          <div className="col-span-5 row-start-3 h-2" />

          {/* ROW 4: Maternal Grandfather */}
          <div className="col-start-5 row-start-4">
            <AncestorCard label="Dziadek (po matce)" ancestor={maternalGrandfather} depth="grandparent" />
          </div>

          {/* ROW 4-5: Mother */}
          <div className="col-start-3 row-span-2 row-start-4 flex items-center">
            <div className="w-full">
              <AncestorCard label="Matka" ancestor={mother} depth="parent" />
            </div>
          </div>
          <div className="col-start-4 row-start-4 flex items-center">
            <ConnectingLine />
          </div>

          {/* Line: Subject → Mother */}
          <div className="col-start-2 row-span-2 row-start-4 flex items-center">
            <ConnectingLine />
          </div>

          {/* ROW 5: Maternal Grandmother */}
          <div className="col-start-5 row-start-5">
            <AncestorCard label="Babka (po matce)" ancestor={maternalGrandmother} depth="grandparent" />
          </div>
          <div className="col-start-4 row-start-5 flex items-center">
            <ConnectingLine />
          </div>
        </div>
      </div>

      {/* Lineage note */}
      {sheep.lineage && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-medium text-muted-foreground">Linia hodowlana</h4>
          <p className="mt-1 text-sm">{sheep.lineage}</p>
        </div>
      )}

      {/* ==================== REACT FLOW MODAL ==================== */}
      <Dialog open={flowModalOpen} onOpenChange={setFlowModalOpen}>
        <DialogContent fullScreen className="flex flex-col">
          <DialogHeader className="px-4 pt-3 pb-2 shrink-0">
            <DialogTitle>
              Drzewo genealogiczne — {sheep.name || sheep.earTag}
            </DialogTitle>
            <DialogDescription>
              Interaktywny rodowód (3 pokolenia). Użyj kółka myszy do przybliżania, przeciągnij aby przesuwać.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden rounded-b-xl">
            {flowModalOpen && <PedigreeFlow sheepId={sheep.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
