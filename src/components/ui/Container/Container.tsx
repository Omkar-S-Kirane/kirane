import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ContainerMaxWidth = 'content' | 'wide' | 'full'
type ContainerPadding = 'default' | 'page' | 'none'

interface ContainerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
  maxWidth?: ContainerMaxWidth
  padding?: ContainerPadding
  centered?: boolean
  safeArea?: boolean
}

const maxWidthClasses: Record<ContainerMaxWidth, string> = {
  content: 'max-w-[var(--container-max)]',
  wide: 'max-w-[var(--container-wide-max)]',
  full: 'max-w-none',
}

const paddingClasses: Record<ContainerPadding, string> = {
  default: 'px-[var(--container-padding)]',
  page: 'px-[var(--layout-page-gutter)]',
  none: 'px-0',
}

export function Container({
  children,
  className,
  as: Element = 'div',
  maxWidth = 'content',
  padding = 'default',
  centered = true,
  safeArea = false,
}: ContainerProps) {
  const inlinePadding =
    padding === 'page'
      ? 'var(--layout-page-gutter)'
      : padding === 'default'
        ? 'var(--container-padding)'
        : '0px'

  return (
    <Element
      className={cn(
        centered && 'mx-auto',
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className,
      )}
      style={
        safeArea
          ? {
              paddingInlineStart: `max(${inlinePadding}, env(safe-area-inset-left, 0px))`,
              paddingInlineEnd: `max(${inlinePadding}, env(safe-area-inset-right, 0px))`,
            }
          : undefined
      }
    >
      {children}
    </Element>
  )
}
