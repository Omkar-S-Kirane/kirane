import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { cn } from '@/lib/cn'
import type {
  VengeanceInteractiveParticlesTextProps,
  TrailPoint,
  ParticleSampleData,
} from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRAME_INTERVAL = 33.333
const TOUCH_CANVAS_SIZE = 64
const TOUCH_MAX_AGE = 120
const TOUCH_TRAIL_MAX = 100
const PIXEL_THRESHOLD = 128
const CAMERA_FOV = 50
const INTRO_DURATION_SIZE = 1000
const INTRO_DURATION_DEPTH = 1500

const DEFAULTS = {
  fontSize: 160,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  color: '#fafaf9',
  background: 'transparent',
  fontWeight: 600,
  letterSpacing: 0,
  particleSize: 1.5,
  particleDensity: 1,
  depth: 4,
  randomness: 2,
  speed: 0.4,
  interactionRadius: 120,
  interactionStrength: 1,
  returnSpeed: 0.08,
  animated: true,
  reducedMotionFallback: 'static' as const,
} as const

// ---------------------------------------------------------------------------
// GLSL — Vertex shader
// ---------------------------------------------------------------------------

const VERTEX_SHADER = /* glsl */ `
precision highp float;

attribute float pindex;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute float angle;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform float uPointer;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;

varying float vPsize;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float random(float n) {
  return fract(sin(n + 1.0) * 43758.5453123);
}

void main() {
  vUv = uv;
  vec2 puv = offset.xy / uTextureSize + 0.5;
  vec4 colA = texture2D(uTexture, puv);
  float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
  vec3 displaced = offset;
  displaced.xy += vec2(random(pindex) - 0.5, random(pindex + 1.0) - 0.5) * uRandom;
  float t = uTime;
  displaced.z += snoise(vec2(displaced.x * 0.05, displaced.y * 0.05) + t) * uDepth;
  displaced.x += snoise(vec2(displaced.y * 0.1, pindex * 0.002) + t) * 0.5;
  displaced.y += snoise(vec2(displaced.x * 0.1, pindex * 0.002) + t) * 0.5;
  float touch = texture2D(uTouch, puv).r;
  displaced.z += touch * 20.0 * uPointer;
  displaced.x += touch * 10.0 * (random(pindex) - 0.5) * uPointer;
  displaced.y += touch * 10.0 * (random(pindex) - 0.5) * uPointer;
  float psize = (snoise(vec2(pindex * 0.5, pindex * 0.5) + t) + 2.0) * 0.5;
  psize *= max(grey, 0.2);
  psize *= uSize;
  vec2 rUv = position.xy * psize * uSize;
  float c = cos(angle);
  float s = sin(angle);
  mat2 rot = mat2(c, -s, s, c);
  rUv = rot * rUv;
  displaced.xy += rUv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  vPsize = psize;
  vUv = uv;
}
`

