export type HeroVideoKind = 'desktop' | 'mobile'

const DESKTOP_ASPECT_RATIO = 16 / 9
const MOBILE_ASPECT_RATIO = 9 / 16
const COMPOSITION_CROSSOVER = Math.sqrt(
  DESKTOP_ASPECT_RATIO * MOBILE_ASPECT_RATIO,
)
const SOURCE_HYSTERESIS = 0.05

/**
 * Picks the composition that loses the least image area under `object-fit:
 * cover`. The 5% hysteresis prevents a nearly square tablet/window from
 * repeatedly reloading the video while its dimensions fluctuate.
 */
export function selectHeroVideo(
  width: number,
  height: number,
  current?: HeroVideoKind,
): HeroVideoKind {
  if (!(width > 0 && height > 0)) return current ?? 'desktop'

  const viewportAspectRatio = width / height
  if (current === 'mobile' && viewportAspectRatio <= 1 + SOURCE_HYSTERESIS) {
    return 'mobile'
  }
  if (current === 'desktop' && viewportAspectRatio >= 1 - SOURCE_HYSTERESIS) {
    return 'desktop'
  }

  return viewportAspectRatio <= COMPOSITION_CROSSOVER ? 'mobile' : 'desktop'
}
