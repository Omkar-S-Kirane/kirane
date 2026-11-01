import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CINEMATIC_STAGE_IDS,
  useCinematicNavigation,
} from './use-cinematic-navigation'

function createJourneyRef() {
  return {
    current: {
      adjustProgress: vi.fn(),
      completeForNavigation: vi.fn(),
      reset: vi.fn(),
    },
  }
}

function wheel(
  deltaY: number,
  deltaMode = 0,
  target: EventTarget | null = null,
) {
  return {
    deltaY,
    deltaX: 0,
    deltaMode,
    ctrlKey: false,
    target,
    preventDefault: vi.fn(),
  } as unknown as WheelEvent
}

function key(key: string, target: EventTarget | null = null) {
  return {
    key,
    target,
    shiftKey: false,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent
}

beforeEach(() => {
  vi.useRealTimers()
  window.history.replaceState(null, '', '/')
})

describe('useCinematicNavigation', () => {
  it('defines the complete ordered stage sequence', () => {
    expect(CINEMATIC_STAGE_IDS).toEqual([
      'home',
      'universe',
      'impact',
      'work',
      'experience',
      'skills',
      'resume',
      'contact',
    ])
  })

  it('resolves valid and malformed initial hashes without rewriting history', () => {
    const journeyRef = createJourneyRef()
    window.history.replaceState(null, '', '/#experience')
    const { result, unmount } = renderHook(() =>
      useCinematicNavigation(journeyRef),
    )
    expect(result.current.activeStage).toBe('experience')
    expect(window.location.hash).toBe('#experience')
    unmount()

    window.history.replaceState(null, '', '/#missing')
    const malformed = renderHook(() => useCinematicNavigation(journeyRef))
    expect(malformed.result.current.activeStage).toBe('home')
    expect(window.location.hash).toBe('#missing')
  })

  it('moves one stage per intentional wheel gesture and rearms after quiet', () => {
    vi.useFakeTimers()
    const journeyRef = createJourneyRef()
    const { result } = renderHook(() => useCinematicNavigation(journeyRef))
    act(() => result.current.navigateTo('universe'))
    act(() => result.current.onTransitionComplete())

    const first = wheel(100)
    const burst = wheel(100)
    act(() => {
      result.current.handleWheel(first)
      result.current.handleWheel(burst)
    })

    expect(result.current.activeStage).toBe('impact')
    expect(result.current.isTransitioning).toBe(true)
    expect(first.preventDefault).toHaveBeenCalledOnce()
    expect(burst.preventDefault).toHaveBeenCalledOnce()

    act(() => result.current.onTransitionComplete())
    expect(result.current.isTransitioning).toBe(false)
    act(() => vi.advanceTimersByTime(180))
    expect(result.current.isTransitioning).toBe(false)
    act(() => result.current.handleWheel(wheel(100)))
    expect(result.current.activeStage).toBe('work')
  })

  it('normalizes line-mode wheel input and only accepts vertical gestures', () => {
    const journeyRef = createJourneyRef()
    const { result } = renderHook(() => useCinematicNavigation(journeyRef))
    const vertical = wheel(2, 1)
    const horizontal = { ...wheel(0), deltaX: 120 } as WheelEvent
    act(() => {
      result.current.handleWheel(vertical)
      result.current.handleWheel(horizontal)
    })
    expect(journeyRef.current.adjustProgress).toHaveBeenCalledTimes(1)
    expect(journeyRef.current.adjustProgress).toHaveBeenCalledWith(0.025)
    expect(vertical.preventDefault).toHaveBeenCalledOnce()
    expect(horizontal.preventDefault).not.toHaveBeenCalled()
  })

  it('does not hijack gestures from controls', () => {
    const journeyRef = createJourneyRef()
    const { result } = renderHook(() => useCinematicNavigation(journeyRef))
    const button = document.createElement('button')
    const event = wheel(100, 0, button)
    act(() => result.current.handleWheel(event))
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(journeyRef.current.adjustProgress).not.toHaveBeenCalled()
  })

  it('uses a vertical touch swipe to navigate and ignores horizontal drags', () => {
    vi.useFakeTimers()
    const journeyRef = createJourneyRef()
    const { result } = renderHook(() => useCinematicNavigation(journeyRef))
    act(() => result.current.navigateTo('universe'))
    act(() => result.current.onTransitionComplete())

    const touch = (x: number, y: number) =>
      ({
        touches: [{ clientX: x, clientY: y }],
        preventDefault: vi.fn(),
      }) as unknown as TouchEvent
    act(() => {
      result.current.handleTouchStart(touch(10, 200))
      result.current.handleTouchMove(touch(12, 120))
      result.current.handleTouchMove(touch(12, 20))
    })
    expect(result.current.activeStage).toBe('impact')
    expect(result.current.isTransitioning).toBe(true)

    act(() => result.current.onTransitionComplete())
    act(() => vi.advanceTimersByTime(180))
    act(() => {
      result.current.handleTouchStart(touch(200, 100))
      result.current.handleTouchMove(touch(100, 102))
    })
    expect(result.current.activeStage).toBe('impact')
  })

  it('supports keyboard order and direct Home/End destinations', () => {
    const journeyRef = createJourneyRef()
    const { result } = renderHook(() => useCinematicNavigation(journeyRef))
    act(() => result.current.navigateTo('universe'))
    act(() => result.current.onTransitionComplete())
    const down = key('ArrowDown')
    act(() => result.current.handleKeyDown(down))
    expect(result.current.activeStage).toBe('impact')
    expect(down.preventDefault).toHaveBeenCalledOnce()
    act(() => result.current.onTransitionComplete())
    act(() => result.current.handleKeyDown(key('End')))
    expect(result.current.activeStage).toBe('contact')
    act(() => result.current.onTransitionComplete())
    act(() => result.current.handleKeyDown(key('Home')))
    expect(result.current.activeStage).toBe('home')
  })

  it('changes Hero endpoints only when the visual handoff completes', () => {
    const { result } = renderHook(() =>
      useCinematicNavigation(createJourneyRef()),
    )
    act(() => result.current.onHeroTransitionComplete())
    expect(result.current.activeStage).toBe('universe')
    expect(window.location.hash).toBe('#universe')

    act(() => result.current.onTransitionComplete())
    act(() => result.current.onHeroTransitionReset())
    expect(result.current.activeStage).toBe('home')
    expect(window.location.hash).toBe('')
    expect(result.current.universeEntered).toBe(false)
  })

  it('routes direct destinations and history traversal without document scrolling', () => {
    const journeyRef = createJourneyRef()
    const scrollIntoView = vi.fn()
    const contact = document.createElement('section')
    contact.id = 'contact'
    contact.scrollIntoView = scrollIntoView
    document.body.append(contact)
    const { result, unmount } = renderHook(() =>
      useCinematicNavigation(journeyRef),
    )

    act(() => result.current.navigateTo('contact'))
    expect(result.current.activeStage).toBe('contact')
    expect(window.location.hash).toBe('#contact')
    expect(journeyRef.current.completeForNavigation).toHaveBeenCalledOnce()
    expect(scrollIntoView).not.toHaveBeenCalled()

    act(() => result.current.onTransitionComplete())
    const pushState = vi.spyOn(window.history, 'pushState')
    act(() => {
      window.history.pushState(null, '', '/#skills')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(result.current.activeStage).toBe('skills')
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).not.toHaveBeenCalled()
    pushState.mockRestore()

    unmount()
    contact.remove()
  })
})
