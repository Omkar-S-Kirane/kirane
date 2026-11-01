import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
} from 'three'
import {
  LOGO_CUTOUT_COLOURS,
  LOGO_VIEWBOX_SIZE,
  TECHNOLOGY_LOGOS,
  getOuterSilhouette,
} from './technologyLogos'
import type { TechnologyLogoId } from './technologyLogos'

const LOGO_TEXTURE_SIZE = 256
/** Share of the texture the mark occupies; the rest is padding for the glow. */
const LOGO_COVERAGE = 0.7

function createCanvas(size: number): {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')
  return { canvas, context }
}

/** Soft radial glow used for halos, planet glows and the sun's first light. */
export function createGlowTexture(): CanvasTexture {
  const size = 128
  const { canvas, context } = createCanvas(size)
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.18, 'rgba(255,255,255,0.62)')
  gradient.addColorStop(0.42, 'rgba(255,255,255,0.2)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.05)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function drawLogo(
  context: CanvasRenderingContext2D,
  id: TechnologyLogoId,
  colour: string,
) {
  const size = LOGO_TEXTURE_SIZE
  const logo = TECHNOLOGY_LOGOS[id]
  context.clearRect(0, 0, size, size)
  context.save()
  // A soft dark halo keeps the mark legible over bright planet surfaces.
  context.shadowColor = 'rgba(0, 0, 0, 0.55)'
  context.shadowBlur = size * 0.04

  if (logo.kind === 'path') {
    const scale = (size * LOGO_COVERAGE) / LOGO_VIEWBOX_SIZE
    const offset = (size * (1 - LOGO_COVERAGE)) / 2
    context.translate(offset, offset)
    context.scale(scale, scale)
    const cutout = LOGO_CUTOUT_COLOURS[id]
    if (cutout) {
      context.fillStyle = cutout
      context.fill(new Path2D(getOuterSilhouette(logo.path)))
      context.shadowColor = 'transparent'
    }
    context.fillStyle = colour
    context.fill(new Path2D(logo.path))
  } else {
    const fontSize = logo.text.length > 2 ? size * 0.36 : size * 0.42
    context.fillStyle = colour
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${fontSize}px "Space Grotesk", system-ui, sans-serif`
    context.fillText(logo.text, size / 2, size / 2 + fontSize * 0.04)
  }
  context.restore()
}

export interface LogoTexture {
  texture: CanvasTexture
  /** Redraws the mark, e.g. once the wordmark font has loaded. */
  redraw: () => void
}

/** A transparent texture with the technology mark in its brand colour. */
export function createLogoTexture(
  id: TechnologyLogoId,
  colour: string,
): LogoTexture {
  const { canvas, context } = createCanvas(LOGO_TEXTURE_SIZE)
  drawLogo(context, id, colour)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.anisotropy = 4
  return {
    texture,
    redraw: () => {
      drawLogo(context, id, colour)
      texture.needsUpdate = true
    },
  }
}
