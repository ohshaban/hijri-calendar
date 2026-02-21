import { ref } from 'vue'
import { getReminders, createReminder, deleteReminder } from '../utils/api.js'

export function useReminders() {
  const reminders = ref([])
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

  return { reminders, loading, error, fetchReminders, addReminder, removeReminder }
}
