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
import { Volume2, VolumeX } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { useTranslation } from '@/i18n'
import { fadeInUp } from '@/lib/animations/motion-variants'
import './Hero.css'

import heroPoster from '@/assets/background/hero-bg.PNG'
import heroVideo from '@/assets/background/Developer_typing_at_computer_117e8542.mp4'

const HERO_SOUND_STORAGE_KEY = 'kirane:hero:sound-enabled'
const HERO_VIDEO_VOLUME = 0.4

function readSoundPreference(): boolean {
  try {
    return window.sessionStorage.getItem(HERO_SOUND_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveSoundPreference(enabled: boolean): void {
  try {
    window.sessionStorage.setItem(HERO_SOUND_STORAGE_KEY, String(enabled))
  } catch {
    // The control still works if storage is unavailable or blocked.
  }
}

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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference)
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [soundControlActive, setSoundControlActive] = useState(
    () => !dissolveProgress || dissolveProgress.get() < 0.995,
  )
  const soundEnabledRef = useRef(soundEnabled)
  const [sectionSize, setSectionSize] = useState({ width: 0, height: 0 })
  const maskDimensionsRef = useRef({
    width: 0,
    bandWidth: 40,
    displacement: 14,
  })
  const noDissolve = useMotionValue(0)
  const heroProgress = dissolveProgress ?? noDissolve
  const dissolveEdge = useTransform(
    heroProgress,
    (value) => 1 - Math.max(0, Math.min(1, value)),
  )
  const soundControlOpacity = useTransform(heroProgress, (value) =>
    Math.max(0, 1 - Math.max(0, Math.min(1, value))),
  )
  const soundControlPointerEvents = useTransform(heroProgress, (value) =>
    value < 0.995 ? 'auto' : 'none',
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

  const updateVideoAudio = useCallback((progress: number) => {
    const video = videoRef.current
    if (!video) return

    const normalizedProgress = Math.max(0, Math.min(1, progress))
    const volume = soundEnabledRef.current
      ? HERO_VIDEO_VOLUME * (1 - normalizedProgress)
      : 0
    video.volume = volume
    video.muted = volume <= 0.001
  }, [])

  const markAudioUnavailable = useCallback(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.volume = 0
      try {
        void video.play().catch(() => {})
      } catch {
        // The poster remains available if even muted playback is unavailable.
      }
    }
    soundEnabledRef.current = false
    setSoundEnabled(false)
    setAudioUnavailable(true)
  }, [])

  const attemptVideoPlayback = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    try {
      void video.play().catch(() => {
        if (soundEnabledRef.current) markAudioUnavailable()
      })
    } catch {
      if (soundEnabledRef.current) markAudioUnavailable()
    }
  }, [markAudioUnavailable])

  const handleSoundToggle = useCallback(() => {
    const nextEnabled = !soundEnabledRef.current
    soundEnabledRef.current = nextEnabled
    setSoundEnabled(nextEnabled)
    setAudioUnavailable(false)
    saveSoundPreference(nextEnabled)

    const progress = heroProgress.get()
    updateVideoAudio(progress)
    if (nextEnabled && progress < 0.995) attemptVideoPlayback()
  }, [attemptVideoPlayback, heroProgress, updateVideoAudio])

  useMotionValueEvent(heroProgress, 'change', (progress) => {
    updateVideoAudio(progress)
    const visible = progress < 0.995
    setSoundControlActive((current) =>
      current === visible ? current : visible,
    )

    const video = videoRef.current
    if (!video) return
    if (!active || progress >= 0.995) {
      video.pause()
      return
    }
    if (video.paused && (!prefersReducedMotion || soundEnabledRef.current)) {
      attemptVideoPlayback()
    }
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const progress = heroProgress.get()
    updateVideoAudio(progress)
    if (!active || progress >= 0.995) {
      video.pause()
      return
    }
    if (
      video.paused &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      (!prefersReducedMotion || soundEnabledRef.current)
    ) {
      attemptVideoPlayback()
    }
  }, [
    active,
    attemptVideoPlayback,
    heroProgress,
    prefersReducedMotion,
    updateVideoAudio,
  ])

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
      className={`hero-section relative isolate flex min-h-svh items-start overflow-hidden pt-[clamp(5rem,11svh,8rem)] pb-[calc(3.5rem+var(--layout-safe-area-bottom))] lg:pt-[16svh]${dissolveProgress ? ' hero-cinematic-layer' : ''}`}
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
          ref={videoRef}
          className="hero-background__video"
          autoPlay={!prefersReducedMotion}
          loop
          muted
          playsInline
          preload="metadata"
          poster={heroPoster}
          aria-hidden="true"
          onCanPlay={() => {
            setVideoReady(true)
            const progress = heroProgress.get()
            updateVideoAudio(progress)
            const video = videoRef.current
            if (!video) return
            if (!active || progress >= 0.995) {
              video.pause()
              return
            }
            if (
              (video.paused &&
                (!prefersReducedMotion || soundEnabledRef.current)) ||
              soundEnabledRef.current
            ) {
              attemptVideoPlayback()
            }
          }}
          onError={() => {
            setVideoReady(false)
            if (soundEnabledRef.current) markAudioUnavailable()
          }}
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/40"
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
          <motion.h1 variants={fadeVariants} className="hero-copy__heading">
            {t.hero.heading}
          </motion.h1>

          <motion.p
            variants={fadeVariants}
            className="hero-copy__tagline mx-auto text-center"
          >
            {t.hero.tagline}
          </motion.p>
        </motion.div>
      </Container>

      {audioUnavailable && (
        <p className="hero-sound-status" role="status" aria-live="polite">
          {t.hero.audioUnavailable}
        </p>
      )}
      <motion.button
        type="button"
        className="hero-sound-control"
        aria-label={soundEnabled ? t.hero.soundOff : t.hero.soundOn}
        aria-pressed={soundEnabled}
        aria-hidden={!soundControlActive}
        disabled={!soundControlActive}
        onClick={handleSoundToggle}
        style={{
          opacity: soundControlOpacity,
          pointerEvents: soundControlPointerEvents,
        }}
      >
        {soundEnabled ? (
          <Volume2 aria-hidden="true" size={17} strokeWidth={1.8} />
        ) : (
          <VolumeX aria-hidden="true" size={17} strokeWidth={1.8} />
        )}
        <span>{soundEnabled ? t.hero.soundOff : t.hero.soundOn}</span>
      </motion.button>
    </motion.section>
  )
}
