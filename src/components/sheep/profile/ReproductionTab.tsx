import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatDate,
  formatAge,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEX_LABELS,
  SEX_ICONS,
} from '@/lib/sheep-utils'
import { Baby, Mars } from 'lucide-react'
import type { SheepDetail } from '@/types/electron'

interface ReproductionTabProps {
  sheep: SheepDetail
}

export function ReproductionTab({ sheep }: ReproductionTabProps) {
  const isMale = sheep.sex === 'MALE'
  const isFemale = sheep.sex === 'FEMALE'

  // Gather data
  const litters = isFemale ? sheep.littersMother || [] : sheep.littersFather || []
  const children = isMale
    ? sheep.childrenAsFather || []
    : sheep.childrenAsMother || []

  const totalBorn = litters.reduce((sum, l) => sum + l.bornCount, 0)
  const totalWeaned = litters.reduce((sum, l) => sum + (l.weanedCount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Role Description */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {isMale ? <Mars className="h-5 w-5 text-primary" /> : <Baby className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {isMale ? 'Tryk reprodukcyjny' : 'Owca hodowlana'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isMale
                ? 'Podsumowanie potomstwa i kojarzeń jako ojciec'
                : 'Podsumowanie miotów i potomstwa jako owca'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Mioty</p>
          <p className="mt-1 text-2xl font-bold">{litters.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Urodzone łącznie</p>
          <p className="mt-1 text-2xl font-bold">{totalBorn || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Odsadzone łącznie</p>
          <p className="mt-1 text-2xl font-bold">{totalWeaned || '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Potomstwo w rejestrze</p>
          <p className="mt-1 text-2xl font-bold">{children.length}</p>
        </div>
      </div>

      {/* Litters Table */}
      {litters.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold">Historia miotów</h3>
          </div>
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Data krycia</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Data wykotu</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    {isFemale ? 'Ojciec' : 'Matka'}
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-center">Urodzone</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-center">Odsadzone</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-center">% przeżywalności</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {litters.map((litter) => {
                  const partner = isFemale
                    ? (litter as any).father
                    : (litter as any).mother
                  const survivalRate =
                    litter.weanedCount !== null && litter.weanedCount !== undefined && litter.bornCount > 0
                      ? ((litter.weanedCount / litter.bornCount) * 100).toFixed(0)
                      : null

                  return (
                    <TableRow key={litter.id}>
                      <TableCell className="font-mono text-sm">
                        {litter.matingDate ? formatDate(litter.matingDate) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {litter.lambingDate ? formatDate(litter.lambingDate) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {partner ? (
                          <span>{partner.name || partner.earTag}</span>
                        ) : (
                          <span className="text-muted-foreground/50">Nieznany</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-medium">
                        {litter.bornCount}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-medium">
                        {litter.weanedCount ?? '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {survivalRate !== null ? (
                          <Badge
                            variant={
                              parseInt(survivalRate) >= 90
                                ? 'active'
                                : parseInt(survivalRate) >= 70
                                ? 'warning'
                                : 'danger'
                            }
                            className="text-xs"
                          >
                            {survivalRate}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Children / Offspring Table */}
      {children.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold">Potomstwo w rejestrze</h3>
          </div>
          <div className="mt-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">Kolczyk</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">ID</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Płeć</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Data ur.</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Wiek</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {child.earTag}
                    </TableCell>
                    <TableCell className="text-sm">
                      {child.name || <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {SEX_ICONS[child.sex]} {SEX_LABELS[child.sex]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {formatDate(child.birthDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAge(child.birthDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[child.status]}>
                        {STATUS_LABELS[child.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {litters.length === 0 && children.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Brak danych o rozrodzie</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Dane pojawią się po zarejestrowaniu miotów i potomstwa.
          </p>
        </div>
      )}
    </div>
  )
}
