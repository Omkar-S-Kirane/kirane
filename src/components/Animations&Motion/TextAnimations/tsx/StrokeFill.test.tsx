import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StrokeFill } from './StrokeFill'

const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false as boolean | null),
}))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()

  return { ...actual, useReducedMotion: reducedMotionMock }
})

beforeEach(() => reducedMotionMock.mockReturnValue(false))
afterEach(cleanup)

describe('StrokeFill', () => {
  it('exposes the displayed SVG text through an accessible label', () => {
    render(<StrokeFill text="KIRANE | OMKAR" />)

    expect(
      screen.getByRole('img', { name: 'KIRANE | OMKAR' }),
    ).toBeInTheDocument()
  })

  it('defaults to the bottom-left position and supports custom stroke and fill colors', () => {
    render(
      <StrokeFill
        text="Elegance"
        fillColor="#fefefe"
        strokeColor="#d4c5a9"
        strokeWidth={2}
      />,
    )

    const svg = screen.getByRole('img', { name: 'Elegance' })
    const text = svg.querySelector('text')
    const line = text?.querySelector('tspan')

    expect(svg.closest('[data-position]')).toHaveAttribute(
      'data-position',
      'bottom-left',
    )
    expect(text).toHaveAttribute('stroke', '#d4c5a9')
    expect(text).toHaveAttribute('stroke-width', '2')
    expect(text).toHaveAttribute('fill', '#fefefe')
    expect(text).toHaveAttribute('fill-opacity', '0')
    expect(line).toHaveAttribute('textLength', '496')
    expect(line).toHaveAttribute('lengthAdjust', 'spacingAndGlyphs')
  })

  it('keeps outline mode permanently transparent while retaining the stroke draw', () => {
    render(<StrokeFill text="KIRANE | OMKAR" fillMode="outline" />)

    const svg = screen.getByRole('img', { name: 'KIRANE | OMKAR' })
    const text = svg.querySelector('text')

    expect(text).toHaveAttribute('fill', 'none')
    expect(text).not.toHaveAttribute('fill-opacity')
    expect(text).toHaveAttribute('stroke-dasharray', '1000')
    expect(text).toHaveAttribute('stroke-dashoffset', '1000')
  })

  it('keeps the SVG bounds compact around the wordmark', () => {
    render(<StrokeFill text="KIRANE | OMKAR" fillMode="outline" />)

    const svg = screen.getByRole('img', { name: 'KIRANE | OMKAR' })
    const viewBoxHeight = Number(svg.getAttribute('viewBox')?.split(' ')[3])

    expect(viewBoxHeight).toBeLessThan(150)
  })

  it('signals completion when the Motion stroke animation finishes', async () => {
    const onComplete = vi.fn()

    render(
      <StrokeFill
        text="KIRANE | OMKAR"
        fillMode="outline"
        duration={0}
        onComplete={onComplete}
      />,
    )

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
  })

  it('styles the vertical divider with the splash accent inside the animated wordmark', () => {
    render(<StrokeFill text="KIRANE | OMKAR" strokeEffect="glass" />)

    const svg = screen.getByRole('img', { name: 'KIRANE | OMKAR' })
    const divider = svg.querySelector('.stroke-fill__divider')

    expect(divider).toHaveTextContent('|')
    expect(divider).toHaveAttribute('stroke', 'var(--splash-accent)')
    expect(divider).toHaveAttribute('fill', 'var(--splash-accent)')
    expect(divider).toHaveAttribute('textLength', '8')
    expect(divider).toHaveAttribute('lengthAdjust', 'spacingAndGlyphs')
    expect(svg.querySelector('text')).toHaveAttribute(
      'stroke-dasharray',
      '1000',
    )
  })

  it('supports a glass stroke while retaining the animated SVG text', () => {
    render(<StrokeFill text="Elegance" strokeEffect="glass" />)

    const svg = screen.getByRole('img', { name: 'Elegance' })
    const text = svg.querySelector('text')
    const stroke = text?.getAttribute('stroke')
    const lastStop = svg.querySelector('linearGradient stop:last-child')

    expect(stroke).toMatch(/^url\(#.+-glass-stroke\)$/)
    expect(svg.querySelectorAll('linearGradient stop')).toHaveLength(3)
    expect(lastStop).toHaveAttribute('stop-color', 'var(--splash-accent)')
    expect(text).toHaveAttribute('stroke-dasharray', '1000')
  })

  it('wraps long text into fitted SVG lines while preserving its accessible label', () => {
    const longText = 'A reusable responsive stroke fill animation demonstration'

    render(<StrokeFill text={longText} />)

    const svg = screen.getByRole('img', { name: longText })
    const lines = svg.querySelectorAll('tspan')

    expect(lines.length).toBeGreaterThan(1)
    expect(Number(svg.getAttribute('viewBox')?.split(' ')[3])).toBeGreaterThan(
      180,
    )
    expect(
      [...lines].every(
        (line) => Number(line.getAttribute('textLength')) <= 880,
      ),
    ).toBe(true)
  })

  it('renders the completed text immediately when reduced motion is preferred', () => {
    reducedMotionMock.mockReturnValue(true)

    render(<StrokeFill text="Elegance" />)

    const svg = screen.getByRole('img', { name: 'Elegance' })
    const text = svg.querySelector('text')

    expect(text).toHaveAttribute('stroke-dasharray', 'none')
    expect(text).toHaveStyle({ fillOpacity: 1 })
  })
})
