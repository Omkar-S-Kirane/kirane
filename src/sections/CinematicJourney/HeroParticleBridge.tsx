import { useEffect, useRef } from 'react'
import { useMotionValueEvent } from 'motion/react'
import type { MotionValue } from 'motion/react'
import {
  getDissolveBoundary,
  getHeroDissolveProgress,
  getSunTrailTarget,
} from './cinematic-progress'

const PARTICLE_COUNT = 210

function fract(value: number) {
  return value - Math.floor(value)
}

function easeOut(value: number) {
  return 1 - (1 - value) ** 3
}

interface Particle {
  phase: number
  y: number
  radius: number
  hue: number
  seed: number
  life: number
}

const PARTICLES: Particle[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, index) => {
    const seed = index + 1
    return {
      phase: fract(seed * 0.61803398875) * 0.94,
      y: 0.06 + fract(seed * 0.41421356237) * 0.88,
      radius: 0.7 + fract(seed * 0.73205080757) * 1.9,
      hue: 36 + fract(seed * 0.27182818284) * 20,
      seed,
      life: 0.18 + fract(seed * 0.14142135623) * 0.24,
    }
  },
)

/** Deterministic particles bridge the outgoing Hero and the incoming sun. */
export function HeroParticleBridge({
  progress,
}: {
  progress: MotionValue<number>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef<(value: number) => void>(() => undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !context) return

    let width = 0
    let height = 0
    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      const dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1 : 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawRef.current(progress.get())
    }

    drawRef.current = (overallProgress) => {
      context.clearRect(0, 0, width, height)
      const dissolve = getHeroDissolveProgress(overallProgress)
      if (dissolve <= 0 || dissolve >= 1) return
      const sun = getSunTrailTarget(overallProgress)
      const sunX = sun.x * width
      const sunY = sun.y * height

      const particleLimit =
        width < 640 ? 96 : width < 1024 ? 150 : PARTICLE_COUNT
      for (let index = 0; index < particleLimit; index += 1) {
        const particle = PARTICLES[index]
        const age = (dissolve - particle.phase) / particle.life
        if (age <= 0 || age >= 1) continue
        const t = easeOut(age)
        const sourceX =
          (getDissolveBoundary(particle.phase, particle.y) / 100) * width
        const sourceY = particle.y * height
        const turbulence =
          Math.sin(particle.seed * 0.71 + age * 13) * height * 0.018 * (1 - t)
        const orbitProgress =
          particle.seed % 4 === 0 ? Math.max(0, (age - 0.66) / 0.34) : 0
        const orbitAngle = particle.seed * 1.73 + age * 8
        const orbitRadius = 8 + fract(particle.seed * 0.13) * 22
        const orbitX = Math.cos(orbitAngle) * orbitRadius * orbitProgress
        const orbitY = Math.sin(orbitAngle) * orbitRadius * 0.62 * orbitProgress
        const x = sourceX + (sunX - sourceX) * t + orbitX
        const y = sourceY + (sunY - sourceY) * t + turbulence + orbitY
        const tailT = easeOut(Math.max(0, age - 0.13) / 0.87)
        const tailX = sourceX + (sunX - sourceX) * tailT
        const tailY =
          sourceY + (sunY - sourceY) * tailT + turbulence * 1.5 + orbitY * 0.7
        const alpha = Math.sin(Math.PI * age) * (0.2 + 0.72 * (1 - age * 0.35))
        const radius = particle.radius * (0.65 + t * 0.55)

        context.beginPath()
        context.moveTo(tailX, tailY)
        context.lineTo(x, y)
        context.strokeStyle = `hsla(${particle.hue}, 94%, 67%, ${alpha * 0.24})`
        context.lineWidth = Math.max(0.55, radius * 0.62)
        context.stroke()

        const glow = context.createRadialGradient(x, y, 0, x, y, radius * 3.8)
        glow.addColorStop(0, `hsla(${particle.hue}, 100%, 87%, ${alpha})`)
        glow.addColorStop(1, `hsla(${particle.hue}, 96%, 54%, 0)`)
        context.fillStyle = glow
        context.beginPath()
        context.arc(x, y, radius * 3.8, 0, Math.PI * 2)
        context.fill()
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      drawRef.current = () => undefined
    }
  }, [progress])

  useMotionValueEvent(progress, 'change', (value) => drawRef.current(value))

  return (
    <canvas
      ref={canvasRef}
      className="cinematic-journey__particles"
      aria-hidden="true"
    />
  )
}
