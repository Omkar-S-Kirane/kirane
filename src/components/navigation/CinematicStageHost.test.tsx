import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { CinematicStageHost } from './CinematicStageHost'

vi.mock('motion/react', async () => {
  const actual =
    await vi.importActual<typeof import('motion/react')>('motion/react')
  return { ...actual, useReducedMotion: () => true }
})

describe('CinematicStageHost', () => {
  it('lets pointer input pass through the Universe introduction to the 3D scene', () => {
    render(
      <I18nProvider>
        <CinematicStageHost
          activeStage="universe"
          onTransitionComplete={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getByTestId('active-stage-panel')).toHaveStyle({
      pointerEvents: 'none',
    })
  })

  it('renders one active, accessible panel and makes the exiting panel inert', async () => {
    const onTransitionComplete = vi.fn()
    const { rerender } = render(
      <I18nProvider>
        <CinematicStageHost
          activeStage="impact"
          onTransitionComplete={onTransitionComplete}
        />
      </I18nProvider>,
    )

    const host = screen.getByTestId('cinematic-stage-host')
    expect(host).toHaveAttribute('data-active-stage', 'impact')
    expect(host.querySelectorAll('[data-stage-panel="active"]')).toHaveLength(1)
    expect(
      screen.getByRole('region', { name: /Experience measured/ }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)

    rerender(
      <I18nProvider>
        <CinematicStageHost
          activeStage="work"
          onTransitionComplete={onTransitionComplete}
        />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(host.querySelectorAll('[data-stage-panel="active"]')).toHaveLength(
        1,
      )
      expect(host).toHaveAttribute('data-active-stage', 'work')
    })
    const inactivePanels = host.querySelectorAll(
      '[data-stage-panel="inactive"]',
    )
    for (const panel of inactivePanels) {
      expect(panel).toHaveAttribute('aria-hidden', 'true')
      expect(panel).toHaveAttribute('inert')
    }
  })

  it('uses an immediate transition for reduced-motion visitors', () => {
    render(
      <I18nProvider>
        <CinematicStageHost
          activeStage="skills"
          onTransitionComplete={vi.fn()}
        />
      </I18nProvider>,
    )
    const panel = screen.getByTestId('active-stage-panel')
    expect(panel).toHaveAttribute('data-reduced-motion', 'true')
    expect(panel).toHaveAttribute('data-transition-duration', '0')
  })

  it('routes direct stage selection to the matching content and preserves actions', async () => {
    const onOpenResume = vi.fn()
    const { rerender } = render(
      <I18nProvider>
        <CinematicStageHost
          activeStage="home"
          onTransitionComplete={vi.fn()}
          onOpenResume={onOpenResume}
        />
      </I18nProvider>,
    )
    expect(screen.queryByTestId('active-stage-panel')).not.toBeInTheDocument()

    rerender(
      <I18nProvider>
        <CinematicStageHost
          activeStage="resume"
          onTransitionComplete={vi.fn()}
          onOpenResume={onOpenResume}
        />
      </I18nProvider>,
    )
    screen.getByRole('button', { name: 'Open resume' }).click()
    expect(onOpenResume).toHaveBeenCalledOnce()

    rerender(
      <I18nProvider>
        <CinematicStageHost
          activeStage="contact"
          onTransitionComplete={vi.fn()}
          onOpenResume={onOpenResume}
        />
      </I18nProvider>,
    )
    await waitFor(() => {
      const activePanel = screen
        .getByTestId('cinematic-stage-host')
        .querySelector('[data-stage-panel="active"]')
      expect(activePanel).not.toBeNull()
      expect(
        within(activePanel as HTMLElement).getByRole('link', { name: 'Email' }),
      ).toHaveAttribute('href', 'mailto:omkarkirane.dev@gmail.com')
    })
  })
})
