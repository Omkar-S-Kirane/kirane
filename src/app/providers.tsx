import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Application-level providers.
 * MotionConfig's reducedMotion="user" makes all motion.* components
 * automatically respect the prefers-reduced-motion media query.
 */
export function Providers({ children }: ProvidersProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
