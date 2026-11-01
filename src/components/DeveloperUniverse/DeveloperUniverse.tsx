import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { ChevronsDown } from 'lucide-react'
import {
  DEVELOPER_UNIVERSE_PLANETS,
  PLANET_FORMATION_ORDER,
} from '@/data/developerUniverse'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import type {
  ScreenCircle,
  TechnologyPlanet,
  UniverseFrame,
  UniverseLayout,
} from './developerUniverse.types'
import {
  getScrollHintOpacity,
  getScrollHintY,
  getSunState,
  toFormationProgress,
} from './formationTimeline'
import { loadUniverseScene } from './loadUniverseScene'
import { resolveOrbitRadius, toOrbitElements } from './orbitalMechanics'
import { PlanetInformationCard } from './PlanetInformationCard'
import { UniverseFallback } from './UniverseFallback'
import type { ScenePlanet } from './universeRuntime'
import { placeInformationCard } from './usePlanetInteraction'
import type { CardSide } from './usePlanetInteraction'
import { usePlanetInteraction } from './usePlanetInteraction'
import { useUniverseLayout } from './useUniverseLayout'
import { detectWebGLSupport } from './webglSupport'
import './developerUniverse.css'

const UniverseScene = lazy(() =>
  loadUniverseScene().then((module) => ({ default: module.UniverseScene })),
)

/** Sun radius (CSS px) at which the overlay typography renders at scale 1. */
const SUN_TEXT_BASE_RADIUS = 110
const NAVBAR_CLEARANCE = 88
const EDGE_GAP = 16
const NO_INSETS = { top: 0, bottom: 0 }

export interface DeveloperUniverseProps {
  /** Smoothed section progress from useUniverseProgress (0 → 1). */
  progress: MotionValue<number>
  active?: boolean
  /** Accept planet input only while the Universe destination is active. */
  interactionEnabled?: boolean
  /** Reframing as surrounding overlays appear (0 → 1). */
  reframe?: MotionValue<number>
  /** Space taken by those overlays once fully visible, in CSS pixels. */
  insets?: { top: number; bottom: number }
  className?: string
}

interface FloatingCardTarget {
  x: MotionValue<number>
  y: MotionValue<number>
  width: number
  height: number
  side: CardSide | null
}

function resolveScenePlanets(layout: UniverseLayout): ScenePlanet[] {
  const visible = DEVELOPER_UNIVERSE_PLANETS.filter(
    (planet) => layout.tier !== 'compact' || planet.featured,
  )
  const formationOrder = [...visible].sort(
    (a, b) =>
      PLANET_FORMATION_ORDER.indexOf(a.id) -
      PLANET_FORMATION_ORDER.indexOf(b.id),
  )
  return visible.map((planet, orbitIndex) => ({
    planet,
    orbitIndex,
    orderIndex: formationOrder.indexOf(planet),
    size: planet.planetSize * layout.planetScale,
    elements: toOrbitElements(
      planet,
      resolveOrbitRadius(planet, layout.tier, orbitIndex, visible.length),
    ),
  }))
}

function relatedNamesOf(planet: TechnologyPlanet): string[] {
  return planet.relatedTechnologies
    .map((id) => DEVELOPER_UNIVERSE_PLANETS.find((item) => item.id === id))
    .filter((item): item is TechnologyPlanet => item !== undefined)
    .map((item) => item.name)
}

function FloatingCard({
  planet,
  onMount,
}: {
  planet: TechnologyPlanet
  onMount: (
    element: HTMLElement,
    x: MotionValue<number>,
    y: MotionValue<number>,
    planetId: string,
  ) => void
}) {
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const register = useCallback(
    (element: HTMLElement | null) => {
      if (element) onMount(element, x, y, planet.id)
    },
    [onMount, planet.id, x, y],
  )
  return (
    <PlanetInformationCard
      ref={register}
      planet={planet}
      relatedNames={relatedNamesOf(planet)}
      mode="floating"
      x={x}
      y={y}
    />
  )
}

/**
 * Developer Universe: the full-stack developer as a golden sun, with each
 * technology as a planet on its own orbit. Formation is driven entirely by
 * the section's scroll progress; once formed, planets can be explored by
 * hover (pointer), tap (touch) or keyboard as soon as each planet appears.
 */
