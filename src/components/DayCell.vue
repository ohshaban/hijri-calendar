<script setup>
const props = defineProps({
  day: Object,
  lang: String,
  reminders: Array,
})
</script>

<template>
  <div
    class="min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-e border-slate-100 dark:border-slate-700 relative group"
    :class="{
      'cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-900/20': !day.empty,
      'bg-slate-50/50 dark:bg-slate-800/50': day.empty,
    }"
  >
    <template v-if="!day.empty">
      <!-- Hijri day number -->
      <div class="flex items-start justify-between">
        <span
          class="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-semibold"
          :class="{
            'bg-teal-600 text-white': day.isToday,
            'text-slate-700 dark:text-slate-200': !day.isToday,
          }"
        >
          {{ day.day }}
        </span>
        <!-- Gregorian small date -->
        <span class="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
          {{ lang === 'ar' ? day.gregorianFormattedAr : day.gregorianFormatted }}
        </span>
      </div>

      <!-- Islamic date label -->
      <div v-if="day.islamicDate" class="mt-1">
        <span
          class="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full leading-tight inline-block"
          :class="{
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400': day.islamicDate.color === 'emerald',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400': day.islamicDate.color === 'amber',
            'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400': day.islamicDate.color === 'teal',
          }"
        >
          {{ lang === 'ar' ? day.islamicDate.ar : day.islamicDate.en }}
        </span>
      </div>

      <!-- Reminder indicators -->
      <div v-if="reminders.length > 0" class="mt-1 flex gap-0.5">
        <span
          v-for="r in reminders.slice(0, 3)"
          :key="r.id"
          class="w-1.5 h-1.5 rounded-full bg-teal-500"
          :title="r.title"
        />
        <span v-if="reminders.length > 3" class="text-[10px] text-slate-400">
          +{{ reminders.length - 3 }}
        </span>
      </div>
    </template>
  </div>
</template>
