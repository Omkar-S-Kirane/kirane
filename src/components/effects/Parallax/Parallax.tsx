import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ParallaxProps {
  children: ReactNode
  className?: string
  /** Distance in pixels the content travels during scroll. */
  offset?: number
}

/**
 * Applies a vertical parallax shift to its children based on scroll position.
 * Scroll-linked transforms bypass MotionConfig's reducedMotion setting,
 * so this component checks the preference directly.
 */
export function Parallax({ children, className, offset = 50 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset])

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}
