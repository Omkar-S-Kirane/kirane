import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { motionValue } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import { Hero } from './Hero'

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false as boolean | null),
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return { ...actual, useReducedMotion: reducedMotionMock }
})

beforeEach(() => {
  reducedMotionMock.mockReturnValue(false)
  window.sessionStorage.clear()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.sessionStorage.clear()
})

function renderHero(props: Partial<React.ComponentProps<typeof Hero>> = {}) {
  return render(
    <I18nProvider>
      <Hero
        active
        fontsReady
        onLayoutReady={vi.fn()}
        onRevealComplete={vi.fn()}
        {...props}
      />
    </I18nProvider>,
  )
}

describe('Hero', () => {
  it('measures after critical fonts settle and reports the first layout once', () => {
    const onLayoutReady = vi.fn()
    const onRevealComplete = vi.fn()

    const { rerender } = render(
      <I18nProvider>
        <Hero
          active={false}
          fontsReady={false}
          onLayoutReady={onLayoutReady}
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(onLayoutReady).not.toHaveBeenCalled()

    rerender(
      <I18nProvider>
        <Hero
          active={false}
          fontsReady
          onLayoutReady={onLayoutReady}
          onRevealComplete={onRevealComplete}
        />
      </I18nProvider>,
    )

    expect(onLayoutReady).toHaveBeenCalledOnce()
    expect(onRevealComplete).not.toHaveBeenCalled()
  })

  it('presents the exact translated hero heading and tagline', () => {
    renderHero()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'ARCHITECT. BUILD. SCALE.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Engineering seamless digital experiences across web, iOS, and Android.',
      ),
    ).toBeInTheDocument()
  })

  it('starts muted and toggles the original video audio with a session preference', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    const { container } = renderHero()
    const video = container.querySelector('video')!
    const button = screen.getByRole('button', { name: 'Turn sound on' })

    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(button)

    expect(video.muted).toBe(false)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(window.sessionStorage.getItem('kirane:hero:sound-enabled')).toBe(
      'true',
    )
    expect(play).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Turn sound off' }))

    expect(video.muted).toBe(true)
    expect(window.sessionStorage.getItem('kirane:hero:sound-enabled')).toBe(
      'false',
    )
  })

  it('fades volume with the cinematic dissolve and resumes when reversed', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {})
    const dissolveProgress = motionValue(0)
    const { container } = renderHero({ dissolveProgress })
    const video = container.querySelector('video')!
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound on' }))

    act(() => dissolveProgress.set(0.5))
    expect(video.volume).toBeCloseTo(0.2)
    expect(video.muted).toBe(false)

    act(() => dissolveProgress.set(1))
    expect(video.volume).toBe(0)
    expect(video.muted).toBe(true)
    expect(pause).toHaveBeenCalled()

    const playsBeforeReverse = play.mock.calls.length
    act(() => dissolveProgress.set(0.5))
    expect(play.mock.calls.length).toBeGreaterThan(playsBeforeReverse)
  })

  it('restores saved preference and recovers gracefully from blocked audio playback', async () => {
    window.sessionStorage.setItem('kirane:hero:sound-enabled', 'true')
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(
      new DOMException('NotAllowedError'),
    )
    const { container } = renderHero()
    fireEvent.canPlay(container.querySelector('video')!)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Turn sound on' }),
      ).toHaveAttribute('aria-pressed', 'false'),
    )
    expect(container.querySelector('video')!.muted).toBe(true)
    expect(screen.getByText(/sound could not start/i)).toBeInTheDocument()
  })

  it('completes its reveal immediately when reduced motion is preferred', () => {
    reducedMotionMock.mockReturnValue(true)
    const onRevealComplete = vi.fn()

    renderHero({ onRevealComplete })

    expect(onRevealComplete).toHaveBeenCalledOnce()
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Turn sound on' })).toBeVisible()
  })
})
