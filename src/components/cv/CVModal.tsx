import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { resumeData } from '@/data/resume'
import { useTranslation } from '@/i18n/useTranslation'

import { CVActions } from './CVActions'
import { CVDocument } from './CVDocument'

interface CVModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Full-screen CV modal — accessible dialog with:
 *  • Focus trap (Tab / Shift+Tab cycle within modal)
 *  • Scroll-lock on the body while open
 *  • Escape key dismissal
 *  • Backdrop click dismissal
 *  • Animated enter/exit via Motion
 *  • Print-friendly: only the CV document prints (see resume-print.css)
 */
export function CVModal({ isOpen, onClose }: CVModalProps) {
  const { t, language } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const data = resumeData[language]

  // ── Scroll lock & focus management ────────────────────────
  useEffect(() => {
    if (!isOpen) return

    // Remember where focus was so we can restore it on close
    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Lock body scroll
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog
    requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })

    return () => {
      // Restore body scroll
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)

      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // ── Keyboard handling ─────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose],
  )

  // ── Backdrop click ────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cv-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          aria-hidden="true"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.resume.resumeDocument}
            className="cv-modal"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <CVActions onClose={onClose} />

            <div className="cv-modal__scroll">
              <CVDocument data={data} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
