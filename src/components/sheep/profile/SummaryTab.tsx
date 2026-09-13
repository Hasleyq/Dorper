import { Badge } from '@/components/ui/badge'
import {
  formatDate,
  formatAge,
  calculateADG,
  checkWithdrawal,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEX_LABELS,
  SEX_VARIANTS,
  SEX_ICONS,
} from '@/lib/sheep-utils'
import { Calendar, Weight, TrendingUp, Dna, Tag, User, Scale } from 'lucide-react'
import type { SheepDetail } from '@/types/electron'

interface SummaryTabProps {
  sheep: SheepDetail
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string | number
  unit?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${accent || ''}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

export function SummaryTab({ sheep }: SummaryTabProps) {
  const withdrawal = checkWithdrawal(sheep.healthRecords || [])
  const adg = calculateADG(sheep.weights || [])
  const latestWeight = sheep.weights?.length
    ? sheep.weights[sheep.weights.length - 1]
    : null
  const birthWeight = sheep.weights?.find((w) => w.type === 'BIRTH')

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column — Info & Photo */}
      <div className="space-y-4 lg:col-span-1">
        {/* Photo — functional upload via native Electron dialog */}
        {(() => {
          const latestPhoto = sheep.photos?.length ? sheep.photos[sheep.photos.length - 1] : null
          const photoUrl = latestPhoto?.url
          
          if (photoUrl) {
            return (
              <div
                className="relative aspect-square overflow-hidden rounded-xl border border-border cursor-pointer group"
                onClick={async () => {
                  if (!window.electronAPI) return
                  try {
                    const result = await window.electronAPI.sheep.uploadPhoto(sheep.id)
                    if (!result.canceled && result.imageUrl) {
                      window.location.reload()
                    }
                  } catch (err) {
                    console.error('Upload failed:', err)
                  }
                }}
                title="Kliknij, aby zmienić zdjęcie"
              >
                <img
                  src={`local-file://${photoUrl.replace(/\\/g, '/')}`}
                  alt={sheep.name || sheep.earTag}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">Zmień zdjęcie</p>
                </div>
              </div>
            )
          }

          return (
            <div
              className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border bg-card/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={async () => {
                if (!window.electronAPI) return
                try {
                  const result = await window.electronAPI.sheep.uploadPhoto(sheep.id)
                  if (!result.canceled && result.imageUrl) {
                    window.location.reload()
                  }
                } catch (err) {
                  console.error('Upload failed:', err)
                }
              }}
              title="Kliknij, aby dodać zdjęcie"
            >
              <div className="text-center text-muted-foreground">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <span className="text-2xl">{SEX_ICONS[sheep.sex] || '🐑'}</span>
                </div>
                <p className="text-xs">Kliknij, aby dodać zdjęcie</p>
                <p className="mt-1 text-[10px]">JPG, PNG, WebP</p>
              </div>
            </div>
          )
        })()}

        {/* Basic Info Card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Informacje podstawowe</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={Tag} label="Numer kolczyka">
              <span className="font-mono">{sheep.earTag}</span>
            </InfoRow>
            <InfoRow icon={User} label="ID">
              {sheep.name || <span className="text-muted-foreground">—</span>}
            </InfoRow>
            <InfoRow icon={Dna} label="Płeć">
              <Badge variant={SEX_VARIANTS[sheep.sex]}>
                {SEX_ICONS[sheep.sex]} {SEX_LABELS[sheep.sex]}
              </Badge>
            </InfoRow>
            <InfoRow icon={Calendar} label="Data urodzenia">
              {formatDate(sheep.birthDate)}
            </InfoRow>
            <InfoRow icon={Calendar} label="Wiek">
              {formatAge(sheep.birthDate)}
            </InfoRow>
            {sheep.lineage && (
              <InfoRow icon={Dna} label="Linia hodowlana">
                {sheep.lineage}
              </InfoRow>
            )}
          </div>
        </div>
      </div>

      {/* Right Column — Metrics */}
      <div className="space-y-4 lg:col-span-2">
        {/* Key Metrics Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Status"
            value={STATUS_LABELS[sheep.status] || sheep.status}
            accent={
              sheep.status === 'ACTIVE'
                ? 'text-emerald-400'
                : sheep.status === 'SOLD'
                ? 'text-blue-400'
                : 'text-zinc-400'
            }
          />
          <MetricCard
            label="Aktualna waga"
            value={latestWeight ? latestWeight.weight.toFixed(1) : '—'}
            unit={latestWeight ? 'kg' : undefined}
          />
          <MetricCard
            label="Waga urodzeniowa"
            value={birthWeight ? birthWeight.weight.toFixed(1) : '—'}
            unit={birthWeight ? 'kg' : undefined}
          />
          <MetricCard
            label="ADG (przyrost)"
            value={adg ? adg.toFixed(3) : '—'}
            unit={adg ? 'kg/dzień' : undefined}
            accent={adg && adg > 0.2 ? 'text-emerald-400' : ''}
          />
        </div>

        {/* Withdrawal Warning */}
        {withdrawal.isActive && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="danger">⚠ Karencja aktywna</Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Lek:</span>{' '}
                <span className="font-medium text-red-700">{withdrawal.medication || '—'}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Koniec karencji:</span>{' '}
                <span className="font-medium text-red-700">
                  {formatDate(withdrawal.endDate!)} ({withdrawal.daysRemaining} dni)
                </span>
              </p>
              <p className="mt-2 text-xs text-red-600">
                Sprzedaż i ubój tej sztuki są niewskazane do czasu zakończenia karencji.
              </p>
            </div>
          </div>
        )}

        {/* Parent Info */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-medium text-muted-foreground">Ojciec</h4>
            {sheep.father ? (
              <div className="mt-2">
                <p className="text-sm font-semibold">
                  {sheep.father.name || sheep.father.earTag}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {sheep.father.earTag}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground/50">Nieznany</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-xs font-medium text-muted-foreground">Matka</h4>
            {sheep.mother ? (
              <div className="mt-2">
                <p className="text-sm font-semibold">
                  {sheep.mother.name || sheep.mother.earTag}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {sheep.mother.earTag}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground/50">Nieznana</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Wpisy wagowe"
            value={sheep.weights?.length || 0}
          />
          <MetricCard
            label="Wizyty zdrowotne"
            value={sheep.healthRecords?.length || 0}
          />
          <MetricCard
            label="Transakcje"
            value={sheep.transactions?.length || 0}
          />
        </div>
      </div>
    </div>
  )
}
