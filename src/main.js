import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Restore language preference
const lang = localStorage.getItem('hilal_lang') || 'en'
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
document.documentElement.lang = lang

// Restore dark mode preference
if (localStorage.getItem('hilal_dark') === 'true' ||
    (!localStorage.getItem('hilal_dark') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
}

createApp(App).mount('#app')
