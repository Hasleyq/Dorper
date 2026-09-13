import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OptionSelectWithAddProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  onAddOption: (option: string) => Promise<string | null>;
  placeholder?: string;
  error?: boolean;
  className?: string;
  addPlaceholder?: string;
}

export function OptionSelectWithAdd({
  value,
  onValueChange,
  options,
  onAddOption,
  placeholder = 'Wybierz opcję...',
  error = false,
  className = '',
  addPlaceholder = 'Wpisz nową opcję...',
}: OptionSelectWithAddProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionText.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      const added = await onAddOption(trimmed);
      if (added) {
        onValueChange(added);
      }
      setNewOptionText('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add custom option:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="flex-1">
          <Select
            value={value}
            onValueChange={(val) => {
              if (val === '__ADD_NEW__') {
                setIsAdding(true);
              } else {
                onValueChange(val);
              }
            }}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
              <SelectItem value="__ADD_NEW__" className="text-primary font-medium">
                + Dodaj własną opcję...
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* The '+' button requested by user */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-dashed hover:border-primary hover:text-primary transition-colors"
          onClick={() => setIsAdding(!isAdding)}
          title="Dodaj nową własną opcję do wyboru"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Inline add panel when '+' is active */}
      {isAdding && (
        <form onSubmit={handleSave} className="flex items-center gap-1.5 pt-1 animate-fade-in">
          <Input
            autoFocus
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            placeholder={addPlaceholder}
            className="h-8 text-xs flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !newOptionText.trim()}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Zapisz
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setNewOptionText('');
            }}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}
    </div>
  );
}
