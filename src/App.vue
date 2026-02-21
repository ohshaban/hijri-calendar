<script setup>
import { ref, watch } from 'vue'
import { useLang } from './utils/i18n.js'
import { useCalendar } from './composables/useCalendar.js'
import { useAuth } from './composables/useAuth.js'
import { useReminders } from './composables/useReminders.js'
import CalendarHeader from './components/CalendarHeader.vue'
import CalendarGrid from './components/CalendarGrid.vue'
import TodayInfo from './components/TodayInfo.vue'
import AuthModal from './components/AuthModal.vue'
import ReminderModal from './components/ReminderModal.vue'
import ReminderList from './components/ReminderList.vue'

const { lang, setLang, t } = useLang()
const calendar = useCalendar()
const auth = useAuth()
const reminderState = useReminders()

const dark = ref(document.documentElement.classList.contains('dark'))
const showAuthModal = ref(false)
const showReminderModal = ref(false)
const showReminderList = ref(false)
const selectedDay = ref(null)

function toggleDark() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  localStorage.setItem('hilal_dark', dark.value)
}

function toggleLang() {
  setLang(lang.value === 'en' ? 'ar' : 'en')
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
  showReminderList.value = true
}

async function onSignOut() {
  await auth.logout()
  reminderState.reminders.value = []
}

watch(() => auth.isAuthenticated.value, (val) => {
  if (val) reminderState.fetchReminders()
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
        <div class="flex items-center gap-2">
          <button
            @click="toggleLang"
            class="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
          >
            {{ lang === 'en' ? 'عربي' : 'EN' }}
          </button>
          <button
            @click="toggleDark"
            class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            :title="dark ? t('lightMode') : t('darkMode')"
          >
            <span v-if="dark" class="text-lg leading-none">☀️</span>
            <span v-else class="text-lg leading-none">🌙</span>
          </button>
          <button
            @click="onShowReminders"
            class="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium"
          >
            {{ t('myReminders') }}
          </button>
          <button
            v-if="!auth.isAuthenticated.value"
            @click="showAuthModal = true"
            class="px-3 py-1.5 text-sm rounded-lg border border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 font-medium"
          >
            {{ t('signIn') }}
          </button>
          <button
            v-else
            @click="onSignOut"
            class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
          >
            {{ t('signOut') }}
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

      <CalendarGrid
        :days="calendar.calendarDays.value"
        :lang="lang"
        :reminders="reminderState.reminders.value"
        :current-month="calendar.currentMonth.value"
        :current-year="calendar.currentYear.value"
        @day-click="onDayClick"
      />
    </main>

    <AuthModal
      v-if="showAuthModal"
      :auth="auth"
      :lang="lang"
      @close="showAuthModal = false"
      @success="onAuthSuccess"
    />

    <ReminderModal
      v-if="showReminderModal && selectedDay"
      :day="selectedDay"
      :year="calendar.currentYear.value"
      :month="calendar.currentMonth.value"
      :reminder-state="reminderState"
      :lang="lang"
      @close="showReminderModal = false; selectedDay = null"
    />

    <ReminderList
      v-if="showReminderList"
      :reminder-state="reminderState"
      :lang="lang"
      @close="showReminderList = false"
    />
  </div>
</template>
