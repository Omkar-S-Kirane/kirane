import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useDocumentVisibility } from './use-document-visibility'

const originalVisibilityState = Object.getOwnPropertyDescriptor(
  document,
  'visibilityState',
)

afterEach(() => {
  if (originalVisibilityState) {
    Object.defineProperty(document, 'visibilityState', originalVisibilityState)
  }
})

describe('useDocumentVisibility', () => {
  it('reports changes so background render loops can pause while hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    const { result } = renderHook(() => useDocumentVisibility())
    expect(result.current).toBe(true)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(result.current).toBe(false)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(result.current).toBe(true)
  })
})
