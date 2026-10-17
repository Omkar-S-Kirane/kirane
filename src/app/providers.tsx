import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { I18nProvider } from '@/i18n'
import { ThemeProvider } from '@/theme'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Application-level providers.
 *
 * - I18nProvider supplies translations and language switching to the
 *   entire component tree.
 * - MotionConfig's reducedMotion="user" makes all motion.* components
 *   automatically respect the prefers-reduced-motion media query.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </I18nProvider>
    </ThemeProvider>
  )
}
