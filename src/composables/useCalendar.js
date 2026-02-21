import { ref, computed } from 'vue'
import { todayHijri, daysInMonth, firstDayOfMonth, toGregorian, formatGregorianDate } from '../utils/hijri.js'
import { getIslamicDate } from '../utils/islamicDates.js'

export function useCalendar() {
  const today = todayHijri()
  const currentYear = ref(today.year)
  const currentMonth = ref(today.month)

  const monthDays = computed(() => daysInMonth(currentYear.value, currentMonth.value))
  const startDay = computed(() => firstDayOfMonth(currentYear.value, currentMonth.value))

  const calendarDays = computed(() => {
    const days = []
    const total = monthDays.value
    const offset = startDay.value

    // Empty cells before month starts
    for (let i = 0; i < offset; i++) {
      days.push({ empty: true })
    }

    for (let d = 1; d <= total; d++) {
      const gregDate = toGregorian(currentYear.value, currentMonth.value, d)
      const islamicDate = getIslamicDate(currentMonth.value, d)
      const isToday = currentYear.value === today.year &&
                      currentMonth.value === today.month &&
                      d === today.day

      days.push({
        day: d,
        gregorianDate: gregDate,
        gregorianFormatted: gregDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        gregorianFormattedAr: gregDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
        islamicDate,
        isToday,
        empty: false,
      })
    }

    // Fill trailing empty cells to complete the last row
    const remainder = days.length % 7
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        days.push({ empty: true })
      }
    }

    return days
  })

  function nextMonth() {
    if (currentMonth.value === 12) {
      currentMonth.value = 1
      currentYear.value++
    } else {
      currentMonth.value++
    }
  }

  function prevMonth() {
    if (currentMonth.value === 1) {
      currentMonth.value = 12
      currentYear.value--
    } else {
      currentMonth.value--
    }
  }

  function goToToday() {
    const t = todayHijri()
    currentYear.value = t.year
    currentMonth.value = t.month
  }

  function setMonth(month) {
    currentMonth.value = month
  }

  function setYear(year) {
    currentYear.value = year
  }

  return {
    currentYear,
    currentMonth,
    calendarDays,
    monthDays,
    today,
    nextMonth,
    prevMonth,
    goToToday,
    setMonth,
    setYear,
  }
}
