import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'

interface LenisProviderProps {
  children: ReactNode
}

export function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      respectReducedMotion: true,
      smoothWheel:
        document.documentElement.classList.contains('aether-document'),
    })

    return () => lenis.destroy()
  }, [])

  return children
}
