import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  GitBranch,
  Award,
  Globe,
  Download,
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatAge,
  checkWithdrawal,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEX_LABELS,
  SEX_VARIANTS,
  SEX_ICONS,
} from '@/lib/sheep-utils'
import { useFlockSettings } from '@/lib/flock-settings'
import { parseClassificationData } from '@/types/pedigree'
import { SummaryTab } from '@/components/sheep/profile/SummaryTab'
import { GeneticsTab } from '@/components/sheep/profile/GeneticsTab'
import { WeightsTab } from '@/components/sheep/profile/WeightsTab'
import { HealthTab } from '@/components/sheep/profile/HealthTab'
import { ReproductionTab } from '@/components/sheep/profile/ReproductionTab'
import { BreedingCertificate } from '@/components/sheep/profile/BreedingCertificate'
import { PedigreeEditorDialog } from '@/components/sheep/profile/PedigreeEditorDialog'
import { ClassificationDialog } from '@/components/sheep/profile/ClassificationDialog'
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

  // Dialog states
  const [showCertDialog, setShowCertDialog] = useState(false)
  const [showPedigreeDialog, setShowPedigreeDialog] = useState(false)
  const [showClassificationDialog, setShowClassificationDialog] = useState(false)
  const [certLang, setCertLang] = useState<'pl' | 'en'>('pl')

  const { settings: flockSettings } = useFlockSettings()

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

  // PDF generation handler with language support
  const handleGeneratePdf = useCallback(async (lang: 'pl' | 'en' = certLang) => {
    if (!sheep || !window.electronAPI) return

    try {
      setPdfStatus('generating')

      // Generate PDF blob using @react-pdf/renderer
      const blob = await pdf(
        <BreedingCertificate
          sheep={sheep}
          language={lang}
          flockSettings={flockSettings}
        />
      ).toBlob()
      const arrayBuffer = await blob.arrayBuffer()

      // Build filename: Certyfikat_PL-DRP-003_Atlas.pdf
      const namePart = sheep.name ? `_${sheep.name}` : ''
      const prefix = lang === 'pl' ? 'Certyfikat' : 'Pedigree'
      const defaultName = `${prefix}_${sheep.earTag.replace(/\//g, '-')}${namePart}.pdf`

      // Send to main process / web downloader
      const savedPath = await window.electronAPI.dialog.savePdf(arrayBuffer, defaultName)

      if (savedPath) {
        setPdfStatus('success')
        setShowCertDialog(false)
        setTimeout(() => setPdfStatus('idle'), 3000)
      } else {
        setPdfStatus('idle')
      }
    } catch (err) {
      console.error('PDF generation failed:', err)
      setPdfStatus('error')
      setTimeout(() => setPdfStatus('idle'), 4000)
    }
  }, [sheep, certLang, flockSettings])

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
  const classification = parseClassificationData(sheep.classificationData)
  const hasClassification = Boolean(
    classification &&
    (classification.horn || classification.conf || classification.size || classification.performedBy)
  )

  // PDF button label based on status
  const pdfButtonContent = {
    idle: (
      <>
        <FileText className="h-4 w-4" />
        Certyfikat (PDF)
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
              {sheep.breedPercentage && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                  {sheep.breedPercentage}% Dorper
                </Badge>
              )}
              {hasClassification && (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                  <Award className="h-3 w-3 mr-1" />
                  Skasyfikowany ({classification.horn || 'Ocena'})
                </Badge>
              )}
              {withdrawal.isActive && (
                <Badge variant="danger">
                  🔒 Karencja do {withdrawal.daysRemaining}d
                </Badge>
              )}
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowCertDialog(true)}
              disabled={pdfStatus === 'generating'}
            >
              {pdfButtonContent[pdfStatus]}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowPedigreeDialog(true)}
            >
              <GitBranch className="h-4 w-4" />
              Rodowód (4 pokolenia)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowClassificationDialog(true)}
            >
              <Award className="h-4 w-4" />
              Klasyfikacja / Ocena
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
          <GeneticsTab
            sheep={sheep}
            onOpenPedigreeEditor={() => setShowPedigreeDialog(true)}
          />
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

      {/* ==================== CERTIFICATE LANGUAGE DIALOG ==================== */}
      <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generuj Certyfikat Hodowlany (PDF)
            </DialogTitle>
            <DialogDescription>
              Wybierz język urzędowy certyfikatu. Dokument zawiera 4 pokolenia rodowodu,
              tabelę pomiarów oraz kartę klasyfikacji.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Język dokumentu
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCertLang('pl')}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    certLang === 'pl'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                      : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                  }`}
                >
                  <span className="text-2xl">🇵🇱</span>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Polski</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Świadectwo Pochodzenia
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCertLang('en')}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    certLang === 'en'
                      ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                      : 'border-border bg-card/60 hover:bg-card text-muted-foreground'
                  }`}
                >
                  <span className="text-2xl">🇬🇧</span>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">English</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Pedigree Certificate
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs space-y-1.5">
              <p className="font-medium text-foreground">Szczegóły certyfikatu:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                <li>Owca: <span className="font-mono font-medium text-foreground">{sheep.earTag}</span> {sheep.name && `(${sheep.name})`}</li>
                <li>Hodowla: <span className="font-medium text-foreground">{flockSettings.flockName || 'Nie ustawiono'}</span></li>
                <li>Logo: {flockSettings.logoUrl ? <span className="text-emerald-400">Dołączone ✓</span> : <span className="text-amber-400">Brak (możesz dodać w Ustawieniach)</span>}</li>
                <li>Klasyfikacja: {hasClassification ? <span className="text-emerald-400">Wypełniona ✓</span> : <span className="text-muted-foreground">Pusta tabelka na pieczątkę/wpis ✓</span>}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setShowCertDialog(false)}>
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={() => handleGeneratePdf(certLang)}
              disabled={pdfStatus === 'generating'}
              className="gap-2"
            >
              {pdfStatus === 'generating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generowanie PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Pobierz PDF ({certLang.toUpperCase()})
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== 4-GEN PEDIGREE EDITOR DIALOG ==================== */}
      <PedigreeEditorDialog
        open={showPedigreeDialog}
        onOpenChange={setShowPedigreeDialog}
        sheep={sheep}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* ==================== CLASSIFICATION DIALOG ==================== */}
      <ClassificationDialog
        open={showClassificationDialog}
        onOpenChange={setShowClassificationDialog}
        sheep={sheep}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
