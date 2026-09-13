import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, AlertTriangle, Eye, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  formatAge,
  formatDate,
  checkWithdrawal,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEX_LABELS,
  SEX_VARIANTS,
  SEX_ICONS,
} from '@/lib/sheep-utils'
import type { SheepRecord } from '@/types/electron'

// ============================================
// Sortable header helper
// ============================================
function SortableHeader({
  column,
  children,
}: {
  column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (desc?: boolean) => void }
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  )
}

// ============================================
// Column definitions (Polish headers)
// ============================================
export function getSheepColumns(
  onView?: (sheep: SheepRecord) => void,
  _onEdit?: (sheep: SheepRecord) => void,
  onDelete?: (sheep: SheepRecord) => void
): ColumnDef<SheepRecord>[] {
  return [
    // EAR TAG
    {
      accessorKey: 'earTag',
      header: ({ column }) => <SortableHeader column={column}>Kolczyk</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium text-foreground">
          {row.getValue('earTag')}
        </span>
      ),
    },

    // NAME (with withdrawal warning)
    {
      accessorKey: 'name',
      header: ({ column }) => <SortableHeader column={column}>ID</SortableHeader>,
      cell: ({ row }) => {
        const sheep = row.original
        const name = sheep.name || '—'
        const withdrawal = checkWithdrawal(sheep.healthRecords || [])

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {withdrawal.isActive && (
              <div className="group relative">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-100 border border-red-300 px-2.5 py-1.5 text-xs text-red-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <div className="font-semibold">⚠ Karencja aktywna</div>
                  <div>
                    {withdrawal.medication && `${withdrawal.medication} · `}
                    do {formatDate(withdrawal.endDate!)} ({withdrawal.daysRemaining} dni)
                  </div>
                  <div className="absolute inset-x-0 -bottom-1 mx-auto h-2 w-2 rotate-45 bg-red-100 border-b border-r border-red-300" />
                </div>
              </div>
            )}
          </div>
        )
      },
    },

    // SEX
    {
      accessorKey: 'sex',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Płeć
        </span>
      ),
      cell: ({ row }) => {
        const sex = row.getValue('sex') as string
        return (
          <Badge variant={SEX_VARIANTS[sex] || 'secondary'}>
            {SEX_ICONS[sex]} {SEX_LABELS[sex] || sex}
          </Badge>
        )
      },
      filterFn: (row, _id, filterValue) => {
        if (!filterValue) return true
        return row.getValue('sex') === filterValue
      },
    },

    // BIRTH DATE
    {
      accessorKey: 'birthDate',
      header: ({ column }) => <SortableHeader column={column}>Data ur.</SortableHeader>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue('birthDate'))}
        </span>
      ),
    },

    // AGE (computed)
    {
      id: 'age',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Wiek
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{formatAge(row.original.birthDate)}</span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = new Date(rowA.original.birthDate).getTime()
        const b = new Date(rowB.original.birthDate).getTime()
        return a - b // Older sheep first when ascending
      },
    },

    // STATUS
    {
      accessorKey: 'status',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const sheep = row.original
        const withdrawal = checkWithdrawal(sheep.healthRecords || [])

        return (
          <div className="flex flex-col gap-1">
            <Badge variant={STATUS_VARIANTS[status] || 'secondary'}>
              {STATUS_LABELS[status] || status}
            </Badge>
            {withdrawal.isActive && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                🔒 Karencja {withdrawal.daysRemaining}d
              </Badge>
            )}
          </div>
        )
      },
      filterFn: (row, _id, filterValue) => {
        if (!filterValue) return true
        return row.getValue('status') === filterValue
      },
    },

    // MOTHER
    {
      id: 'mother',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Matka
        </span>
      ),
      cell: ({ row }) => {
        const mother = row.original.mother
        if (!mother) return <span className="text-muted-foreground/50">—</span>
        return (
          <span className="text-sm">
            {mother.name || mother.earTag}
          </span>
        )
      },
    },

    // FATHER
    {
      id: 'father',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ojciec
        </span>
      ),
      cell: ({ row }) => {
        const father = row.original.father
        if (!father) return <span className="text-muted-foreground/50">—</span>
        return (
          <span className="text-sm">
            {father.name || father.earTag}
          </span>
        )
      },
    },

    // LATEST WEIGHT
    {
      id: 'weight',
      header: () => (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Waga
        </span>
      ),
      cell: ({ row }) => {
        const weights = row.original.weights
        if (!weights || weights.length === 0) {
          return <span className="text-muted-foreground/50">—</span>
        }
        const latest = weights[0]
        return (
          <span className="font-mono text-sm">
            {latest.weight.toFixed(1)} kg
          </span>
        )
      },
    },

    // ACTIONS
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        const sheep = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Otwórz menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akcje</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView?.(sheep)}>
                <Eye className="h-4 w-4" />
                Wyświetl szczegóły
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => _onEdit?.(sheep)}>
                <Pencil className="h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(sheep)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
