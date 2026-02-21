<script setup>
import { getMonthName, getAllMonths } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'

const props = defineProps({
  year: Number,
  month: Number,
  lang: String,
})

const emit = defineEmits(['prev', 'next', 'today', 'set-month', 'set-year'])
const { t } = useLang()

const years = Array.from({ length: 21 }, (_, i) => 1440 + i)
</script>

<template>
  <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
    <!-- Nav arrows + month/year -->
    <div class="flex items-center gap-2">
      <button
        @click="emit('prev')"
        class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="Previous month"
      >
        <svg class="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-1">
        <select
          :value="month"
          @change="emit('set-month', Number($event.target.value))"
          class="bg-transparent font-semibold text-lg cursor-pointer focus:outline-none appearance-none pe-1"
        >
          <option
            v-for="m in getAllMonths(lang)"
            :key="m.value"
            :value="m.value"
            class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            {{ m.label }}
          </option>
        </select>

        <select
          :value="year"
          @change="emit('set-year', Number($event.target.value))"
          class="bg-transparent font-semibold text-lg cursor-pointer focus:outline-none appearance-none"
        >
          <option
            v-for="y in years"
            :key="y"
            :value="y"
            class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            {{ y }}
          </option>
        </select>
      </div>

      <button
        @click="emit('next')"
        class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label="Next month"
      >
        <svg class="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Today button -->
    <button
      @click="emit('today')"
      class="px-4 py-1.5 text-sm rounded-lg border border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 font-medium"
    >
      {{ t('today') }}
    </button>
  </div>
</template>
