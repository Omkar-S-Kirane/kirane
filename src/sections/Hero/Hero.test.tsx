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
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1024,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 768,
  })
  window.sessionStorage.clear()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.sessionStorage.clear()
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1024,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 768,
  })
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

  it('loads one viewport-matched video and preserves the sound choice across orientation changes', () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)
    const { container } = renderHero()
    const video = container.querySelector('video')!

    expect(container.querySelectorAll('video')).toHaveLength(1)
    expect(video.getAttribute('src')).toContain('web-bg.optimized.mp4')
    expect(video.getAttribute('poster')).toContain('web-bg-poster.webp')
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound on' }))
    expect(video.muted).toBe(false)

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844,
    })
    fireEvent(window, new Event('orientationchange'))

    expect(container.querySelector('video')).toBe(video)
    expect(container.querySelectorAll('video')).toHaveLength(1)
    expect(video.getAttribute('src')).toContain('mobile-bg.optimized.mp4')
    expect(video.getAttribute('poster')).toContain('mobile-bg-poster.webp')
    expect(video.muted).toBe(false)
    expect(
      screen.getByRole('button', { name: 'Turn sound off' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(play).toHaveBeenCalled()
  })

  it('does not change the video source for small viewport resizes within one composition', () => {
    const { container } = renderHero()
    const video = container.querySelector('video')!
    const initialSource = video.getAttribute('src')

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 760,
    })
    fireEvent(window, new Event('resize'))

    expect(video.getAttribute('src')).toBe(initialSource)
    expect(container.querySelector('video')).toBe(video)
  })

  it('fades volume with the cinematic dissolve and resumes when reversed', async () => {
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
    await act(async () => {
      await Promise.resolve()
    })

    act(() => dissolveProgress.set(0.5))
    expect(video.volume).toBeCloseTo(0.2)
    expect(video.muted).toBe(false)
    await act(async () => {
      await Promise.resolve()
    })

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
