import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer'
import { formatDate } from '@/lib/sheep-utils'
import { parseCustomPedigree, parseClassificationData } from '@/types/pedigree'
import type { Pedigree4Gen, AncestorNode } from '@/types/pedigree'
import type { SheepDetail } from '@/types/electron'
import type { FlockSettings } from '@/lib/flock-settings'
import { DORPER_LOGO_BASE64, UNION_LOGO_BASE64 } from '@/assets/logos-base64'

// ============================================
// Register font with Polish character support
// ============================================
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
      fontStyle: 'italic',
      fontWeight: 400,
    },
  ],
})

// Disable hyphenation (breaks Polish words)
Font.registerHyphenationCallback((word) => [word])

// ============================================
// Design tokens & styling
// ============================================
const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 7.5,
    color: '#111827',
    backgroundColor: '#ffffff',
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 26,
  },
  // Top header layout
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBoxTopLeft: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  mainTitle: {
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: '#111827',
  },
  sexSubtitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    color: '#374151',
    marginTop: 2,
  },
  metaRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  metaText: {
    fontSize: 7.5,
    color: '#4b5563',
    marginBottom: 1.5,
  },
  metaCode: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#111827',
  },
  // Info bar (Nazwa, ID, % Rasowości)
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#9ca3af',
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 7,
  },
  infoBarText: {
    fontSize: 8,
  },
  infoBarBold: {
    fontSize: 8,
    fontWeight: 700,
  },
  // Section Header
  sectionHeader: {
    fontSize: 8.5,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  // ==========================================
  // Pedigree Table (4 Columns)
  // ==========================================
  pedigreeContainer: {
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 7,
  },
  pedigreeGrid: {
    flexDirection: 'row',
    height: 184, // total height of 4-generation tree
  },
  // Gen 1 (Parents): 28% width
  colGen1: {
    width: '28%',
    borderRightWidth: 1,
    borderRightColor: '#6b7280',
  },
  // Gen 2 (Grandparents): 26% width
  colGen2: {
    width: '26%',
    borderRightWidth: 1,
    borderRightColor: '#6b7280',
  },
  // Gen 3 (Great-grandparents): 24% width
  colGen3: {
    width: '24%',
    borderRightWidth: 1,
    borderRightColor: '#6b7280',
  },
  // Gen 4 (Great-great-grandparents): 22% width
  colGen4: {
    width: '22%',
  },
  // Cells
  cellGen1: {
    height: 92,
    padding: 3,
    justifyContent: 'center',
  },
  cellGen2: {
    height: 46,
    padding: 2.5,
    justifyContent: 'center',
  },
  cellGen3: {
    height: 23,
    paddingHorizontal: 2.5,
    paddingVertical: 1,
    justifyContent: 'center',
  },
  cellGen4: {
    height: 11.5,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  cellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
  },
  cellTagLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: '#4b5563',
    marginBottom: 0.5,
  },
  cellName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#111827',
  },
  cellId: {
    fontSize: 6.5,
    fontFamily: 'Roboto',
    color: '#374151',
  },
  cellPurity: {
    fontSize: 6,
    color: '#4b5563',
  },
  cellGen4Text: {
    fontSize: 5.5,
    color: '#1f2937',
  },
  // ==========================================
  // Middle Table: Birth & Offspring Data
  // ==========================================
  tableContainer: {
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#d1d5db',
    minHeight: 12,
    alignItems: 'center',
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563',
    backgroundColor: '#f3f4f6',
    minHeight: 13,
    alignItems: 'center',
  },
  th: {
    fontSize: 6.5,
    fontWeight: 700,
    color: '#374151',
    textAlign: 'center',
    paddingVertical: 1.5,
  },
  td: {
    fontSize: 6.5,
    color: '#1f2937',
    textAlign: 'center',
    paddingVertical: 1,
  },
  tdLabel: {
    fontSize: 6.5,
    fontWeight: 700,
    color: '#111827',
    textAlign: 'left',
    paddingLeft: 4,
  },
  subNote: {
    fontSize: 5.8,
    fontStyle: 'italic',
    color: '#4b5563',
    marginBottom: 6,
  },
  // ==========================================
  // Inspection Certificate Table
  // ==========================================
  inspectionContainer: {
    borderWidth: 1,
    borderColor: '#4b5563',
    marginBottom: 7,
  },
  // ==========================================
  // Footer / Breeder, Owner, Signature & Union Logo
  // ==========================================
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.8,
    borderTopColor: '#d1d5db',
  },
  addressBox: {
    width: '26%',
  },
  addressBoxTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 1.5,
  },
  addressBoxLine: {
    fontSize: 6.8,
    color: '#374151',
    marginBottom: 1,
  },
  signatureBox: {
    width: '28%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  signatureLine: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 2,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 6.5,
    color: '#4b5563',
    textAlign: 'center',
  },
  unionBox: {
    width: '18%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomAffiliation: {
    marginTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  affiliationText: {
    fontSize: 6,
    color: '#4b5563',
    fontStyle: 'italic',
  },
})

