import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  variants,
  type AnimationVariantKey,
} from '@/lib/animations/motion-variants'

interface RevealProps {
  children: ReactNode
  className?: string
  variant?: AnimationVariantKey
  delay?: number
  once?: boolean
}

/**
 * Wraps children in a motion.div that animates when scrolled into view.
 * Reduced motion is handled globally by MotionConfig in providers.tsx.
 */
export function Reveal({
  children,
  className,
  variant = 'fadeInUp',
  delay = 0,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={variants[variant]}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
