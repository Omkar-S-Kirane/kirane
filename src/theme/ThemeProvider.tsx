import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './context'
import type { ResolvedTheme, ThemePreference } from './theme-types'
import { isThemePreference, resolveTheme } from './theme-types'

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)'
const STORAGE_KEY_ATTRIBUTE = 'data-theme-storage-key'

function getStorageKey(): string | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.getAttribute(STORAGE_KEY_ATTRIBUTE)
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'

  const storageKey = getStorageKey()
  if (!storageKey) return 'system'

  try {
    const stored = window.localStorage.getItem(storageKey)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'dark'
  }

  try {
    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'dark'
  }
}

function applyTheme(preference: ThemePreference, theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.themePreference = preference
  root.dataset.theme = theme
  root.style.colorScheme = theme

  const themeColor = getComputedStyle(root)
    .getPropertyValue('--color-bg')
    .trim()
  const themeColorMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  )
  if (themeColor && themeColorMeta) themeColorMeta.content = themeColor
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState(getInitialPreference)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const resolvedTheme = resolveTheme(preference, systemTheme)

  useLayoutEffect(() => {
    applyTheme(preference, resolvedTheme)
  }, [preference, resolvedTheme])

  useEffect(() => {
    if (preference !== 'system' || typeof window.matchMedia !== 'function') {
      return
    }

    let mediaQuery: MediaQueryList
    try {
      mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    } catch {
      return
    }

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [preference])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    if (!isThemePreference(nextPreference)) return
    if (nextPreference === 'system') setSystemTheme(getSystemTheme())
    setPreferenceState(nextPreference)

    const storageKey = getStorageKey()
    if (!storageKey || typeof window === 'undefined') return

    try {
      window.localStorage.setItem(storageKey, nextPreference)
    } catch {
      // The in-memory theme continues to work when storage is unavailable.
    }
  }, [])

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
