<script setup>
import { ref } from 'vue'
import { useLang } from '../utils/i18n.js'

const props = defineProps({ auth: Object, lang: String })
const emit = defineEmits(['close', 'success'])
const { t } = useLang()

const step = ref('email') // 'email' or 'otp'
const email = ref('')
const code = ref('')

async function handleRequestOtp() {
  if (!email.value) return
  const ok = await props.auth.sendOtp(email.value)
  if (ok) step.value = 'otp'
}

async function handleVerify() {
  if (!code.value) return
  const ok = await props.auth.verify(email.value, code.value)
  if (ok) emit('success')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold">{{ t('signIn') }}</h2>
        <button @click="emit('close')" class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Email step -->
      <div v-if="step === 'email'">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ t('signInToCreate') }}</p>
        <input
          v-model="email"
          type="email"
          :placeholder="t('enterEmail')"
          class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          @keyup.enter="handleRequestOtp"
          :dir="'ltr'"
        />
        <p v-if="auth.error.value" class="text-sm text-red-500 mt-2">{{ auth.error.value }}</p>
        <button
          @click="handleRequestOtp"
          :disabled="auth.loading.value || !email"
          class="w-full mt-4 px-4 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {{ auth.loading.value ? t('loading') : t('sendCode') }}
        </button>
      </div>

      <!-- OTP step -->
      <div v-else>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ t('otpSent') }}</p>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          maxlength="6"
          :placeholder="t('enterCode')"
          class="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-center tracking-[0.3em] font-mono text-lg"
          @keyup.enter="handleVerify"
          dir="ltr"
        />
        <p v-if="auth.error.value" class="text-sm text-red-500 mt-2">{{ auth.error.value }}</p>
        <button
          @click="handleVerify"
          :disabled="auth.loading.value || code.length < 6"
          class="w-full mt-4 px-4 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {{ auth.loading.value ? t('loading') : t('verifyCode') }}
        </button>
        <button
          @click="step = 'email'"
          class="w-full mt-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {{ t('cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>
