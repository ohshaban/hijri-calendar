<script setup>
import { ref, watch, nextTick } from 'vue'
import { useLang } from './utils/i18n.js'
import { useCalendar } from './composables/useCalendar.js'
import { useAuth } from './composables/useAuth.js'
import { useReminders } from './composables/useReminders.js'
import { toHijri, formatHijriDate } from './utils/hijri.js'
import CalendarHeader from './components/CalendarHeader.vue'
import CalendarGrid from './components/CalendarGrid.vue'
import TodayInfo from './components/TodayInfo.vue'
import AuthModal from './components/AuthModal.vue'
import ReminderModal from './components/ReminderModal.vue'
import ReminderList from './components/ReminderList.vue'
import ToastContainer from './components/ToastContainer.vue'

const { lang, setLang, t } = useLang()
const calendar = useCalendar()
const auth = useAuth()
const reminderState = useReminders()

const dark = ref(document.documentElement.classList.contains('dark'))
const showInfoMenu = ref(false)
const showDateLookup = ref(false)
const gregorianInput = ref('')
const lookupResult = ref(null)
const showAuthModal = ref(false)
const showReminderModal = ref(false)
const showReminderList = ref(false)
const selectedDay = ref(null)
const calendarGrid = ref(null)

function toggleDark() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('hilal_dark', dark.value)
}

function toggleLang() {
  setLang(lang.value === 'en' ? 'ar' : 'en')
}

function handleDateLookup() {
  if (!gregorianInput.value) return
  try {
    const date = new Date(gregorianInput.value + 'T12:00:00')
    if (isNaN(date.getTime())) return
    const hijri = toHijri(date)
    lookupResult.value = {
      formatted: formatHijriDate(hijri.year, hijri.month, hijri.day, lang.value),
      year: hijri.year,
      month: hijri.month,
      day: hijri.day,
    }
  } catch {
    lookupResult.value = null
  }
}

function goToLookupDate() {
  if (!lookupResult.value) return
  const { year, month, day } = lookupResult.value
  calendar.goToHijriDate(year, month)
  showDateLookup.value = false
  lookupResult.value = null
  gregorianInput.value = ''
  nextTick(() => {
    calendarGrid.value?.selectDayByNumber(day)
  })
}

function onDayClick(day) {
  if (day.empty) return
  selectedDay.value = day
  if (!auth.isAuthenticated.value) {
    showAuthModal.value = true
  } else {
    showReminderModal.value = true
  }
}

function onModalClose() {
  showReminderModal.value = false
  selectedDay.value = null
  nextTick(() => calendarGrid.value?.refocus())
}

function onAuthClose() {
  showAuthModal.value = false
  nextTick(() => calendarGrid.value?.refocus())
}

function onAuthSuccess() {
  showAuthModal.value = false
  if (selectedDay.value) {
    showReminderModal.value = true
  }
  reminderState.fetchReminders()
}

function onShowReminders() {
  if (!auth.isAuthenticated.value) {
    showAuthModal.value = true
    return
  }
  reminderState.fetchReminders()
  reminderState.fetchRecurringEvents()
  showReminderList.value = true
}

async function onSignOut() {
  await auth.logout()
  reminderState.reminders.value = []
  reminderState.recurringEvents.value = []
}

