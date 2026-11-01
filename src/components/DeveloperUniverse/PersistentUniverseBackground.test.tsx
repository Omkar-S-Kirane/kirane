import { cleanup, render, screen } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistentUniverseBackground } from './PersistentUniverseBackground'

const universeSpy = vi.fn()

vi.mock('./DeveloperUniverse', () => ({
  DeveloperUniverse: (props: Record<string, unknown>) => {
    universeSpy(props)
    return <div data-testid="single-universe-scene" />
  },
}))

afterEach(() => {
  cleanup()
  universeSpy.mockClear()
})

describe('PersistentUniverseBackground', () => {
  it('keeps planet input disabled while the Hero stage is active', () => {
    const progress = motionValue(1)
    const { rerender } = render(
      <PersistentUniverseBackground
        progress={progress}
        entered
        activeSection="home"
      />,
    )

    expect(universeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: true, interactionEnabled: false }),
    )

    rerender(
      <PersistentUniverseBackground
        progress={progress}
        entered
        activeSection="universe"
      />,
    )
    expect(universeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: true, interactionEnabled: true }),
    )

    rerender(
      <PersistentUniverseBackground
        progress={progress}
        entered={false}
        activeSection="home"
      />,
    )
    expect(universeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: false, interactionEnabled: false }),
    )
  })

  it('keeps one scene mounted and enables interactions only in Universe', () => {
    const progress = motionValue(1)
    const { rerender } = render(
      <PersistentUniverseBackground
        progress={progress}
        entered
        activeSection="universe"
      />,
    )

    expect(screen.getAllByTestId('single-universe-scene')).toHaveLength(1)
    expect(universeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: true, interactionEnabled: true }),
    )

    rerender(
      <PersistentUniverseBackground
        progress={progress}
        entered
        activeSection="impact"
      />,
    )
    expect(screen.getAllByTestId('single-universe-scene')).toHaveLength(1)
    expect(universeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ active: true, interactionEnabled: false }),
    )
    expect(
      document.querySelector('.persistent-universe-background'),
    ).toHaveAttribute('data-section', 'impact')
  })
})
