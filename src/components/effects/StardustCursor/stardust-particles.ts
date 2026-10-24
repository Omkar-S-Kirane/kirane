export type DustParticleKind = 'trail' | 'puff-cap' | 'puff-stem' | 'idle'

export interface DustParticle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  opacity: number
  color: string
  phase: number
  wander: number
  kind: DustParticleKind
}

export interface Point {
  x: number
  y: number
}

export const MAX_PARTICLES = 240

const TRAIL_SPACING = 8
const MAX_TRAIL_PARTICLES_PER_EVENT = 80
const PUFF_CAP_PARTICLES = 36
const PUFF_STEM_PARTICLES = 12
const AMBER = [204, 138, 34] as const
const GOLD = [242, 204, 77] as const

type RandomSource = () => number

function between(
  random: RandomSource,
  minimum: number,
  maximum: number,
): number {
  return minimum + random() * (maximum - minimum)
}

function colorAt(mix: number): string {
  const amount = Math.max(0, Math.min(1, mix))
  const channels = AMBER.map((start, index) =>
    Math.round(start + (GOLD[index] - start) * amount),
  )
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
}

function movement(random: RandomSource, wander: number) {
  return { phase: between(random, 0, Math.PI * 2), wander }
}

export function createTrailParticles(
  start: Point,
  end: Point,
  distanceRemainder = 0,
  random: RandomSource = Math.random,
): { particles: DustParticle[]; remainder: number } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)

  if (distance === 0) {
    return { particles: [], remainder: distanceRemainder }
  }

  const accumulatedDistance = distanceRemainder + distance
  const availableCount = Math.floor(accumulatedDistance / TRAIL_SPACING)
  const count = Math.min(availableCount, MAX_TRAIL_PARTICLES_PER_EVENT)
  const remainder = accumulatedDistance % TRAIL_SPACING
  const spreadAcrossSegment = availableCount > MAX_TRAIL_PARTICLES_PER_EVENT

  if (count === 0) return { particles: [], remainder }

  const firstDistance = TRAIL_SPACING - distanceRemainder
  const directionX = dx / distance
  const directionY = dy / distance
  const normalX = -directionY
  const normalY = directionX
  const speed = Math.min(distance * 1.8, 90)
  const particles: DustParticle[] = []

  for (let index = 0; index < count; index += 1) {
    const along = spreadAcrossSegment
      ? (distance * index) / Math.max(count - 1, 1)
      : firstDistance + index * TRAIL_SPACING
    const progress = Math.min(along / distance, 1)
    // A center-heavy distribution gives the trail the broad, soft plume from
    // the reference while keeping most particles near its centerline.
    const lateral = (random() - random()) * 112
    const jitter = between(random, -2.5, 2.5)
    const colorMix = Math.max(
      0,
      Math.min(1, progress + between(random, -0.12, 0.12)),
    )
    const drift = movement(random, between(random, 3, 8))

    particles.push({
      x: start.x + dx * progress + normalX * lateral + directionX * jitter,
      y: start.y + dy * progress + normalY * lateral + directionY * jitter,
      vx:
        -directionX * (12 + speed * 0.24) + normalX * between(random, -14, 14),
      vy:
        -directionY * (12 + speed * 0.24) +
        normalY * between(random, -14, 14) -
        between(random, 1, 10),
      age: 0,
      life: between(random, 0.75, 1.35),
      size: between(random, 0.6, 1.65),
      opacity: between(random, 0.32, 0.68),
      color: colorAt(colorMix),
      ...drift,
      kind: 'trail',
    })
  }

  return { particles, remainder }
}

export function createMushroomBurst(
  center: Point,
  random: RandomSource = Math.random,
): DustParticle[] {
  const particles: DustParticle[] = []

  for (let index = 0; index < PUFF_CAP_PARTICLES; index += 1) {
    const baseAngle = Math.PI + (index / (PUFF_CAP_PARTICLES - 1)) * Math.PI
    const angle = baseAngle + between(random, -0.08, 0.08)
    const speed = between(random, 46, 88)
    const drift = movement(random, between(random, 3, 8))

    particles.push({
      x: center.x + between(random, -2, 2),
      y: center.y + between(random, -2, 2),
      vx: Math.cos(angle) * speed + between(random, -4, 4),
      vy: Math.min(Math.sin(angle), 0) * speed * 1.05,
      age: 0,
      life: between(random, 0.85, 1.35),
      size: between(random, 0.85, 1.9),
      opacity: between(random, 0.42, 0.78),
      color: colorAt(random()),
      ...drift,
      kind: 'puff-cap',
    })
  }

  for (let index = 0; index < PUFF_STEM_PARTICLES; index += 1) {
    const drift = movement(random, between(random, 3, 8))
    particles.push({
      x: center.x + between(random, -2, 2),
      y: center.y + between(random, -2, 2),
      vx: between(random, -9, 9),
      vy: -between(random, 54, 94),
      age: 0,
      life: between(random, 0.7, 1.05),
      size: between(random, 0.75, 1.55),
      opacity: between(random, 0.34, 0.62),
      color: colorAt(random()),
      ...drift,
      kind: 'puff-stem',
    })
  }

  return particles
}

export function createIdleParticle(
  center: Point,
  random: RandomSource = Math.random,
): DustParticle {
  const angle = between(random, 0, Math.PI * 2)
  const radius = between(random, 16, 120)

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius * 0.42,
    vx: between(random, -8, 8),
    vy: between(random, -7, 7),
    age: 0,
    life: between(random, 1.8, 2.8),
    size: between(random, 0.75, 1.75),
    opacity: between(random, 0.42, 0.82),
    color: colorAt(random()),
    ...movement(random, between(random, 8, 18)),
    kind: 'idle',
  }
}

export function trimParticles(
  particles: DustParticle[],
  maximum = MAX_PARTICLES,
): DustParticle[] {
  const boundedMaximum = Math.max(0, Math.floor(maximum))
  if (particles.length > boundedMaximum) {
    particles.splice(0, particles.length - boundedMaximum)
  }
  return particles
}
