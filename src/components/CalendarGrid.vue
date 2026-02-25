<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { getDayNames, formatHijriDate } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'
import DayCell from './DayCell.vue'

const props = defineProps({
  days: Array,
  lang: String,
  reminders: Array,
  recurringEvents: { type: Array, default: () => [] },
  currentMonth: Number,
  currentYear: Number,
  todayDay: { type: Number, default: -1 },
})

const emit = defineEmits(['day-click', 'prev', 'next'])
const { t } = useLang()

const dayNames = computed(() => getDayNames(props.lang))
// Selected day index (visual highlight, persists even when grid loses DOM focus)
const selectedDay = ref(props.todayDay > 0 ? props.todayDay - 1 : -1)
// Whether the grid div actually has DOM focus (for keyboard events + hint bar)
const gridFocused = ref(false)
const gridEl = ref(null)
const pendingEdge = ref(null)
const pendingSelectDay = ref(null)

const realDays = computed(() => props.days.filter(d => !d.empty))

// Data for the mobile detail panel
const selectedDayData = computed(() => {
  if (selectedDay.value < 0) return null
  const day = realDays.value[selectedDay.value]
  if (!day) return null
  return {
    day,
    reminders: dayReminders(day),
    recurringEvents: dayRecurringEvents(day),
    hijriFormatted: formatHijriDate(props.currentYear, props.currentMonth, day.day, props.lang),
  }
})

const slideDirection = ref('next')
const gridKey = computed(() => `${props.currentYear}-${props.currentMonth}`)
// Track whether grid had focus before transition so we can restore it after
const needsFocus = ref(false)

onMounted(() => {
  gridEl.value?.focus()
})

// When month/year changes, set selection to edge day if navigating across months
watch([() => props.currentMonth, () => props.currentYear], (newVal, oldVal) => {
  // Determine slide direction from month/year change
  const [newM, newY] = [newVal[0], newVal[1]]
  const [oldM, oldY] = [oldVal[0], oldVal[1]]
  // Remember if grid had focus so we can restore after transition
  needsFocus.value = gridFocused.value || pendingEdge.value !== null

  if (pendingEdge.value === 'first') slideDirection.value = 'next'
  else if (pendingEdge.value === 'last') slideDirection.value = 'prev'
  else if (newY > oldY || (newY === oldY && newM > oldM)) slideDirection.value = 'next'
  else slideDirection.value = 'prev'

  nextTick(() => {
    if (pendingSelectDay.value !== null) {
      const idx = realDays.value.findIndex(d => d.day === pendingSelectDay.value)
      selectedDay.value = idx >= 0 ? idx : 0
      pendingSelectDay.value = null
    } else if (pendingEdge.value === 'last') {
      selectedDay.value = realDays.value.length - 1
    } else if (pendingEdge.value === 'first') {
      selectedDay.value = 0
    } else {
      // Month changed via dropdown/button — check if today is in this month
      selectedDay.value = props.todayDay > 0 ? props.todayDay - 1 : -1
    }
    pendingEdge.value = null
  })
})

