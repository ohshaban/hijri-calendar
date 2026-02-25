<script setup>
import { ref, watch, nextTick } from 'vue'
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
import ToastContainer from './components/ToastContainer.vue'

const { lang, setLang, t } = useLang()
const calendar = useCalendar()
const auth = useAuth()
const reminderState = useReminders()

const dark = ref(document.documentElement.classList.contains('dark'))
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
        <div class="flex items-center gap-1 sm:gap-2">
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

      <CalendarGrid
        ref="calendarGrid"
        :days="calendar.calendarDays.value"
        :lang="lang"
        :reminders="reminderState.reminders.value"
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
