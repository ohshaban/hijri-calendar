<script setup>
import { computed } from 'vue'
import { useLang } from '../utils/i18n.js'

const props = defineProps({ reminderState: Object, lang: String })
const emit = defineEmits(['close'])
const { t } = useLang()

const sortedReminders = computed(() => {
  return [...props.reminderState.reminders.value].sort((a, b) => a.remind_at - b.remind_at)
})

const now = Math.floor(Date.now() / 1000)

function formatDate(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString(props.lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function handleDelete(id) {
  await props.reminderState.removeReminder(id)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">{{ t('myReminders') }}</h2>
        <button @click="emit('close')" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="reminderState.loading.value" class="text-center py-8 text-slate-400">
        {{ t('loading') }}
      </div>

      <div v-else-if="sortedReminders.length === 0" class="text-center py-8 text-slate-400">
        <div class="text-4xl mb-3">📭</div>
        <p>{{ t('noReminders') }}</p>
      </div>

      <div v-else class="overflow-y-auto flex-1 space-y-2">
        <div
          v-for="r in sortedReminders"
          :key="r.id"
          class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
          :class="{
            'opacity-60': r.sent,
          }"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="font-medium text-sm truncate">{{ r.title }}</p>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                :class="{
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400': r.sent,
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400': !r.sent && r.remind_at > now,
                  'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400': !r.sent && r.remind_at <= now,
                }"
              >
                {{ r.sent ? t('sent') : t('pending') }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ r.hijri_date }}</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatDate(r.remind_at) }}</p>
          </div>
          <button
            v-if="!r.sent"
            @click="handleDelete(r.id)"
            class="shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            :title="t('delete')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
