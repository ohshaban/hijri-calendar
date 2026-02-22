import { ref } from 'vue'
import {
  getReminders, createReminder, deleteReminder,
  getRecurringEvents, createRecurringEvent, deleteRecurringEvent
} from '../utils/api.js'

export function useReminders() {
  const reminders = ref([])
  const recurringEvents = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchReminders() {
    loading.value = true
    error.value = ''
    try {
      const data = await getReminders()
      reminders.value = data.reminders
    } catch (err) {
      error.value = err.error || 'Failed to load reminders'
    } finally {
      loading.value = false
    }
  }

  async function addReminder(data) {
    loading.value = true
    error.value = ''
    try {
      const result = await createReminder(data)
      reminders.value.push(result.reminder)
      return true
    } catch (err) {
      error.value = err.error || 'Failed to create reminder'
      return false
    } finally {
      loading.value = false
    }
  }

  async function removeReminder(id) {
    error.value = ''
    try {
      await deleteReminder(id)
      reminders.value = reminders.value.filter(r => r.id !== id)
      return true
    } catch (err) {
      error.value = err.error || 'Failed to delete reminder'
      return false
    }
  }

  async function fetchRecurringEvents() {
    error.value = ''
    try {
      const data = await getRecurringEvents()
      recurringEvents.value = data.recurringEvents
    } catch (err) {
      error.value = err.error || 'Failed to load recurring events'
    }
  }

  async function addRecurringEvent(data) {
    loading.value = true
    error.value = ''
    try {
      const result = await createRecurringEvent(data)
      recurringEvents.value.push(result.recurringEvent)
      return true
    } catch (err) {
      error.value = err.error || 'Failed to create recurring event'
      return false
    } finally {
      loading.value = false
    }
  }

  async function removeRecurringEvent(id) {
    error.value = ''
    try {
      await deleteRecurringEvent(id)
      recurringEvents.value = recurringEvents.value.filter(e => e.id !== id)
      return true
    } catch (err) {
      error.value = err.error || 'Failed to delete recurring event'
      return false
    }
  }

  return {
    reminders, recurringEvents, loading, error,
    fetchReminders, addReminder, removeReminder,
    fetchRecurringEvents, addRecurringEvent, removeRecurringEvent
  }
}
