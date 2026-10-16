import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  DOT_SIZE,
  DOT_SPRING_CONFIG,
  INTERACTIVE_SELECTOR,
  RING_HOVER_SCALE,
  RING_PRESS_SCALE,
  RING_SIZE,
  RING_SPRING_CONFIG,
} from '@/constants/cursor-constants'

function hasFineCursor(): boolean {
  return window.matchMedia('(pointer: fine) and (hover: hover)').matches
}

/**
 * Premium two-part cursor accent: a bouncy inner dot and a
 * spring-delayed outer ring that follow the normal browser cursor.
 * The default cursor remains visible. Desktop-only; respects reduced motion.
 *
 * Scroll-linked and imperative motion values bypass MotionConfig's
 * reduced-motion handling, so this component checks useReducedMotion
 * directly — the same pattern Parallax uses.
 */
export function CustomCursor() {
  const shouldReduceMotion = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const hasMovedRef = useRef(false)

  // Raw pointer position — updated imperatively, no React re-renders
  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)

  // Dot follows with bouncy spring for playful feel
  const dotX = useSpring(rawX, DOT_SPRING_CONFIG)
  const dotY = useSpring(rawY, DOT_SPRING_CONFIG)

  // Ring follows with smoother, delayed spring
  const ringX = useSpring(rawX, RING_SPRING_CONFIG)
  const ringY = useSpring(rawY, RING_SPRING_CONFIG)

  // Check for desktop pointer on mount and resize
  useEffect(() => {
    const check = () => setIsDesktop(hasFineCursor())
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Pointer tracking and interaction detection
  useEffect(() => {
    if (!isDesktop || shouldReduceMotion) return

    const onPointerMove = (e: PointerEvent) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)
      if (!hasMovedRef.current) {
        hasMovedRef.current = true
        setVisible(true)
      }
    }

    const onPointerLeave = () => setVisible(false)
    const onPointerEnter = () => {
      if (hasMovedRef.current) setVisible(true)
    }

    const onPointerDown = () => setIsPressed(true)
    const onPointerUp = () => setIsPressed(false)

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        setIsHovering(true)
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        setIsHovering(false)
      }
    }

    document.addEventListener('pointermove', onPointerMove)
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.documentElement.addEventListener('pointerenter', onPointerEnter)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave,
      )
      document.documentElement.removeEventListener(
        'pointerenter',
        onPointerEnter,
      )
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
    }
  }, [isDesktop, shouldReduceMotion, rawX, rawY])

  // Nothing to render on touch devices or when reduced motion is on
  if (!isDesktop || shouldReduceMotion) return null

  const ringScale = isPressed
    ? RING_PRESS_SCALE
    : isHovering
      ? RING_HOVER_SCALE
      : 1

  return (
    <>
      {/* Inner dot — bouncy spring follows the normal browser cursor */}
      <motion.div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: '50%',
          backgroundColor: '#67C7FF',
          pointerEvents: 'none',
          zIndex: 9999,
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />

      {/* Outer ring */}
      <motion.div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: '50%',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          pointerEvents: 'none',
          zIndex: 9998,
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: ringScale,
        }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { type: 'spring', damping: 20, stiffness: 300 },
        }}
      />
    </>
  )
}
