import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrambleReveal } from './ScrambleReveal'

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false as boolean | null),
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()

  return { ...actual, useReducedMotion: reducedMotionMock }
})

let queuedFrames: FrameRequestCallback[]
let nextFrameId: number

beforeEach(() => {
  reducedMotionMock.mockReturnValue(false)
  queuedFrames = []
  nextFrameId = 0
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      queuedFrames.push(callback)
      nextFrameId += 1
      return nextFrameId
    }),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function runNextFrame(timestamp: number) {
  const callback = queuedFrames.shift()
  if (!callback) throw new Error('Expected an animation frame to be queued')

  act(() => callback(timestamp))
}

describe('ScrambleReveal', () => {
  it('resolves the tagline from left to right and finishes with the exact copy', () => {
    render(<ScrambleReveal text="Engineering the extraordinary." />)

    const visualText = screen.getByText(
      (_, element) => element?.getAttribute('aria-hidden') === 'true',
    )

    expect(visualText).not.toHaveTextContent('Engineering the extraordinary.')

    runNextFrame(0)
    runNextFrame(900)

    const halfwayText = visualText.textContent ?? ''
    expect(halfwayText.slice(0, 15)).toBe('Engineering the')

    runNextFrame(1800)
    expect(visualText).toHaveTextContent('Engineering the extraordinary.')
    expect(
      screen.getByText('Engineering the extraordinary.'),
    ).toBeInTheDocument()
  })

  it('does not restart the animation when rerendered with the same text', () => {
    const { rerender } = render(
      <ScrambleReveal text="Engineering the extraordinary." />,
    )
    const requestFrame = vi.mocked(requestAnimationFrame)
    const firstScheduleCount = requestFrame.mock.calls.length

    rerender(<ScrambleReveal text="Engineering the extraordinary." />)

    expect(requestFrame).toHaveBeenCalledTimes(firstScheduleCount)
  })

  it('waits for its start signal before scheduling the scramble', () => {
    const { rerender } = render(
      <ScrambleReveal text="Engineering the extraordinary." start={false} />,
    )
    const reveal = document.querySelector('.scramble-reveal')

    expect(reveal).toHaveAttribute('aria-hidden', 'true')
    expect(requestAnimationFrame).not.toHaveBeenCalled()

    rerender(<ScrambleReveal text="Engineering the extraordinary." start />)

    expect(reveal).not.toHaveAttribute('aria-hidden')
    expect(requestAnimationFrame).toHaveBeenCalledOnce()
  })

  it('renders the completed text without scheduling frames for reduced motion', () => {
    reducedMotionMock.mockReturnValue(true)

    render(<ScrambleReveal text="Engineering the extraordinary." />)

    expect(
      screen.getByText('Engineering the extraordinary.'),
    ).toBeInTheDocument()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('cancels its pending animation frame on unmount', () => {
    const { unmount } = render(
      <ScrambleReveal text="Engineering the extraordinary." />,
    )
    const pendingFrameId = nextFrameId

    unmount()

    expect(cancelAnimationFrame).toHaveBeenCalledWith(pendingFrameId)
  })
})
