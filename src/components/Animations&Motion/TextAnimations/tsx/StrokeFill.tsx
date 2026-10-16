import { useId, useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { Container } from '@/components/ui/Container'
import './StrokeFill.css'

export type StrokeFillPosition = 'bottom-left' | 'center' | 'bottom-center'
export type StrokeFillEffect = 'solid' | 'glass'
export type StrokeFillMode = 'fill' | 'outline'

export interface StrokeFillProps {
  text?: string
  duration?: number
  onComplete?: () => void
  className?: string
  position?: StrokeFillPosition
  strokeEffect?: StrokeFillEffect
  fillMode?: StrokeFillMode
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  children?: ReactNode
}

const VIEWBOX_WIDTH = 1000
const TEXT_START_X = 2
const MAX_TEXT_FONT_SIZE = 100
const MAX_TEXT_ADVANCE = 880
const TEXT_ADVANCE_PER_CHARACTER = 0.62
const TEXT_LINE_HEIGHT_RATIO = 1.15
const TEXT_VIEWBOX_HEIGHT_RATIO = 1.42
const TEXT_BASELINE_RATIO = 0.8
const MAX_CHARACTERS_PER_LINE = 18
const STROKE_DASH_LENGTH = 1000

export function StrokeFill({
  text = 'Elegance',
  duration = 3,
  onComplete,
  className,
  position = 'bottom-left',
  strokeEffect = 'solid',
  fillMode = 'fill',
  fillColor = 'var(--splash-text)',
  strokeColor = 'var(--splash-text)',
  strokeWidth = 1.5,
  children,
}: StrokeFillProps) {
  const gradientId = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-glass-stroke`
  const prefersReducedMotion = useReducedMotion()
  const animationDuration = Math.max(0, duration)
  const lines = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean)
    const wrappedLines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const remainingCharacters = Array.from(word)

      while (remainingCharacters.length > MAX_CHARACTERS_PER_LINE) {
        if (currentLine) {
          wrappedLines.push(currentLine)
          currentLine = ''
        }

        wrappedLines.push(
          remainingCharacters.splice(0, MAX_CHARACTERS_PER_LINE).join(''),
        )
      }

      const remainingWord = remainingCharacters.join('')
      if (!remainingWord) continue

      if (!currentLine) {
        currentLine = remainingWord
      } else if (
        Array.from(currentLine).length + 1 + remainingCharacters.length <=
        MAX_CHARACTERS_PER_LINE
      ) {
        currentLine += ` ${remainingWord}`
      } else {
        wrappedLines.push(currentLine)
        currentLine = remainingWord
      }
    }

    if (currentLine) wrappedLines.push(currentLine)
    return wrappedLines.length > 0 ? wrappedLines : ['']
  }, [text])
  const longestLineLength = Math.max(
    ...lines.map((line) => Array.from(line).length),
    1,
  )
  const fontSize = Math.min(
    MAX_TEXT_FONT_SIZE,
    MAX_TEXT_ADVANCE / (longestLineLength * TEXT_ADVANCE_PER_CHARACTER),
  )
  const lineHeight = fontSize * TEXT_LINE_HEIGHT_RATIO
  const viewBoxHeight =
    fontSize * TEXT_VIEWBOX_HEIGHT_RATIO + (lines.length - 1) * lineHeight
  const firstLineY = fontSize * TEXT_BASELINE_RATIO

  const initial = useMemo(
    () => ({
      strokeDasharray: STROKE_DASH_LENGTH,
      strokeDashoffset: STROKE_DASH_LENGTH,
      ...(fillMode === 'fill' ? { fillOpacity: 0 } : {}),
    }),
    [fillMode],
  )
  const animate = useMemo(
    () => ({
      strokeDashoffset: 0,
      ...(fillMode === 'fill' ? { fillOpacity: 1 } : {}),
    }),
    [fillMode],
  )
  const transition = useMemo(
    () => ({
      duration: animationDuration,
      ease: 'easeInOut' as const,
      ...(fillMode === 'fill'
        ? {
            fillOpacity: {
              delay: animationDuration * 0.67,
              duration: animationDuration * 0.33,
              ease: 'easeIn' as const,
            },
          }
        : {}),
    }),
    [animationDuration, fillMode],
  )
  const textStyle = useMemo(() => ({ fontSize: `${fontSize}px` }), [fontSize])

  return (
    <div
      className={cn('stroke-fill', `stroke-fill--${position}`, className)}
      data-position={position}
    >
      <Container
        maxWidth="full"
        padding="page"
        centered={false}
        safeArea
        className="stroke-fill__container"
      >
        <div className="stroke-fill__stack">
          <svg
            className="stroke-fill__svg"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${viewBoxHeight}`}
            role="img"
            aria-label={text}
            focusable="false"
          >
            {strokeEffect === 'glass' && (
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={strokeColor}
                    stopOpacity="0.76"
                  />
                  <stop offset="54%" stopColor={fillColor} stopOpacity="0.92" />
                  <stop
                    offset="100%"
                    stopColor="var(--splash-accent)"
                    stopOpacity="0.68"
                  />
                </linearGradient>
              </defs>
            )}
            <motion.text
              dominantBaseline="middle"
              stroke={
                strokeEffect === 'glass' ? `url(#${gradientId})` : strokeColor
              }
              strokeWidth={strokeWidth}
              strokeDasharray={
                prefersReducedMotion ? 'none' : STROKE_DASH_LENGTH
              }
              fill={fillMode === 'outline' ? 'none' : fillColor}
              fillOpacity={fillMode === 'fill' ? 0 : undefined}
              vectorEffect="non-scaling-stroke"
              className="stroke-fill__text"
              style={textStyle}
              initial={prefersReducedMotion ? false : initial}
              animate={animate}
              transition={transition}
              onAnimationComplete={onComplete}
            >
              {lines.map((line, lineIndex) => {
                const dividerIndex = line.indexOf('|')
                const lineContent =
                  dividerIndex === -1 ? (
                    line
                  ) : (
                    <>
                      {line.slice(0, dividerIndex)}
                      <tspan
                        className="stroke-fill__divider"
                        stroke="var(--splash-accent)"
                        strokeWidth={strokeWidth * 0.45}
                        fill="var(--splash-accent)"
                        textLength={fontSize * 0.08}
                        lengthAdjust="spacingAndGlyphs"
                      >
                        {line[dividerIndex]}
                      </tspan>
                      {line.slice(dividerIndex + 1)}
                    </>
                  )

                return (
                  <tspan
                    key={`${lineIndex}-${line}`}
                    x={TEXT_START_X}
                    y={firstLineY + lineIndex * lineHeight}
                    textLength={Math.min(
                      MAX_TEXT_ADVANCE,
                      fontSize *
                        Math.max(Array.from(line).length, 1) *
                        TEXT_ADVANCE_PER_CHARACTER,
                    )}
                    lengthAdjust="spacingAndGlyphs"
                  >
                    {lineContent}
                  </tspan>
                )
              })}
            </motion.text>
          </svg>
          {children}
        </div>
      </Container>
    </div>
  )
}
