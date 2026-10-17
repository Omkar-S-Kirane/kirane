import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import { useTheme } from '@/theme'
import type { ThemePreference } from '@/theme'

const THEME_OPTIONS = [
  { value: 'dark', Icon: Moon },
  { value: 'light', Icon: Sun },
  { value: 'system', Icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: ThemePreference
  Icon: typeof Moon
}>

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()
  const prefersReducedMotion = useReducedMotion() === true
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const menuId = useId()
  const selectedIndex = THEME_OPTIONS.findIndex(
    (option) => option.value === preference,
  )
  const SelectedIcon = THEME_OPTIONS[selectedIndex].Icon
  const labels = {
    dark: t.theme.dark,
    light: t.theme.light,
    system: t.theme.system,
  }

  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.focus()
    }
  }, [focusedIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex((current) => (current + 1) % THEME_OPTIONS.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(
          (current) =>
            (current - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length,
        )
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(THEME_OPTIONS.length - 1)
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        closeMenu(true)
        break
      case 'Tab':
        closeMenu()
        break
    }
  }

  const handleSelect = (nextPreference: ThemePreference) => {
    setPreference(nextPreference)
    closeMenu(true)
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${t.theme.preference}: ${labels[preference]}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          if (isOpen) {
            closeMenu()
          } else {
            setFocusedIndex(selectedIndex)
            setIsOpen(true)
          }
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted transition-colors duration-200 hover:bg-fg/[0.08] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <SelectedIcon aria-hidden="true" className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={t.theme.preference}
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border/80 bg-bg-muted/95 p-1 shadow-xl shadow-fg/5 backdrop-blur-md"
          >
            {THEME_OPTIONS.map(({ value, Icon }, index) => {
              const isSelected = value === preference
              return (
                <button
                  key={value}
                  ref={(element) => {
                    optionRefs.current[index] = element
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onFocus={() => setFocusedIndex(index)}
                  onClick={() => handleSelect(value)}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                    isSelected
                      ? 'bg-fg/[0.08] text-fg'
                      : 'text-fg-muted hover:bg-fg/[0.05] hover:text-fg',
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  <span className="flex-1 text-left">{labels[value]}</span>
                  {isSelected && (
                    <Check aria-hidden="true" className="h-4 w-4 text-accent" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
