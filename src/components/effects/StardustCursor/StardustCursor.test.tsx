import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StardustCursor } from './StardustCursor'

const media = {
  '(pointer: fine) and (hover: hover)': true,
  '(prefers-reduced-motion: reduce)': false,
}

const mediaListeners = new Map<
  string,
  Set<(event: MediaQueryListEvent) => void>
>()
const frames = new Map<number, FrameRequestCallback>()
let nextFrameId = 1
const shadowBlurValues: number[] = []

const context = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  setTransform: vi.fn(),
  fillStyle: '',
  globalAlpha: 1,
  shadowBlur: 0,
  shadowColor: '',
}

Object.defineProperty(context, 'shadowBlur', {
  configurable: true,
  get: () => 0,
  set: (value: number) => shadowBlurValues.push(value),
})

beforeEach(() => {
  media['(pointer: fine) and (hover: hover)'] = true
  media['(prefers-reduced-motion: reduce)'] = false
  mediaListeners.clear()
  frames.clear()
  shadowBlurValues.length = 0
  nextFrameId = 1
  vi.clearAllMocks()

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: media[query as keyof typeof media] ?? false,
      media: query,
      onchange: null,
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        const listeners = mediaListeners.get(query) ?? new Set()
        listeners.add(listener)
        mediaListeners.set(query, listeners)
      },
      removeEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => mediaListeners.get(query)?.delete(listener),
    })),
  )

  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      const id = nextFrameId++
      frames.set(id, callback)
      return id
    }),
  )
  vi.stubGlobal(
    'cancelAnimationFrame',
    vi.fn((id: number) => frames.delete(id)),
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1024,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 768,
  })
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 1,
  })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  })
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function dispatchPointerEvent(
  type: 'pointermove' | 'pointerdown',
  x: number,
  y: number,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    clientX: x,
    clientY: y,
  })
  document.dispatchEvent(event)
}

function advanceFrame(time = 16) {
  const [id, callback] = [...frames.entries()][0] ?? []
  if (id === undefined || callback === undefined) return
  frames.delete(id)
  act(() => callback(time))
}

describe('StardustCursor', () => {
  it('renders a non-interactive canvas for fine pointers and paints a trail', () => {
    render(<StardustCursor />)

    const canvas = screen.getByTestId('stardust-canvas')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toHaveStyle({ pointerEvents: 'none' })

    dispatchPointerEvent('pointermove', 20, 30)
    dispatchPointerEvent('pointermove', 52, 44)
    expect(window.requestAnimationFrame).toHaveBeenCalled()

    advanceFrame()
    expect(context.arc).toHaveBeenCalled()
    expect(context.fill).toHaveBeenCalled()
    expect(Math.max(...shadowBlurValues)).toBeGreaterThan(4.5)
  })

  it('keeps repeated click puffs alive together and cancels animation on unmount', () => {
    const { unmount } = render(<StardustCursor />)
    dispatchPointerEvent('pointerdown', 100, 90)
    dispatchPointerEvent('pointerdown', 140, 90)
    advanceFrame()

    expect(context.fill.mock.calls.length).toBeGreaterThan(70)
    expect(frames.size).toBeGreaterThan(0)

    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it('starts a low-density random flow after the pointer becomes idle', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    render(<StardustCursor />)
    dispatchPointerEvent('pointermove', 100, 100)

    act(() => vi.advanceTimersByTime(450))
    expect(window.requestAnimationFrame).toHaveBeenCalled()

    advanceFrame(performance.now() + 16)
    expect(context.fill.mock.calls.length).toBeGreaterThan(10)
  })

  it('does not render on touch-only or reduced-motion devices', () => {
    media['(pointer: fine) and (hover: hover)'] = false
    const touchRender = render(<StardustCursor />)
    expect(screen.queryByTestId('stardust-canvas')).not.toBeInTheDocument()
    touchRender.unmount()

    media['(pointer: fine) and (hover: hover)'] = true
    media['(prefers-reduced-motion: reduce)'] = true
    render(<StardustCursor />)
    expect(screen.queryByTestId('stardust-canvas')).not.toBeInTheDocument()
  })

  it('caps the high-DPI backing canvas and pauses while the page is hidden', () => {
    const { unmount } = render(<StardustCursor />)
    const canvas = screen.getByTestId('stardust-canvas') as HTMLCanvasElement

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 4000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 3000,
    })
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    })
    act(() => window.dispatchEvent(new Event('resize')))
    expect(canvas.width * canvas.height).toBeLessThanOrEqual(4_194_304)

    dispatchPointerEvent('pointerdown', 120, 80)
    expect(frames.size).toBe(1)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(frames.size).toBe(0)
    expect(window.cancelAnimationFrame).toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(frames.size).toBe(1)

    unmount()
  })
})
