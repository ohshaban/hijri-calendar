<script setup>
import { computed } from 'vue'
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

function dayReminders(day) {
  if (!day || day.empty || !props.reminders) return []
  const hijriDate = `${props.currentYear}-${String(props.currentMonth).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
  return props.reminders.filter(r => r.hijri_date === hijriDate && !r.cancelled)
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
    <div class="grid grid-cols-7">
      <DayCell
        v-for="(day, i) in days"
        :key="i"
        :day="day"
        :lang="lang"
        :reminders="dayReminders(day)"
        @click="emit('day-click', day)"
      />
    </div>
  </div>
</template>
