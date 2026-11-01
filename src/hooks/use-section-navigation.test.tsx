import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSectionNavigation } from './use-section-navigation'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSectionNavigation', () => {
  it('advances one full-screen section at a time and updates the hash', () => {
    const { result } = renderHook(() => useSectionNavigation())

    act(() => {
      result.current.navigateBy(1)
    })

    expect(result.current.activeId).toBe('impact')
    expect(result.current.scrollDirection).toBe(1)
    expect(window.location.hash).toBe('#impact')
  })

  it('opens the section selected by a direct hash URL', () => {
    window.history.replaceState(null, '', '/#impact')
    const { result } = renderHook(() => useSectionNavigation())

    expect(result.current.activeId).toBe('impact')
  })

  it('ignores wheel events until the gesture crosses the navigation threshold', () => {
    const { result } = renderHook(() => useSectionNavigation())
    const preventDefault = vi.fn()

    act(() => {
      result.current.handleWheel({ deltaY: 20, preventDefault } as never)
    })
    expect(result.current.activeId).toBe('home')

    act(() => {
      result.current.handleWheel({ deltaY: 100, preventDefault } as never)
    })
    expect(result.current.activeId).toBe('impact')
    expect(preventDefault).toHaveBeenCalledTimes(2)
  })

  it('exposes continuous normalized scroll progress to the active slide', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSectionNavigation())
    const preventDefault = vi.fn()

    act(() => {
      result.current.handleWheel({ deltaY: 30, preventDefault } as never)
    })
    expect(result.current.scrollProgress).toBe(0.5)
    expect(result.current.activeId).toBe('home')

    act(() => {
      result.current.handleWheel({ deltaY: 30, preventDefault } as never)
    })
    expect(result.current.scrollProgress).toBe(1)
    expect(result.current.activeId).toBe('impact')

    act(() => vi.advanceTimersByTime(280))
    expect(result.current.scrollProgress).toBe(1)

    act(() => vi.advanceTimersByTime(620))
    expect(result.current.scrollProgress).toBe(0)
    vi.useRealTimers()
  })
})

describe('useSectionNavigation scrubbed sections', () => {
  const wheel = (deltaY: number, deltaMode = 0) =>
    ({ deltaY, deltaMode, preventDefault: vi.fn() }) as never

  function enterImpact() {
    const hook = renderHook(() => useSectionNavigation())
    act(() => {
      hook.result.current.navigateBy(1)
    })
    return hook
  }

  it('starts the impact sequence at zero when entered from above', () => {
    const { result } = enterImpact()

    expect(result.current.activeId).toBe('impact')
    expect(result.current.sectionProgress.get()).toBe(0)
  })

  it('maps wheel distance to continuous, reversible progress without leaving the section', () => {
    vi.useFakeTimers()
    const { result } = enterImpact()
    act(() => vi.advanceTimersByTime(300))

    act(() => {
      result.current.handleWheel(wheel(700))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(0.25)
    expect(result.current.activeId).toBe('impact')

    act(() => {
      result.current.handleWheel(wheel(-350))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(0.125)
    expect(result.current.activeId).toBe('impact')
    vi.useRealTimers()
  })

  it('normalises line-based wheel deltas', () => {
    vi.useFakeTimers()
    const { result } = enterImpact()
    act(() => vi.advanceTimersByTime(300))

    act(() => {
      result.current.handleWheel(wheel(35, 1))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(0.2)
    vi.useRealTimers()
  })

  it('rests at the end of a gesture and only a fresh gesture moves on to the next section', () => {
    vi.useFakeTimers()
    const { result } = enterImpact()
    act(() => vi.advanceTimersByTime(900))

    act(() => {
      result.current.handleWheel(wheel(4000))
    })
    expect(result.current.sectionProgress.get()).toBe(1)

    // Trailing inertia from the same gesture is absorbed.
    act(() => {
      result.current.handleWheel(wheel(200))
    })
    expect(result.current.activeId).toBe('impact')

    act(() => vi.advanceTimersByTime(300))
    act(() => {
      result.current.handleWheel(wheel(100))
    })
    expect(result.current.activeId).toBe('work')
    vi.useRealTimers()
  })

  it('reverses to the start and then returns to the previous section', () => {
    vi.useFakeTimers()
    const { result } = enterImpact()
    act(() => vi.advanceTimersByTime(900))

    act(() => {
      result.current.handleWheel(wheel(1400))
    })
    act(() => vi.advanceTimersByTime(300))
    act(() => {
      result.current.handleWheel(wheel(-1400))
    })
    expect(result.current.sectionProgress.get()).toBe(0)
    expect(result.current.activeId).toBe('impact')

    act(() => vi.advanceTimersByTime(300))
    act(() => {
      result.current.handleWheel(wheel(-100))
    })
    expect(result.current.activeId).toBe('home')
    vi.useRealTimers()
  })

  it('shows the completed sequence when returning from a later section', () => {
    window.history.replaceState(null, '', '/#work')
    const { result } = renderHook(() => useSectionNavigation())

    act(() => {
      result.current.navigateTo('impact')
    })
    expect(result.current.activeId).toBe('impact')
    expect(result.current.sectionProgress.get()).toBe(1)
  })

  it('steps progress with the keyboard before navigating', () => {
    const { result } = enterImpact()

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(0.1)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(0.3)
    expect(result.current.activeId).toBe('impact')
  })

  it('scrubs with vertical touch movement and ignores horizontal drags', () => {
    const { result } = enterImpact()
    const touches = (x: number, y: number) =>
      ({
        touches: [{ clientX: x, clientY: y }],
        changedTouches: [{ clientX: x, clientY: y }],
      }) as never

    act(() => {
      result.current.handleTouchStart(touches(100, 600))
      result.current.handleTouchMove(touches(100, 400))
      result.current.handleTouchEnd(touches(100, 400))
    })
    expect(result.current.sectionProgress.get()).toBeCloseTo(
      (200 * 2.4) / 2800,
    )
    expect(result.current.activeId).toBe('impact')

    const before = result.current.sectionProgress.get()
    act(() => {
      result.current.handleTouchStart(touches(100, 600))
      result.current.handleTouchMove(touches(300, 590))
      result.current.handleTouchMove(touches(320, 560))
      result.current.handleTouchEnd(touches(320, 560))
    })
    expect(result.current.sectionProgress.get()).toBe(before)
    expect(result.current.activeId).toBe('impact')
  })

  it('treats the section as a normal slide when scrubbing is disabled', () => {
    const { result } = renderHook(() =>
      useSectionNavigation(undefined, { scrub: false }),
    )
    act(() => {
      result.current.navigateBy(1)
    })
    expect(result.current.sectionProgress.get()).toBe(1)
  })
})
