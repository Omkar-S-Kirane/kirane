import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ParticleSphere } from './ParticleSphere'
import { ThemeProvider } from '@/theme'
import { useTheme } from '@/theme'

function ThemeChangingSphere({ onReady }: { onReady: () => void }) {
  const { setPreference } = useTheme()

  return (
    <>
      <button onClick={() => setPreference('light')}>Use light theme</button>
      <ParticleSphere phase="hero" onReady={onReady} />
    </>
  )
}

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
      <ThemeProvider>
        <ParticleSphere phase="splash" onReady={onReady} />
      </ThemeProvider>,
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())

    rerender(
      <ThemeProvider>
        <ParticleSphere
          phase="transitioning"
          reducedMotion
          onReady={onReady}
          onTransitionComplete={onTransitionComplete}
        />
      </ThemeProvider>,
    )

    await waitFor(() => expect(onTransitionComplete).toHaveBeenCalledOnce())
  })

  it('updates the fallback palette without remounting the sphere', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const onReady = vi.fn()

    render(
      <ThemeProvider>
        <ThemeChangingSphere onReady={onReady} />
      </ThemeProvider>,
    )

    await waitFor(() => expect(onReady).toHaveBeenCalledOnce())
    expect(document.querySelector('[data-theme="dark"]')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use light theme' }))

    expect(document.querySelector('[data-theme="light"]')).toBeInTheDocument()
    expect(onReady).toHaveBeenCalledOnce()
  })
})
