import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/i18n'
import type { StrokeFillProps } from '@/components/Animations&Motion/TextAnimations/tsx/StrokeFill'
import { SplashScreen } from './SplashScreen'

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false as boolean | null),
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()

  return { ...actual, useReducedMotion: reducedMotionMock }
})

vi.mock('@/components/effects/ParticleSphere', () => ({
  ParticleSphere: () => <canvas data-testid="particle-sphere" />,
}))

vi.mock(
  '@/components/Animations&Motion/TextAnimations/tsx',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@/components/Animations&Motion/TextAnimations/tsx')
      >()

    return {
      ...actual,
      StrokeFill: ({ children, onComplete }: StrokeFillProps) => (
        <section data-testid="wordmark-sequence">
          <button
            type="button"
            data-testid="finish-wordmark"
            onClick={() => onComplete?.()}
          />
          {children}
        </section>
      ),
    }
  },
)

let queuedFrames: FrameRequestCallback[]

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotionMock.mockReturnValue(false)
  queuedFrames = []
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      queuedFrames.push(callback)
      return queuedFrames.length
    }),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function renderSplash(fontsReady = true) {
  return render(
    <I18nProvider>
      <SplashScreen
        exiting={false}
        fontsReady={fontsReady}
        onRevealComplete={vi.fn()}
      />
    </I18nProvider>,
  )
}

describe('SplashScreen animation sequence', () => {
  it('waits for critical font loading before starting the wordmark', () => {
    const { rerender } = renderSplash(false)

    expect(screen.queryByTestId('wordmark-sequence')).not.toBeInTheDocument()

    rerender(
      <I18nProvider>
        <SplashScreen
          exiting={false}
          fontsReady
          onRevealComplete={vi.fn()}
        />
      </I18nProvider>,
    )

    expect(screen.getByTestId('wordmark-sequence')).toBeInTheDocument()
  })

  it('starts the tagline only after the wordmark completes and a short hold', async () => {
    renderSplash()
    const tagline = document.querySelector('.scramble-reveal')

    expect(tagline).toHaveAttribute('aria-hidden', 'true')
    expect(requestAnimationFrame).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('finish-wordmark'))
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    act(() => vi.advanceTimersByTime(359))

    expect(document.querySelector('.scramble-reveal')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(requestAnimationFrame).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(document.querySelector('.scramble-reveal')).not.toHaveAttribute(
      'aria-hidden',
    )
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
  })

  it('starts the completed tagline immediately for reduced-motion users', () => {
    reducedMotionMock.mockReturnValue(true)
    renderSplash()

    expect(document.querySelector('.scramble-reveal')).not.toHaveAttribute(
      'aria-hidden',
    )
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('cleans up the inter-phase timer when the splash unmounts', () => {
    const { unmount } = renderSplash()

    fireEvent.click(screen.getByTestId('finish-wordmark'))
    unmount()
    act(() => vi.advanceTimersByTime(400))

    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })
})
