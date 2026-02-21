<script setup>
import { getMonthName, formatHijriDate } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'

const props = defineProps({ today: Object, lang: String })
const { t } = useLang()
</script>

<template>
  <div class="mb-6 text-center">
    <p class="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{{ t('today') }}</p>
    <p class="text-2xl font-bold text-teal-700 dark:text-teal-400">
      {{ formatHijriDate(today.year, today.month, today.day, lang) }}
    </p>
  </div>
</template>
