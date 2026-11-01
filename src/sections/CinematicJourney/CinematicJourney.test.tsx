import { createRef, useEffect } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { useMotionValue } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { describe, expect, it, vi } from 'vitest'
import {
  CinematicJourney,
  type CinematicJourneyHandle,
} from './CinematicJourney'

vi.mock('motion/react', async () => {
  const actual =
    await vi.importActual<typeof import('motion/react')>('motion/react')
  return { ...actual, useReducedMotion: () => true }
})

vi.mock('@/sections/Hero', () => ({ Hero: () => <div data-testid="hero" /> }))
vi.mock('./HeroParticleBridge', () => ({ HeroParticleBridge: () => null }))

function JourneyHarness({
  forwardedRef,
  onEntered,
  onComplete,
  onReset,
  onProgress,
}: {
  forwardedRef: React.Ref<CinematicJourneyHandle>
  onEntered: (entered: boolean) => void
  onComplete: () => void
  onReset: () => void
  onProgress: (progress: MotionValue<number>) => void
}) {
  const progress = useMotionValue(0)
  useEffect(() => onProgress(progress), [onProgress, progress])
  return (
    <CinematicJourney
      ref={forwardedRef}
      universeProgress={progress}
      fontsReady
      onLayoutReady={() => {}}
      onRevealComplete={() => {}}
      onUniverseEnteredChange={onEntered}
      onHeroTransitionComplete={onComplete}
      onHeroTransitionReset={onReset}
    />
  )
}

describe('CinematicJourney controller handoff', () => {
  it('exposes bounded progress controls and reports completed entry and reset', async () => {
    const journeyRef = createRef<CinematicJourneyHandle>()
    const onEntered = vi.fn()
    const onComplete = vi.fn()
    const onReset = vi.fn()
    let progressRef: MotionValue<number> | null = null
    const getProgress = () => {
      if (!progressRef) throw new Error('Journey progress was not captured')
      return progressRef
    }
    render(
      <JourneyHarness
        forwardedRef={journeyRef}
        onEntered={onEntered}
        onComplete={onComplete}
        onReset={onReset}
        onProgress={(progress) => {
          progressRef = progress
        }}
      />,
    )

    act(() => journeyRef.current?.adjustProgress(0.4))
    await waitFor(() => expect(getProgress().get()).toBeCloseTo(0.4))
    await waitFor(() => expect(onEntered).toHaveBeenLastCalledWith(true))

    act(() => journeyRef.current?.adjustProgress(1))
    await waitFor(() => expect(getProgress().get()).toBe(1))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())

    act(() => journeyRef.current?.adjustProgress(-3))
    await waitFor(() => expect(getProgress().get()).toBe(0))
    await waitFor(() => expect(onReset).toHaveBeenCalledOnce())
    await waitFor(() => expect(onEntered).toHaveBeenLastCalledWith(false))
  })

  it('supports direct completion and reset while preserving the endpoint callbacks', async () => {
    const journeyRef = createRef<CinematicJourneyHandle>()
    const onComplete = vi.fn()
    const onReset = vi.fn()
    let progressRef: MotionValue<number> | null = null
    const getProgress = () => {
      if (!progressRef) throw new Error('Journey progress was not captured')
      return progressRef
    }
    render(
      <JourneyHarness
        forwardedRef={journeyRef}
        onEntered={() => {}}
        onComplete={onComplete}
        onReset={onReset}
        onProgress={(progress) => {
          progressRef = progress
        }}
      />,
    )

    act(() => journeyRef.current?.completeForNavigation())
    await waitFor(() => expect(getProgress().get()).toBe(1))
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())

    act(() => journeyRef.current?.reset())
    await waitFor(() => expect(getProgress().get()).toBe(0))
    await waitFor(() => expect(onReset).toHaveBeenCalledOnce())
  })
})
