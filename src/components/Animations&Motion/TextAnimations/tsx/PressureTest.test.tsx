import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PressureTest } from './PressureTest'

let scheduledFrame: FrameRequestCallback | null = null

beforeEach(() => {
  scheduledFrame = null
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      scheduledFrame = callback
      return 1
    }),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const characterIndex =
        this.tagName === 'SPAN' && this.parentElement
          ? Array.from(this.parentElement.children).indexOf(this)
          : -1
      const left = characterIndex < 0 ? 0 : characterIndex * 20
      return {
        x: left,
        y: 0,
        left,
        top: 0,
        right: left + 10,
        bottom: 40,
        width: characterIndex < 0 ? 600 : 10,
        height: 40,
        toJSON: () => ({}),
      } as DOMRect
    },
  )
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PressureTest', () => {
  it('renders the brand in the pressure font and responds to pointer movement', () => {
    const text = 'ARCHITECT. BUILD. SCALE.'
    render(<PressureTest text={text} tag="h1" />)

    const heading = screen.getByRole('heading', { level: 1, name: text })
    const characters = Array.from(heading.querySelectorAll('span'))
    expect(characters).toHaveLength(text.length)
    expect(heading).toHaveStyle({ fontFamily: 'Compressa VF' })

    const farCharacter = characters[0]
    if (!farCharacter) throw new Error('First character was not rendered')
    const initialVariation = farCharacter.style.fontVariationSettings
    expect(initialVariation).toContain("'wght'")

    fireEvent.mouseMove(window, { clientX: 5, clientY: 20 })
    const nextFrame = scheduledFrame
    expect(nextFrame).not.toBeNull()
    act(() => nextFrame?.(16))

    expect(farCharacter.style.fontVariationSettings).not.toBe(initialVariation)
  })
})
