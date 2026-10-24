import { describe, expect, it } from 'vitest'
import {
  MAX_PARTICLES,
  createIdleParticle,
  createMushroomBurst,
  createTrailParticles,
  trimParticles,
} from './stardust-particles'

describe('stardust particle creation', () => {
  it('carries short pointer movements forward until the trail spacing is reached', () => {
    const first = createTrailParticles(
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      0,
      () => 0.5,
    )
    const second = createTrailParticles(
      { x: 3, y: 0 },
      { x: 10, y: 0 },
      first.remainder,
      () => 0.5,
    )

    expect(first.particles).toHaveLength(0)
    expect(second.particles).toHaveLength(1)
    expect(second.particles[0].x).toBeCloseTo(8)
    expect(second.remainder).toBeCloseTo(2)
  })

  it('spreads a capped fast-movement trail across the full segment', () => {
    const trail = createTrailParticles(
      { x: 0, y: 0 },
      { x: 800, y: 0 },
      0,
      () => 0.5,
    )

    expect(trail.particles).toHaveLength(80)
    expect(trail.particles[0].x).toBeCloseTo(0)
    expect(trail.particles.at(-1)?.x).toBeCloseTo(800)
  })

  it('widens the trail and shades it with warm golden colors', () => {
    let seed = 37
    const random = () => {
      seed = (seed * 16_807) % 2_147_483_647
      return (seed - 1) / 2_147_483_646
    }
    const trail = createTrailParticles(
      { x: 0, y: 0 },
      { x: 0, y: 80 },
      0,
      random,
    )
    const perpendicularPositions = trail.particles.map((particle) => particle.x)
    const width =
      Math.max(...perpendicularPositions) - Math.min(...perpendicularPositions)

    const beginningColor = trail.particles[0].color
    const endingColor = trail.particles.at(-1)?.color ?? ''
    const colorChannels = [beginningColor, endingColor].map(
      (color) => color.match(/\d+/g)?.map(Number) ?? [],
    )

    expect(width).toBeGreaterThan(100)
    expect(beginningColor).not.toEqual(endingColor)
    expect(
      colorChannels.every(([red, green, blue]) => red > green && green > blue),
    ).toBe(true)
  })

  it('creates a bounded upward mushroom burst with a narrow stem and broad cap', () => {
    const burst = createMushroomBurst({ x: 120, y: 240 }, () => 0.5)
    const stem = burst.filter((particle) => particle.kind === 'puff-stem')
    const cap = burst.filter((particle) => particle.kind === 'puff-cap')

    expect(burst.length).toBeGreaterThan(30)
    expect(burst.length).toBeLessThanOrEqual(64)
    expect(stem.length).toBeGreaterThan(0)
    expect(cap.length).toBeGreaterThan(stem.length)
    expect(stem.every((particle) => particle.vy < 0)).toBe(true)
    expect(cap.every((particle) => particle.vy <= 0)).toBe(true)
    expect(
      burst.every((particle) => particle.x >= 118 && particle.x <= 122),
    ).toBe(true)
  })

  it('keeps the live particle collection under its hard limit', () => {
    const particles = createMushroomBurst({ x: 0, y: 0 })
    const trimmed = trimParticles([
      ...particles,
      ...particles,
      ...particles,
      ...particles,
      ...particles,
      ...particles,
    ])

    expect(trimmed).toHaveLength(MAX_PARTICLES)
  })

  it('creates slow, wandering particles around an idle cursor', () => {
    const particle = createIdleParticle({ x: 120, y: 80 }, () => 0.5)
    let seed = 73
    const random = () => {
      seed = (seed * 16_807) % 2_147_483_647
      return (seed - 1) / 2_147_483_646
    }
    const cloud = Array.from({ length: 120 }, () =>
      createIdleParticle({ x: 120, y: 80 }, random),
    )
    const xPositions = cloud.map(({ x }) => x)
    const yPositions = cloud.map(({ y }) => y)

    expect(particle.kind).toBe('idle')
    expect(particle.wander).toBeGreaterThan(0)
    expect(particle.color).toMatch(/^rgb\(/)
    expect(Math.hypot(particle.x - 120, particle.y - 80)).toBeGreaterThan(0)
    expect(Math.max(...xPositions) - Math.min(...xPositions)).toBeGreaterThan(
      150,
    )
    expect(Math.max(...yPositions) - Math.min(...yPositions)).toBeLessThan(110)
  })
})
