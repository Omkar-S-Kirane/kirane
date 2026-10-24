import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './PressureTest.css'

export interface PressureTestProps {
  text?: string
  fontUrl?: string
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4'
}

interface Vec2 {
  x: number
  y: number
}

const FONT_FAMILY = 'Compressa VF'
const DEFAULT_FONT_URL =
  'https://res.cloudinary.com/losrodriguez/raw/upload/v1782070311/CompressaPRO-GX_xfju37.woff2'

const distanceBetween = (first: Vec2, second: Vec2) =>
  Math.hypot(second.x - first.x, second.y - first.y)

const getAttribute = (
  distance: number,
  maximumDistance: number,
  minimum: number,
  maximum: number,
) =>
  Math.max(
    minimum,
    maximum - Math.abs((maximum * distance) / maximumDistance) + minimum,
  )

export function PressureTest({
  text = 'UILORA',
  fontUrl = DEFAULT_FONT_URL,
  className = 'text-white',
  tag = 'h2',
}: PressureTestProps) {
  const Tag = tag
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const spansRef = useRef<Array<HTMLSpanElement | null>>([])
  const pointerRef = useRef<Vec2>({ x: 0, y: 0 })
  const easedPointerRef = useRef<Vec2>({ x: 0, y: 0 })
  const [fontSize, setFontSize] = useState(24)
  const characters = useMemo(() => text.split(''), [text])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
    }
    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) pointerRef.current = { x: touch.clientX, y: touch.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    const bounds = containerRef.current?.getBoundingClientRect()
    if (bounds) {
      const center = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      }
      easedPointerRef.current = center
      pointerRef.current = { ...center }
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  const setResponsiveFontSize = useCallback(() => {
    const width = containerRef.current?.getBoundingClientRect().width
    if (width === undefined) return
    // Give the wordmark a little more presence while keeping its size tied to
    // the available width so it stays legible on narrow screens.
    setFontSize(Math.max(24, width / (characters.length * 0.4)))
  }, [characters.length])

  useEffect(() => {
    let resizeTimer: number | null = null
    const handleResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(setResponsiveFontSize, 100)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimer !== null) window.clearTimeout(resizeTimer)
    }
  }, [setResponsiveFontSize])

  useEffect(() => {
    let animationFrame = 0
    const animate = () => {
      easedPointerRef.current.x +=
        (pointerRef.current.x - easedPointerRef.current.x) / 15
      easedPointerRef.current.y +=
        (pointerRef.current.y - easedPointerRef.current.y) / 15

      const title = titleRef.current
      if (title) {
        const maximumDistance = title.getBoundingClientRect().width / 2
        spansRef.current.forEach((span) => {
          if (!span) return

          const bounds = span.getBoundingClientRect()
          const center = {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
          }
          const distance = distanceBetween(easedPointerRef.current, center)
          const weight = Math.floor(
            getAttribute(distance, maximumDistance, 100, 900),
          )
          const width = Math.floor(
            getAttribute(distance, maximumDistance, 5, 200),
          )
          const italic = getAttribute(distance, maximumDistance, 0, 1).toFixed(
            2,
          )

          span.style.fontVariationSettings = `'wght' ${weight}, 'wdth' ${width}, 'ital' ${italic}`
        })
      }

      animationFrame = window.requestAnimationFrame(animate)
    }

    animate()
    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  const titleStyle: CSSProperties = {
    fontFamily: FONT_FAMILY,
    fontSize,
    lineHeight: 1,
    margin: 0,
    fontWeight: 100,
    whiteSpace: 'nowrap',
    width: '100%',
  }

  return (
    <div ref={containerRef} className="pressure-test">
      <style>{`@font-face { font-family: '${FONT_FAMILY}'; src: url('${fontUrl}'); }`}</style>
      <Tag
        ref={titleRef}
        aria-label={text}
        className={`pt-title ${className}`}
        style={titleStyle}
      >
        {characters.map((character, index) => (
          <span
            key={`${character}-${index}`}
            aria-hidden="true"
            ref={(element) => {
              spansRef.current[index] = element
            }}
          >
            {character}
          </span>
        ))}
      </Tag>
    </div>
  )
}
