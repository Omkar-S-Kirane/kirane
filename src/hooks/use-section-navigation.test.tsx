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
