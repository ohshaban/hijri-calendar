import uq from '@umalqura/core'

// Convert Western numerals to Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
export function toArabicNumerals(num) {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(num).replace(/[0-9]/g, d => arabicDigits[d])
}

// Get Hijri date from a JS Date object
export function toHijri(date) {
  const d = uq(date)
  return {
    year: d.hy,
    month: d.hm,
    day: d.hd,
    monthName: getMonthName(d.hm, 'en'),
    monthNameAr: getMonthName(d.hm, 'ar'),
    dayOfWeek: date.getDay(),
  }
}

// Get Gregorian Date from Hijri components
export function toGregorian(year, month, day) {
  const d = uq(year, month, day)
  return d.date
}

// Get number of days in a Hijri month
export function daysInMonth(year, month) {
  const d = uq(year, month, 1)
  return d.daysInMonth
}

// Get day of week for first day of Hijri month (0=Sun, 6=Sat)
export function firstDayOfMonth(year, month) {
  const date = toGregorian(year, month, 1)
  return date.getDay()
}

// Get today's Hijri date
export function todayHijri() {
  return toHijri(new Date())
}

// Format Hijri date string
export function formatHijriDate(year, month, day, lang = 'en') {
  const monthName = getMonthName(month, lang)
  if (lang === 'ar') {
    return `${toArabicNumerals(day)} ${monthName} ${toArabicNumerals(year)} هـ`
  }
  return `${day} ${monthName} ${year} AH`
}

// Get Gregorian date string for a Hijri date
export function formatGregorianDate(year, month, day, lang = 'en') {
  const date = toGregorian(year, month, day)
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const MONTHS_EN = [
  '', 'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Akhira', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'da', 'Dhu al-Hijja'
]

const MONTHS_AR = [
  '', 'مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي',
  'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'
]

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

export function getMonthName(month, lang = 'en') {
  return lang === 'ar' ? MONTHS_AR[month] : MONTHS_EN[month]
}

export function getDayNames(lang = 'en') {
  return lang === 'ar' ? DAYS_AR : DAYS_EN
}

export function getAllMonths(lang = 'en') {
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN
  return months.slice(1).map((name, i) => ({ value: i + 1, label: name }))
}
