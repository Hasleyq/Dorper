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
} from '@react-pdf/renderer'
import { formatDate, formatAge, SEX_LABELS, STATUS_LABELS } from '@/lib/sheep-utils'
import type { SheepDetail } from '@/types/electron'

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
// Design tokens
// ============================================
const colors = {
  primary: '#d97706',
  bg: '#FAFAF9',
  text: '#1c1917',
  muted: '#78716c',
  border: '#d6d3d1',
  lightBorder: '#e7e5e4',
  accent: '#fffbeb',
  sealStroke: '#c4985a',
  sealText: '#b8944f',
}

// ============================================
// Styles
// ============================================
const s = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.bg,
    padding: 40,
    paddingBottom: 100,
  },
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  headerBreed: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Section title
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 10,
  },
  // Info grid — 2-column layout
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    width: '50%',
    marginBottom: 6,
  },
  infoLabel: {
    width: 100,
    fontSize: 9,
    color: colors.muted,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 700,
  },
  // ==========================================
  // Pedigree table — fixed widths
  // ==========================================
  pedigreeTable: {
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 5,
  },
  pedigreeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 40,
  },
  pedigreeRowLast: {
    flexDirection: 'row',
    minHeight: 40,
  },
  pedigreeHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.accent,
    minHeight: 24,
  },
  // Column 1: generation label — fixed 80pt
  colGen: {
    width: 80,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  // Column 2: father side — exactly 50% of remaining
  colFather: {
    width: '50%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  // Column 3: mother side — exactly 50% of remaining
  colMother: {
    width: '50%',
    padding: 6,
  },
  pedigreeLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pedigreeName: {
    fontSize: 10,
    fontWeight: 700,
  },
  pedigreeTag: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 1,
  },
  // ==========================================
  // Footer / Issuer
  // ==========================================
  footerArea: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  footerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  // Seal (bottom left)
  sealContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Issuer (bottom right)
  issuerContainer: {
    alignItems: 'flex-end',
  },
  issuerLabel: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 4,
  },
  issuerName: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 8,
  },
  signatureLine: {
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1,
  },
  signatureCaption: {
    fontSize: 7,
    color: colors.muted,
    marginTop: 2,
  },
  // Meta line
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaText: {
    fontSize: 7,
    color: colors.muted,
  },
})

// ============================================
// Helper: ancestor cell
// ============================================
function AncestorCell({
  label,
  ancestor,
  style,
}: {
  label: string
  ancestor: { earTag: string; name?: string | null; sex?: string } | null | undefined
  style: any
}) {
  return (
    <View style={style}>
      <Text style={s.pedigreeLabel}>{label}</Text>
      {ancestor ? (
        <>
          <Text style={s.pedigreeName}>{ancestor.name || ancestor.earTag}</Text>
          <Text style={s.pedigreeTag}>{ancestor.earTag}</Text>
        </>
      ) : (
        <Text style={{ ...s.pedigreeName, color: colors.muted, fontStyle: 'italic' }}>Nieznany</Text>
      )}
    </View>
  )
}

// ============================================
// Official Seal SVG (circular stamp)
// ============================================
function OfficialSeal() {
  return (
    <View style={s.sealContainer}>
      <Svg viewBox="0 0 100 100" width={90} height={90}>
        {/* Outer ring */}
        <Circle cx="50" cy="50" r="46" stroke={colors.sealStroke} strokeWidth="2" fill="none" opacity="0.4" />
        {/* Inner ring */}
        <Circle cx="50" cy="50" r="40" stroke={colors.sealStroke} strokeWidth="0.8" fill="none" opacity="0.3" />
        {/* Decorative dots */}
        <Circle cx="50" cy="8" r="1.5" fill={colors.sealStroke} opacity="0.4" />
        <Circle cx="50" cy="92" r="1.5" fill={colors.sealStroke} opacity="0.4" />
        <Circle cx="8" cy="50" r="1.5" fill={colors.sealStroke} opacity="0.4" />
        <Circle cx="92" cy="50" r="1.5" fill={colors.sealStroke} opacity="0.4" />
        {/* Star/cross in center */}
        <Path d="M50 30 L53 47 L70 50 L53 53 L50 70 L47 53 L30 50 L47 47 Z" fill={colors.sealStroke} opacity="0.25" />
      </Svg>
      {/* Text overlay — positioned absolutely over SVG */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 5.5, color: colors.sealText, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, textAlign: 'center', opacity: 0.6 }}>
          Dorper Barwałd
        </Text>
        <Text style={{ fontSize: 4, color: colors.sealText, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1, textAlign: 'center', opacity: 0.5 }}>
          Oficjalny Certyfikat
        </Text>
      </View>
    </View>
  )
}

// ============================================
// Main PDF Document Component
// ============================================
interface BreedingCertificateProps {
  sheep: SheepDetail
}