export function DeveloperUniverse({
  progress,
  active = true,
  interactionEnabled = true,
  reframe,
  insets = NO_INSETS,
  className,
}: DeveloperUniverseProps) {
  const { t } = useTranslation()
  const reducedMotion = useReducedMotion() === true
  const layout = useUniverseLayout()
  const scenePlanets = useMemo(() => resolveScenePlanets(layout), [layout])
  const [webglAvailable, setWebglAvailable] = useState(detectWebGLSupport)
  const [sceneMounted, setSceneMounted] = useState(active)
  const [sceneReady, setSceneReady] = useState(false)
  const [cardHasAnchor, setCardHasAnchor] = useState(false)
  const [hoverAnchor, setHoverAnchor] = useState<{
    id: string
    anchor: ScreenCircle
  } | null>(null)
  const fallbackReframe = useMotionValue(0)
  const reframeValue = reframe ?? fallbackReframe

  const formation = useTransform(progress, toFormationProgress)
  const nebulaOpacity = useTransform(formation, (f) => getSunState(f).halo)
  // The first golden light, bleeding in from the east before the sun appears.
  const dawnOpacity = useTransform(formation, (f) => {
    const sun = getSunState(f)
    return sun.light * (1 - sun.travel)
  })
  const hintOpacity = useTransform(progress, getScrollHintOpacity)
  const hintY = useTransform(progress, getScrollHintY)
  const sunText = useTransform(formation, (f) => getSunState(f).text)
  const sunTextBlur = useTransform(sunText, (v) => `blur(${(1 - v) * 8}px)`)
  const sunTextLift = useTransform(sunText, (v) => (1 - v) * 10)
  const sunX = useMotionValue(-9999)
  const sunY = useMotionValue(-9999)
  const sunScale = useMotionValue(1)

  // Input is available as soon as the destination is active. Planet hit
  // meshes appear with each planet, so partial formation never disables a
  // planet that is already visible.
  const interactive = interactionEnabled
  const interaction = usePlanetInteraction(interactive)
  const setHoveredPlanet = interaction.hover
  const clearPlanetInteraction = interaction.clear
  const hoverAnchorRef = useRef<{ id: string; anchor: ScreenCircle } | null>(
    null,
  )
  const handlePlanetHover = useCallback(
    (id: string | null, anchor?: ScreenCircle, leavingId?: string) => {
      if (!id) {
        // R3F can dispatch a departed planet's pointer-out after the next
        // planet's pointer-over. Ignore that stale leave so it cannot erase
        // the new hover target or briefly replace its card with a blocking
        // sheet.
        if (
          leavingId &&
          hoverAnchorRef.current &&
          hoverAnchorRef.current.id !== leavingId
        ) {
          return
        }
        hoverAnchorRef.current = null
        setHoverAnchor(null)
        setHoveredPlanet(null)
        return
      }

      hoverAnchorRef.current = anchor ? { id, anchor } : null
      setHoverAnchor(hoverAnchorRef.current)
      setHoveredPlanet(id)
    },
    [setHoveredPlanet],
  )
  const clearInteraction = useCallback(() => {
    hoverAnchorRef.current = null
    setHoverAnchor(null)
    clearPlanetInteraction()
  }, [clearPlanetInteraction])
  useEffect(() => {
    if (!interactionEnabled) clearInteraction()
  }, [clearInteraction, interactionEnabled])
  const activePlanet = useMemo(
    () =>
      DEVELOPER_UNIVERSE_PLANETS.find(
        (planet) => planet.id === interaction.activeId,
      ) ?? null,
    [interaction.activeId],
  )
  const cardMode = layout.tier === 'compact' ? 'sheet' : 'floating'

  const lastFrameRef = useRef<UniverseFrame | null>(null)
  const cardTargetRef = useRef<FloatingCardTarget | null>(null)
  const insetsRef = useRef(insets)
  useEffect(() => {
    insetsRef.current = insets
  }, [insets])

  const positionCardAt = useCallback(
    (
      anchor: ScreenCircle,
      sun: ScreenCircle,
      viewport: { width: number; height: number },
    ) => {
      const target = cardTargetRef.current
      if (!target || target.width === 0) return
      const shift = reframeValue.get()
      const placement = placeInformationCard({
        anchor,
        sun,
        card: { width: target.width, height: target.height },
        viewport,
        insets: {
          top: Math.max(NAVBAR_CLEARANCE, insetsRef.current.top * shift),
          right: EDGE_GAP,
          bottom: EDGE_GAP + insetsRef.current.bottom * shift,
          left: EDGE_GAP,
        },
        previous: target.side,
      })
      target.side = placement.side
      target.x.set(placement.x)
      target.y.set(placement.y)
    },
    [reframeValue],
  )
  const positionCard = useCallback(
    (frame: UniverseFrame, anchor = frame.planet) => {
      if (!anchor) return
      positionCardAt(anchor, frame.sun, {
        width: frame.width,
        height: frame.height,
      })
    },
    [positionCardAt],
  )
  const positionFallbackCard = useCallback(
    (anchor: ScreenCircle) => {
      const frame = lastFrameRef.current
      const width = frame?.width || window.innerWidth
      const height = frame?.height || window.innerHeight
      const sun = frame?.sun ?? {
        x: width / 2,
        y: height / 2,
        r: Math.min(width, height) * 0.14,
      }
      positionCardAt(anchor, sun, { width, height })
    },
    [positionCardAt],
  )

  const handleFrame = useCallback(
    (frame: UniverseFrame) => {
      lastFrameRef.current = frame
      setCardHasAnchor((current) => {
        const next = frame.planet !== null
        return current === next ? current : next
      })
      sunX.set(frame.sun.x)
      sunY.set(frame.sun.y)
      sunScale.set(Math.max(frame.sun.r, 1) / SUN_TEXT_BASE_RADIUS)
      positionCard(frame)
    },
    [positionCard, sunScale, sunX, sunY],
  )

  const handleCardMount = useCallback(
    (
      element: HTMLElement,
      x: MotionValue<number>,
      y: MotionValue<number>,
      planetId: string,
    ) => {
      cardTargetRef.current = {
        x,
        y,
        width: element.offsetWidth,
        height: element.offsetHeight,
        side: null,
      }
      // Place the card before its first paint.
      const frame = lastFrameRef.current
      const hover = hoverAnchorRef.current
      if (frame) {
        positionCard(
          frame,
          hover?.id === planetId ? hover.anchor : (frame.planet ?? undefined),
        )
      } else if (hover?.id === planetId) {
        positionFallbackCard(hover.anchor)
      }
    },
    [positionCard, positionFallbackCard],
  )

  const handleSceneReady = useCallback(() => setSceneReady(true), [])
  const handleContextLost = useCallback(() => {
    setWebglAvailable(false)
    setSceneReady(false)
    setCardHasAnchor(false)
  }, [])

  useEffect(() => {
    if (!active || sceneMounted) return
    const frame = window.requestAnimationFrame(() => setSceneMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [active, sceneMounted])

  return (
    <div
      className={cn('developer-universe', className)}
      role="group"
      aria-label={t.universe.sceneLabel}
      aria-hidden={!interactionEnabled}
      inert={!interactionEnabled}
      data-interactive={interactive}
      style={{ pointerEvents: interactionEnabled ? 'auto' : 'none' }}
    >
      <div className="developer-universe__space" aria-hidden="true" />
      <motion.div
        className="developer-universe__nebula"
        style={{ opacity: nebulaOpacity }}
        aria-hidden="true"
      />
      <motion.div
        className="developer-universe__dawn"
        style={{ opacity: dawnOpacity }}
        aria-hidden="true"
      />

      {sceneMounted && webglAvailable && (
        <Suspense fallback={null}>
          <UniverseScene
            active={active}
            planets={scenePlanets}
            layout={layout}
            formation={formation}
            reframe={reframeValue}
            insets={insets}
            reducedMotion={reducedMotion}
            activeId={interaction.activeId}
            interactive={interactive}
            onHover={handlePlanetHover}
            onSelect={interaction.select}
            onMiss={clearInteraction}
            onFrame={handleFrame}
            onContextLost={handleContextLost}
            onReady={handleSceneReady}
          />
        </Suspense>
      )}

      {active && sceneMounted && (!webglAvailable || !sceneReady) && (
        <UniverseFallback
          planets={scenePlanets.map((item) => item.planet)}
          formation={formation}
          activeId={interaction.activeId}
          onSelect={interaction.select}
          onHover={handlePlanetHover}
          interactionEnabled={interactionEnabled}
          loading={webglAvailable && !sceneReady}
        />
      )}

      {webglAvailable && (
        <motion.div
          className="developer-universe__sun-anchor"
          style={{ x: sunX, y: sunY, scale: sunScale }}
          aria-hidden="true"
        >
          <motion.p
            className="developer-universe__sun-text"
            style={{ opacity: sunText, filter: sunTextBlur, y: sunTextLift }}
          >
            <span>{t.universe.sunLineOne}</span>
            <span>{t.universe.sunLineTwo}</span>
          </motion.p>
        </motion.div>
      )}

      {!reducedMotion && (
        <motion.p
          className="developer-universe__hint"
          style={{ opacity: hintOpacity, y: hintY }}
          aria-hidden="true"
        >
          <ChevronsDown className="h-4 w-4" aria-hidden="true" />
          {t.universe.scrollHint}
        </motion.p>
      )}

      {interactive && webglAvailable && sceneReady && (
        <ul className="sr-only" aria-label={t.universe.technologyListLabel}>
          {scenePlanets.map(({ planet }) => (
            <li key={planet.id}>
              <button
                type="button"
                onFocus={() => interaction.focus(planet.id)}
                onClick={() => interaction.focus(planet.id)}
                onBlur={clearInteraction}
              >
                {planet.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="developer-universe__card-layer" aria-live="polite">
        <AnimatePresence>
          {activePlanet &&
            (cardMode === 'floating' &&
            (hoverAnchor?.id === interaction.activeId ||
              (webglAvailable && sceneReady && cardHasAnchor)) ? (
              <FloatingCard
                key={activePlanet.id}
                planet={activePlanet}
                onMount={handleCardMount}
              />
            ) : (
              <PlanetInformationCard
                key={activePlanet.id}
                planet={activePlanet}
                relatedNames={relatedNamesOf(activePlanet)}
                mode="sheet"
                onClose={clearInteraction}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
