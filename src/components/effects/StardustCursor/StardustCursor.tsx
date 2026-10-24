import { useEffect, useRef, useState } from 'react'
import './stardust-cursor.css'
import {
  createIdleParticle,
  createMushroomBurst,
  createTrailParticles,
  trimParticles,
} from './stardust-particles'
import type { DustParticle, Point } from './stardust-particles'

const FINE_POINTER_QUERY = '(pointer: fine) and (hover: hover)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const MAX_CANVAS_PIXELS = 4_194_304
const IDLE_START_DELAY_MS = 420
const IDLE_PARTICLE_INTERVAL_MS = 100
const IDLE_PARTICLE_BATCH_SIZE = 20

function subscribeToMediaQuery(
  query: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
): () => void {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }

  query.addListener(listener)
  return () => query.removeListener(listener)
}

function getCanvasScale(width: number, height: number): number {
  const deviceScale = window.devicePixelRatio || 1
  const pixelBudgetScale = Math.sqrt(
    MAX_CANVAS_PIXELS / Math.max(width * height, 1),
  )
  return Math.min(deviceScale, 2, pixelBudgetScale)
}

/** A lightweight global canvas trail for fine pointers. */
export function StardustCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const finePointer = window.matchMedia(FINE_POINTER_QUERY)
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)
    const updateSupport = () => {
      setEnabled(finePointer.matches && !reducedMotion.matches)
    }

    updateSupport()
    const unsubscribeFinePointer = subscribeToMediaQuery(
      finePointer,
      updateSupport,
    )
    const unsubscribeReducedMotion = subscribeToMediaQuery(
      reducedMotion,
      updateSupport,
    )

    return () => {
      unsubscribeFinePointer()
      unsubscribeReducedMotion()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    const particles: DustParticle[] = []
    let lastPointer: Point | null = null
    let trailRemainder = 0
    let frameId: number | null = null
    let lastFrameTime: number | null = null
    let width = 0
    let height = 0
    let idleTimer: number | null = null

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      const scale = getCanvasScale(width, height)
      canvas.width = Math.max(1, Math.floor(width * scale))
      canvas.height = Math.max(1, Math.floor(height * scale))
      context.setTransform(scale, 0, 0, scale, 0, 0)
      context.clearRect(0, 0, width, height)
    }

    const renderFrame: FrameRequestCallback = (time) => {
      frameId = null
      if (document.visibilityState === 'hidden') {
        lastFrameTime = null
        return
      }

      const delta =
        lastFrameTime === null
          ? 1 / 60
          : Math.min(Math.max((time - lastFrameTime) / 1000, 0), 0.05)
      lastFrameTime = time
      context.clearRect(0, 0, width, height)

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index]
        particle.age += delta

        if (particle.age >= particle.life) {
          particles.splice(index, 1)
          continue
        }

        const isIdle = particle.kind === 'idle'
        const isPuff =
          particle.kind === 'puff-cap' || particle.kind === 'puff-stem'
        const drag = isIdle ? 0.72 : isPuff ? 0.9 : 1.2
        const wave = particle.age * (isIdle ? 1.8 : 2.6) + particle.phase
        const dragFactor = Math.exp(-drag * delta)
        particle.vx =
          particle.vx * dragFactor + Math.cos(wave) * particle.wander * delta
        particle.vy =
          particle.vy * dragFactor +
          Math.sin(wave * 0.87) * particle.wander * delta +
          (isIdle ? -1 : isPuff ? 13 : 3) * delta
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta

        const lifeProgress = particle.age / particle.life
        const fade = (1 - lifeProgress) ** 1.8
        context.fillStyle = particle.color
        context.globalAlpha = particle.opacity * fade
        context.shadowColor = particle.color
        context.shadowBlur = particle.size * (isPuff ? 8.2 : isIdle ? 7.6 : 7.5)
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fill()
      }

      context.globalAlpha = 1
      context.shadowBlur = 0

      if (particles.length > 0) {
        frameId = window.requestAnimationFrame(renderFrame)
      } else {
        lastFrameTime = null
      }
    }

    const scheduleFrame = () => {
      if (frameId !== null || document.visibilityState === 'hidden') return
      frameId = window.requestAnimationFrame(renderFrame)
    }

    const addParticles = (newParticles: DustParticle[]) => {
      if (newParticles.length === 0) return
      particles.push(...newParticles)
      trimParticles(particles)
      scheduleFrame()
    }

    const clearIdleTimer = () => {
      if (idleTimer === null) return
      window.clearTimeout(idleTimer)
      idleTimer = null
    }

    const scheduleIdleParticle = (delay = IDLE_START_DELAY_MS) => {
      clearIdleTimer()
      if (!lastPointer || document.visibilityState === 'hidden') return

      idleTimer = window.setTimeout(() => {
        idleTimer = null
        const center = lastPointer
        if (!center || document.visibilityState === 'hidden') return
        const idleParticles = Array.from(
          { length: IDLE_PARTICLE_BATCH_SIZE },
          () => createIdleParticle(center),
        )
        addParticles(idleParticles)
        scheduleIdleParticle(IDLE_PARTICLE_INTERVAL_MS)
      }, delay)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return

      const point = { x: event.clientX, y: event.clientY }
      if (lastPointer) {
        const trail = createTrailParticles(lastPointer, point, trailRemainder)
        trailRemainder = trail.remainder
        addParticles(trail.particles)
      }
      lastPointer = point
      scheduleIdleParticle()
    }

    const handlePointerLeave = () => {
      clearIdleTimer()
      lastPointer = null
      trailRemainder = 0
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.button !== 0) return
      const point = { x: event.clientX, y: event.clientY }
      lastPointer = point
      addParticles(createMushroomBurst(point))
      scheduleIdleParticle()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (frameId !== null) window.cancelAnimationFrame(frameId)
        frameId = null
        lastFrameTime = null
        handlePointerLeave()
      } else {
        scheduleFrame()
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas, { passive: true })
    document.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    })
    document.addEventListener('pointerdown', handlePointerDown, {
      passive: true,
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.documentElement.addEventListener(
      'pointerleave',
      handlePointerLeave,
    )

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.documentElement.removeEventListener(
        'pointerleave',
        handlePointerLeave,
      )
      clearIdleTimer()
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      particles.length = 0
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="stardust-cursor"
      data-testid="stardust-canvas"
      style={{ pointerEvents: 'none' }}
    />
  )
}