// ---------------------------------------------------------------------------
// GLSL — Fragment shader
// ---------------------------------------------------------------------------

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vPsize;
varying vec2 vUv;
void main() {
  vec2 cxy = 2.0 * vUv - 1.0;
  float dist = length(cxy);
  if (dist > 1.0) discard;
  float alpha = 1.0 - smoothstep(0.3, 1.0, dist);
  alpha *= min(1.0, vPsize * 1.5);
  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(uColor, alpha);
}
`

// ---------------------------------------------------------------------------
// TouchTexture
// ---------------------------------------------------------------------------

class TouchTexture {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private trail: TrailPoint[] = []
  texture: THREE.CanvasTexture
  private radius: number

  constructor(interactionRadius: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = TOUCH_CANVAS_SIZE
    this.canvas.height = TOUCH_CANVAS_SIZE
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('TouchTexture: 2D context unavailable')
    this.ctx = ctx
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.radius = Math.max(
      0.05,
      Math.min(0.5, 0.15 * (interactionRadius / 120)),
    )
  }

  addTouch(point: { x: number; y: number; force?: number }) {
    this.trail.push({ x: point.x, y: point.y, age: 0, force: point.force ?? 1 })
    if (this.trail.length > TOUCH_TRAIL_MAX) this.trail.shift()
  }

  update() {
    this.clear()
    for (const pt of this.trail) {
      pt.age += 1
      if (pt.age <= TOUCH_MAX_AGE) this.drawPoint(pt)
    }
    this.trail = this.trail.filter((p) => p.age < TOUCH_MAX_AGE)
    this.texture.needsUpdate = true
  }

  private clear() {
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, TOUCH_CANVAS_SIZE, TOUCH_CANVAS_SIZE)
  }

  private drawPoint(pt: TrailPoint) {
    const size = TOUCH_CANVAS_SIZE
    const px = pt.x * size
    const py = (1 - pt.y) * size
    const intensity = 1 - pt.age / TOUCH_MAX_AGE
    const radius = this.radius * size * intensity * pt.force
    const grad = this.ctx.createRadialGradient(
      px,
      py,
      radius * 0.25,
      px,
      py,
      radius,
    )
    grad.addColorStop(0, `rgba(255,255,255,${0.35 * intensity})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    this.ctx.beginPath()
    this.ctx.fillStyle = grad
    this.ctx.arc(px, py, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  dispose() {
    this.texture.dispose()
  }
}

// ---------------------------------------------------------------------------
// Text → particle sampling
// ---------------------------------------------------------------------------

