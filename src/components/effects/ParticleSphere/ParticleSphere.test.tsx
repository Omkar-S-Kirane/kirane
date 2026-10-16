import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParticleSphere } from './ParticleSphere'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ParticleSphere lifecycle', () => {
  it('reports the static fallback ready and completes immediately for reduced motion', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const onReady = vi.fn()
    const onTransitionComplete = vi.fn()
    const { rerender } = render(
      <ParticleSphere phase="splash" onReady={onReady} />,
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())

    rerender(
      <ParticleSphere
        phase="transitioning"
        reducedMotion
        onReady={onReady}
        onTransitionComplete={onTransitionComplete}
      />,
    )

    await waitFor(() =>
      expect(onTransitionComplete).toHaveBeenCalledOnce(),
    )
  })
})
