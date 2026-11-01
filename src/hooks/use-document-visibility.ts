import { useEffect, useState } from 'react'

/** Tracks whether the current document is visible without tying it to a frame loop. */
export function useDocumentVisibility(): boolean {
  const [visible, setVisible] = useState(
    () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}
