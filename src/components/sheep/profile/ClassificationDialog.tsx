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
import { Loader2, Save, Award, Trash2 } from 'lucide-react';
import { parseClassificationData } from '@/types/pedigree';
import type { ClassificationData } from '@/types/pedigree';
import type { SheepDetail } from '@/types/electron';

interface ClassificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheep: SheepDetail;
  onSuccess: () => void;
}

export function ClassificationDialog({
  open,
  onOpenChange,
  sheep,
  onSuccess,
}: ClassificationDialogProps) {
  const [data, setData] = useState<ClassificationData>({
    tagNo: sheep.earTag,
    date: new Date().toISOString().split('T')[0],
    performedBy: '',
    age: '',
    horn: 'Bezrogi',
    conf: '',
    size: '',
    fat: '',
    colour: '',
    covering: '',
    type: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const parsed = parseClassificationData(sheep.classificationData);
      if (parsed) {
        setData(parsed);
      } else {
        setData({
          tagNo: sheep.earTag,
          date: new Date().toISOString().split('T')[0],
          performedBy: '',
          age: '',
          horn: 'Bezrogi',
          conf: '',
          size: '',
          fat: '',
          colour: '',
          covering: '',
          type: '',
          notes: '',
        });
      }
    }
  }, [open, sheep]);

  const handleSave = async () => {
    if (!window.electronAPI) return;
    try {
      setSaving(true);
      await window.electronAPI.sheep.update(sheep.id, {
        classificationData: JSON.stringify(data),
      } as any);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to save classification:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.electronAPI) return;
    try {
      setSaving(true);
      await window.electronAPI.sheep.update(sheep.id, {
        classificationData: null,
      } as any);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to clear classification:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[560px] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-amber-500" />
            Świadectwo oceny i klasyfikacja (Inspection Certificate)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Wpisz wyniki oceny pokrojowej i klasyfikacji owcy. Jeśli pozostawisz te pola puste,
            tabela na certyfikacie PDF wygeneruje się pusta (gotowa do odręcznej oceny).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mt-2">
          {/* Tag & Date */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Numer kolczyka (Tag no)</Label>
              <Input
                value={data.tagNo || ''}
                onChange={(e) => setData({ ...data, tagNo: e.target.value })}
                placeholder={sheep.earTag}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data oceny (Date for tagging)</Label>
              <Input
                type="date"
                value={data.date || ''}
                onChange={(e) => setData({ ...data, date: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Inspector & Age */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Oceniający (Performed by)</Label>
              <Input
                value={data.performedBy || ''}
                onChange={(e) => setData({ ...data, performedBy: e.target.value })}
                placeholder="np. Klasyfikator PZHO / Dorper"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Wiek / Rogi (Age / Horn)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={data.age || ''}
                  onChange={(e) => setData({ ...data, age: e.target.value })}
                  placeholder="Wiek np. 2 l."
                  className="h-8 text-xs"
                />
                <Input
                  value={data.horn || ''}
                  onChange={(e) => setData({ ...data, horn: e.target.value })}
                  placeholder="Bezrogi"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Inspection scoring metrics (C, G, D, P, H, T) */}
          <div className="rounded-lg border border-border bg-slate-50 p-3.5 space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Noty klasyfikacyjne (wg wzorca Dorper)
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Conf (C)</Label>
                <Input
                  value={data.conf || ''}
                  onChange={(e) => setData({ ...data, conf: e.target.value })}
                  placeholder="4"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Budowa</span>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Size (G)</Label>
                <Input
                  value={data.size || ''}
                  onChange={(e) => setData({ ...data, size: e.target.value })}
                  placeholder="5"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Wielkość</span>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Fat (D)</Label>
                <Input
                  value={data.fat || ''}
                  onChange={(e) => setData({ ...data, fat: e.target.value })}
                  placeholder="4"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Tłuszcz</span>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Colour (P)</Label>
                <Input
                  value={data.colour || ''}
                  onChange={(e) => setData({ ...data, colour: e.target.value })}
                  placeholder="5"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Umaszczenie</span>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Cover (H)</Label>
                <Input
                  value={data.covering || ''}
                  onChange={(e) => setData({ ...data, covering: e.target.value })}
                  placeholder="4"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Okrywa</span>
              </div>
              <div className="space-y-1 text-center">
                <Label className="text-[11px] font-bold">Type (T)</Label>
                <Input
                  value={data.type || ''}
                  onChange={(e) => setData({ ...data, type: e.target.value })}
                  placeholder="T4"
                  className="h-8 text-center text-xs font-semibold"
                />
                <span className="text-[9px] text-muted-foreground block">Typ rasowy</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Dodatkowe uwagi / komentarz oceny</Label>
            <Input
              value={data.notes || ''}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="np. Zwierzę wzorcowej budowy, czarny łeb, prawidłowa okrywa letnia"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
          {sheep.classificationData ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={saving}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Usuń ocenę
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Zapisz klasyfikację
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
