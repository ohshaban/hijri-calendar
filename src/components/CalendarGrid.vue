<script setup>
import { computed, ref } from 'vue'
import { getDayNames, formatHijriDate } from '../utils/hijri.js'
import DayCell from './DayCell.vue'

const props = defineProps({
  days: Array,
  lang: String,
  reminders: Array,
  currentMonth: Number,
  currentYear: Number,
})

const emit = defineEmits(['day-click'])

const dayNames = computed(() => getDayNames(props.lang))
const focusedIndex = ref(-1)

const realDays = computed(() => props.days.filter(d => !d.empty))

function dayReminders(day) {
  if (!day || day.empty || !props.reminders) return []
  const hijriDate = `${props.currentYear}-${String(props.currentMonth).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  return props.reminders.filter(r => r.hijri_date === hijriDate && !r.cancelled)
}

function handleGridKeydown(e) {
  const total = realDays.value.length
  if (!total) return

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1
    focusedIndex.value = Math.min(total - 1, Math.max(0, (focusedIndex.value < 0 ? 0 : focusedIndex.value) + dir))
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const dir = document.documentElement.dir === 'rtl' ? 1 : -1
    focusedIndex.value = Math.min(total - 1, Math.max(0, (focusedIndex.value < 0 ? 0 : focusedIndex.value) + dir))
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(total - 1, (focusedIndex.value < 0 ? 0 : focusedIndex.value) + 7)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(0, (focusedIndex.value < 0 ? 0 : focusedIndex.value) - 7)
  } else if (e.key === 'Enter' && focusedIndex.value >= 0) {
    e.preventDefault()
    emit('day-click', realDays.value[focusedIndex.value])
  }
}

function isFocused(day) {
  if (day.empty || focusedIndex.value < 0) return false
  return realDays.value[focusedIndex.value]?.day === day.day
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
    <div class="grid grid-cols-7" tabindex="0" @keydown="handleGridKeydown" @focus="focusedIndex = focusedIndex < 0 ? 0 : focusedIndex" @blur="focusedIndex = -1" role="grid" aria-label="Calendar">
      <DayCell
        v-for="(day, i) in days"
        :key="i"
        :day="day"
        :lang="lang"
        :reminders="dayReminders(day)"
        :focused="isFocused(day)"
        @click="emit('day-click', day)"
      />
    </div>
  </div>
</template>
