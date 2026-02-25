import { ref, computed } from 'vue'

const currentLang = ref(localStorage.getItem('hilal_lang') || 'en')

export function useLang() {
  const lang = computed(() => currentLang.value)
  const isRtl = computed(() => currentLang.value === 'ar')
  const dir = computed(() => currentLang.value === 'ar' ? 'rtl' : 'ltr')

  function setLang(l) {
    currentLang.value = l
    localStorage.setItem('hilal_lang', l)
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  function t(key) {
    return translations[currentLang.value]?.[key] || translations.en[key] || key
  }

  return { lang, isRtl, dir, setLang, t }
}

const translations = {
  en: {
    appName: 'Hilal Calendar',
    today: 'Today',
    month: 'Month',
    year: 'Year',
    createReminder: 'Create Reminder',
    myReminders: 'My Reminders',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    email: 'Email',
    sendCode: 'Send Code',
    verifyCode: 'Verify Code',
    enterEmail: 'Enter your email',
    enterCode: 'Enter 6-digit code',
    title: 'Title',
    description: 'Description (optional)',
    reminderDate: 'Remind me on',
    reminderTime: 'at time',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    noReminders: 'No reminders yet',
    loading: 'Loading...',
    signInToCreate: 'Sign in to create reminders',
    reminderCreated: 'Reminder created!',
    reminderDeleted: 'Reminder cancelled',
    otpSent: 'Code sent to your email',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    gregorian: 'Gregorian',
    close: 'Close',
    upcoming: 'Upcoming',
    past: 'Past',
    sent: 'Sent',
    pending: 'Pending',
    recurringReminder: 'Recurring annual reminder',
    recurringEvents: 'Recurring Events',
    originYear: 'Origin Year',
    annualReminder: 'Annual Reminder',
    deleteRecurring: 'Delete recurring event',
    noRecurringEvents: 'No recurring events',
    confirmDelete: 'Are you sure you want to delete this?',
    kbdNavigate: 'navigate',
    kbdSelect: 'open',
    kbdCreateReminder: 'create reminder',
    tapToRemind: 'tap to set reminder',
    edit: 'Edit',
    reminderUpdated: 'Reminder updated!',
    upcomingReminders: 'Upcoming',
    pastReminders: 'Past',
    clearPast: 'Clear past',
    pastCleared: 'Past reminders cleared',
  },
  ar: {
    appName: 'تقويم هلال',
    today: 'اليوم',
    month: 'الشهر',
    year: 'السنة',
    createReminder: 'إنشاء تذكير',
    myReminders: 'تذكيراتي',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    sendCode: 'إرسال الرمز',
    verifyCode: 'تأكيد الرمز',
    enterEmail: 'أدخل بريدك الإلكتروني',
    enterCode: 'أدخل الرمز المكون من 6 أرقام',
    title: 'العنوان',
    description: 'الوصف (اختياري)',
    reminderDate: 'ذكّرني في',
    reminderTime: 'في الوقت',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    noReminders: 'لا توجد تذكيرات',
    loading: 'جارٍ التحميل...',
    signInToCreate: 'سجّل الدخول لإنشاء تذكيرات',
    reminderCreated: 'تم إنشاء التذكير!',
    reminderDeleted: 'تم إلغاء التذكير',
    otpSent: 'تم إرسال الرمز إلى بريدك',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    gregorian: 'ميلادي',
    close: 'إغلاق',
    upcoming: 'القادمة',
    past: 'السابقة',
    sent: 'تم الإرسال',
    pending: 'قيد الانتظار',
    recurringReminder: 'تذكير سنوي متكرر',
    recurringEvents: 'الأحداث المتكررة',
    originYear: 'سنة الحدث',
    annualReminder: 'تذكير سنوي',
    deleteRecurring: 'حذف التذكير المتكرر',
    noRecurringEvents: 'لا توجد أحداث متكررة',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    kbdNavigate: 'تنقل',
    kbdSelect: 'فتح',
    kbdCreateReminder: 'إنشاء تذكير',
    tapToRemind: 'انقر لإنشاء تذكير',
    edit: 'تعديل',
    reminderUpdated: 'تم تحديث التذكير!',
    upcomingReminders: 'القادمة',
    pastReminders: 'السابقة',
    clearPast: 'مسح السابقة',
    pastCleared: 'تم مسح التذكيرات السابقة',
  }
}
