import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

function createMatchMedia(initiallyDark: boolean) {
  let listener: ((event: MediaQueryListEvent) => void) | undefined
  const mediaQuery = {
    matches: initiallyDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(
      (_type: string, callback: (event: MediaQueryListEvent) => void) => {
        listener = callback
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, callback: (event: MediaQueryListEvent) => void) => {
        if (listener === callback) listener = undefined
      },
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery),
  )
  return {
    mediaQuery,
    setDark(isDark: boolean) {
      Object.defineProperty(mediaQuery, 'matches', { value: isDark })
      listener?.({ matches: isDark } as MediaQueryListEvent)
    },
  }
}

function ThemeProbe() {
  const { preference, resolvedTheme, setPreference } = useTheme()

  return (
    <div>
      <output data-testid="theme-state">
        {preference}:{resolvedTheme}
      </output>
      <button onClick={() => setPreference('dark')}>choose dark</button>
      <button onClick={() => setPreference('light')}>choose light</button>
      <button onClick={() => setPreference('system')}>choose system</button>
    </div>
  )
}

function renderThemeProbe() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.themeStorageKey = 'kirane-theme'
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-preference')
  document.documentElement.style.removeProperty('color-scheme')
  delete document.documentElement.dataset.themeStorageKey
})

describe('ThemeProvider', () => {
  it('defaults to System and follows operating-system theme changes', () => {
    const { mediaQuery, setDark } = createMatchMedia(false)

    renderThemeProbe()

    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(document.documentElement).toHaveAttribute(
      'data-theme-preference',
      'system',
    )
    expect(mediaQuery.addEventListener).toHaveBeenCalledOnce()

    act(() => setDark(true))

    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('persists explicit preferences and ignores operating-system changes', () => {
    const { mediaQuery, setDark } = createMatchMedia(true)

    renderThemeProbe()

    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:dark')

    act(() => setDark(false))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:light')

    fireEvent.click(screen.getByRole('button', { name: 'choose dark' }))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('dark:dark')

    act(() => setDark(false))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('dark:dark')

    fireEvent.click(screen.getByRole('button', { name: 'choose system' }))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:light')

    act(() => setDark(true))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:dark')

    fireEvent.click(screen.getByRole('button', { name: 'choose light' }))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('light:light')
    expect(localStorage.getItem('kirane-theme')).toBe('light')
    expect(mediaQuery.removeEventListener).toHaveBeenCalledTimes(2)

    act(() => setDark(true))
    expect(screen.getByTestId('theme-state')).toHaveTextContent('light:light')

    cleanup()
    renderThemeProbe()
    expect(screen.getByTestId('theme-state')).toHaveTextContent('light:light')
  })

  it('ignores invalid stored preferences and falls back to System', () => {
    createMatchMedia(false)
    localStorage.setItem('kirane-theme', 'sepia')

    renderThemeProbe()

    expect(screen.getByTestId('theme-state')).toHaveTextContent('system:light')
  })

  it('continues working when localStorage is unavailable', () => {
    createMatchMedia(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    renderThemeProbe()
    fireEvent.click(screen.getByRole('button', { name: 'choose dark' }))

    expect(screen.getByTestId('theme-state')).toHaveTextContent('dark:dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
