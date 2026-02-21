// Notable Islamic dates (month, day) with names
// These recur every Hijri year
const ISLAMIC_DATES = [
  { month: 1, day: 1, en: 'Islamic New Year', ar: 'رأس السنة الهجرية', color: 'emerald' },
  { month: 1, day: 10, en: 'Ashura', ar: 'عاشوراء', color: 'emerald' },
  { month: 3, day: 12, en: 'Mawlid al-Nabi', ar: 'المولد النبوي', color: 'emerald' },
  { month: 7, day: 27, en: 'Isra\' wal-Mi\'raj', ar: 'الإسراء والمعراج', color: 'amber' },
  { month: 8, day: 15, en: 'Mid-Sha\'ban', ar: 'ليلة النصف من شعبان', color: 'amber' },
  { month: 9, day: 1, en: 'Ramadan begins', ar: 'بداية رمضان', color: 'teal' },
  { month: 9, day: 27, en: 'Laylat al-Qadr', ar: 'ليلة القدر', color: 'teal' },
  { month: 10, day: 1, en: 'Eid al-Fitr', ar: 'عيد الفطر', color: 'emerald' },
  { month: 10, day: 2, en: 'Eid al-Fitr', ar: 'عيد الفطر', color: 'emerald' },
  { month: 10, day: 3, en: 'Eid al-Fitr', ar: 'عيد الفطر', color: 'emerald' },
  { month: 12, day: 8, en: 'Day of Tarwiyah', ar: 'يوم التروية', color: 'amber' },
  { month: 12, day: 9, en: 'Day of Arafah', ar: 'يوم عرفة', color: 'teal' },
  { month: 12, day: 10, en: 'Eid al-Adha', ar: 'عيد الأضحى', color: 'emerald' },
  { month: 12, day: 11, en: 'Eid al-Adha', ar: 'عيد الأضحى', color: 'emerald' },
  { month: 12, day: 12, en: 'Eid al-Adha', ar: 'عيد الأضحى', color: 'emerald' },
  { month: 12, day: 13, en: 'Eid al-Adha', ar: 'عيد الأضحى', color: 'emerald' },
]

export function getIslamicDate(month, day) {
  return ISLAMIC_DATES.find(d => d.month === month && d.day === day) || null
}

export function getIslamicDatesForMonth(month) {
  return ISLAMIC_DATES.filter(d => d.month === month)
}
