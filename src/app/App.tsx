import { useCallback, useState } from 'react'
import { CustomCursor } from '@/components/effects/CustomCursor'
import {
  SplashScreen,
  shouldShowSplash,
} from '@/components/effects/SplashScreen'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/sections/Hero'

export function App() {
  // Show splash only once per browser session
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </>
  )
}
