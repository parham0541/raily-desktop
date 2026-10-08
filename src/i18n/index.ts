import en from './en'
import fa from './fa'

export const translations = {
  en,
  fa,
}

export type Language = keyof typeof translations

export function getTranslation(language: Language) {
  return translations[language]
}

export function getDirection(language: Language) {
  return language === 'fa' ? 'rtl' : 'ltr'
}