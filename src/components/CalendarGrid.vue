<script setup>
import { computed, ref, watch } from 'vue'
import { getDayNames } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'
import DayCell from './DayCell.vue'

const props = defineProps({
  days: Array,
  lang: String,
  reminders: Array,
  currentMonth: Number,
  currentYear: Number,
})

const emit = defineEmits(['day-click'])
const { t } = useLang()

const dayNames = computed(() => getDayNames(props.lang))
const focusedDay = ref(-1)
const gridHasFocus = ref(false)
const gridEl = ref(null)

const realDays = computed(() => props.days.filter(d => !d.empty))

// Reset focus when month/year changes
watch([() => props.currentMonth, () => props.currentYear], () => {
  focusedDay.value = -1
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

  switch (e.key) {
    case 'ArrowRight': {
      e.preventDefault()
      const dir = rtl ? -1 : 1
      focusedDay.value = clamp((focusedDay.value < 0 ? 0 : focusedDay.value) + dir, 0, total - 1)
      break
    }
    case 'ArrowLeft': {
      e.preventDefault()
      const dir = rtl ? 1 : -1
      focusedDay.value = clamp((focusedDay.value < 0 ? 0 : focusedDay.value) + dir, 0, total - 1)
      break
    }
    case 'ArrowDown':
      e.preventDefault()
      focusedDay.value = clamp((focusedDay.value < 0 ? 0 : focusedDay.value) + 7, 0, total - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedDay.value = clamp((focusedDay.value < 0 ? 0 : focusedDay.value) - 7, 0, total - 1)
      break
    case 'Enter':
    case ' ':
      if (focusedDay.value >= 0) {
        e.preventDefault()
        emit('day-click', realDays.value[focusedDay.value])
      }
      break
  }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
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

function isFocused(day) {
  if (day.empty || focusedDay.value < 0 || !gridHasFocus.value) return false
  return realDays.value[focusedDay.value]?.day === day.day
}
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

    <!-- Keyboard hint (desktop only, shown when grid is focused) -->
    <div v-if="gridHasFocus" class="hidden sm:flex items-center justify-center gap-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 dark:text-slate-500">
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">&larr;&rarr;&uarr;&darr;</kbd> {{ t('kbdNavigate') }}</span>
      <span><kbd class="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd> {{ t('kbdSelect') }}</span>
    </div>
  </div>
</template>