watch(() => auth.isAuthenticated.value, (val) => {
  if (val) {
    reminderState.fetchReminders()
    reminderState.fetchRecurringEvents()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🌙</span>
          <h1 class="text-lg font-semibold text-teal-700 dark:text-teal-400">{{ t('appName') }}</h1>
        </div>
        <div class="flex items-center gap-1 sm:gap-2">
          <!-- Info menu -->
          <div class="relative">
            <button
              @click="showInfoMenu = !showInfoMenu"
              class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              :title="t('about')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div
              v-if="showInfoMenu"
              class="absolute top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 w-52 z-50"
              :class="lang === 'ar' ? 'left-0' : 'right-0'"
            >
              <div @click.self="showInfoMenu = false" class="fixed inset-0 z-[-1]" />
              <a
                href="mailto:developer.ohs@gmail.com"
                class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {{ t('contact') }}
              </a>
              <a
                href="https://github.com/ohshaban/hijri-calendar"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg class="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                {{ t('sourceCode') }}
              </a>
              <a
                href="https://buymeacoffee.com/ohshaban"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {{ t('support') }}
              </a>
            </div>
          </div>
          <button
            @click="toggleLang"
            class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
            :title="t('language')"
          >
            <span class="sm:hidden">{{ lang === 'en' ? 'ع' : 'En' }}</span>
            <span class="hidden sm:inline">{{ lang === 'en' ? 'عربي' : 'EN' }}</span>
          </button>
          <button
            @click="toggleDark"
            class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            :title="dark ? t('lightMode') : t('darkMode')"
          >
            <span v-if="dark" class="text-lg leading-none">☀️</span>
            <span v-else class="text-lg leading-none">🌙</span>
          </button>
          <button
            @click="onShowReminders"
            class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium"
            :title="t('myReminders')"
          >
            <svg class="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="hidden sm:inline">{{ t('myReminders') }}</span>
          </button>
          <button
            v-if="!auth.isAuthenticated.value"
            @click="showAuthModal = true"
            class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center text-sm rounded-lg border border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 font-medium"
            :title="t('signIn')"
          >
            <svg class="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">{{ t('signIn') }}</span>
          </button>
          <button
            v-else
            @click="onSignOut"
            class="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            :title="t('signOut')"
          >
            <svg class="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="hidden sm:inline">{{ t('signOut') }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <TodayInfo :today="calendar.today" :lang="lang" />

      <CalendarHeader
        :year="calendar.currentYear.value"
        :month="calendar.currentMonth.value"
        :lang="lang"
        @prev="calendar.prevMonth"
        @next="calendar.nextMonth"
        @today="calendar.goToToday"
        @set-month="calendar.setMonth"
        @set-year="calendar.setYear"
      />

      <!-- Gregorian date lookup -->
      <div class="flex items-center gap-2 mb-3">
        <button
          @click="showDateLookup = !showDateLookup; lookupResult = null"
          class="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {{ t('goToGregorian') }}
        </button>
      </div>
      <div v-if="showDateLookup" class="mb-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <label class="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">{{ t('gregorianLookup') }}</label>
        <div class="flex gap-2">
          <input
            v-model="gregorianInput"
            type="date"
            class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            dir="ltr"
            @change="handleDateLookup"
          />
          <button
            v-if="lookupResult"
            @click="goToLookupDate"
            class="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium"
          >
            {{ t('go') }}
          </button>
        </div>
        <p v-if="lookupResult" class="mt-2 text-sm font-medium text-teal-700 dark:text-teal-400">
          {{ lookupResult.formatted }}
        </p>
      </div>

      <CalendarGrid
        ref="calendarGrid"
        :days="calendar.calendarDays.value"
        :lang="lang"
        :reminders="reminderState.reminders.value"
        :recurring-events="reminderState.recurringEvents.value"
        :current-month="calendar.currentMonth.value"
        :current-year="calendar.currentYear.value"
        :today-day="calendar.currentYear.value === calendar.today.year && calendar.currentMonth.value === calendar.today.month ? calendar.today.day : -1"
        @day-click="onDayClick"
        @prev="calendar.prevMonth"
        @next="calendar.nextMonth"
      />
    </main>

    <AuthModal
      v-if="showAuthModal"
      :auth="auth"
      :lang="lang"
      @close="onAuthClose"
      @success="onAuthSuccess"
    />

    <ReminderModal
      v-if="showReminderModal && selectedDay"
      :day="selectedDay"
      :year="calendar.currentYear.value"
      :month="calendar.currentMonth.value"
      :reminder-state="reminderState"
      :lang="lang"
      @close="onModalClose"
    />

    <ReminderList
      v-if="showReminderList"
      :reminder-state="reminderState"
      :lang="lang"
      @close="showReminderList = false"
    />

    <ToastContainer />
  </div>
</template>