function sampleText(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: number | string = 600,
  letterSpacing: number = 0,
  particleDensity: number = 1,
): ParticleSampleData & { canvas: HTMLCanvasElement } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const empty = {
    offsets: new Float32Array(0),
    brightness: new Float32Array(0),
    count: 0,
    textureWidth: 1,
    textureHeight: 1,
    canvas,
  }
  if (!ctx || typeof ctx.measureText !== 'function') return empty

  const lines = text.split('\n')
  const lineHeight = fontSize * 1.2
  const padding = fontSize * 0.2

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`
  let maxWidth = 0
  for (const line of lines) {
    const w = ctx.measureText(line).width
    if (w > maxWidth) maxWidth = w
  }

  const textureWidth = Math.ceil(maxWidth + padding * 2)
  const textureHeight = Math.ceil(lines.length * lineHeight + padding * 2)
  canvas.width = textureWidth
  canvas.height = textureHeight

  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, textureWidth, textureHeight)
  ctx.fillStyle = 'white'
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  if (letterSpacing) ctx.letterSpacing = `${letterSpacing}px`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(
      lines[i],
      textureWidth / 2,
      padding + lineHeight * i + lineHeight / 2,
    )
  }

  const imageData = ctx.getImageData(0, 0, textureWidth, textureHeight)
  const data = imageData.data
  const numPixels = textureWidth * textureHeight

  let count = 0
  for (let i = 0; i < numPixels; i += 1) {
    if (data[i * 4] > PIXEL_THRESHOLD) count += 1
  }

  if (count === 0) return { ...empty, textureWidth, textureHeight, canvas }

  const density = Math.max(0.05, Math.min(1, particleDensity))
  const step = Math.max(1, Math.floor(1 / density))

  const offsets = new Float32Array(count * 3)
  const brightness = new Float32Array(count)
  let idx = 0

  for (let i = 0; i < numPixels; i += step) {
    const px = data[i * 4]
    if (px <= PIXEL_THRESHOLD) continue
    const ix = i % textureWidth
    const iy = Math.floor(i / textureWidth)
    offsets[idx * 3] = ix - textureWidth / 2
    offsets[idx * 3 + 1] = textureHeight / 2 - iy
    offsets[idx * 3 + 2] = 0
    brightness[idx] = px / 255
    idx += 1
  }

  const trimmedOffsets = new Float32Array(idx * 3)
  const trimmedBrightness = new Float32Array(idx)
  trimmedOffsets.set(offsets.subarray(0, idx * 3))
  trimmedBrightness.set(brightness.subarray(0, idx))

  return {
    offsets: trimmedOffsets,
    brightness: trimmedBrightness,
    count: idx,
    textureWidth,
    textureHeight,
    canvas,
  }
}

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------

function easeIn(t: number): number {
  return t * t
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

function parseColor(css: string): THREE.Color {
  return new THREE.Color(css)
}

// ---------------------------------------------------------------------------
// VengeanceInteractiveParticlesText
// ---------------------------------------------------------------------------

export function VengeanceInteractiveParticlesText({
  text,
  fontSize = DEFAULTS.fontSize,
  fontFamily = DEFAULTS.fontFamily,
  color = DEFAULTS.color,
  background = DEFAULTS.background,
  className,
  fontWeight = DEFAULTS.fontWeight,
  letterSpacing = DEFAULTS.letterSpacing,
  particleSize = DEFAULTS.particleSize,
  particleDensity = DEFAULTS.particleDensity,
  depth = DEFAULTS.depth,
  randomness = DEFAULTS.randomness,
  speed = DEFAULTS.speed,
  interactionRadius = DEFAULTS.interactionRadius,
  interactionStrength = DEFAULTS.interactionStrength,
  returnSpeed = DEFAULTS.returnSpeed,
  animated = DEFAULTS.animated,
  reducedMotionFallback = DEFAULTS.reducedMotionFallback,
  ariaLabel,
  onReady,
}: VengeanceInteractiveParticlesTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion() === true
  const [renderMode, setRenderMode] = useState<
    'webgl' | 'failed' | 'text-only'
  >('text-only')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Plain-text fallback — skip WebGL entirely
    if (reducedMotionFallback === 'plain-text') {
      setRenderMode('text-only')
      onReady?.()
      return
    }

    // ---- Renderer ---------------------------------------------------------
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    } catch {
      setRenderMode('text-only')
      onReady?.()
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const rect = container.getBoundingClientRect()

    if (rect.width === 0) {
      renderer.dispose()
      setRenderMode('text-only')
      onReady?.()
      return
    }

    renderer.domElement.style.display = 'block'
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)

    // ---- Auto-compute fontSize ------------------------------------------
    let computedFontSize = fontSize
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')
    if (measureCtx && rect.width > 0) {
      const refSize = 100
      const lines = text.split('\n')
      measureCtx.font = `${fontWeight} ${refSize}px ${fontFamily}`
      if (letterSpacing) measureCtx.letterSpacing = `${letterSpacing}px`
      let maxLineWidth = 0
      for (const line of lines) {
        const w = measureCtx.measureText(line).width
        if (w > maxLineWidth) maxLineWidth = w
      }
      if (maxLineWidth > 0) {
        const targetWidth = rect.width * 0.85
        computedFontSize = Math.round((targetWidth / maxLineWidth) * refSize)
        computedFontSize = Math.max(40, Math.min(computedFontSize, 600))
      }
    }

    // ---- Scene & camera -------------------------------------------------
    const scene = new THREE.Scene()
    const aspect = rect.width / rect.height
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 1, 10000)

    // ---- Sample text ----------------------------------------------------
    const sample = sampleText(
      text,
      computedFontSize,
      fontFamily,
      fontWeight,
      letterSpacing,
      particleDensity,
    )
    if (sample.count === 0) {
      renderer.dispose()
      setRenderMode('text-only')
      onReady?.()
      return
    }

    // ---- Canvas dimensions ----------------------------------------------
    // The container collapses to ~1px height because the canvas is absolutely
    // positioned (removed from document flow). Compute canvas height from the
    // sampled text's aspect ratio so the particle field always has proper
    // dimensions regardless of container flow height.
    const textAspect = sample.textureHeight / sample.textureWidth
    const canvasWidth = Math.max(1, rect.width)
    const canvasHeight = Math.max(1, Math.round(canvasWidth * textAspect))

    renderer.domElement.style.width = `${canvasWidth}px`
    renderer.domElement.style.height = `${canvasHeight}px`
    renderer.setSize(canvasWidth, canvasHeight, false)
    camera.aspect = canvasWidth / canvasHeight
    camera.updateProjectionMatrix()

    const halfFov = (CAMERA_FOV * Math.PI) / 360
    const fitH = sample.textureHeight / (2 * Math.tan(halfFov))
    const fitW =
      sample.textureWidth /
      (2 * Math.tan(halfFov) * (canvasWidth / canvasHeight))
    camera.position.z = Math.max(fitH, fitW) * 1.1

    // ---- Textures -------------------------------------------------------
    const textTexture = new THREE.CanvasTexture(sample.canvas)
    textTexture.minFilter = THREE.LinearFilter
    textTexture.magFilter = THREE.LinearFilter
    const touch = new TouchTexture(interactionRadius)

    // ---- Geometry -------------------------------------------------------
    const baseGeo = new THREE.InstancedBufferGeometry()
    const positions = new Float32Array([
      -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0,
    ])
    baseGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1])
    baseGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    baseGeo.setIndex(
      new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1),
    )
    baseGeo.setAttribute(
      'offset',
      new THREE.InstancedBufferAttribute(sample.offsets, 3),
    )
    const pindices = new Float32Array(sample.count)
    const angles = new Float32Array(sample.count)
    for (let i = 0; i < sample.count; i += 1) {
      pindices[i] = i
      angles[i] = Math.random() * Math.PI
    }
    baseGeo.setAttribute(
      'pindex',
      new THREE.InstancedBufferAttribute(pindices, 1),
    )
    baseGeo.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1))

    // ---- Material -------------------------------------------------------
    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uRandom: { value: prefersReducedMotion ? randomness : 10 },
      uDepth: { value: prefersReducedMotion ? depth : 15 },
      uSize: { value: prefersReducedMotion ? particleSize : 0.8 },
      uPointer: { value: 0 },
      uTextureSize: {
        value: new THREE.Vector2(sample.textureWidth, sample.textureHeight),
      },
      uTexture: { value: textTexture },
      uTouch: { value: touch.texture },
      uColor: { value: parseColor(color) },
    }
    const material = new THREE.RawShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      depthTest: false,
      transparent: true,
    })

    // ---- Mesh -----------------------------------------------------------
    const mesh = new THREE.Mesh(baseGeo, material)
    scene.add(mesh)

    // ---- Hit plane ------------------------------------------------------
    const hitGeo = new THREE.PlaneGeometry(
      sample.textureWidth,
      sample.textureHeight,
    )
    const hitMat = new THREE.MeshBasicMaterial({ visible: false })
    const hitMesh = new THREE.Mesh(hitGeo, hitMat)
    scene.add(hitMesh)

    const raycaster = new THREE.Raycaster()
    const mouseNdc = new THREE.Vector2()

    // ---- Pointer state --------------------------------------------------
    let pointerTarget = 0
    let pointerCurrent = 0

    // ---- Event handlers -------------------------------------------------
    function onPointerMove(e: PointerEvent) {
      if (!animated || prefersReducedMotion) return
      const r = renderer.domElement.getBoundingClientRect()
      mouseNdc.x = ((e.clientX - r.left) / r.width) * 2 - 1
      mouseNdc.y = -((e.clientY - r.top) / r.height) * 2 + 1
      raycaster.setFromCamera(mouseNdc, camera)
      const hits = raycaster.intersectObject(hitMesh)
      if (hits.length > 0 && hits[0].uv) {
        pointerTarget = 1
        touch.addTouch({
          x: hits[0].uv.x,
          y: hits[0].uv.y,
          force: interactionStrength,
        })
      }
    }

    function onPointerLeave() {
      pointerTarget = 0
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave)

    container.style.position = 'relative'
    container.style.background = background

    // ---- Resize ---------------------------------------------------------
    function resize() {
      if (!container) return
      const r = container.getBoundingClientRect()
      if (r.width === 0) return
      const nextHeight = Math.max(1, Math.round(r.width * textAspect))
      renderer.domElement.style.width = `${r.width}px`
      renderer.domElement.style.height = `${nextHeight}px`
      renderer.setSize(r.width, nextHeight, false)
      camera.aspect = r.width / nextHeight
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(container)

    // ---- Animation loop -------------------------------------------------
    let rafId = 0
    let lastFrameTime = 0
    let introStart = 0
    let running = true

    function loop(time: number) {
      if (!running) return
      rafId = requestAnimationFrame(loop)
      if (time - lastFrameTime < FRAME_INTERVAL) return
      lastFrameTime = time

      if (introStart === 0) introStart = time

      if (animated && !prefersReducedMotion) {
        const pointerDiff = pointerTarget - pointerCurrent
        pointerCurrent += pointerDiff * returnSpeed
        if (Math.abs(pointerDiff) < 0.001) pointerCurrent = pointerTarget
        uniforms.uPointer.value = pointerCurrent

        const elapsed = time - introStart
        const sizeT = Math.min(1, elapsed / INTRO_DURATION_SIZE)
        uniforms.uSize.value = 0.8 + (particleSize - 0.8) * easeIn(sizeT)
        const randT = Math.min(1, elapsed / INTRO_DURATION_SIZE)
        uniforms.uRandom.value = 10 + (randomness - 10) * easeIn(randT)
        const depthT = Math.min(1, elapsed / INTRO_DURATION_DEPTH)
        uniforms.uDepth.value = 15 + (depth - 15) * easeInOut(depthT)
        uniforms.uTime.value += 0.05 * speed
      } else {
        uniforms.uPointer.value = 0
      }

      touch.update()
      renderer.render(scene, camera)
    }

    // ---- Visibility -----------------------------------------------------
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!running) {
            running = true
            rafId = requestAnimationFrame(loop)
          }
        } else {
          running = false
          cancelAnimationFrame(rafId)
        }
      },
      { threshold: 0.1 },
    )
    intersectionObserver.observe(container)

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(rafId)
      } else if (!running) {
        running = true
        lastFrameTime = performance.now()
        rafId = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // ---- Start ----------------------------------------------------------
    setRenderMode('webgl')

    if (prefersReducedMotion || !animated) {
      uniforms.uPointer.value = 0
      touch.update()
      renderer.render(scene, camera)
    } else {
      rafId = requestAnimationFrame(loop)
    }

    onReady?.()

    // ---- Cleanup --------------------------------------------------------
    return () => {
      running = false
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
      baseGeo.dispose()
      material.dispose()
      textTexture.dispose()
      touch.dispose()
      hitGeo.dispose()
      hitMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [
    prefersReducedMotion,
    text,
    fontSize,
    fontFamily,
    color,
    background,
    className,
    fontWeight,
    letterSpacing,
    particleSize,
    particleDensity,
    depth,
    randomness,
    speed,
    interactionRadius,
    interactionStrength,
    returnSpeed,
    animated,
    reducedMotionFallback,
    ariaLabel,
    onReady,
  ])

  const isWebglActive = renderMode === 'webgl'
  const showFallbackText = !isWebglActive

  const hiddenTextStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
    pointerEvents: 'none',
  }

  const fallbackTextStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight: fontWeight as never,
    letterSpacing: `${letterSpacing}px`,
    fontFamily,
    color,
    lineHeight: '1.2',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    display: 'block',
    pointerEvents: 'none',
  }

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-auto relative', className)}
      style={{ background }}
    >
      <span
        style={hiddenTextStyle}
        aria-hidden={showFallbackText ? 'true' : undefined}
      >
        {text}
      </span>
      {showFallbackText && <span style={fallbackTextStyle}>{text}</span>}
    </div>
  )
}

/* 

USE :-> 
          
<VengeanceInteractiveParticlesText
    text={t.hero.heading}
    fontSize={98}
    fontWeight={600}
    animated={!prefersReducedMotion}
    interactionRadius={100}
/>

*/
