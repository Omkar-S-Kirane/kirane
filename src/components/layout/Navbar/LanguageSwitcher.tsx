import { AnimatePresence, motion } from 'motion/react'
import { Check, Globe } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { LANGUAGES } from '@/i18n'
import { useTranslation } from '@/i18n'

/**
 * Language switcher dropdown — sits in the navbar. Shows the current
 * language code next to a Globe icon. Clicking opens a dropdown with
 * all supported languages; the active one gets a check mark.
 *
 * Keyboard-accessible: Arrow keys navigate, Enter/Space select,
 * Escape closes.
 */
export function LanguageSwitcher() {
  const { t, language, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const currentIndex = LANGUAGES.findIndex((l) => l.code === language)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  // Focus management within dropdown
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus()
    }
  }, [isOpen, focusedIndex])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // Opening — focus the current language
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
      }
      return !prev
    })
  }, [currentIndex])

  const handleSelect = useCallback(
    (code: (typeof LANGUAGES)[number]['code']) => {
      setLanguage(code)
      setIsOpen(false)
    },
    [setLanguage],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setFocusedIndex((prev) =>
            prev < LANGUAGES.length - 1 ? prev + 1 : 0,
          )
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : LANGUAGES.length - 1,
          )
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIndex(0)
          break
        }
        case 'End': {
          e.preventDefault()
          setFocusedIndex(LANGUAGES.length - 1)
          break
        }
        default:
          break
      }
    },
    [isOpen],
  )

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t.languageSwitcher.changeLanguage}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors duration-200',
          'text-fg-muted hover:text-fg',
          isOpen && 'text-fg',
        )}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{language}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.33, 1, 0.68, 1] }}
            role="listbox"
            aria-label={t.languageSwitcher.label}
            className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-border/80 bg-bg-muted/95 p-1 shadow-xl shadow-fg/5 backdrop-blur-md"
          >
            {LANGUAGES.map((lang, index) => {
              const isActive = lang.code === language
              return (
                <button
                  key={lang.code}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-fg/[0.08] text-fg'
                      : 'text-fg-muted hover:bg-fg/[0.04] hover:text-fg',
                    focusedIndex === index && !isActive && 'bg-fg/[0.04]',
                  )}
                >
                  <span>{lang.nativeName}</span>
                  {isActive && <Check className="h-4 w-4 text-accent" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
