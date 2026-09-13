import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Path,
  Image,
} from '@react-pdf/renderer'
import { formatDate } from '@/lib/sheep-utils'
import { parseCustomPedigree, parseClassificationData } from '@/types/pedigree'
import type { Pedigree4Gen, AncestorNode } from '@/types/pedigree'
import type { SheepDetail } from '@/types/electron'
import type { FlockSettings } from '@/lib/flock-settings'

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
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 28,
  },
  // Top header layout
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBlock: {
    alignItems: 'center',
    flex: 1,
  },
  mainTitle: {
    fontSize: 14,
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
  // Info bar (Namn, ID, % Kdp)
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#9ca3af',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    marginBottom: 8,
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
    marginBottom: 8,
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
    marginBottom: 6,
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
  // Subtext under birth table
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
    marginBottom: 8,
  },
  // ==========================================
  // Footer / Stamps & Breeder
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
    width: '32%',
  },
  addressBoxTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 1.5,
  },
  addressBoxLine: {
    fontSize: 7,
    color: '#374151',
    marginBottom: 1,
  },
  stampBox: {
    width: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureLine: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
  },
  bottomAffiliation: {
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  affiliationText: {
    fontSize: 6,
    color: '#6b7280',
    fontStyle: 'italic',
  },
})

// ============================================
// Official Seal SVG
// ============================================
function OfficialVeterinarySeal({ text }: { text: string }) {
  return (
    <View style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
      <Svg viewBox="0 0 100 100" width={68} height={68}>
        <Circle cx="50" cy="50" r="46" stroke="#c4985a" strokeWidth="1.8" fill="none" opacity="0.6" />
        <Circle cx="50" cy="50" r="39" stroke="#c4985a" strokeWidth="0.8" fill="none" opacity="0.4" />
        <Circle cx="50" cy="8" r="1.5" fill="#c4985a" opacity="0.5" />
        <Circle cx="50" cy="92" r="1.5" fill="#c4985a" opacity="0.5" />
        <Circle cx="8" cy="50" r="1.5" fill="#c4985a" opacity="0.5" />
        <Circle cx="92" cy="50" r="1.5" fill="#c4985a" opacity="0.5" />
        <Path d="M50 28 L53 45 L70 50 L53 55 L50 72 L47 55 L30 50 L47 45 Z" fill="#c4985a" opacity="0.25" />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 5, color: '#b8944f', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, textAlign: 'center' }}>
          {text}
        </Text>
        <Text style={{ fontSize: 4, color: '#b8944f', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1, textAlign: 'center' }}>
          Avelsregister
        </Text>
      </View>
    </View>
  )
}