export function BreedingCertificate({ sheep }: BreedingCertificateProps) {
  const latestWeight = sheep.weights?.length
    ? sheep.weights[sheep.weights.length - 1]
    : null

  const father = sheep.father
  const mother = sheep.mother
  const paternalGrandfather = (father as any)?.father || null
  const paternalGrandmother = (father as any)?.mother || null
  const maternalGrandfather = (mother as any)?.father || null
  const maternalGrandmother = (mother as any)?.mother || null

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ==================== HEADER ==================== */}
        <View style={s.headerContainer}>
          <Text style={s.headerTitle}>Certyfikat Hodowlany</Text>
          <Text style={s.headerSubtitle}>Hodowla Dorper Barwałd</Text>
          <Text style={s.headerBreed}>Rasa: Dorper • Owce mięsne</Text>
        </View>

        {/* ==================== SUBJECT INFO ==================== */}
        <Text style={s.sectionTitle}>Dane osobnika</Text>

        <View style={s.infoGrid}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Numer kolczyka:</Text>
            <Text style={s.infoValue}>{sheep.earTag}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>ID:</Text>
            <Text style={s.infoValue}>{sheep.name || '—'}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Płeć:</Text>
            <Text style={s.infoValue}>{SEX_LABELS[sheep.sex] || sheep.sex}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Data urodzenia:</Text>
            <Text style={s.infoValue}>{formatDate(sheep.birthDate)}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Wiek:</Text>
            <Text style={s.infoValue}>{formatAge(sheep.birthDate)}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Status:</Text>
            <Text style={s.infoValue}>{STATUS_LABELS[sheep.status] || sheep.status}</Text>
          </View>
          {sheep.lineage && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Linia hodowlana:</Text>
              <Text style={s.infoValue}>{sheep.lineage}</Text>
            </View>
          )}
          {latestWeight && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Aktualna waga:</Text>
              <Text style={s.infoValue}>{latestWeight.weight.toFixed(1)} kg</Text>
            </View>
          )}
        </View>

        <View style={s.divider} />

        {/* ==================== PEDIGREE TABLE ==================== */}
        <Text style={s.sectionTitle}>Rodowód — 2 pokolenia</Text>

        <View style={s.pedigreeTable}>
          {/* Header row */}
          <View style={s.pedigreeHeaderRow}>
            <View style={s.colGen}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0 }}>Pokolenie</Text>
            </View>
            <View style={s.colFather}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0 }}>Strona ojca ♂</Text>
            </View>
            <View style={s.colMother}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0 }}>Strona matki ♀</Text>
            </View>
          </View>

          {/* P1: Parents */}
          <View style={s.pedigreeRow}>
            <View style={s.colGen}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0 }}>Rodzice</Text>
            </View>
            <AncestorCell label="Ojciec" ancestor={father} style={s.colFather} />
            <AncestorCell label="Matka" ancestor={mother} style={s.colMother} />
          </View>

          {/* P2: Paternal grandparents */}
          <View style={s.pedigreeRow}>
            <View style={s.colGen}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0, fontSize: 6 }}>Dziadkowie{'\n'}(str. ojca)</Text>
            </View>
            <AncestorCell label="Dziadek (oo)" ancestor={paternalGrandfather} style={s.colFather} />
            <AncestorCell label="Babka (oo)" ancestor={paternalGrandmother} style={s.colMother} />
          </View>

          {/* P2: Maternal grandparents */}
          <View style={s.pedigreeRowLast}>
            <View style={s.colGen}>
              <Text style={{ ...s.pedigreeLabel, marginBottom: 0, fontSize: 6 }}>Dziadkowie{'\n'}(str. matki)</Text>
            </View>
            <AncestorCell label="Dziadek (om)" ancestor={maternalGrandfather} style={s.colFather} />
            <AncestorCell label="Babka (om)" ancestor={maternalGrandmother} style={s.colMother} />
          </View>
        </View>

        {/* ==================== FOOTER ==================== */}
        <View style={s.footerArea}>
          <View style={s.footerDivider} />

          <View style={s.footerRow}>
            {/* Seal (left) */}
            <OfficialSeal />

            {/* Issuer (right) */}
            <View style={s.issuerContainer}>
              <Text style={s.issuerLabel}>Wystawca:</Text>
              <Text style={s.issuerName}>DORPER BARWAŁD</Text>
              <Text style={s.signatureLine}>.............................................</Text>
              <Text style={s.signatureCaption}>podpis hodowcy</Text>
            </View>
          </View>

          <View style={s.metaRow}>
            <Text style={s.metaText}>Wygenerowano: {formatDate(new Date())}</Text>
            <Text style={s.metaText}>Nr: {sheep.earTag}/{new Date().getFullYear()}</Text>
            <Text style={s.metaText}>Dorper Breeding Manager v1.0</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
