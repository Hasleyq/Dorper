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
import { Maximize2, GitBranch, Edit3 } from 'lucide-react'
import { PedigreeFlow } from './PedigreeFlow'
import { parseCustomPedigree } from '@/types/pedigree'
import type { SheepDetail } from '@/types/electron'

interface GeneticsTabProps {
  sheep: SheepDetail
  onOpenPedigreeEditor?: () => void
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
  ancestor: { id: string; earTag: string; name?: string | null; sex?: string; breedPurity?: string } | null | undefined
  depth: 'parent' | 'grandparent'
}) {
  const isGrandparent = depth === 'grandparent'

  if (!ancestor || (!ancestor.earTag && !ancestor.name)) {
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
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {ancestor.breedPurity && (
          <span className="text-[10px] font-medium text-amber-400/80">{ancestor.breedPurity}%</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold truncate">{ancestor.name || ancestor.earTag}</p>
        {ancestor.sex && (
          <Badge variant={SEX_VARIANTS[ancestor.sex]} className="text-[10px] px-1 py-0">
            {SEX_ICONS[ancestor.sex]}
          </Badge>
        )}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground truncate">{ancestor.earTag}</p>
    </div>
  )
}

// ============================================
// Connecting line component (CSS-based)
// ============================================
function ConnectingLine() {
  return <div className="flex items-center justify-center"><div className="h-px w-6 bg-border" /></div>
}

export function GeneticsTab({ sheep, onOpenPedigreeEditor }: GeneticsTabProps) {
  const [flowModalOpen, setFlowModalOpen] = useState(false)
  const custom = parseCustomPedigree(sheep.customPedigree)

  // Father: DB sheep.father or custom?.father
  const father = sheep.father || (custom?.father?.tag || custom?.father?.name ? {
    id: 'custom-f',
    earTag: custom.father.tag,
    name: custom.father.name,
    sex: 'RAM',
    breedPurity: custom.father.breedPurity,
  } : null)

  // Mother: DB sheep.mother or custom?.mother
  const mother = sheep.mother || (custom?.mother?.tag || custom?.mother?.name ? {
    id: 'custom-m',
    earTag: custom.mother.tag,
    name: custom.mother.name,
    sex: 'EWE',
    breedPurity: custom.mother.breedPurity,
  } : null)

  // Paternal Grandfather
  const paternalGrandfather = (sheep.father as any)?.father || (custom?.fatherFather?.tag || custom?.fatherFather?.name ? {
    id: 'custom-ff',
    earTag: custom.fatherFather.tag,
    name: custom.fatherFather.name,
    sex: 'RAM',
    breedPurity: custom.fatherFather.breedPurity,
  } : null)

  // Paternal Grandmother
  const paternalGrandmother = (sheep.father as any)?.mother || (custom?.fatherMother?.tag || custom?.fatherMother?.name ? {
    id: 'custom-fm',
    earTag: custom.fatherMother.tag,
    name: custom.fatherMother.name,
    sex: 'EWE',
    breedPurity: custom.fatherMother.breedPurity,
  } : null)

  // Maternal Grandfather
  const maternalGrandfather = (sheep.mother as any)?.father || (custom?.motherFather?.tag || custom?.motherFather?.name ? {
    id: 'custom-mf',
    earTag: custom.motherFather.tag,
    name: custom.motherFather.name,
    sex: 'RAM',
    breedPurity: custom.motherFather.breedPurity,
  } : null)

  // Maternal Grandmother
  const maternalGrandmother = (sheep.mother as any)?.mother || (custom?.motherMother?.tag || custom?.motherMother?.name ? {
    id: 'custom-mm',
    earTag: custom.motherMother.tag,
    name: custom.motherMother.name,
    sex: 'EWE',
    breedPurity: custom.motherMother.breedPurity,
  } : null)

  const hasCustomAncestors = Boolean(
    custom && (
      custom.father?.tag || custom.mother?.tag ||
      custom.fatherFather?.tag || custom.fatherMother?.tag ||
      custom.fff?.tag || custom.ffff?.tag
    )
  )

  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="rounded-xl border border-border bg-card p-4 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Rodowód hodowlany</h3>
            {hasCustomAncestors && (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                Zdefiniowane 4 pokolenia
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Drzewo genealogiczne na podstawie rejestru oraz ręcznie wprowadzonych przodków (dla tryków i matek z zewnątrz)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {onOpenPedigreeEditor && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPedigreeEditor}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edytuj rodowód (4 pok.)
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlowModalOpen(true)}
            className="gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Wykres interaktywny
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