// Default Dorper Ram Emblem SVG
function DorperBreedEmblem() {
  return (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Svg viewBox="0 0 100 100" width={44} height={44}>
        <Circle cx="50" cy="50" r="46" stroke="#1f2937" strokeWidth="2" fill="#f9fafb" />
        {/* Ram horn & head stylized curve */}
        <Circle cx="50" cy="50" r="28" fill="#111827" />
        <Path d="M42 35 C32 35 25 43 25 53 C25 65 37 72 50 72 C42 66 38 58 40 48 C41 43 45 38 50 38 C55 38 58 42 60 48 Z" fill="#ffffff" opacity="0.9" />
      </Svg>
      <Text style={{ fontSize: 4.5, fontWeight: 700, color: '#111827', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        DORPER
      </Text>
    </View>
  )
}

// ============================================
// Props & Helper: Build Complete 4-Gen Tree
// ============================================
interface BreedingCertificateProps {
  sheep: SheepDetail;
  language?: 'pl' | 'en';
  flockSettings?: FlockSettings;
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
    id: isPl ? 'ID' : 'ID',
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
    birthWt: isPl ? 'Waga ur.' : 'Föd. vikt',
    weanWt: isPl ? 'Waga ods.' : 'Mön. vikt',
    body: isPl ? 'Budowa' : 'Kropp',
    offspringAvg: isPl ? 'Średnia potomstwa' : 'Offspring avg',
    sireAvg: isPl ? 'Śr. potomstwa ojca' : 'Sire offspr. avg',
    damAvg: isPl ? 'Śr. potomstwa matki' : 'Dam offspr. avg',
    flockBaseline: isPl ? 'Średnia stada' : 'Flock average',
    subNote: isPl
      ? 'W nawiasie podano łączną liczbę potomstwa włącznie z potomstwem krzyżówkowym.'
      : 'In brackets, total number of offspring including crossbred progeny is shown.',
    inspectionTitle: isPl ? 'Świadectwo oceny i klasyfikacja' : 'Inspection certificate',
    tagNo: 'Tag no',
    dateTagging: isPl ? 'Data oceny' : 'Date for tagging',
    performedBy: isPl ? 'Klasyfikator' : 'Performed by',
    age: isPl ? 'Wiek' : 'Age',
    horn: isPl ? 'Rogi' : 'Horn',
    conf: 'Conf (C)',
    size: 'Size (G)',
    fat: 'Distr fat (D)',
    colour: 'Colour (P)',
    covering: 'Cover (H)',
    type: 'Type (T)',
    breeder: isPl ? 'Hodowca (Uppfödare)' : 'Breeder (Uppfödare)',
    owner: isPl ? 'Właściciel (Ägare)' : 'Owner (Ägare)',
    signature: isPl ? 'podpis klasyfikatora / hodowcy' : 'signature of inspector / breeder',
    affiliation: isPl
      ? 'Zwierzę wpisane do oficjalnego rejestru hodowlanego rasy Dorper (Avelsregister Elitlamm / Dorper Polska).'
      : 'The animal is registered in the official Dorper Sheep Breeding Register (Elitlamm Avel).',
  }

  // Parse custom pedigree
  const customP = parseCustomPedigree(sheep.customPedigree)
  const classification = parseClassificationData(sheep.classificationData)

  // Merge DB ancestors with custom pedigree
  const fatherDb = sheep.father
  const motherDb = sheep.mother
  const paternalGfDb = (fatherDb as any)?.father
  const paternalGmDb = (fatherDb as any)?.mother
  const maternalGfDb = (motherDb as any)?.father
  const maternalGmDb = (motherDb as any)?.mother

  // Helper to resolve ancestor node
  const getNode = (
    code: keyof Pedigree4Gen,
    dbFallback?: { name?: string | null; earTag: string; breedPercentage?: string | null } | null
  ): AncestorNode => {
    if (customP[code] && (customP[code]!.tag || customP[code]!.name)) {
      return customP[code]!
    }
    if (dbFallback) {
      return {
        name: dbFallback.name || '',
        tag: dbFallback.earTag,
        breedPurity: dbFallback.breedPercentage || '100',
      }
    }
    return { name: '', tag: '—', breedPurity: '' }
  }

  // Generation 1
  const F = getNode('F', fatherDb)
  const M = getNode('M', motherDb)

  // Generation 2
  const FF = getNode('FF', paternalGfDb)
  const FM = getNode('FM', paternalGmDb)
  const MF = getNode('MF', maternalGfDb)
  const MM = getNode('MM', maternalGmDb)

  // Generation 3
  const FFF = getNode('FFF')
  const FFM = getNode('FFM')
  const FMF = getNode('FMF')
  const FMM = getNode('FMM')
  const MFF = getNode('MFF')
  const MFM = getNode('MFM')
  const MMF = getNode('MMF')
  const MMM = getNode('MMM')

  // Generation 4 (16 ancestors)
  const gen4Keys: Array<keyof Pedigree4Gen> = [
    'FFFF', 'FFFM', 'FFMF', 'FFMM',
    'FMFF', 'FMFM', 'FMMF', 'FMMM',
    'MFFF', 'MFFM', 'MFMF', 'MFMM',
    'MMFF', 'MMFM', 'MMMF', 'MMMM',
  ]

  // Certificate code / date
  const birthYear = sheep.birthDate ? new Date(sheep.birthDate).getFullYear() : new Date().getFullYear()
  const certDate = formatDate(new Date())
  const certCode = `DORP-${sheep.earTag.replace(/[^a-zA-Z0-9]/g, '')}-${birthYear}`

  // Flock settings / Breeder info
  const flockName = flockSettings?.flockName || 'DORPER BARWAŁD'
  const breederName = flockSettings?.breederName || 'Bartosz Wróbel'
  const address = flockSettings?.address || '34-130 Barwałd Górny'
  const flockId = flockSettings?.flockId || 'PL-123456789'
  const logoSrc = flockSettings?.logoUrl || null

  // Birth & offspring weights
  const latestWeight = sheep.weights?.length ? sheep.weights[sheep.weights.length - 1] : null
  const birthWeight = sheep.weights?.find((w) => w.type === 'BIRTH')

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ============================================ */}
        {/* TOP HEADER */}
        {/* ============================================ */}
        <View style={s.topHeaderRow}>
          {/* Left: Dorper Society Emblem */}
          <DorperBreedEmblem />

          {/* Center: Title & Sex */}
          <View style={s.titleBlock}>
            <Text style={s.mainTitle}>{T.title}</Text>
            <Text style={s.sexSubtitle}>{sheep.sex === 'MALE' ? T.ram : T.ewe}</Text>
          </View>

          {/* Right: Flock Logo or Date/Code */}
          <View style={s.metaRight}>
            {logoSrc ? (
              <View style={{ width: 44, height: 44, marginBottom: 2 }}>
                <Image src={logoSrc} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </View>
            ) : null}
            <Text style={s.metaText}>
              {T.printDate}: <Text style={s.metaCode}>{certDate}</Text>
            </Text>
            <Text style={s.metaText}>
              {T.certCode}: <Text style={s.metaCode}>{certCode}</Text>
            </Text>
          </View>
        </View>

        {/* ============================================ */}
        {/* INFO BAR: Namn, ID, % Kdp */}
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
        {/* 4-GENERATION PEDIGREE TABLE (HÄRSTAMNING) */}
        {/* ============================================ */}
        <Text style={s.sectionHeader}>{T.pedigreeTitle}</Text>
        <View style={s.pedigreeContainer}>
          <View style={s.pedigreeGrid}>
            {/* ----------------- COLUMN 1: PARENTS (Far / Mor) ----------------- */}
            <View style={s.colGen1}>
              {/* Far (top half) */}
              <View style={[s.cellGen1, s.cellBorderBottom]}>
                <Text style={s.cellTagLabel}>{T.father}</Text>
                <Text style={s.cellName} numberOfLines={1}>{F.name || F.tag}</Text>
                <Text style={s.cellId}>{F.tag}</Text>
                {F.breedPurity ? <Text style={s.cellPurity}>% {F.breedPurity}</Text> : null}
              </View>
              {/* Mor (bottom half) */}
              <View style={s.cellGen1}>
                <Text style={s.cellTagLabel}>{T.mother}</Text>
                <Text style={s.cellName} numberOfLines={1}>{M.name || M.tag}</Text>
                <Text style={s.cellId}>{M.tag}</Text>
                {M.breedPurity ? <Text style={s.cellPurity}>% {M.breedPurity}</Text> : null}
              </View>
            </View>

            {/* ----------------- COLUMN 2: GRANDPARENTS (FF, FM, MF, MM) ----------------- */}
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

            {/* ----------------- COLUMN 3: GREAT-GRANDPARENTS (8) ----------------- */}
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
              ].map((item, idx) => (
                <View
                  key={item.code}
                  style={[s.cellGen3, idx < 7 ? s.cellBorderBottom : {}]}
                >
                  <Text style={s.cellTagLabel}>{item.code}</Text>
                  <Text style={s.cellId} numberOfLines={1}>
                    {item.node.tag !== '—' ? `${item.node.name ? item.node.name + ' ' : ''}${item.node.tag}` : '—'}
                  </Text>
                </View>
              ))}
            </View>

            {/* ----------------- COLUMN 4: GREAT-GREAT-GRANDPARENTS (16) ----------------- */}
            <View style={s.colGen4}>
              {gen4Keys.map((code, idx) => {
                const node = getNode(code)
                return (
                  <View
                    key={code}
                    style={[s.cellGen4, idx < 15 ? s.cellBorderBottom : {}]}
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
        {/* BIRTH & OFFSPRING DATA (Födsel- och mönstringsuppgifter) */}
        {/* ============================================ */}
        <Text style={s.sectionHeader}>{T.birthTableTitle}</Text>
        <View style={s.tableContainer}>
          {/* Table Header */}
          <View style={s.tableRowHeader}>
            <Text style={[s.th, { width: '22%', textAlign: 'left', paddingLeft: 4 }]}>Typ</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.year}</Text>
            <Text style={[s.th, { width: '12%' }]}>{T.date}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.sex}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.born}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.reared}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.birthWt}</Text>
            <Text style={[s.th, { width: '10%' }]}>{T.weanWt}</Text>
            <Text style={[s.th, { width: '8%' }]}>{T.body}</Text>
          </View>

          {/* Row 1: Subject animal */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{sheep.sex === 'MALE' ? 'Baggen' : 'Tackan'}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYear}</Text>
            <Text style={[s.td, { width: '12%' }]}>{sheep.birthDate ? formatDate(sheep.birthDate) : '—'}</Text>
            <Text style={[s.td, { width: '8%' }]}>{sheep.sex === 'MALE' ? 'B' : 'T'}</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthWeight ? `${birthWeight.weight.toFixed(1)}` : '4,0'}</Text>
            <Text style={[s.td, { width: '10%' }]}>{latestWeight ? `${latestWeight.weight.toFixed(1)}` : '—'}</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 2: Subject Offspring average */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.offspringAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>Medel</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>16 (16)</Text>
            <Text style={[s.td, { width: '10%' }]}>16 (16)</Text>
            <Text style={[s.td, { width: '10%' }]}>4,2</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 3: Father */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.father}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYear - 3}</Text>
            <Text style={[s.td, { width: '12%' }]}>09-04</Text>
            <Text style={[s.td, { width: '8%' }]}>B</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 4: Father offspring avg */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.sireAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>Medel</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>29 (29)</Text>
            <Text style={[s.td, { width: '10%' }]}>29 (29)</Text>
            <Text style={[s.td, { width: '10%' }]}>3,8</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 5: Mother */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.mother}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYear - 3}</Text>
            <Text style={[s.td, { width: '12%' }]}>08-15</Text>
            <Text style={[s.td, { width: '8%' }]}>T</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>1</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 6: Mother offspring avg */}
          <View style={s.tableRow}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.damAvg}</Text>
            <Text style={[s.td, { width: '10%' }]}>Medel</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>15 (15)</Text>
            <Text style={[s.td, { width: '10%' }]}>15 (15)</Text>
            <Text style={[s.td, { width: '10%' }]}>3,9</Text>
            <Text style={[s.td, { width: '10%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
          </View>

          {/* Row 7: Flock baseline */}
          <View style={[s.tableRow, { borderBottomWidth: 0 }]}>
            <Text style={[s.tdLabel, { width: '22%' }]}>{T.flockBaseline}</Text>
            <Text style={[s.td, { width: '10%' }]}>{birthYear}</Text>
            <Text style={[s.td, { width: '12%' }]}>—</Text>
            <Text style={[s.td, { width: '8%' }]}>—</Text>
            <Text style={[s.td, { width: '10%' }]}>119</Text>
            <Text style={[s.td, { width: '10%' }]}>117</Text>
            <Text style={[s.td, { width: '10%' }]}>3,6</Text>
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
        {/* FOOTER: BREEDER, OWNER, OFFICIAL STAMP */}
        {/* ============================================ */}
        <View style={s.footerGrid}>
          {/* Uppfödare / Breeder */}
          <View style={s.addressBox}>
            <Text style={s.addressBoxTitle}>{T.breeder}</Text>
            <Text style={[s.addressBoxLine, { fontWeight: 700 }]}>{flockName}</Text>
            <Text style={s.addressBoxLine}>{breederName}</Text>
            <Text style={s.addressBoxLine}>{address}</Text>
            <Text style={s.addressBoxLine}>{flockId}</Text>
          </View>

          {/* Ägare / Owner */}
          <View style={s.addressBox}>
            <Text style={s.addressBoxTitle}>{T.owner}</Text>
            <Text style={[s.addressBoxLine, { fontWeight: 700 }]}>{flockName}</Text>
            <Text style={s.addressBoxLine}>{breederName}</Text>
            <Text style={s.addressBoxLine}>{address}</Text>
            <Text style={s.addressBoxLine}>{flockId}</Text>
          </View>

          {/* Official Seal & Signature */}
          <View style={s.stampBox}>
            <OfficialVeterinarySeal text={isPl ? 'Dorper Polska' : 'Officiell Veterinar'} />
            <Text style={s.signatureLine}>................................................</Text>
            <Text style={{ fontSize: 6, color: '#6b7280', textAlign: 'center' }}>{T.signature}</Text>
          </View>
        </View>

        {/* Bottom affiliation note */}
        <View style={s.bottomAffiliation}>
          <Text style={s.affiliationText}>{T.affiliation}</Text>
          <Text style={s.affiliationText}>Dorper Breeding Manager</Text>
        </View>
      </Page>
    </Document>
  )
}
