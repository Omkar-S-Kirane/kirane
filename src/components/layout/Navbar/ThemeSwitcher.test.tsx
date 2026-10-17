import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { ThemeProvider } from '@/theme'
import { ThemeSwitcher } from './ThemeSwitcher'

function renderSwitcher() {
  return render(
    <I18nProvider>
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    </I18nProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.themeStorageKey = 'kirane-theme'
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-preference')
  document.documentElement.style.removeProperty('color-scheme')
  delete document.documentElement.dataset.themeStorageKey
})

describe('ThemeSwitcher', () => {
  it('shows the selected preference and applies the selection immediately', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    const trigger = screen.getByRole('button', {
      name: 'Theme preference: System',
    })
    await user.click(trigger)

    const menu = screen.getByRole('menu', { name: 'Theme preference' })
    expect(menu).toBeInTheDocument()
    expect(
      screen.getByRole('menuitemradio', { name: 'System' }),
    ).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }))

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('kirane-theme')).toBe('dark')
    expect(
      screen.getByRole('button', { name: 'Theme preference: Dark' }),
    ).toHaveFocus()
  })

  it('supports arrow-key selection and closes on Escape', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    const trigger = screen.getByRole('button', {
      name: 'Theme preference: System',
    })
    await user.click(trigger)

    const selectedOption = screen.getByRole('menuitemradio', { name: 'System' })
    await waitFor(() => expect(selectedOption).toHaveFocus())
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toHaveFocus()
    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
  })

  it('closes when the user interacts outside the menu', async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(
      screen.getByRole('button', { name: 'Theme preference: System' }),
    )
    await user.click(document.body)

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    )
  })
})
