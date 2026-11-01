import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSectionNavigation } from './use-section-navigation'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSectionNavigation', () => {
  it('uses smooth anchor navigation and updates the section hash', () => {
    const section = document.createElement('section')
    section.id = 'impact'
    section.scrollIntoView = vi.fn()
    document.body.append(section)
    const { result, unmount } = renderHook(() => useSectionNavigation())

    act(() => result.current.navigateTo('impact'))

    expect(section.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(result.current.activeId).toBe('impact')
    expect(window.location.hash).toBe('#impact')
    expect(result.current).not.toHaveProperty('handleWheel')
    expect(result.current).not.toHaveProperty('handleTouchMove')

    unmount()
    section.remove()
  })

  it('reads a valid section from a direct hash URL', () => {
    window.history.replaceState(null, '', '/#impact')
    const { result } = renderHook(() => useSectionNavigation())
    expect(result.current.activeId).toBe('impact')
  })
})
