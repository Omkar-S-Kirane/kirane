import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  title: string
  description?: string
  eyebrow?: string
  className?: string
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-medium tracking-tight text-fg sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
    </div>
  )
}
