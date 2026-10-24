import { describe, expect, it } from 'vitest'
import { calculateExperience, getEngineeringMetrics } from './impact-metrics'

describe('calculateExperience', () => {
  it('counts an overlapping employment month once and includes the current month', () => {
    const experience = calculateExperience(
      [
        { date: 'December 2022 - May 2024', technologies: ['React Native'] },
        { date: 'May 2024 - October 2025', technologies: ['React Native'] },
        { date: 'December 2025 - Present', technologies: ['React Native'] },
      ],
      new Date(2026, 9, 25),
    )

    expect(experience.totalYears).toBe(3.8)
    expect(experience.technologyYears['React Native']).toBe(3.8)
  })

  it('ignores malformed dates instead of fabricating a duration', () => {
    expect(
      calculateExperience(
        [{ date: 'Unknown - Present', technologies: ['TypeScript'] }],
        new Date(2026, 9, 25),
      ),
    ).toEqual({ totalYears: 0, technologyYears: {} })
  })

  it('keeps the displayed metrics aligned with the source employment data', () => {
    const metrics = getEngineeringMetrics(new Date(2026, 9, 25))
    expect(metrics.map((metric) => metric.value)).toEqual([
      '6.0+',
      '4.9',
      '8+',
      '4',
    ])
  })
})
