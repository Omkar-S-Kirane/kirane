import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import './ScrambleReveal.css'

export interface ScrambleRevealProps {
  text: string
  duration?: number
  start?: boolean
  onComplete?: () => void
  className?: string
}

interface ScrambleFrame {
  source: string
  displayed: string
  resolvedCount: number
}

const SCRAMBLE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const SCRAMBLEABLE_CHARACTER = /[A-Za-z0-9]/

function createDisplayedText(text: string, resolvedCount: number) {
  return Array.from(text, (character, index) => {
    if (index < resolvedCount || !SCRAMBLEABLE_CHARACTER.test(character)) {
      return character
    }

    const randomIndex = Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)
    return SCRAMBLE_CHARACTERS[randomIndex]
  }).join('')
}

function createFrame(text: string, resolvedCount: number): ScrambleFrame {
  return {
    source: text,
    displayed: createDisplayedText(text, resolvedCount),
    resolvedCount,
  }
}

export function ScrambleReveal({
  text,
  duration = 1800,
  start = true,
  onComplete,
  className,
}: ScrambleRevealProps) {
  const prefersReducedMotion = useReducedMotion() === true
  const characters = useMemo(() => Array.from(text), [text])
  const safeDuration = Math.max(0, duration)
  const initialFrame = useMemo(
    () =>
      createFrame(
        text,
        prefersReducedMotion || safeDuration === 0 ? characters.length : 0,
      ),
    [characters.length, prefersReducedMotion, safeDuration, text],
  )
  const [frame, setFrame] = useState(initialFrame)
  const animationFrame = useRef<number | null>(null)
  const completedAnimationKey = useRef<string | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const visibleFrame = frame.source === text ? frame : initialFrame

  useEffect(() => {
    const animationKey = `${text}\u0000${safeDuration}`
    if (completedAnimationKey.current !== animationKey) {
      completedAnimationKey.current = null
    }

    if (!start) {
      completedAnimationKey.current = null
      return
    }

    if (completedAnimationKey.current === animationKey) return

    const notifyComplete = () => {
      completedAnimationKey.current = animationKey
      onCompleteRef.current?.()
    }

    if (prefersReducedMotion || safeDuration === 0 || characters.length === 0) {
      setFrame(createFrame(text, characters.length))
      notifyComplete()
      return
    }

    let active = true
    let startedAt: number | null = null

    const advance = (timestamp: number) => {
      if (!active) return

      startedAt ??= timestamp
      const progress = Math.min((timestamp - startedAt) / safeDuration, 1)
      const resolvedCount = Math.floor(progress * characters.length)

      setFrame({
        source: text,
        displayed: createDisplayedText(text, resolvedCount),
        resolvedCount,
      })

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(advance)
      } else {
        animationFrame.current = null
        notifyComplete()
      }
    }

    animationFrame.current = requestAnimationFrame(advance)

    return () => {
      active = false
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }
    }
  }, [characters.length, prefersReducedMotion, safeDuration, start, text])

  return (
    <span
      className={cn(
        'scramble-reveal',
        !start && 'scramble-reveal--pending',
        className,
      )}
      aria-hidden={start ? undefined : true}
    >
      <span className="scramble-reveal__accessible">{text}</span>
      <span className="scramble-reveal__visual" aria-hidden="true">
        {Array.from(visibleFrame.displayed, (character, index) => {
          const isResolved =
            index < visibleFrame.resolvedCount ||
            !SCRAMBLEABLE_CHARACTER.test(characters[index] ?? '')

          return (
            <span
              key={`${index}-${characters[index] ?? ''}`}
              className={cn(
                'scramble-reveal__character',
                isResolved
                  ? 'scramble-reveal__character--resolved'
                  : 'scramble-reveal__character--unresolved',
              )}
            >
              {character}
            </span>
          )
        })}
      </span>
    </span>
  )
}
