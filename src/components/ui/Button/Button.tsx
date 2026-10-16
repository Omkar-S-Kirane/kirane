import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg font-medium hover:bg-accent-hover',
  secondary:
    'border border-border text-fg hover:border-border-hover hover:bg-bg-muted',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-muted',
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm',
        'transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
