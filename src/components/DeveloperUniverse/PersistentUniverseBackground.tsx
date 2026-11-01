import type { MotionValue } from 'motion/react'
import { useDocumentVisibility } from '@/hooks/use-document-visibility'
import { DeveloperUniverse } from './DeveloperUniverse'
import './persistentUniverseBackground.css'

export interface PersistentUniverseBackgroundProps {
  progress: MotionValue<number>
  entered: boolean
  activeSection: string
}

/** One long-lived universe canvas behind all sections after the Hero. */
export function PersistentUniverseBackground({
  progress,
  entered,
  activeSection,
}: PersistentUniverseBackgroundProps) {
  const visible = useDocumentVisibility()
  const withinUniverseJourney =
    activeSection === 'home' || activeSection === 'universe'
  const interactiveSection = entered && withinUniverseJourney && visible

  return (
    <div
      className="persistent-universe-background"
      data-entered={entered}
      data-section={activeSection}
      data-interactive={interactiveSection}
      aria-hidden={!interactiveSection}
    >
      <DeveloperUniverse
        progress={progress}
        active={entered && visible}
        interactionEnabled={interactiveSection}
      />
      <div
        className="persistent-universe-background__shade"
        aria-hidden="true"
      />
    </div>
  )
}
