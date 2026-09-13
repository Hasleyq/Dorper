import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SEX_ICONS } from '@/lib/sheep-utils'
import { ChevronDown, X } from 'lucide-react'
import type { SheepRecord } from '@/types/electron'

interface SheepComboboxProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  sheep: SheepRecord[]
  filterSex?: 'MALE' | 'FEMALE'
  placeholder?: string
  error?: boolean
}

export function SheepCombobox({
  value,
  onChange,
  sheep,
  filterSex,
  placeholder = 'Wybierz...',
  error,
}: SheepComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter sheep by sex and search query
  const filtered = sheep.filter((s) => {
    if (filterSex && s.sex !== filterSex) return false
    if (s.status !== 'ACTIVE') return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      s.earTag.toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q)
    )
  })

  // Find selected sheep
  const selected = sheep.find((s) => s.id === value)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500/30'
            : 'border-border focus:ring-primary/30'
        } bg-background focus:outline-none focus:ring-2`}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span>{SEX_ICONS[selected.sex]}</span>
            <span className="font-medium">{selected.name || selected.earTag}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {selected.earTag}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
                setSearch('')
              }}
              className="rounded p-0.5 hover:bg-secondary"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-xl animate-fade-in">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po imieniu lub kolczyku..."
              className="h-8 text-xs"
              autoFocus
            />
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <li
                  key={s.id}
                  onClick={() => {
                    onChange(s.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-secondary ${
                    s.id === value ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <span className="text-xs">{SEX_ICONS[s.sex]}</span>
                  <span className="font-medium">{s.name || s.earTag}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {s.earTag}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                Brak wyników
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
