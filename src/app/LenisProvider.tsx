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
    })

    return () => lenis.destroy()
  }, [])

  return children
}
