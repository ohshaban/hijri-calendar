<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { getDayNames } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'
import DayCell from './DayCell.vue'

const props = defineProps({
  days: Array,
  lang: String,
  reminders: Array,
  currentMonth: Number,
  currentYear: Number,
  todayDay: { type: Number, default: -1 },
})

const emit = defineEmits(['day-click', 'prev', 'next'])
const { t } = useLang()

const dayNames = computed(() => getDayNames(props.lang))
const focusedDay = ref(props.todayDay > 0 ? props.todayDay - 1 : 0)
const gridHasFocus = ref(true)
const gridEl = ref(null)
const pendingEdge = ref(null) // 'first' or 'last' — set when navigating across months

const realDays = computed(() => props.days.filter(d => !d.empty))

// When month/year changes, set focus to edge day if we navigated across months
watch([() => props.currentMonth, () => props.currentYear], () => {
  nextTick(() => {
    if (pendingEdge.value === 'last') {
      focusedDay.value = realDays.value.length - 1
    } else if (pendingEdge.value === 'first') {
      focusedDay.value = 0
    }
    pendingEdge.value = null
  })
})

function dayReminders(day) {
  if (!day || day.empty || !props.reminders) return []
  const hijriDate = `${props.currentYear}-${String(props.currentMonth).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  return props.reminders.filter(r => r.hijri_date === hijriDate && !r.cancelled)
}

function handleGridKeydown(e) {
  const total = realDays.value.length
  if (!total) return

  const rtl = document.documentElement.dir === 'rtl'
  const cur = focusedDay.value < 0 ? 0 : focusedDay.value

  switch (e.key) {
    case 'ArrowRight': {
      e.preventDefault()
      const dir = rtl ? -1 : 1
      const next = cur + dir
      if (next >= total) {
        pendingEdge.value = 'first'
        emit('next')
      } else if (next < 0) {
        pendingEdge.value = 'last'
        emit('prev')
      } else {
        focusedDay.value = next
      }
      break
    }
    case 'ArrowLeft': {
      e.preventDefault()
      const dir = rtl ? 1 : -1
      const next = cur + dir
      if (next >= total) {
        pendingEdge.value = 'first'
        emit('next')
      } else if (next < 0) {
        pendingEdge.value = 'last'
        emit('prev')
      } else {
        focusedDay.value = next
      }
      break
    }
    case 'ArrowDown': {
      e.preventDefault()
      const next = cur + 7
      if (next >= total) {
        pendingEdge.value = 'first'
        emit('next')
      } else {
        focusedDay.value = next
      }
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      const next = cur - 7
      if (next < 0) {
        pendingEdge.value = 'last'
        emit('prev')
      } else {
        focusedDay.value = next
      }
      break
    }
    case 'Enter':
    case ' ':
      if (focusedDay.value >= 0) {
        e.preventDefault()
        emit('day-click', realDays.value[focusedDay.value])
      }
      break
  }
}

function handleFocus() {
  gridHasFocus.value = true
  if (focusedDay.value < 0) focusedDay.value = 0
}

function handleBlur(e) {
  if (gridEl.value && !gridEl.value.contains(e.relatedTarget)) {
    gridHasFocus.value = false
  }
}

function handleCellClick(day) {
  if (day.empty) return
  const idx = realDays.value.findIndex(d => d.day === day.day)

  if (gridHasFocus.value && focusedDay.value === idx) {
    // Already focused on this day — open it
    emit('day-click', day)
  } else {
    // First click — just focus the grid and select this day
    focusedDay.value = idx
    gridHasFocus.value = true
    gridEl.value?.focus()
  }
}

function refocus() {
  gridHasFocus.value = true
  gridEl.value?.focus()
}

function isFocused(day) {
  if (day.empty || focusedDay.value < 0 || !gridHasFocus.value) return false
  return realDays.value[focusedDay.value]?.day === day.day
}

const selectedDayName = computed(() => {
  if (focusedDay.value < 0 || !gridHasFocus.value) return ''
  const day = realDays.value[focusedDay.value]
  return day ? String(day.day) : ''
})

defineExpose({ refocus })
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <!-- Day names header -->
    <div class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div
        v-for="name in dayNames"
        :key="name"
        class="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
      >
        {{ name }}
      </div>
    </div>

    <!-- Calendar cells -->
    <div
      ref="gridEl"
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
        :focused="isFocused(day)"
        @click="handleCellClick(day)"
      />
    </div>

    <!-- Hint bar (desktop only) -->
    <div v-if="gridHasFocus" class="hidden sm:flex items-center justify-center gap-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500">
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">&larr;&rarr;&uarr;&darr;</kbd> {{ t('kbdNavigate') }}</span>
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd> {{ t('kbdCreateReminder') }}</span>
    </div>
  </div>
</template>
