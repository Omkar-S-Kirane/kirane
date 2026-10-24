import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'

vi.mock('@/hooks/use-active-section', () => ({
  useActiveSection: () => [null, vi.fn()],
}))

import { Navbar } from './Navbar'

describe('Navbar section navigation', () => {
  it('shows Impact in the mobile menu, navigates to it, and closes the menu', () => {
    const onNavigate = vi.fn()
    render(
      <I18nProvider>
        <Navbar activeSection="home" onNavigate={onNavigate} />
      </I18nProvider>,
    )

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    fireEvent.click(toggle)

    const mobileNav = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    })
    fireEvent.click(within(mobileNav).getByRole('link', { name: 'Impact' }))

    expect(onNavigate).toHaveBeenCalledWith('impact')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