function dayReminders(day) {
  if (!day || day.empty || !props.reminders) return []
  const hijriDate = `${props.currentYear}-${String(props.currentMonth).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  return props.reminders.filter(r => r.hijri_date === hijriDate && !r.cancelled)
}

function dayRecurringEvents(day) {
  if (!day || day.empty || !props.recurringEvents) return []
  return props.recurringEvents.filter(e =>
    e.hijri_month === props.currentMonth &&
    e.hijri_day === day.day &&
    e.active &&
    props.currentYear >= e.origin_year
  )
}

function handleGridKeydown(e) {
  const total = realDays.value.length
  if (!total) return

  const rtl = document.documentElement.dir === 'rtl'
  const cur = selectedDay.value < 0 ? 0 : selectedDay.value

  switch (e.key) {
    case 'ArrowRight': {
      e.preventDefault()
      const dir = rtl ? -1 : 1
      const next = cur + dir
      if (next >= total) { pendingEdge.value = 'first'; emit('next') }
      else if (next < 0) { pendingEdge.value = 'last'; emit('prev') }
      else selectedDay.value = next
      break
    }
    case 'ArrowLeft': {
      e.preventDefault()
      const dir = rtl ? 1 : -1
      const next = cur + dir
      if (next >= total) { pendingEdge.value = 'first'; emit('next') }
      else if (next < 0) { pendingEdge.value = 'last'; emit('prev') }
      else selectedDay.value = next
      break
    }
    case 'ArrowDown': {
      e.preventDefault()
      const next = cur + 7
      if (next >= total) { pendingEdge.value = 'first'; emit('next') }
      else selectedDay.value = next
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      const next = cur - 7
      if (next < 0) { pendingEdge.value = 'last'; emit('prev') }
      else selectedDay.value = next
      break
    }
    case 'Enter':
    case ' ':
      if (selectedDay.value >= 0) {
        e.preventDefault()
        emit('day-click', realDays.value[selectedDay.value])
      }
      break
  }
}

function handleFocus() {
  gridFocused.value = true
  if (selectedDay.value < 0) selectedDay.value = 0
}

function handleBlur(e) {
  // Don't clear focus state during month transitions (grid element is being swapped)
  if (needsFocus.value) return
  if (gridEl.value && !gridEl.value.contains(e.relatedTarget)) {
    gridFocused.value = false
  }
}

function handleCellClick(day) {
  if (day.empty) return
  const idx = realDays.value.findIndex(d => d.day === day.day)

  if (selectedDay.value === idx) {
    // Already selected — open it
    emit('day-click', day)
  } else {
    // First click — select this day
    selectedDay.value = idx
    gridEl.value?.focus()
  }
}

function onAfterEnter() {
  if (needsFocus.value) {
    gridEl.value?.focus()
    needsFocus.value = false
  }
}

function refocus() {
  gridFocused.value = true
  gridEl.value?.focus()
}

function isSelected(day) {
  if (day.empty || selectedDay.value < 0) return false
  return realDays.value[selectedDay.value]?.day === day.day
}

function selectDayByNumber(dayNum) {
  // Set pending so the watcher picks it up if a month change is in flight
  pendingSelectDay.value = dayNum
  // Also try to select immediately (for same-month navigations)
  nextTick(() => {
    if (pendingSelectDay.value === dayNum) {
      const idx = realDays.value.findIndex(d => d.day === dayNum)
      if (idx >= 0) {
        selectedDay.value = idx
        pendingSelectDay.value = null
      }
    }
    gridEl.value?.focus()
  })
}

defineExpose({ refocus, selectDayByNumber })
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <!-- Day names header -->
    <div class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div
        v-for="name in dayNames"
        :key="name"
        class="py-2 xs:py-3 text-center text-[10px] xs:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
      >
        {{ name }}
      </div>
    </div>

    <!-- Calendar cells with slide transition -->
    <div class="relative overflow-hidden">
      <Transition :name="'slide-' + slideDirection" mode="out-in" @after-enter="onAfterEnter">
        <div
          ref="gridEl"
          :key="gridKey"
          class="grid grid-cols-7 outline-none"
          tabindex="0"
          role="grid"
          aria-label="Calendar"
          @keydown="handleGridKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <DayCell
            v-for="(day, i) in days"
            :key="i"
            :day="day"
            :lang="lang"
            :reminders="dayReminders(day)"
            :recurring-events="dayRecurringEvents(day)"
            :selected="isSelected(day)"
            @click="handleCellClick(day)"
          />
        </div>
      </Transition>
    </div>

    <!-- Mobile detail panel for selected day (visible below xs breakpoint) -->
    <div v-if="selectedDayData" class="xs:hidden border-t border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/50">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ selectedDayData.hijriFormatted }}</span>
        <button
          @click="emit('day-click', selectedDayData.day)"
          class="text-[10px] font-medium text-teal-600 dark:text-teal-400 flex items-center gap-0.5"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          {{ t('createReminder') }}
        </button>
      </div>
      <!-- Islamic event -->
      <div v-if="selectedDayData.day.islamicDate" class="mb-1">
        <span
          class="text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block"
          :class="{
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400': selectedDayData.day.islamicDate.color === 'emerald',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400': selectedDayData.day.islamicDate.color === 'amber',
            'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400': selectedDayData.day.islamicDate.color === 'teal',
          }"
        >{{ lang === 'ar' ? selectedDayData.day.islamicDate.ar : selectedDayData.day.islamicDate.en }}</span>
      </div>
      <!-- Recurring events for this day -->
      <div v-if="selectedDayData.recurringEvents.length > 0" class="space-y-1">
        <div v-for="e in selectedDayData.recurringEvents" :key="e.id" class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span class="text-xs text-slate-600 dark:text-slate-400 truncate">{{ e.title }}</span>
        </div>
      </div>
      <!-- Reminders for this day -->
      <div v-if="selectedDayData.reminders.length > 0" class="space-y-1">
        <div v-for="r in selectedDayData.reminders" :key="r.id" class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span class="text-xs text-slate-600 dark:text-slate-400 truncate">{{ r.title }}</span>
        </div>
      </div>
      <p v-else-if="!selectedDayData.day.islamicDate && selectedDayData.recurringEvents.length === 0" class="text-[11px] text-slate-400 dark:text-slate-500">{{ t('noReminders') }}</p>
    </div>

    <!-- Keyboard hint bar (desktop only, shown when grid has DOM focus) -->
    <div v-if="gridFocused" class="hidden sm:flex items-center justify-center gap-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500">
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">&larr;&rarr;&uarr;&darr;</kbd> {{ t('kbdNavigate') }}</span>
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd> {{ t('kbdCreateReminder') }}</span>
    </div>
  </div>
</template>
