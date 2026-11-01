import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { motionValue } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { DeveloperUniverse } from './DeveloperUniverse'

const { sceneReadiness } = vi.hoisted(() => ({
  sceneReadiness: { hold: false },
}))

// The WebGL scene itself is verified in the browser; here it is a stub.
vi.mock('./loadUniverseScene', async () => {
  const { useEffect } = await import('react')
  return {
    loadUniverseScene: () =>
      Promise.resolve({
        UniverseScene: ({ onReady }: { onReady?: () => void }) => {
          useEffect(() => {
            if (!sceneReadiness.hold) onReady?.()
          }, [onReady])
          return <div data-testid="scene" />
        },
      }),
  }
})

function mockWebGL(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    (available ? { getExtension: () => null } : null) as never,
  )
}

beforeEach(() => {
  // jsdom has no WebGL, so by default the universe uses its fallback.
  mockWebGL(false)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  sceneReadiness.hold = false
})

describe('DeveloperUniverse', () => {
  it('shows the sun identity in title case when WebGL is unavailable', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(1)} />
      </I18nProvider>,
    )

    expect(screen.getByText('Full Stack')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
  })

  it('falls back gracefully without WebGL and invites the visitor to scroll', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(0)} />
      </I18nProvider>,
    )

    const universe = screen.getByRole('group', {
      name: /Developer universe/,
    })
    expect(
      within(universe).getByText(/Interactive 3D is unavailable/),
    ).toBeInTheDocument()
    expect(
      within(universe).getByText('Scroll to form the universe'),
    ).toBeInTheDocument()
    expect(
      within(universe).getByRole('button', { name: 'React' }),
    ).toBeInTheDocument()
  })

  it('opens details when a partially formed planet is hovered', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(0.4)} />
      </I18nProvider>,
    )

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'React' }))
    expect(
      screen.getByRole('complementary', { name: 'Selected planet: React' }),
    ).toBeInTheDocument()
  })

  it('opens details for every available planet hover target', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(0.7)} />
      </I18nProvider>,
    )

    const planetButtons = screen
      .getAllByRole('button')
      .filter((button) =>
        button.classList.contains('universe-fallback__planet'),
      )
    expect(planetButtons.length).toBeGreaterThan(1)

    for (const button of planetButtons) {
      fireEvent.mouseEnter(button)
      const planetName = button
        .querySelector('span:last-child')
        ?.textContent?.trim()
      expect(planetName).toBeTruthy()
      expect(
        screen.getByRole('complementary', {
          name: `Selected planet: ${planetName}`,
        }),
      ).toBeInTheDocument()
    }
  })

  it('keeps the new planet card open if the prior planet reports a late pointer leave', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(0.7)} />
      </I18nProvider>,
    )

    const react = screen.getByRole('button', { name: 'React' })
    const javascript = screen.getByRole('button', { name: 'JavaScript' })

    fireEvent.mouseEnter(react)
    fireEvent.mouseEnter(javascript)
    fireEvent.mouseLeave(react)

    expect(
      screen.getByRole('complementary', {
        name: 'Selected planet: JavaScript',
      }),
    ).toBeInTheDocument()
    const previousCard = screen.queryByRole('complementary', {
      name: 'Selected planet: React',
    })
    if (previousCard) {
      expect(previousCard).toHaveStyle({ pointerEvents: 'none' })
    }
  })

  it('keeps switching between floating planet cards possible while WebGL is loading', async () => {
    sceneReadiness.hold = true
    vi.restoreAllMocks()
    mockWebGL(true)
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(0.7)} />
      </I18nProvider>,
    )

    expect(await screen.findByTestId('scene')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'React' }).closest('ul'),
    ).toBeInTheDocument()

    const react = screen.getByRole('button', { name: 'React' })
    const javascript = screen.getByRole('button', { name: 'JavaScript' })
    fireEvent.mouseEnter(react)
    expect(
      screen.getByRole('complementary', { name: 'Selected planet: React' }),
    ).toHaveClass('universe-card--floating')

    fireEvent.mouseEnter(javascript)
    fireEvent.mouseLeave(react)

    expect(
      screen.getByRole('complementary', {
        name: 'Selected planet: JavaScript',
      }),
    ).toHaveClass('universe-card--floating')
  })

  it('opens and closes planet details once the universe is interactive', async () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(1)} />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'TypeScript' }))
    expect(
      screen.getByRole('complementary', {
        name: 'Selected planet: TypeScript',
      }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Close technology details' }),
    )
    await vi.waitFor(() =>
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument(),
    )
  })

  it('offers a keyboard list of technologies once the 3D universe is interactive', async () => {
    vi.restoreAllMocks()
    mockWebGL(true)
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(1)} />
      </I18nProvider>,
    )

    expect(await screen.findByTestId('scene')).toBeInTheDocument()
    const list = screen.getByRole('list', {
      name: 'Technologies in the developer universe',
    })
    expect(within(list).getAllByRole('button')).toHaveLength(19)
  })

  it('makes the scene inert outside the Universe destination', () => {
    const { container } = render(
      <I18nProvider>
        <DeveloperUniverse
          progress={motionValue(1)}
          interactionEnabled={false}
        />
      </I18nProvider>,
    )

    const scene = container.querySelector('.developer-universe')
    expect(scene).toHaveAttribute('inert')
    expect(scene).toHaveAttribute('aria-hidden', 'true')
    expect(scene).toHaveStyle({ pointerEvents: 'none' })
  })

  it('keeps only subdued orbit accents in the persistent fallback outside Universe', () => {
    const { container } = render(
      <I18nProvider>
        <DeveloperUniverse
          progress={motionValue(1)}
          interactionEnabled={false}
        />
      </I18nProvider>,
    )

    expect(
      container.querySelector('.universe-fallback__ambient-planets'),
    ).toBeInTheDocument()
    expect(
      container.querySelectorAll('.universe-fallback__ambient-planet'),
    ).not.toHaveLength(0)
    expect(
      container.querySelector('.universe-fallback__planet'),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('.universe-fallback__notice'),
    ).not.toBeInTheDocument()
  })

  it('does not duplicate the technology controls in the fallback', () => {
    render(
      <I18nProvider>
        <DeveloperUniverse progress={motionValue(1)} />
      </I18nProvider>,
    )

    expect(screen.getAllByRole('button', { name: 'React' })).toHaveLength(1)
  })
})
