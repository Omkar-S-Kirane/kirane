import { useCallback } from 'react'
import {
  CINEMATIC_STAGE_IDS,
  useCinematicNavigation,
  type CinematicStageId,
} from './use-cinematic-navigation'

export const PAGE_SECTION_IDS = CINEMATIC_STAGE_IDS
export type PageSectionId = CinematicStageId

/** Compatibility adapter for callers migrating to the fixed-stage controller. */
export function useSectionNavigation(initialSection?: PageSectionId) {
  const { activeStage, navigateTo: navigateStage } = useCinematicNavigation(
    { current: null },
    initialSection,
  )
  const navigateTo = useCallback(
    (id: string) => {
      if (PAGE_SECTION_IDS.includes(id as PageSectionId)) {
        navigateStage(id as PageSectionId)
      }
    },
    [navigateStage],
  )

  return { activeId: activeStage, navigateTo }
}
