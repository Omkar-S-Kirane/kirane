import { CustomCursor } from '@/components/effects/CustomCursor'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/sections/Hero'

export function App() {
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
