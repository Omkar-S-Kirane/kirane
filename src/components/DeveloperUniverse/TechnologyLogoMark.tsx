import {
  LOGO_CUTOUT_COLOURS,
  LOGO_VIEWBOX_SIZE,
  TECHNOLOGY_LOGOS,
  getOuterSilhouette,
} from './technologyLogos'
import type { TechnologyLogoId } from './technologyLogos'

interface TechnologyLogoMarkProps {
  logo: TechnologyLogoId
  colour: string
  className?: string
}

/** The technology mark as inline SVG (decorative; the name is shown as text). */
export function TechnologyLogoMark({
  logo,
  colour,
  className,
}: TechnologyLogoMarkProps) {
  const definition = TECHNOLOGY_LOGOS[logo]
  const cutout = LOGO_CUTOUT_COLOURS[logo]

  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX_SIZE} ${LOGO_VIEWBOX_SIZE}`}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {definition.kind === 'path' ? (
        <>
          {cutout && (
            <path d={getOuterSilhouette(definition.path)} fill={cutout} />
          )}
          <path d={definition.path} fill={colour} />
        </>
      ) : (
        <text
          x="12"
          y="12.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colour}
          fontSize={definition.text.length > 2 ? 9.5 : 11}
          fontWeight={700}
          fontFamily="'Space Grotesk', system-ui, sans-serif"
        >
          {definition.text}
        </text>
      )}
    </svg>
  )
}
