import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, FileText, Loader2, Check, AlertCircle } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  formatAge,
  checkWithdrawal,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEX_LABELS,
  SEX_VARIANTS,
  SEX_ICONS,
} from '@/lib/sheep-utils'
import { SummaryTab } from '@/components/sheep/profile/SummaryTab'
import { GeneticsTab } from '@/components/sheep/profile/GeneticsTab'
import { WeightsTab } from '@/components/sheep/profile/WeightsTab'
import { HealthTab } from '@/components/sheep/profile/HealthTab'
import { ReproductionTab } from '@/components/sheep/profile/ReproductionTab'
import { BreedingCertificate } from '@/components/sheep/profile/BreedingCertificate'
import type { SheepDetail } from '@/types/electron'

interface SheepProfileProps {
  sheepId: string
  onBack: () => void
}

export function SheepProfile({ sheepId, onBack }: SheepProfileProps) {
  const [sheep, setSheep] = useState<SheepDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchSheep() {
      if (!window.electronAPI) {
        setError('Brak połączenia z Electron API')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const result = await window.electronAPI.sheep.getById(sheepId)
        if (!result) {
          setError('Nie znaleziono owcy o podanym ID')
        } else {
          setSheep(result as SheepDetail)
        }
      } catch (err) {
        console.error('Failed to fetch sheep:', err)
        setError('Błąd podczas ładowania danych')
      } finally {
        setLoading(false)
      }
    }

    fetchSheep()
  }, [sheepId, refreshKey])

  // PDF generation handler
  const handleGeneratePdf = useCallback(async () => {
    if (!sheep || !window.electronAPI) return

    try {
      setPdfStatus('generating')

      // Generate PDF blob using @react-pdf/renderer
      const blob = await pdf(<BreedingCertificate sheep={sheep} />).toBlob()
      const arrayBuffer = await blob.arrayBuffer()

      // Build filename: Certyfikat_PL-DRP-003_Atlas.pdf
      const namePart = sheep.name ? `_${sheep.name}` : ''
      const defaultName = `Certyfikat_${sheep.earTag.replace(/\//g, '-')}${namePart}.pdf`

      // Send to main process for save dialog
      const savedPath = await window.electronAPI.dialog.savePdf(arrayBuffer, defaultName)

      if (savedPath) {
        setPdfStatus('success')
        setTimeout(() => setPdfStatus('idle'), 3000)
      } else {
        // User cancelled the save dialog
        setPdfStatus('idle')
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
      setPdfStatus('error')
      setTimeout(() => setPdfStatus('idle'), 4000)
    }
  }, [sheep])

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Ładowanie profilu...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !sheep) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Powrót do rejestru
        </Button>
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <p className="text-muted-foreground">{error || 'Nieznany błąd'}</p>
        </div>
      </div>
    )
  }

  const withdrawal = checkWithdrawal(sheep.healthRecords || [])

  // PDF button label based on status
  const pdfButtonContent = {
    idle: (
      <>
        <FileText className="h-4 w-4" />
        Generuj Certyfikat (PDF)
      </>
    ),
    generating: (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Generowanie...
      </>
    ),
    success: (
      <>
        <Check className="h-4 w-4 text-emerald-400" />
        Zapisano!
      </>
    ),
    error: (
      <>
        <AlertCircle className="h-4 w-4 text-red-400" />
        Błąd generowania
      </>
    ),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="group -ml-2">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Powrót do rejestru
      </Button>

      {/* ==================== HEADER ==================== */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — Identity */}
          <div className="space-y-2">
            {/* Ear Tag */}
            <p className="font-mono text-sm text-muted-foreground">{sheep.earTag}</p>

            {/* Name */}
            <h1 className="text-3xl font-bold tracking-tight">
              {sheep.name || sheep.earTag}
            </h1>

            {/* Quick info line */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant={SEX_VARIANTS[sheep.sex]}>
                {SEX_ICONS[sheep.sex]} {SEX_LABELS[sheep.sex]}
              </Badge>
              <span>·</span>
              <span>{formatAge(sheep.birthDate)}</span>
              {sheep.lineage && (
                <>
                  <span>·</span>
                  <span className="text-xs">{sheep.lineage}</span>
                </>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={STATUS_VARIANTS[sheep.status]}>
                {STATUS_LABELS[sheep.status]}
              </Badge>
              {withdrawal.isActive && (
                <Badge variant="danger">
                  🔒 Karencja do {withdrawal.daysRemaining}d
                </Badge>
              )}
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex gap-2 sm:flex-col">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleGeneratePdf}
              disabled={pdfStatus === 'generating'}
            >
              {pdfButtonContent[pdfStatus]}
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== TABBED CONTENT ==================== */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="summary">Podsumowanie</TabsTrigger>
          <TabsTrigger value="genetics">Genetyka</TabsTrigger>
          <TabsTrigger value="weights">Wagi i Przyrosty</TabsTrigger>
          <TabsTrigger value="health">Zdrowie</TabsTrigger>
          <TabsTrigger value="reproduction">Rozród</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab sheep={sheep} />
        </TabsContent>

        <TabsContent value="genetics">
          <GeneticsTab sheep={sheep} />
        </TabsContent>

        <TabsContent value="weights">
          <WeightsTab sheep={sheep} onRefresh={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>

        <TabsContent value="health">
          <HealthTab sheep={sheep} onRefresh={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>

        <TabsContent value="reproduction">
          <ReproductionTab sheep={sheep} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
