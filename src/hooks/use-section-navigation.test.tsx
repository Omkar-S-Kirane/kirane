import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSectionNavigation } from './use-section-navigation'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('useSectionNavigation', () => {
  it('changes the active destination without scrolling the document', () => {
    const section = document.createElement('section')
    section.id = 'impact'
    section.scrollIntoView = vi.fn()
    document.body.append(section)
    const { result, unmount } = renderHook(() => useSectionNavigation())

    act(() => result.current.navigateTo('impact'))

    expect(section.scrollIntoView).not.toHaveBeenCalled()
    expect(result.current.activeId).toBe('impact')
    expect(window.location.hash).toBe('#impact')

    unmount()
    section.remove()
  })

  it.each(['universe', 'resume'])(
    'navigates to the %s section and updates the hash',
    (id) => {
      const section = document.createElement('section')
      section.id = id
      section.scrollIntoView = vi.fn()
      document.body.append(section)
      const { result, unmount } = renderHook(() => useSectionNavigation())

      act(() => result.current.navigateTo(id))

      expect(section.scrollIntoView).not.toHaveBeenCalled()
      expect(result.current.activeId).toBe(id)
      expect(window.location.hash).toBe(`#${id}`)

      unmount()
      section.remove()
    },
  )

  it.each(['universe', 'resume'])('reads %s from a direct hash URL', (id) => {
    window.history.replaceState(null, '', `/#${id}`)
    const { result } = renderHook(() => useSectionNavigation())
    expect(result.current.activeId).toBe(id)
  })

  it('keeps Impact after Universe in the active-section order', () => {
    window.history.replaceState(null, '', '/#impact')
    const { result } = renderHook(() => useSectionNavigation())
    expect(result.current.activeId).toBe('impact')
  })
})
