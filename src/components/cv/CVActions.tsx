import { useCallback } from 'react'
import { Printer, Download, X } from 'lucide-react'
import { useTranslation } from '@/i18n/useTranslation'
import { cn } from '@/lib/cn'

interface CVActionsProps {
  onClose: () => void
  className?: string
}

/**
 * Action bar for the CV modal — print, PDF download, and close.
 * Print uses the browser's native print dialog; PDF download triggers
 * print-to-PDF via the same mechanism (the print stylesheet handles layout).
 */
export function CVActions({ onClose, className }: CVActionsProps) {
  const { t } = useTranslation()
  const r = t.resume

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div
      className={cn('cv-actions', className)}
      role="toolbar"
      aria-label={r.resumeDocument}
    >
      <button
        type="button"
        className="cv-actions__btn"
        onClick={handlePrint}
        aria-label={r.print}
        title={r.print}
      >
        <Printer size={18} aria-hidden="true" />
        <span className="cv-actions__label">{r.print}</span>
      </button>

      <button
        type="button"
        className="cv-actions__btn"
        onClick={handlePrint}
        aria-label={r.downloadPdf}
        title={r.downloadPdf}
      >
        <Download size={18} aria-hidden="true" />
        <span className="cv-actions__label">{r.downloadPdf}</span>
      </button>

      <button
        type="button"
        className="cv-actions__btn cv-actions__btn--close"
        onClick={onClose}
        aria-label={r.closeResume}
        title={r.close}
      >
        <X size={18} aria-hidden="true" />
        <span className="cv-actions__label">{r.close}</span>
      </button>
    </div>
  )
}
