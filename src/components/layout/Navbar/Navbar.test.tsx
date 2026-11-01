import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'

vi.mock('@/hooks/use-active-section', () => ({
  useActiveSection: () => [null, vi.fn()],
}))

import { Navbar } from './Navbar'

describe('Navbar section navigation', () => {
  it('shows the requested destinations in order', () => {
    render(
      <I18nProvider>
        <Navbar activeSection="home" onNavigate={vi.fn()} />
      </I18nProvider>,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Main navigation',
    })
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Universe', 'Impact', 'Work', 'Experience', 'Skills', 'Resume'])
  })

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

  it('navigates to Universe from the mobile menu', () => {
    const onNavigate = vi.fn()
    render(
      <I18nProvider>
        <Navbar activeSection="home" onNavigate={onNavigate} />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const mobileNav = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    })
    fireEvent.click(within(mobileNav).getByRole('link', { name: 'Universe' }))

    expect(onNavigate).toHaveBeenCalledWith('universe')
  })

  it('routes desktop destinations through the controller even when they are not mounted', () => {
    const onNavigate = vi.fn()
    render(
      <I18nProvider>
        <Navbar activeSection="home" onNavigate={onNavigate} />
      </I18nProvider>,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Main navigation',
    })
    fireEvent.click(within(navigation).getByRole('link', { name: 'Work' }))
    expect(onNavigate).toHaveBeenCalledWith('work')
    expect(window.location.hash).not.toBe('#work')
  })
})
