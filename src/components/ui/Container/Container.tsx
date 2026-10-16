import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
}

export function Container({
  children,
  className,
  as: Element = 'div',
}: ContainerProps) {
  return (
    <Element
      className={cn(
        'mx-auto w-full max-w-[var(--container-max)] px-[var(--container-padding)]',
        className,
      )}
    >
      {children}
    </Element>
  )
}
