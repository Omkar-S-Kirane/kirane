import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type Variants,
} from 'motion/react'
import { Container } from '@/components/ui/Container'
import { PressureTest } from '@/components/Animations&Motion/TextAnimations/tsx/PressureTest'
import { useTranslation } from '@/i18n'
import { fadeInUp } from '@/lib/animations/motion-variants'
import './Hero.css'

import heroPoster from '@/assets/background/hero-bg.PNG'
import heroVideo from '@/assets/background/Developer_typing_at_computer_117e8542.mp4'

interface HeroProps {
  active: boolean
  fontsReady: boolean
  onLayoutReady: () => void
  onRevealComplete: () => void
  dissolveProgress?: MotionValue<number>
}

const contentVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.08,
      staggerChildren: 0.14,
    },
  },
}

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.01 },
  },
}

const reducedMotionSequenceVariants: Variants = {
  hidden: {},
  visible: {},
}

const headingVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function Hero({
  active,
  fontsReady,
  onLayoutReady,
  onRevealComplete,
  dissolveProgress,
}: HeroProps) {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion() === true
  const sectionRef = useRef<HTMLElement | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 })
  const maskDimensionsRef = useRef({
    width: 0,
    bandWidth: 40,
    displacement: 14,
  })
  const noDissolve = useMotionValue(0)
  const dissolveEdge = useTransform(
    dissolveProgress ?? noDissolve,
    (value) => 1 - Math.max(0, Math.min(1, value)),
  )
  const maskBaseWidth = useMotionValue('0px')
  const maskBandX = useMotionValue(0)
  const maskDisplacement = Math.min(56, Math.max(16, sectionSize.width * 0.045))

  const updateMask = (edge: number) => {
    const { width, bandWidth, displacement } = maskDimensionsRef.current
    const halfBand = bandWidth / 2
    const x =
      edge * (width + halfBand + displacement * 2) - halfBand - displacement
    maskBandX.set(x)
    maskBaseWidth.set(`${Math.max(0, x + displacement / 2)}px`)
  }
  const updateMaskRef = useRef(updateMask)
  updateMaskRef.current = updateMask

  useMotionValueEvent(dissolveEdge, 'change', (edge) =>
    updateMaskRef.current(edge),
  )
  const layoutReadyReported = useRef(false)
  const revealCompleteReported = useRef(false)
  const sequenceVariants = prefersReducedMotion
    ? reducedMotionSequenceVariants
    : contentVariants
  const fadeVariants = prefersReducedMotion ? reducedMotionVariants : fadeInUp

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!fontsReady || !section || layoutReadyReported.current) return

    section.getBoundingClientRect()
    layoutReadyReported.current = true
    onLayoutReady()
  }, [fontsReady, onLayoutReady])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const measure = () => {
      const { width, height } = section.getBoundingClientRect()
      maskDimensionsRef.current = {
        width,
        bandWidth: Math.min(140, Math.max(40, width * 0.11)),
        displacement: Math.min(56, Math.max(16, width * 0.045)),
      }
      setSectionSize({ width, height })
      updateMaskRef.current(dissolveEdge.get())
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(section)
    window.addEventListener('resize', measure, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (!active) {
      revealCompleteReported.current = false
      return
    }

    if (prefersReducedMotion && !revealCompleteReported.current) {
      revealCompleteReported.current = true
      onRevealComplete()
    }
  }, [active, onRevealComplete, prefersReducedMotion])

  const handleRevealComplete = useCallback(
    (definition: string) => {
      if (
        !active ||
        definition !== 'visible' ||
        revealCompleteReported.current
      ) {
        return
      }

      revealCompleteReported.current = true
      onRevealComplete()
    },
    [active, onRevealComplete],
  )

  return (
    <motion.section
      id={dissolveProgress ? undefined : 'home'}
      data-page-section={dissolveProgress ? undefined : true}
      ref={sectionRef}
      className={`relative isolate flex min-h-svh items-start overflow-hidden pt-[clamp(8.5rem,15svh,11rem)] pb-[calc(3.5rem+var(--layout-safe-area-bottom))] lg:pt-[16svh]${dissolveProgress ? ' hero-cinematic-layer' : ''}`}
      style={
        dissolveProgress
          ? {
              mask: 'url(#hero-dissolve-mask)',
              pointerEvents: 'none',
            }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className={`hero-background absolute inset-0${videoReady ? ' is-video-ready' : ''}`}
        style={{ backgroundImage: `url(${heroPoster})` }}
      >
        <video
          className="hero-background__video"
          autoPlay={!prefersReducedMotion}
          loop
          muted
          playsInline
          preload="metadata"
          poster={heroPoster}
          aria-hidden="true"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
      </div>
      {dissolveProgress && (
        <svg
          className="hero-dissolve-defs"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter
              id="hero-dissolve-noise"
              x="-60%"
              y="-15%"
              width="220%"
              height="130%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.008 0.025"
                numOctaves="2"
                seed="9"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0.5"
                result="horizontal-noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="horizontal-noise"
                scale={maskDisplacement}
                xChannelSelector="R"
                yChannelSelector="A"
              />
            </filter>
            <linearGradient id="hero-dissolve-gradient">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask
              id="hero-dissolve-mask"
              x="0"
              y="0"
              width={sectionSize.width}
              height={sectionSize.height}
              maskContentUnits="userSpaceOnUse"
              maskUnits="userSpaceOnUse"
            >
              <motion.rect
                style={{ width: maskBaseWidth }}
                height={sectionSize.height}
                fill="white"
              />
              <g filter="url(#hero-dissolve-noise)">
                <motion.rect
                  x={maskBandX}
                  style={{ width: 'clamp(40px, 11vw, 140px)' }}
                  height={sectionSize.height}
                  fill="url(#hero-dissolve-gradient)"
                />
              </g>
            </mask>
          </defs>
        </svg>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/55"
      />
      <Container
        maxWidth="wide"
        padding="page"
        safeArea
        className="relative z-10 grid w-full grid-cols-1 items-start"
      >
        <motion.div
          initial={prefersReducedMotion ? false : 'hidden'}
          animate={active ? 'visible' : 'hidden'}
          variants={sequenceVariants}
          onAnimationComplete={handleRevealComplete}
          className="hero-copy mx-auto w-full max-w-5xl text-center"
        >
          <motion.div
            variants={
              prefersReducedMotion
                ? reducedMotionSequenceVariants
                : headingVariants
            }
            className="w-full"
          >
            <PressureTest
              text={t.hero.heading}
              tag="h1"
              className="text-fg hero-copy-shadow"
            />
          </motion.div>

          <motion.p
            variants={fadeVariants}
            className="hero-copy-shadow mx-auto mt-4 max-w-2xl text-center font-display text-base leading-relaxed text-secondary sm:mt-6 sm:text-lg"
          >
            {t.hero.tagline}
          </motion.p>
        </motion.div>
      </Container>
    </motion.section>
  )
}
