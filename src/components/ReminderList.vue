<script setup>
import { computed, ref } from 'vue'
import { useLang } from '../utils/i18n.js'
import { getMonthName } from '../utils/hijri.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({ reminderState: Object, lang: String })
const emit = defineEmits(['close'])
const { t } = useLang()
const toast = useToast()

const sortedReminders = computed(() => {
  return [...props.reminderState.reminders.value].sort((a, b) => a.remind_at - b.remind_at)
})

const now = Math.floor(Date.now() / 1000)

// Edit state
const editingId = ref(null)
const editTitle = ref('')
const editDescription = ref('')
const editTime = ref('')

function startEdit(r) {
  editingId.value = r.id
  editTitle.value = r.title
  editDescription.value = r.description || ''
  const d = new Date(r.remind_at * 1000)
  editTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(r) {
  if (!editTitle.value.trim()) return
  const gregDate = r.gregorian_date
  const remindAt = new Date(`${gregDate}T${editTime.value}:00`)

  const ok = await props.reminderState.editReminder(r.id, {
    title: editTitle.value.trim(),
    description: editDescription.value.trim(),
    remindAt: remindAt.toISOString(),
  })

  if (ok) {
    toast.success(t('reminderUpdated'))
    editingId.value = null
  } else {
    toast.error(props.reminderState.error.value)
  }
}

function formatDate(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString(props.lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatHijriMonthDay(month, day) {
  const monthName = getMonthName(month, props.lang)
  return `${day} ${monthName}`
}

async function handleDelete(id) {
  if (!confirm(t('confirmDelete'))) return
  const ok = await props.reminderState.removeReminder(id)
  if (ok) toast.success(t('reminderDeleted'))
}

async function handleDeleteRecurring(id) {
  if (!confirm(t('confirmDelete'))) return
  const ok = await props.reminderState.removeRecurringEvent(id)
  if (ok) toast.success(t('reminderDeleted'))
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

      <div v-else class="overflow-y-auto flex-1 space-y-4">
        <!-- Recurring Events Section -->
        <div v-if="reminderState.recurringEvents.value.length > 0">
          <h3 class="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ t('recurringEvents') }}
          </h3>
          <div class="space-y-2">
            <div
              v-for="e in reminderState.recurringEvents.value"
              :key="e.id"
              class="p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 flex items-start justify-between gap-3"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-medium text-sm truncate">{{ e.title }}</p>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    {{ t('annualReminder') }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatHijriMonthDay(e.hijri_month, e.hijri_day) }}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">{{ t('originYear') }}: {{ e.origin_year }} {{ lang === 'ar' ? 'هـ' : 'AH' }} · {{ e.remind_time }}</p>
              </div>
              <button
                @click="handleDeleteRecurring(e.id)"
                class="shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                :title="t('deleteRecurring')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- One-time Reminders Section -->
        <div v-if="sortedReminders.length === 0 && reminderState.recurringEvents.value.length === 0" class="text-center py-8 text-slate-400">
          <div class="text-4xl mb-3">📭</div>
          <p>{{ t('noReminders') }}</p>
        </div>

        <div v-if="sortedReminders.length > 0" class="space-y-2">
          <div
            v-for="r in sortedReminders"
            :key="r.id"
            class="p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            :class="{ 'opacity-60': r.sent }"
          >
            <!-- Edit form -->
            <div v-if="editingId === r.id" class="space-y-2">
              <input
                v-model="editTitle"
                type="text"
                maxlength="200"
                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                :placeholder="t('title')"
              />
              <textarea
                v-model="editDescription"
                rows="2"
                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                :placeholder="t('description')"
              />
              <input
                v-model="editTime"
                type="time"
                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                dir="ltr"
              />
              <div class="flex gap-2">
                <button
                  @click="cancelEdit"
                  class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {{ t('cancel') }}
                </button>
                <button
                  @click="saveEdit(r)"
                  :disabled="!editTitle.trim()"
                  class="flex-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 text-xs font-medium"
                >
                  {{ t('save') }}
                </button>
              </div>
            </div>

            <!-- Display mode -->
            <div v-else class="flex items-start justify-between gap-3">
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
              <div v-if="!r.sent" class="flex gap-1 shrink-0">
                <button
                  @click="startEdit(r)"
                  class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600"
                  :title="t('edit')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="handleDelete(r.id)"
                  class="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
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
      </div>
    </div>
  </div>
</template>
