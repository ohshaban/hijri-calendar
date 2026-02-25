<script setup>
import { toArabicNumerals } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'

const props = defineProps({
  day: Object,
  lang: String,
  reminders: Array,
  recurringEvents: { type: Array, default: () => [] },
  selected: { type: Boolean, default: false },
})

const { t } = useLang()

function displayDay(num) {
  return props.lang === 'ar' ? toArabicNumerals(num) : num
}
</script>

<template>
  <div
    class="min-h-[56px] xs:min-h-[80px] sm:min-h-[100px] p-1 xs:p-1.5 sm:p-2 border-b border-e border-slate-100 dark:border-slate-700 relative group"
    :class="{
      'cursor-pointer hover:bg-teal-50/50 dark:hover:bg-teal-900/20': !day.empty,
      'bg-slate-50/50 dark:bg-slate-800/50': day.empty,
      'bg-teal-50 dark:bg-teal-900/30': selected,
    }"
  >
    <template v-if="!day.empty">
      <!-- Hijri day number -->
      <div class="flex items-start justify-between">
        <span
          class="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-semibold"
          :class="{
            'bg-teal-600 text-white': day.isToday,
            'bg-teal-100 text-teal-700 dark:bg-teal-800 dark:text-teal-300': selected && !day.isToday,
            'text-slate-700 dark:text-slate-200': !day.isToday && !selected,
          }"
        >
          {{ displayDay(day.day) }}
        </span>
        <!-- Gregorian small date (hidden on very small screens) -->
        <span class="hidden xs:inline text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
          {{ lang === 'ar' ? day.gregorianFormattedAr : day.gregorianFormatted }}
        </span>
      </div>

      <!-- Mobile: combined indicator dots (Islamic date + recurring + reminders) -->
      <div v-if="day.islamicDate || recurringEvents.length > 0 || reminders.length > 0" class="xs:hidden mt-0.5 flex gap-0.5 items-center">
        <span
          v-if="day.islamicDate"
          class="w-1.5 h-1.5 rounded-full shrink-0"
          :class="{
            'bg-emerald-500': day.islamicDate.color === 'emerald',
            'bg-amber-500': day.islamicDate.color === 'amber',
            'bg-teal-500': day.islamicDate.color === 'teal',
          }"
        />
        <span
          v-for="e in recurringEvents.slice(0, 2)"
          :key="e.id"
          class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
          :title="e.title"
        />
        <span
          v-for="r in reminders.slice(0, 2)"
          :key="r.id"
          class="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"
          :title="r.title"
        />
      </div>

      <!-- Islamic date label (hidden on very small screens) -->
      <div v-if="day.islamicDate" class="hidden xs:block mt-1">
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

      <!-- Event/reminder indicators (desktop only, mobile dots are above) -->
      <div v-if="recurringEvents.length > 0 || reminders.length > 0" class="hidden xs:flex mt-1 gap-0.5">
        <span
          v-for="e in recurringEvents.slice(0, 3)"
          :key="e.id"
          class="w-1.5 h-1.5 rounded-full bg-amber-500"
          :title="e.title"
        />
        <span
          v-for="r in reminders.slice(0, 3)"
          :key="r.id"
          class="w-1.5 h-1.5 rounded-full bg-sky-500"
          :title="r.title"
        />
        <span v-if="recurringEvents.length + reminders.length > 3" class="text-[10px] text-slate-400">
          +{{ recurringEvents.length + reminders.length - 3 }}
        </span>
      </div>

      <!-- Tap/click hint on selected cell -->
      <div v-if="selected" class="absolute bottom-0.5 xs:bottom-1 inset-x-0 text-center">
        <span class="inline-flex items-center gap-0.5 text-teal-600/70 dark:text-teal-400/60">
          <svg class="w-2.5 h-2.5 xs:w-3 xs:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
          <span class="hidden xs:inline text-[9px] sm:text-[10px]">{{ t('tapToRemind') }}</span>
        </span>
      </div>
    </template>
  </div>
</template>
