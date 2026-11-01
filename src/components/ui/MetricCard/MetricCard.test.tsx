import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MetricCard } from './MetricCard'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function mockMotionPreferences({
  finePointer = true,
  reducedMotion = false,
}: {
  finePointer?: boolean
  reducedMotion?: boolean
} = {}) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: query.includes('prefers-reduced-motion')
          ? reducedMotion
          : finePointer,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

describe('MetricCard pointer parallax', () => {
  it('moves each depth layer subtly and returns it on pointer leave', () => {
    mockMotionPreferences()
    let frame: FrameRequestCallback | undefined
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frame = callback
        return 1
      })
    render(<MetricCard value="6.0+" label="Years of experience" />)

    const card = screen.getByRole('article')
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    })

    fireEvent.pointerMove(card, {
      clientX: 100,
      clientY: 100,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(card, {
      clientX: 100,
      clientY: 100,
      pointerType: 'mouse',
    })
    expect(requestFrame).toHaveBeenCalledOnce()
    act(() => frame?.(0))

    expect(card.style.getPropertyValue('--metric-tilt-x')).toBe('-2deg')
    expect(card.style.getPropertyValue('--metric-surface-x')).toBe('2px')
    expect(card.style.getPropertyValue('--metric-depth-1-x')).toBe('-4.5px')
    expect(card.style.getPropertyValue('--metric-depth-3-x')).toBe('1px')

    fireEvent.pointerLeave(card)
    act(() => frame?.(16))

    expect(card.style.getPropertyValue('--metric-tilt-x')).toBe('0deg')
    expect(card.style.getPropertyValue('--metric-surface-x')).toBe('0px')
    expect(card.style.getPropertyValue('--metric-depth-1-x')).toBe('0px')
  })

  it('ignores pointer movement for touch input and reduced-motion preferences', () => {
    mockMotionPreferences()
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
    render(<MetricCard value="6.0+" label="Years of experience" />)

    const card = screen.getByRole('article')
    fireEvent.pointerMove(card, {
      clientX: 100,
      clientY: 100,
      pointerType: 'touch',
    })
    expect(requestFrame).not.toHaveBeenCalled()

    cleanup()
    vi.restoreAllMocks()
    mockMotionPreferences({ reducedMotion: true })
    const reducedRequestFrame = vi.spyOn(window, 'requestAnimationFrame')
    render(<MetricCard value="6.0+" label="Years of experience" />)
    fireEvent.pointerMove(screen.getByRole('article'), {
      clientX: 100,
      clientY: 100,
      pointerType: 'mouse',
    })
    expect(reducedRequestFrame).not.toHaveBeenCalled()
  })
})
