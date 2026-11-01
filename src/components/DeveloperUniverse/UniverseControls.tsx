import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { MotionValue } from 'motion/react'
import { useUniverseRuntime } from './universeRuntime'

interface UniverseControlsProps {
  /** Largest distance from the sun the composition must keep in view. */
  systemRadius: number
  /** 0 → 1 as the Impact heading and metrics appear around the scene. */
  reframe: MotionValue<number>
  /** Space reserved by those overlays once fully visible, in CSS pixels. */
  insets: { top: number; bottom: number }
  /** Pointer parallax is enabled only on the Universe destination. */
  interactive: boolean
}

const DEG = Math.PI / 180
const PARALLAX_YAW = 0.065
const PARALLAX_PITCH = 0.035
const DRAG_THRESHOLD_PX = 6
const MAX_EXTRA_PITCH = 0.32
const MIN_EXTRA_PITCH = -0.14

/**
 * Camera rig: frames the whole system for the current viewport, adds a
 * subtle pointer parallax and an optional drag-to-rotate. The camera always
 * orbits the sun, so the central sphere stays steady while the planets shift
 * in depth.
 */
export function UniverseControls({
  systemRadius,
  reframe,
  insets,
  interactive,
}: UniverseControlsProps) {
  const runtimeRef = useUniverseRuntime()
  const gl = useThree((state) => state.gl)
  const targetRef = useRef(new Vector3())
  const pointer = useRef({ x: 0, y: 0 })
  const rig = useRef({
    yaw: 0,
    pitch: Number.NaN,
    dragYaw: 0,
    dragPitch: 0,
    velocity: 0,
  })
  const insetsRef = useRef(insets)

  useEffect(() => {
    insetsRef.current = insets
  }, [insets])

  // Pointer parallax follows the cursor anywhere on the page.
  useEffect(() => {
    const { reducedMotion, layout } = runtimeRef.current
    if (!interactive || reducedMotion || layout.coarsePointer) return
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive, runtimeRef])

  // Drag to rotate. Touch drags only rotate horizontally, because vertical
  // swipes drive the scroll-based formation.
  useEffect(() => {
    const element = gl.domElement
    const runtimeAtMount = runtimeRef.current
    let start: { x: number; y: number; type: string } | null = null
    let last = { x: 0, y: 0, time: 0 }

    const onDown = (event: PointerEvent) => {
      if (!runtimeRef.current.interactive || event.button > 0) return
      start = { x: event.clientX, y: event.clientY, type: event.pointerType }
      last = { x: event.clientX, y: event.clientY, time: performance.now() }
      rig.current.velocity = 0
    }
    const onMove = (event: PointerEvent) => {
      if (!start) return
      const runtime = runtimeRef.current
      const dx = event.clientX - start.x
      const dy = event.clientY - start.y
      if (!runtime.dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        if (start.type !== 'mouse' && Math.abs(dy) > Math.abs(dx)) {
          start = null
          return
        }
        runtime.dragging = true
      }
      const now = performance.now()
      const stepX = event.clientX - last.x
      const yawStep = stepX * 0.0045
      rig.current.dragYaw += yawStep
      if (start.type === 'mouse') {
        rig.current.dragPitch = MathUtils.clamp(
          rig.current.dragPitch + (event.clientY - last.y) * 0.0025,
          MIN_EXTRA_PITCH,
          MAX_EXTRA_PITCH,
        )
      }
      rig.current.velocity =
        yawStep / Math.max((now - last.time) / 1000, 1 / 120)
      last = { x: event.clientX, y: event.clientY, time: now }
    }
    const onUp = () => {
      const runtime = runtimeRef.current
      if (runtime.dragging) runtime.lastDragEndedAt = performance.now()
      runtime.dragging = false
      start = null
    }

    element.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      element.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      runtimeAtMount.dragging = false
    }
  }, [gl, runtimeRef])

  useFrame((frameState, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const runtime = runtimeRef.current
    const { layout } = runtime
    const { size } = frameState
    const camera = frameState.camera as PerspectiveCamera
    if (camera.fov !== layout.fov) {
      camera.fov = layout.fov
      camera.updateProjectionMatrix()
    }
    const target = targetRef.current
    const aspect = size.width / Math.max(size.height, 1)
    const tanHalf = Math.tan((layout.fov * DEG) / 2)

    // Fit the outermost orbit horizontally and the tilted system vertically.
    const halfWidthNeeded = systemRadius / layout.fitFactor
    const distanceForWidth = halfWidthNeeded / (tanHalf * aspect)
    const verticalExtent = Math.max(
      layout.sunRadius * 1.8,
      systemRadius * Math.sin(layout.elevation * DEG + 12 * DEG),
    )
    const distanceForHeight = verticalExtent / (tanHalf * 0.86)
    const shift = reframe.get()
    const distance =
      Math.max(distanceForWidth, distanceForHeight) * (1 + 0.12 * shift)

    // Centre the system in the band left free by the heading and metrics.
    const worldPerPixel = (2 * distance * tanHalf) / Math.max(size.height, 1)
    const offsetPixels =
      ((insetsRef.current.top - insetsRef.current.bottom) / 2) * shift
    target.set(0, offsetPixels * worldPerPixel, 0)

    const state = rig.current
    if (Number.isNaN(state.pitch)) state.pitch = layout.elevation * DEG
    if (!runtime.dragging && !runtime.reducedMotion) {
      state.dragYaw += state.velocity * delta
      state.velocity = MathUtils.damp(state.velocity, 0, 3.5, delta)
    }
    const parallax = runtime.reducedMotion ? { x: 0, y: 0 } : pointer.current
    const yawTarget = state.dragYaw + parallax.x * PARALLAX_YAW
    const pitchTarget =
      layout.elevation * DEG + state.dragPitch + parallax.y * PARALLAX_PITCH
    state.yaw = MathUtils.damp(state.yaw, yawTarget, 3, delta)
    state.pitch = MathUtils.damp(state.pitch, pitchTarget, 3, delta)

    const horizontal = distance * Math.cos(state.pitch)
    camera.position.set(
      target.x + horizontal * Math.sin(state.yaw),
      target.y + distance * Math.sin(state.pitch),
      target.z + horizontal * Math.cos(state.yaw),
    )
    camera.lookAt(target)
    // Overlays and planet shaders project with this frame's camera.
    camera.updateMatrixWorld()

    runtime.cameraDistance = distance
    runtime.viewHalfHeight = distance * tanHalf
    runtime.viewHalfWidth = distance * tanHalf * aspect
  })

  return null
}