// ============================================
// Helper: format node
// ============================================
function fmtNode(node?: AncestorNode | null): {
  tag: string
  name: string
  breedPurity?: string
} {
  if (!node || (!node.tag && !node.name)) {
    return { tag: '—', name: '', breedPurity: undefined }
  }
  return {
    tag: node.tag || '—',
    name: node.name || '',
    breedPurity: node.breedPurity,
  }
}

interface BreedingCertificateProps {
  sheep: SheepDetail
  language?: 'pl' | 'en'
  flockSettings?: FlockSettings
}

export function BreedingCertificate({
  sheep,
  language = 'pl',
  flockSettings,
}: BreedingCertificateProps) {
  const isPl = language === 'pl'

  // Labels based on selected language
  const T = {
    title: isPl ? 'ŚWIADECTWO POCHODZENIA - DORPER' : 'PEDIGREE CERTIFICATE - DORPER',
    ram: isPl ? 'TRYK' : 'RAM',
    ewe: isPl ? 'OWCA' : 'EWE',
    printDate: isPl ? 'Data wydruku' : 'Date of issue',
    certCode: isPl ? 'Kod certyfikatu' : 'Certificate ID',
    name: isPl ? 'Nazwa' : 'Name',
    id: isPl ? 'Nr kolczyka' : 'Tag ID',
    purity: isPl ? '% Rasowości' : '% Dorper',
    pedigreeTitle: isPl ? 'Pochodzenie (Rodowód)' : 'Pedigree',
    father: isPl ? 'Ojciec' : 'Sire',
    mother: isPl ? 'Matka' : 'Dam',
    birthTableTitle: isPl ? 'Dane o urodzeniu i miotach' : 'Birth and offspring data',
    year: isPl ? 'Rok' : 'Year',
    date: isPl ? 'Data' : 'Date',
    sex: isPl ? 'Płeć' : 'Sex',
    born: isPl ? 'Urodz.' : 'Born',
    reared: isPl ? 'Odchow.' : 'Reared',
    birthWt: isPl ? 'Waga ur.' : 'Birth wt.',
    weanWt: isPl ? 'Waga ods.' : 'Wean wt.',
    body: isPl ? 'Budowa' : 'Body',
    offspringAvg: isPl ? 'Średnia potomstwa' : 'Offspring avg.',
    sireAvg: isPl ? 'Śr. potomstwa ojca' : 'Sire offspr. avg.',
    damAvg: isPl ? 'Śr. potomstwa matki' : 'Dam offspr. avg.',
    flockBaseline: isPl ? 'Średnia stada' : 'Flock average',
    avgLabel: isPl ? 'Średnia' : 'Average',
    subNote: isPl
      ? 'W nawiasie podano łączną liczbę potomstwa włącznie z potomstwem krzyżówkowym.'
      : 'In brackets, total number of offspring including crossbred progeny is shown.',
    inspectionTitle: isPl ? 'Świadectwo oceny i klasyfikacja' : 'Inspection certificate',
    tagNo: isPl ? 'Nr kolczyka' : 'Tag no',
    dateTagging: isPl ? 'Data oceny' : 'Date of insp.',
    performedBy: isPl ? 'Klasyfikator' : 'Performed by',
    age: isPl ? 'Wiek' : 'Age',
    horn: isPl ? 'Rogi' : 'Horn',
    conf: 'Conf (C)',
    size: 'Size (G)',
    fat: 'Fat (D)',
    colour: 'Colour (P)',
    covering: 'Cover (H)',
    type: 'Type (T)',
    breeder: isPl ? 'Hodowca' : 'Breeder',
    owner: isPl ? 'Właściciel' : 'Owner',
    signature: isPl ? 'podpis klasyfikatora / hodowcy' : 'signature of inspector / breeder',
    affiliation: isPl
      ? 'Zwierzę wpisane do oficjalnego rejestru hodowlanego rasy Dorper – Regionalny Związek Hodowców Owiec i Kóz w Nowym Targu.'
      : 'Animal registered in the official Dorper breeding register – Regional Sheep and Goat Breeders Association in Nowy Targ.',
  }

  // Parse custom pedigree
  const customP = parseCustomPedigree(sheep.customPedigree)
  const classification = parseClassificationData(sheep.classificationData)

  // Merge DB ancestors with custom pedigree
  const fatherDb = sheep.father
  const motherDb = sheep.mother

  // Gen 1
  const F = fmtNode(
    customP.gen1?.F ||
      (fatherDb ? { tag: fatherDb.earTag, name: fatherDb.name, breedPurity: fatherDb.breedPercentage } : null)
  )
  const M = fmtNode(
    customP.gen1?.M ||
      (motherDb ? { tag: motherDb.earTag, name: motherDb.name, breedPurity: motherDb.breedPercentage } : null)
  )

  // Gen 2
  const FF = fmtNode(
    customP.gen2?.FF ||
      (fatherDb?.father ? { tag: fatherDb.father.earTag, name: fatherDb.father.name, breedPurity: fatherDb.father.breedPercentage } : null)
  )
  const FM = fmtNode(
    customP.gen2?.FM ||
      (fatherDb?.mother ? { tag: fatherDb.mother.earTag, name: fatherDb.mother.name, breedPurity: fatherDb.mother.breedPercentage } : null)
  )
  const MF = fmtNode(
    customP.gen2?.MF ||
      (motherDb?.father ? { tag: motherDb.father.earTag, name: motherDb.father.name, breedPurity: motherDb.father.breedPercentage } : null)
  )
  const MM = fmtNode(
    customP.gen2?.MM ||
      (motherDb?.mother ? { tag: motherDb.mother.earTag, name: motherDb.mother.name, breedPurity: motherDb.mother.breedPercentage } : null)
  )

  // Gen 3
  const FFF = fmtNode(customP.gen3?.FFF)
  const FFM = fmtNode(customP.gen3?.FFM)
  const FMF = fmtNode(customP.gen3?.FMF)
  const FMM = fmtNode(customP.gen3?.FMM)
  const MFF = fmtNode(customP.gen3?.MFF)
  const MFM = fmtNode(customP.gen3?.MFM)
  const MMF = fmtNode(customP.gen3?.MMF)
  const MMM = fmtNode(customP.gen3?.MMM)

  // Gen 4 (16 nodes)
  const g4 = customP.gen4 || {}
  const gen4List = [
    { code: 'FFFF', node: fmtNode(g4.FFFF) },
    { code: 'FFFM', node: fmtNode(g4.FFFM) },
    { code: 'FFMF', node: fmtNode(g4.FFMF) },
    { code: 'FFMM', node: fmtNode(g4.FFMM) },
    { code: 'FMFF', node: fmtNode(g4.FMFF) },
    { code: 'FMFM', node: fmtNode(g4.FMFM) },
    { code: 'FMMF', node: fmtNode(g4.FMMF) },
    { code: 'FMMM', node: fmtNode(g4.FMMM) },
    { code: 'MFFF', node: fmtNode(g4.MFFF) },
    { code: 'MFFM', node: fmtNode(g4.MFFM) },
    { code: 'MFMF', node: fmtNode(g4.MFMF) },
    { code: 'MFMM', node: fmtNode(g4.MFMM) },
    { code: 'MMFF', node: fmtNode(g4.MMFF) },
    { code: 'MMFM', node: fmtNode(g4.MMFM) },
    { code: 'MMMF', node: fmtNode(g4.MMMF) },
    { code: 'MMMM', node: fmtNode(g4.MMMM) },
  ]

  // Certificate metadata
  const certDate = formatDate(new Date())
  const birthYear = sheep.birthDate ? new Date(sheep.birthDate).getFullYear() : new Date().getFullYear()
  const certCode = `DORP-${sheep.earTag.replace(/[^a-zA-Z0-9]/g, '')}-${birthYear}`

  // Flock settings / Breeder info
  const flockName = flockSettings?.flockName || 'DORPER BARWAŁD'
  const breederName = flockSettings?.breederName || 'Bartosz Wróbel'
  const address = flockSettings?.address || '34-130 Barwałd Górny'
  const flockId = flockSettings?.flockId || 'PL-123456789'

  // Logos (always pre-loaded)
  const dorperLogoSrc = flockSettings?.logoUrl || DORPER_LOGO_BASE64
  const unionLogoSrc = flockSettings?.unionLogoUrl || UNION_LOGO_BASE64

  // Live database calculations for Birth & Offspring table
  const birthYearStr = sheep.birthDate ? String(new Date(sheep.birthDate).getFullYear()) : '—'
  const birthDateFormatted = sheep.birthDate ? formatDate(sheep.birthDate) : '—'
  const isMale = sheep.sex === 'MALE'
  const subjectSexCode = isMale ? (isPl ? 'T' : 'M') : (isPl ? 'O' : 'F')
  const subjectTypeName = isMale ? (isPl ? 'Tryk' : 'Ram') : (isPl ? 'Owca' : 'Ewe')

  const birthWeightRecord = sheep.weights?.find((w) => w.type === 'BIRTH')
  const weanWeightRecord = sheep.weights?.find((w) => w.type === 'WEANING')
  const birthWeightVal = birthWeightRecord ? birthWeightRecord.weight.toFixed(1).replace('.', ',') : '—'
  const weanWeightVal = weanWeightRecord ? weanWeightRecord.weight.toFixed(1).replace('.', ',') : '—'
  const bodyVal = classification?.conf || '—'

  // Offspring from DB
  const litters = isMale ? (sheep.littersFather || []) : (sheep.littersMother || [])
  const children = isMale ? (sheep.childrenAsFather || []) : (sheep.childrenAsMother || [])
  const totalBorn = litters.reduce((acc, l) => acc + (l.bornCount || 0), 0) || (children.length > 0 ? children.length : 0)
  const totalWeaned = litters.reduce((acc, l) => acc + (l.weanedCount ?? l.bornCount ?? 0), 0) || (children.length > 0 ? children.length : 0)

  // Father & Mother info
  const fatherBirthYear = fatherDb?.birthDate ? String(new Date(fatherDb.birthDate).getFullYear()) : '—'
  const fatherBirthDate = fatherDb?.birthDate ? formatDate(fatherDb.birthDate) : '—'
  const motherBirthYear = motherDb?.birthDate ? String(new Date(motherDb.birthDate).getFullYear()) : '—'
  const motherBirthDate = motherDb?.birthDate ? formatDate(motherDb.birthDate) : '—'

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ============================================ */}
        {/* TOP HEADER: Dorper logo (left), Title (center), Meta (right) */}
        {/* ============================================ */}
        <View style={s.topHeaderRow}>
          {/* Left: User's Dorper Logo (Image 1) */}
          <View style={s.logoBoxTopLeft}>
            <Image src={dorperLogoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </View>

          {/* Center: Title & Sex */}
          <View style={s.titleBlock}>
            <Text style={s.mainTitle}>{T.title}</Text>
            <Text style={s.sexSubtitle}>{isMale ? T.ram : T.ewe}</Text>
          </View>

          {/* Right: Date/Code */}
          <View style={s.metaRight}>
            <Text style={s.metaText}>
              {T.printDate}: <Text style={s.metaCode}>{certDate}</Text>
            </Text>
            <Text style={s.metaText}>
              {T.certCode}: <Text style={s.metaCode}>{certCode}</Text>
            </Text>
          </View>
        </View>

        {/* ============================================ */}
        {/* INFO BAR: Nazwa, Nr kolczyka, % Rasowości */}
        {/* ============================================ */}
        <View style={s.infoBar}>
          <Text style={s.infoBarText}>
            {T.name}: <Text style={s.infoBarBold}>{sheep.name || sheep.earTag}</Text>
          </Text>
          <Text style={s.infoBarText}>
            {T.id}: <Text style={s.infoBarBold}>{sheep.earTag}</Text>
          </Text>
          <Text style={s.infoBarText}>
            {T.purity}: <Text style={s.infoBarBold}>{sheep.breedPercentage || '100'}</Text>
          </Text>
        </View>

        {/* ============================================ */}
        {/* 4-GENERATION PEDIGREE TABLE (RODOWÓD) */}
        {/* ============================================ */}
        <Text style={s.sectionHeader}>{T.pedigreeTitle}</Text>
        <View style={s.pedigreeContainer}>
          <View style={s.pedigreeGrid}>
            {/* ----------------- COLUMN 1: PARENTS (28%) ----------------- */}
            <View style={s.colGen1}>
              {/* Father (top half) */}
              <View style={[s.cellGen1, s.cellBorderBottom]}>
                <Text style={s.cellTagLabel}>{T.father}</Text>
                <Text style={s.cellName} numberOfLines={1}>{F.name || F.tag}</Text>
                <Text style={s.cellId}>{F.tag}</Text>
                {F.breedPurity ? <Text style={s.cellPurity}>% {F.breedPurity}</Text> : null}
              </View>
              {/* Mother (bottom half) */}
              <View style={s.cellGen1}>
                <Text style={s.cellTagLabel}>{T.mother}</Text>
                <Text style={s.cellName} numberOfLines={1}>{M.name || M.tag}</Text>
                <Text style={s.cellId}>{M.tag}</Text>
                {M.breedPurity ? <Text style={s.cellPurity}>% {M.breedPurity}</Text> : null}
              </View>
            </View>

            {/* ----------------- COLUMN 2: GRANDPARENTS (26%) ----------------- */}
            <View style={s.colGen2}>
              <View style={[s.cellGen2, s.cellBorderBottom]}>
                <Text style={s.cellTagLabel}>FF</Text>
                <Text style={s.cellName} numberOfLines={1}>{FF.name || FF.tag}</Text>
                <Text style={s.cellId}>{FF.tag}</Text>
                {FF.breedPurity ? <Text style={s.cellPurity}>% {FF.breedPurity}</Text> : null}
              </View>
              <View style={[s.cellGen2, s.cellBorderBottom]}>
                <Text style={s.cellTagLabel}>FM</Text>
                <Text style={s.cellName} numberOfLines={1}>{FM.name || FM.tag}</Text>
                <Text style={s.cellId}>{FM.tag}</Text>
                {FM.breedPurity ? <Text style={s.cellPurity}>% {FM.breedPurity}</Text> : null}
              </View>
              <View style={[s.cellGen2, s.cellBorderBottom]}>
                <Text style={s.cellTagLabel}>MF</Text>
                <Text style={s.cellName} numberOfLines={1}>{MF.name || MF.tag}</Text>
                <Text style={s.cellId}>{MF.tag}</Text>
                {MF.breedPurity ? <Text style={s.cellPurity}>% {MF.breedPurity}</Text> : null}
              </View>
              <View style={s.cellGen2}>
                <Text style={s.cellTagLabel}>MM</Text>
                <Text style={s.cellName} numberOfLines={1}>{MM.name || MM.tag}</Text>
                <Text style={s.cellId}>{MM.tag}</Text>
                {MM.breedPurity ? <Text style={s.cellPurity}>% {MM.breedPurity}</Text> : null}
              </View>
            </View>

            {/* ----------------- COLUMN 3: GREAT-GRANDPARENTS (24%) ----------------- */}
            <View style={s.colGen3}>
              {[
                { code: 'FFF', node: FFF },
                { code: 'FFM', node: FFM },
                { code: 'FMF', node: FMF },
                { code: 'FMM', node: FMM },
                { code: 'MFF', node: MFF },
                { code: 'MFM', node: MFM },
                { code: 'MMF', node: MMF },
                { code: 'MMM', node: MMM },
              ].map(({ code, node }, idx) => (
                <View
                  key={code}
                  style={[s.cellGen3, idx < 7 ? s.cellBorderBottom : {}]}
                >
                  <Text style={s.cellTagLabel}>{code}</Text>
                  <Text style={s.cellName} numberOfLines={1}>{node.name || node.tag}</Text>
                  <Text style={s.cellId}>{node.tag}</Text>
                </View>
              ))}
            </View>

            {/* ----------------- COLUMN 4: GREAT-GREAT-GRANDPARENTS (22%) ----------------- */}
            <View style={s.colGen4}>
              {gen4List.map(({ code, node }, idx) => {
                const isLast = idx === gen4List.length - 1
                return (
                  <View
                    key={code}
                    style={[s.cellGen4, !isLast ? s.cellBorderBottom : {}]}
                  >
                    <Text style={s.cellGen4Text} numberOfLines={1}>
                      {node.tag !== '—' ? `${code}: ${node.tag}` : `${code}: —`}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        {/* ============================================ */}
        {/* BIRTH & OFFSPRING DATA (Dane o urodzeniu i miotach) */}
        {/* Pure DB data without hardcoded dummy numbers */}
        {/* ============================================ */}
        <Text style={s.sectionHeader}>{T.birthTableTitle}</Text>
        <View style={s.tableContainer}>
          {/* Table Header */}
          <View style={s.tableRowHeader}>
            <Text style={[s.th, { width: '22%', textAlign: 'left', paddingLeft: 4 }]}>{isPl ? 'Typ' : 'Type'}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.year}</Text>
            <Text style={[s.th, { width: '12%' }]}>{T.date}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.sex}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.born}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.reared}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.birthWt}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.weanWt}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.body}</Text>
          </View>

          {/* Row 1: Subject animal (Tryk / Owca) */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{subjectTypeName}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYearStr}</Text>
            <Text style={[s.td, { width: '12%' }]}>{birthDateFormatted}</Text>
            <Text style={[s.td, { width: '8%' }]}>{subjectSexCode}</Text>
            <Text style={[s.td, { width: '10%' }]}>{sheep.litterSize ? String(sheep.litterSize) : '1'}</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthWeightVal}</Text>
            <Text style={[s.td, { width: '10%' }]}>{weanWeightVal}</Text>
            <Text style={[s.td, { width: '8%' }]}>{bodyVal}</Text>
          </View>

          {/* Row 2: Subject Offspring average */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.offspringAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>{T.avgLabel}</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>{totalBorn > 0 ? String(totalBorn) : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>{totalWeaned > 0 ? String(totalWeaned) : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 3: Father */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.father}</Text>
            <Text style={[s.td, { width: '10%' }]}>{fatherBirthYear}</Text>
            <Text style={[s.td, { width: '12%' }]}>{fatherBirthDate}</Text>
            <Text style={[s.td, { width: '8%' }]}>{fatherDb ? (isPl ? 'T' : 'M') : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>{fatherDb?.litterSize ? String(fatherDb.litterSize) : (fatherDb ? '1' : '—')}</Text>
            <Text style={[s.td, { width: '10%' }]}>{fatherDb ? '1' : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 4: Father offspring avg */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.sireAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>{T.avgLabel}</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 5: Mother */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.mother}</Text>
            <Text style={[s.td, { width: '10%' }]}>{motherBirthYear}</Text>
            <Text style={[s.td, { width: '12%' }]}>{motherBirthDate}</Text>
            <Text style={[s.td, { width: '8%' }]}>{motherDb ? (isPl ? 'O' : 'F') : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>{motherDb?.litterSize ? String(motherDb.litterSize) : (motherDb ? '1' : '—')}</Text>
            <Text style={[s.td, { width: '10%' }]}>{motherDb ? '1' : '—'}</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 6: Mother offspring avg */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.damAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>{T.avgLabel}</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 7: Flock baseline */}
          <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.flockBaseline}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYearStr}</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>
        </View>

        <Text style={s.subNote}>{T.subNote}</Text>

        {/* ============================================ */}
        {/* INSPECTION CERTIFICATE TABLE */}
        {/* ============================================ */}
        <Text style={s.sectionHeader}>{T.inspectionTitle}</Text>
        <View style={s.inspectionContainer}>
          {/* Header row */}
          <View style={s.tableRowHeader}>
            <Text style={[s.th, { width: '14%' }]}>{T.tagNo}</Text>
            <Text style={[s.th, { width: '14%' }]}>{T.dateTagging}</Text>
            <Text style={[s.th, { width: '16%' }]}>{T.performedBy}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.age}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.horn}</Text>
            <Text style={[s.th, { width: '7%' }]}>C</Text>
            <Text style={[s.th, { width: '7%' }]}>G</Text>
            <Text style={[s.th, { width: '7%' }]}>D</Text>
            <Text style={[s.th, { width: '7%' }]}>P</Text>
            <Text style={[s.th, { width: '6%' }]}>H</Text>
            <Text style={[s.th, { width: '6%' }]}>T</Text>
          </View>

          {/* Inspection Data Row — either filled from program or blank for handwriting */}
          <View style={[s.tableRow, { minHeight: 20, borderBottomWidth: 0 }]}>
            <Text style={[s.td, { width: '14%', fontFamily: 'Roboto', fontWeight: 700 }]}>
              {classification?.tagNo || sheep.earTag}
            </Text>
            <Text style={[s.td, { width: '14%' }]}>
              {classification?.date ? formatDate(classification.date) : ''}
            </Text>
            <Text style={[s.td, { width: '16%' }]}>
              {classification?.performedBy || ''}
            </Text>
            <Text style={[s.td, { width: '8%' }]}>
              {classification?.age || ''}
            </Text>
            <Text style={[s.td, { width: '8%' }]}>
              {classification?.horn || ''}
            </Text>
            <Text style={[s.td, { width: '7%', fontWeight: 700 }]}>
              {classification?.conf || ''}
            </Text>
            <Text style={[s.td, { width: '7%', fontWeight: 700 }]}>
              {classification?.size || ''}
            </Text>
            <Text style={[s.td, { width: '7%', fontWeight: 700 }]}>
              {classification?.fat || ''}
            </Text>
            <Text style={[s.td, { width: '7%', fontWeight: 700 }]}>
              {classification?.colour || ''}
            </Text>
            <Text style={[s.td, { width: '6%', fontWeight: 700 }]}>
              {classification?.covering || ''}
            </Text>
            <Text style={[s.td, { width: '6%', fontWeight: 700 }]}>
              {classification?.type || ''}
            </Text>
          </View>
        </View>

        {/* ============================================ */}
        {/* FOOTER: BREEDER, OWNER, SIGNATURE & UNION LOGO */}
        {/* ============================================ */}
        <View style={s.footerGrid}>
          {/* Hodowca / Breeder */}
          <View style={s.addressBox}>
            <Text style={s.addressBoxTitle}>{T.breeder}</Text>
            <Text style={[s.addressBoxLine, { fontWeight: 700 }]}>{flockName}</Text>
            <Text style={s.addressBoxLine}>{breederName}</Text>
            <Text style={s.addressBoxLine}>{address}</Text>
            <Text style={s.addressBoxLine}>{flockId}</Text>
          </View>

          {/* Właściciel / Owner */}
          <View style={s.addressBox}>
            <Text style={s.addressBoxTitle}>{T.owner}</Text>
            <Text style={[s.addressBoxLine, { fontWeight: 700 }]}>{flockName}</Text>
            <Text style={s.addressBoxLine}>{breederName}</Text>
            <Text style={s.addressBoxLine}>{address}</Text>
            <Text style={s.addressBoxLine}>{flockId}</Text>
          </View>

          {/* Signature area (No fake SVG stamp) */}
          <View style={s.signatureBox}>
            <Text style={s.signatureLine}>................................................</Text>
            <Text style={s.signatureLabel}>{T.signature}</Text>
          </View>

          {/* Official Union Logo (Image 4: RZHOiK NOWY TARG) */}
          <View style={s.unionBox}>
            <View style={{ width: 54, height: 54 }}>
              <Image src={unionLogoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </View>
            <Text style={{ fontSize: 5, color: '#047857', fontWeight: 700, textAlign: 'center', marginTop: 2 }}>
              RZHOiK NOWY TARG
            </Text>
          </View>
        </View>

        {/* Bottom affiliation note */}
        <View style={s.bottomAffiliation}>
          <Text style={s.affiliationText}>{T.affiliation}</Text>
          <Text style={s.affiliationText}>Dorper Breeding Register</Text>
        </View>
      </Page>
    </Document>
  )
}

export { BreedingCertificate as BreedingCertificateDocument }
