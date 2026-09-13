import { differenceInMonths, differenceInDays, addDays, format } from 'date-fns'
import { pl } from 'date-fns/locale'

// ============================================
// POLISH LABEL MAPS
// ============================================

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktywna',
  SOLD: 'Sprzedana',
  DEAD: 'Padła',
}

export const STATUS_VARIANTS: Record<string, 'active' | 'sold' | 'dead'> = {
  ACTIVE: 'active',
  SOLD: 'sold',
  DEAD: 'dead',
}

export const SEX_LABELS: Record<string, string> = {
  MALE: 'Tryk',
  FEMALE: 'Owca',
}

export const SEX_VARIANTS: Record<string, 'male' | 'female'> = {
  MALE: 'male',
  FEMALE: 'female',
}

export const SEX_ICONS: Record<string, string> = {
  MALE: '♂',
  FEMALE: '♀',
}

export const HEALTH_TYPE_LABELS: Record<string, string> = {
  VACCINE: 'Szczepienie',
  DEWORMING: 'Odrobaczanie',
  VET_VISIT: 'Wizyta wet.',
  HOOF: 'Korekcja racic',
}

export const WEIGHT_TYPE_LABELS: Record<string, string> = {
  BIRTH: 'Urodzeniowa',
  WEANING: 'Odsadzeniowa',
  ADULT: 'Dorosła',
  CUSTOM: 'Inna',
}

// ============================================
// DATE & AGE FORMATTING
// ============================================

/**
 * Safely convert any DB date value to an HTML date-input-compatible string (YYYY-MM-DD).
 * Handles: Date objects, ISO strings, null, undefined.
 */
export function toInputDate(val: string | Date | null | undefined): string {
  if (!val) return new Date().toISOString().split('T')[0]
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'string') {
    // Already "YYYY-MM-DD"?
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
    // ISO string like "2024-01-15T00:00:00.000Z"
    return val.split('T')[0]
  }
  return new Date().toISOString().split('T')[0]
}


/**
 * Format a date string as DD.MM.YYYY (Polish convention)
 */
export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return format(date, 'dd.MM.yyyy', { locale: pl })
}

/**
 * Format a date as a short date (DD MMM YYYY in Polish)
 */
export function formatDateShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return format(date, 'd MMM yyyy', { locale: pl })
}

/**
 * Compute human-readable age string in Polish
 * - < 1 month: "X dni"
 * - 1-11 months: "X mies."
 * - 1 year: "1 rok"
 * - 2-4 years: "X lata"
 * - 5+ years: "X lat"
 */
export function formatAge(birthDateStr: string | Date): string {
  const birthDate = typeof birthDateStr === 'string' ? new Date(birthDateStr) : birthDateStr
  const now = new Date()
  const months = differenceInMonths(now, birthDate)

  if (months < 1) {
    const days = differenceInDays(now, birthDate)
    return `${days} dni`
  }

  if (months < 12) {
    return `${months} mies.`
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  let yearStr: string
  if (years === 1) {
    yearStr = '1 rok'
  } else if (years >= 2 && years <= 4) {
    yearStr = `${years} lata`
  } else {
    yearStr = `${years} lat`
  }

  if (remainingMonths > 0 && years < 5) {
    return `${yearStr}, ${remainingMonths} mies.`
  }

  return yearStr
}

// ============================================
// HEALTH & WITHDRAWAL LOGIC
// ============================================

export interface WithdrawalStatus {
  isActive: boolean
  endDate: Date | null
  daysRemaining: number
  medication: string | null
}

/**
 * Check if a sheep has any active medication withdrawal period.
 * Takes the health records that have withdrawalDays > 0.
 */
export function checkWithdrawal(
  healthRecords: Array<{
    date: string | Date
    withdrawalDays?: number | null
    medication?: string | null
  }>
): WithdrawalStatus {
  if (!healthRecords || healthRecords.length === 0) {
    return { isActive: false, endDate: null, daysRemaining: 0, medication: null }
  }

  const now = new Date()
  let latestActiveEnd: Date | null = null
  let latestMedication: string | null = null

  for (const record of healthRecords) {
    if (!record.withdrawalDays || record.withdrawalDays <= 0) continue

    const recordDate = typeof record.date === 'string' ? new Date(record.date) : record.date
    const endDate = addDays(recordDate, record.withdrawalDays)

    if (endDate > now) {
      if (!latestActiveEnd || endDate > latestActiveEnd) {
        latestActiveEnd = endDate
        latestMedication = record.medication || null
      }
    }
  }

  if (latestActiveEnd) {
    return {
      isActive: true,
      endDate: latestActiveEnd,
      daysRemaining: differenceInDays(latestActiveEnd, now),
      medication: latestMedication,
    }
  }

  return { isActive: false, endDate: null, daysRemaining: 0, medication: null }
}

// ============================================
// GROWTH METRICS
// ============================================

/**
 * Calculate Average Daily Gain (ADG) between birth and weaning weights
 * Returns kg/day or null if insufficient data
 */
export function calculateADG(
  weights: Array<{ weight: number; date: string | Date; type: string }>
): number | null {
  const birth = weights.find((w) => w.type === 'BIRTH')
  const weaning = weights.find((w) => w.type === 'WEANING')

  if (!birth || !weaning) return null

  const birthDate = typeof birth.date === 'string' ? new Date(birth.date) : birth.date
  const weaningDate = typeof weaning.date === 'string' ? new Date(weaning.date) : weaning.date
  const days = differenceInDays(weaningDate, birthDate)

  if (days <= 0) return null

  return (weaning.weight - birth.weight) / days
}
