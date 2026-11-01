import { describe, expect, it } from 'vitest'
import { TECHNOLOGY_LOGOS } from '@/components/DeveloperUniverse/technologyLogos'
import {
  DEVELOPER_UNIVERSE_PLANETS,
  PLANET_FORMATION_ORDER,
} from './developerUniverse'

const ids = DEVELOPER_UNIVERSE_PLANETS.map((planet) => planet.id)

describe('developer universe dataset', () => {
  it('describes all nineteen technologies once', () => {
    expect(DEVELOPER_UNIVERSE_PLANETS).toHaveLength(19)
    expect(new Set(ids).size).toBe(ids.length)
    expect(DEVELOPER_UNIVERSE_PLANETS.map((planet) => planet.name)).toEqual([
      'React',
      'JavaScript',
      'TypeScript',
      'HTML5',
      'CSS3',
      'React Native',
      'Android',
      'iOS',
      'Node.js',
      'Express.js',
      'REST APIs',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Git',
      'GitHub',
      'AWS',
      'Docker',
      'Vercel',
    ])
  })

  it('reveals planets in the requested order, then the remaining ones', () => {
    expect([...PLANET_FORMATION_ORDER].sort()).toEqual([...ids].sort())
    expect(PLANET_FORMATION_ORDER.slice(0, 12)).toEqual([
      'react',
      'reactNative',
      'javascript',
      'typescript',
      'nodejs',
      'express',
      'mongodb',
      'postgresql',
      'git',
      'github',
      'aws',
      'docker',
    ])
  })

  it('gives every planet its own orbit, speed and a real logo', () => {
    const radii = DEVELOPER_UNIVERSE_PLANETS.map((p) => p.orbitalRadius)
    const speeds = DEVELOPER_UNIVERSE_PLANETS.map((p) => p.orbitalSpeed)
    for (let i = 1; i < radii.length; i += 1) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1])
      // Outer orbits are slower, as with real planets.
      expect(speeds[i]).toBeLessThan(speeds[i - 1])
    }
    expect(new Set(speeds).size).toBe(speeds.length)
    for (const planet of DEVELOPER_UNIVERSE_PLANETS) {
      expect(TECHNOLOGY_LOGOS[planet.logo]).toBeDefined()
      expect(Math.abs(planet.orbitalInclination)).toBeLessThanOrEqual(15)
      expect(planet.orbitalEccentricity).toBeGreaterThanOrEqual(0)
      expect(planet.orbitalEccentricity).toBeLessThan(0.15)
      expect(planet.skills.length).toBeGreaterThan(0)
    }
  })

  it('keeps unknown statistics as null rather than inventing them', () => {
    const aws = DEVELOPER_UNIVERSE_PLANETS.find((p) => p.id === 'aws')
    const docker = DEVELOPER_UNIVERSE_PLANETS.find((p) => p.id === 'docker')
    expect(aws).toMatchObject({
      experienceYears: null,
      projectsCompleted: null,
      proficiency: 'Learning',
    })
    expect(docker).toMatchObject({
      experienceYears: null,
      projectsCompleted: null,
      proficiency: 'Learning',
    })
  })

  it('links related technologies to planets that exist', () => {
    for (const planet of DEVELOPER_UNIVERSE_PLANETS) {
      for (const related of planet.relatedTechnologies) {
        expect(ids).toContain(related)
        expect(related).not.toBe(planet.id)
      }
    }
  })

  it('keeps twelve featured planets for compact layouts', () => {
    const featured = DEVELOPER_UNIVERSE_PLANETS.filter((p) => p.featured)
    expect(featured.map((p) => p.id).sort()).toEqual(
      PLANET_FORMATION_ORDER.slice(0, 12).slice().sort(),
    )
  })
})
