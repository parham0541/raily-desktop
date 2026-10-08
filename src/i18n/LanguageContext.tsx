import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  getDirection,
  getTranslation,
  type Language,
} from './index'

export type Theme =
  | 'system'
  | 'light'
  | 'dark'

type LanguageContextValue = {
  language: Language
  direction: 'ltr' | 'rtl'
  theme: Theme
  t: ReturnType<typeof getTranslation>

  setLanguage: (
    language: Language,
  ) => Promise<void>

  setTheme: (
    theme: Theme,
  ) => Promise<void>

  loading: boolean
}

const LanguageContext =
  createContext<LanguageContextValue | null>(
    null,
  )

type LanguageProviderProps = {
  children: ReactNode
}

function getSystemTheme():
  | 'light'
  | 'dark' {
  const mediaQuery =
    window.matchMedia(
      '(prefers-color-scheme: dark)',
    )

  return mediaQuery.matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  const root =
    document.documentElement

  const resolvedTheme =
    theme === 'system'
      ? getSystemTheme()
      : theme

  root.classList.toggle(
    'dark',
    resolvedTheme === 'dark',
  )

  root.dataset.theme =
    resolvedTheme

  root.style.colorScheme =
    resolvedTheme
}

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguageState] =
    useState<Language>('en')

  const [theme, setThemeState] =
    useState<Theme>('system')

  const [loading, setLoading] =
    useState(true)

  const direction =
    getDirection(language)

  const t =
    getTranslation(language)

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings =
          await window.raily.settings.get()

        if (
          settings?.language === 'fa' ||
          settings?.language === 'en'
        ) {
          setLanguageState(
            settings.language,
          )
        }

        if (
          settings?.theme === 'system' ||
          settings?.theme === 'light' ||
          settings?.theme === 'dark'
        ) {
          setThemeState(
            settings.theme,
          )

          applyTheme(
            settings.theme,
          )
        } else {
          applyTheme('system')
        }
      } catch (error) {
        console.error(
          'Failed to load application settings:',
          error,
        )

        applyTheme('system')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    const root =
      document.documentElement

    root.lang = language
    root.dir = direction
  }, [
    language,
    direction,
  ])

  useEffect(() => {
    applyTheme(theme)

    if (theme !== 'system') {
      return
    }

    const mediaQuery =
      window.matchMedia(
        '(prefers-color-scheme: dark)',
      )

    const handleSystemThemeChange =
      () => {
        applyTheme('system')
      }

    mediaQuery.addEventListener(
      'change',
      handleSystemThemeChange,
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleSystemThemeChange,
      )
    }
  }, [theme])

  async function setLanguage(
    nextLanguage: Language,
  ) {
    setLanguageState(
      nextLanguage,
    )

    try {
      await window.raily.settings.update(
        {
          language:
            nextLanguage,
        },
      )
    } catch (error) {
      console.error(
        'Failed to save language:',
        error,
      )
    }
  }

  async function setTheme(
    nextTheme: Theme,
  ) {
    setThemeState(
      nextTheme,
    )

    applyTheme(
      nextTheme,
    )

    try {
      await window.raily.settings.update(
        {
          theme: nextTheme,
        },
      )
    } catch (error) {
      console.error(
        'Failed to save theme:',
        error,
      )
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        theme,
        t,
        setLanguage,
        setTheme,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext,
    )

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider',
    )
  }

  return context
}