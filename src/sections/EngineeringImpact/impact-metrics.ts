export interface ExperienceRecord {
  date: string
  technologies: readonly string[]
}

export interface ExperienceSummary {
  totalYears: number
  technologyYears: Record<string, number>
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

function parseMonth(value: string, now: Date): number | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'present' || normalized === 'current') {
    return now.getFullYear() * 12 + now.getMonth()
  }

  const [month, yearText] = normalized.replace(',', '').split(/\s+/)
  const year = Number(yearText)
  const monthIndex = MONTHS[month]
  if (!Number.isInteger(year) || year < 1900 || monthIndex === undefined) {
    return null
  }
  return year * 12 + monthIndex
}

function expandInclusiveRange(date: string, now: Date): number[] {
  const [startText, endText] = date.split(/\s*[-–—]\s*/)
  if (!startText || !endText) return []

  const start = parseMonth(startText, now)
  const end = parseMonth(endText, now)
  if (start === null || end === null || end < start) return []

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function toDecimalYears(months: number): number {
  return Number((months / 12).toFixed(1))
}

/** Counts overlapping employment months once, retaining the source's inclusive-month rounding. */
export function calculateExperience(
  records: readonly ExperienceRecord[],
  now = new Date(),
): ExperienceSummary {
  const totalMonths = new Set<number>()
  const technologyMonths = new Map<string, Set<number>>()

  for (const record of records) {
    const months = expandInclusiveRange(record.date, now)
    if (months.length === 0) continue
    for (const month of months) totalMonths.add(month)

    for (const technology of record.technologies) {
      const key = technology.trim()
      if (!key) continue
      const existing = technologyMonths.get(key) ?? new Set<number>()
      for (const month of months) existing.add(month)
      technologyMonths.set(key, existing)
    }
  }

  return {
    totalYears: toDecimalYears(totalMonths.size),
    technologyYears: Object.fromEntries(
      [...technologyMonths.entries()].map(([technology, months]) => [
        technology,
        toDecimalYears(months.size),
      ]),
    ),
  }
}

// Employment dates and stacks mirror expCards in MyPortfolio2K25/src/constants/index.js.
const EXPERIENCE_RECORDS: readonly ExperienceRecord[] = [
  {
    date: 'December 2025 - Present',
    technologies: [
      'React Native',
      'TypeScript',
      'JavaScript',
      'Redux Toolkit',
      'Context API',
    ],
  },
  {
    date: 'May 2024 - October 2025',
    technologies: [
      'React Native',
      'TypeScript',
      'Redux Toolkit',
      'API Integration',
    ],
  },
  {
    date: 'December 2022 - May 2024',
    technologies: [
      'ReactJS',
      'React Native',
      'PHP',
      'MySQL',
      'JavaScript',
      'TypeScript',
      'Redux',
    ],
  },
  {
    date: 'October 2021 - October 2022',
    technologies: [
      'ReactJS',
      'React Native',
      'NodeJS',
      'MySQL',
      'JavaScript',
      'Redux',
    ],
  },
  {
    date: 'August 2020 - August 2021',
    technologies: ['ReactJS', 'HTML5', 'CSS3', 'JavaScript'],
  },
]

export interface EngineeringMetric {
  id: 'experience' | 'reactNative' | 'apps' | 'platforms'
  value: string
}

export function getEngineeringMetrics(now = new Date()): EngineeringMetric[] {
  const experience = calculateExperience(EXPERIENCE_RECORDS, now)
  return [
    { id: 'experience', value: `${experience.totalYears.toFixed(1)}+` },
    {
      id: 'reactNative',
      value: `${(experience.technologyYears['React Native'] ?? 0).toFixed(1)}`,
    },
    { id: 'apps', value: '8+' },
    { id: 'platforms', value: '4' },
  ]
}
