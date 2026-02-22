<script setup>
import { useToast } from '../composables/useToast.js'

const { toasts } = useToast()
</script>

<template>
  <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm max-w-xs text-center"
        :class="{
          'bg-teal-600/95 text-white': toast.type === 'success',
          'bg-red-600/95 text-white': toast.type === 'error',
        }"
      >
        {{ toast.message }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
