import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Sparkles, GitBranch } from 'lucide-react';
import { parseCustomPedigree } from '@/types/pedigree';
import type { Pedigree4Gen, AncestorNode } from '@/types/pedigree';
import type { SheepDetail } from '@/types/electron';

interface PedigreeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheep: SheepDetail;
  onSuccess: () => void;
}

function AncestorInputGroup({
  code,
  label,
  value,
  onChange,
  showPurity = false,
  compact = false,
}: {
  code: string;
  label: string;
  value?: AncestorNode;
  onChange: (node: AncestorNode) => void;
  showPurity?: boolean;
  compact?: boolean;
}) {
  const current = value || { name: '', tag: '', breedPurity: '100' };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-primary">{code}</span>
        <span className="text-muted-foreground text-[11px] truncate max-w-[180px]">{label}</span>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <Label className="text-[10px] text-muted-foreground">Nazwa / Przydomek</Label>
          <Input
            value={current.name}
            onChange={(e) => onChange({ ...current, name: e.target.value })}
            placeholder="np. KAYA DORPERS"
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Numer kolczyka / ID *</Label>
          <Input
            value={current.tag}
            onChange={(e) => onChange({ ...current, tag: e.target.value })}
            placeholder="np. AU400030-210881"
            className="h-7 text-xs font-mono"
          />
        </div>
      </div>

      {showPurity && (
        <div className="w-1/2 pt-1">
          <Label className="text-[10px] text-muted-foreground">% rasy Dorper</Label>
          <Input
            value={current.breedPurity || '100'}
            onChange={(e) => onChange({ ...current, breedPurity: e.target.value })}
            placeholder="100"
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function PedigreeEditorDialog({
  open,
  onOpenChange,
  sheep,
  onSuccess,
}: PedigreeEditorDialogProps) {
  const [pedigree, setPedigree] = useState<Pedigree4Gen>(() =>
    parseCustomPedigree(sheep.customPedigree)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPedigree(parseCustomPedigree(sheep.customPedigree));
    }
  }, [open, sheep.customPedigree]);

  const updateNode = (key: keyof Pedigree4Gen, node: AncestorNode) => {
    setPedigree((prev) => ({
      ...prev,
      [key]: node,
    }));
  };

  // Pre-fill from database ancestors if available
  const handleAutoFillFromDb = () => {
    const next: Pedigree4Gen = { ...pedigree };

    // Father
    if (sheep.father) {
      next.F = {
        name: sheep.father.name || '',
        tag: sheep.father.earTag || '',
        breedPurity: sheep.father.breedPercentage || '100',
      };
      if ((sheep.father as any).father) {
        const ff = (sheep.father as any).father;
        next.FF = { name: ff.name || '', tag: ff.earTag || '', breedPurity: '100' };
      }
      if ((sheep.father as any).mother) {
        const fm = (sheep.father as any).mother;
        next.FM = { name: fm.name || '', tag: fm.earTag || '', breedPurity: '100' };
      }
    }

    // Mother
    if (sheep.mother) {
      next.M = {
        name: sheep.mother.name || '',
        tag: sheep.mother.earTag || '',
        breedPurity: sheep.mother.breedPercentage || '100',
      };
      if ((sheep.mother as any).father) {
        const mf = (sheep.mother as any).father;
        next.MF = { name: mf.name || '', tag: mf.earTag || '', breedPurity: '100' };
      }
      if ((sheep.mother as any).mother) {
        const mm = (sheep.mother as any).mother;
        next.MM = { name: mm.name || '', tag: mm.earTag || '', breedPurity: '100' };
      }
    }

    setPedigree(next);
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;
    try {
      setSaving(true);
      await window.electronAPI.sheep.update(sheep.id, {
        customPedigree: JSON.stringify(pedigree),
      } as any);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to save custom pedigree:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[780px] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="h-5 w-5 text-primary" />
                Edycja rodowodu (4 pokolenia wstecz)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Osobnik: <strong>{sheep.name || sheep.earTag}</strong> ({sheep.earTag}). Uzupełnij
                dane genealogiczne, szczególnie przydatne dla kupionego tryka lub owiec z importu.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoFillFromDb}
              className="gap-1.5 text-xs shrink-0 self-start sm:self-auto"
              title="Pobierz znanych przodków z rejestru stada"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Pobierz z bazy stada
            </Button>
          </div>
        </DialogHeader>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-4">
          <Tabs defaultValue="father" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="father" className="text-xs">
                ♂ Linia Ojca (Far / Sire)
              </TabsTrigger>
              <TabsTrigger value="mother" className="text-xs">
                ♀ Linia Matki (Mor / Dam)
              </TabsTrigger>
            </TabsList>

            {/* ================= FATHER SIDE ================= */}
            <TabsContent value="father" className="space-y-4 pt-2">
              {/* Gen 1: Far */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 1: Ojciec (Far)
                </h4>
                <AncestorInputGroup
                  code="F"
                  label="Ojciec"
                  value={pedigree.F}
                  onChange={(n) => updateNode('F', n)}
                  showPurity
                />
              </div>

              {/* Gen 2: Grandparents FF, FM */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 2: Dziadkowie od strony ojca
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="FF"
                    label="Dziadek (Ojciec ojca)"
                    value={pedigree.FF}
                    onChange={(n) => updateNode('FF', n)}
                    showPurity
                  />
                  <AncestorInputGroup
                    code="FM"
                    label="Babka (Matka ojca)"
                    value={pedigree.FM}
                    onChange={(n) => updateNode('FM', n)}
                    showPurity
                  />
                </div>
              </div>

              {/* Gen 3: Great-grandparents FFF, FFM, FMF, FMM */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 3: Pradziadkowie od strony ojca
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="FFF"
                    label="Ojciec dziadka (FF)"
                    value={pedigree.FFF}
                    onChange={(n) => updateNode('FFF', n)}
                  />
                  <AncestorInputGroup
                    code="FFM"
                    label="Matka dziadka (FF)"
                    value={pedigree.FFM}
                    onChange={(n) => updateNode('FFM', n)}
                  />
                  <AncestorInputGroup
                    code="FMF"
                    label="Ojciec babki (FM)"
                    value={pedigree.FMF}
                    onChange={(n) => updateNode('FMF', n)}
                  />
                  <AncestorInputGroup
                    code="FMM"
                    label="Matka babki (FM)"
                    value={pedigree.FMM}
                    onChange={(n) => updateNode('FMM', n)}
                  />
                </div>
              </div>

              {/* Gen 4: 8 ancestors from father side */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 4: Prapradziadkowie od strony ojca
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="FFFF"
                    label="Ojciec FFF"
                    value={pedigree.FFFF}
                    onChange={(n) => updateNode('FFFF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FFFM"
                    label="Matka FFF"
                    value={pedigree.FFFM}
                    onChange={(n) => updateNode('FFFM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FFMF"
                    label="Ojciec FFM"
                    value={pedigree.FFMF}
                    onChange={(n) => updateNode('FFMF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FFMM"
                    label="Matka FFM"
                    value={pedigree.FFMM}
                    onChange={(n) => updateNode('FFMM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FMFF"
                    label="Ojciec FMF"
                    value={pedigree.FMFF}
                    onChange={(n) => updateNode('FMFF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FMFM"
                    label="Matka FMF"
                    value={pedigree.FMFM}
                    onChange={(n) => updateNode('FMFM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FMMF"
                    label="Ojciec FMM"
                    value={pedigree.FMMF}
                    onChange={(n) => updateNode('FMMF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="FMMM"
                    label="Matka FMM"
                    value={pedigree.FMMM}
                    onChange={(n) => updateNode('FMMM', n)}
                    compact
                  />
                </div>
              </div>
            </TabsContent>

            {/* ================= MOTHER SIDE ================= */}
            <TabsContent value="mother" className="space-y-4 pt-2">
              {/* Gen 1: Mor */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 1: Matka (Mor)
                </h4>
                <AncestorInputGroup
                  code="M"
                  label="Matka"
                  value={pedigree.M}
                  onChange={(n) => updateNode('M', n)}
                  showPurity
                />
              </div>

              {/* Gen 2: Grandparents MF, MM */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 2: Dziadkowie od strony matki
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="MF"
                    label="Dziadek (Ojciec matki)"
                    value={pedigree.MF}
                    onChange={(n) => updateNode('MF', n)}
                    showPurity
                  />
                  <AncestorInputGroup
                    code="MM"
                    label="Babka (Matka matki)"
                    value={pedigree.MM}
                    onChange={(n) => updateNode('MM', n)}
                    showPurity
                  />
                </div>
              </div>

              {/* Gen 3: Great-grandparents MFF, MFM, MMF, MMM */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 3: Pradziadkowie od strony matki
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="MFF"
                    label="Ojciec dziadka (MF)"
                    value={pedigree.MFF}
                    onChange={(n) => updateNode('MFF', n)}
                  />
                  <AncestorInputGroup
                    code="MFM"
                    label="Matka dziadka (MF)"
                    value={pedigree.MFM}
                    onChange={(n) => updateNode('MFM', n)}
                  />
                  <AncestorInputGroup
                    code="MMF"
                    label="Ojciec babki (MM)"
                    value={pedigree.MMF}
                    onChange={(n) => updateNode('MMF', n)}
                  />
                  <AncestorInputGroup
                    code="MMM"
                    label="Matka babki (MM)"
                    value={pedigree.MMM}
                    onChange={(n) => updateNode('MMM', n)}
                  />
                </div>
              </div>

              {/* Gen 4: 8 ancestors from mother side */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pokolenie 4: Prapradziadkowie od strony matki
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <AncestorInputGroup
                    code="MFFF"
                    label="Ojciec MFF"
                    value={pedigree.MFFF}
                    onChange={(n) => updateNode('MFFF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MFFM"
                    label="Matka MFF"
                    value={pedigree.MFFM}
                    onChange={(n) => updateNode('MFFM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MFMF"
                    label="Ojciec MFM"
                    value={pedigree.MFMF}
                    onChange={(n) => updateNode('MFMF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MFMM"
                    label="Matka MFM"
                    value={pedigree.MFMM}
                    onChange={(n) => updateNode('MFMM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MMFF"
                    label="Ojciec MMF"
                    value={pedigree.MMFF}
                    onChange={(n) => updateNode('MMFF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MMFM"
                    label="Matka MMF"
                    value={pedigree.MMFM}
                    onChange={(n) => updateNode('MMFM', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MMMF"
                    label="Ojciec MMM"
                    value={pedigree.MMMF}
                    onChange={(n) => updateNode('MMMF', n)}
                    compact
                  />
                  <AncestorInputGroup
                    code="MMMM"
                    label="Matka MMM"
                    value={pedigree.MMMM}
                    onChange={(n) => updateNode('MMMM', n)}
                    compact
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Zapisz rodowód 4 pokoleń
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
