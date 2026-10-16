import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = {
  variant?: ButtonVariant
} & (
  | (ComponentProps<'button'> & { as?: 'button' })
  | (ComponentProps<'a'> & { as: 'a' })
)

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg font-medium hover:bg-accent-hover',
  secondary:
    'border border-border text-fg hover:border-border-hover hover:bg-bg-muted',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-muted',
}

export function Button(props: ButtonProps) {
  const {
    as = 'button',
    variant = 'primary',
    className,
    children,
    ...elementProps
  } = props
  const resolvedClassName = cn(
    'inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm',
    'transition-colors duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-50',
    variantStyles[variant],
    className,
  )

  if (as === 'a') {
    return (
      <a
        className={resolvedClassName}
        {...(elementProps as ComponentProps<'a'>)}
      >
        {children}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } =
    elementProps as ComponentProps<'button'>

  return (
    <button type={type} className={resolvedClassName} {...buttonProps}>
      {children}
    </button>
  )
}
