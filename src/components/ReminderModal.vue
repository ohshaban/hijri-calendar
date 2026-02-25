<script setup>
import { ref } from 'vue'
import { formatHijriDate, toGregorian, getMonthName } from '../utils/hijri.js'
import { useLang } from '../utils/i18n.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  day: Object,
  year: Number,
  month: Number,
  reminderState: Object,
  lang: String,
})

const emit = defineEmits(['close'])
const { t } = useLang()
const toast = useToast()

const title = ref('')
const description = ref('')
const remindTime = ref('09:00')
const isRecurring = ref(false)
const remindDaysBefore = ref(0)

const hijriDateStr = `${props.year}-${String(props.month).padStart(2, '0')}-${String(props.day.day).padStart(2, '0')}`
const gregDate = toGregorian(props.year, props.month, props.day.day)
const gregDateStr = gregDate.toISOString().split('T')[0]

async function handleSave() {
  if (!title.value.trim()) return

  if (isRecurring.value) {
    const ok = await props.reminderState.addRecurringEvent({
      title: title.value.trim(),
      description: description.value.trim(),
      hijriMonth: props.month,
      hijriDay: props.day.day,
      originYear: props.year,
      remindTime: remindTime.value,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      remindDaysBefore: remindDaysBefore.value,
    })

    if (ok) {
      toast.success(t('reminderCreated'))
      emit('close')
    } else {
      toast.error(props.reminderState.error.value)
    }
  } else {
    const remindAt = new Date(`${gregDateStr}T${remindTime.value}:00`)

    const ok = await props.reminderState.addReminder({
      title: title.value.trim(),
      description: description.value.trim(),
      hijriDate: hijriDateStr,
      gregorianDate: gregDateStr,
      remindAt: remindAt.toISOString(),
    })

    if (ok) {
      toast.success(t('reminderCreated'))
      emit('close')
    } else {
      toast.error(props.reminderState.error.value)
    }
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{{ t('createReminder') }}</h2>
        <button @click="emit('close')" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <!-- Date display -->
        <div class="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 mb-4">
          <p class="font-medium text-teal-700 dark:text-teal-400">
            {{ formatHijriDate(year, month, day.day, lang) }}
          </p>
          <p class="text-sm text-teal-600/70 dark:text-teal-500">
            {{ lang === 'ar' ? day.gregorianFormattedAr : day.gregorianFormatted }}
          </p>
        </div>

        <!-- Recurring toggle -->
        <label class="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input
            v-model="isRecurring"
            type="checkbox"
            class="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span class="text-sm font-medium text-slate-600 dark:text-slate-400">{{ t('recurringReminder') }}</span>
        </label>

        <!-- Origin year context for recurring -->
        <div v-if="isRecurring" class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 mb-4 text-xs text-amber-700 dark:text-amber-400">
          {{ t('originYear') }}: {{ year }} {{ lang === 'ar' ? 'هـ' : 'AH' }}
        </div>

        <!-- Form -->
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{{ t('title') }}</label>
            <input
              v-model="title"
              type="text"
              maxlength="200"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              :placeholder="lang === 'ar' ? 'مثال: أول رمضان' : 'e.g. First of Ramadan'"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{{ t('description') }}</label>
            <textarea
              v-model="description"
              rows="2"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{{ t('reminderTime') }}</label>
            <input
              v-model="remindTime"
              type="time"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              dir="ltr"
            />
          </div>

          <!-- Advance reminder for recurring events -->
          <div v-if="isRecurring">
            <label class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">{{ t('remindDaysBefore') }}</label>
            <select
              v-model="remindDaysBefore"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option :value="0">{{ t('onTheDay') }}</option>
              <option :value="1">1 {{ lang === 'ar' ? 'يوم قبل' : 'day before' }}</option>
              <option :value="3">3 {{ t('daysBeforeLabel') }}</option>
              <option :value="7">7 {{ t('daysBeforeLabel') }}</option>
              <option :value="10">10 {{ t('daysBeforeLabel') }}</option>
            </select>
          </div>
        </div>

        <p v-if="reminderState.error.value" class="text-sm text-red-500 mt-2">{{ reminderState.error.value }}</p>

        <div class="flex gap-2 mt-4">
          <button
            @click="emit('close')"
            class="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {{ t('cancel') }}
          </button>
          <button
            @click="handleSave"
            :disabled="reminderState.loading.value || !title.trim()"
            class="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {{ reminderState.loading.value ? t('loading') : t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
