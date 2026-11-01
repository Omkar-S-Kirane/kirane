import { useCallback, useEffect, useState } from 'react'

export const PAGE_SECTION_IDS = [
  'home',
  'impact',
  'work',
  'experience',
  'skills',
  'contact',
] as const

export type PageSectionId = (typeof PAGE_SECTION_IDS)[number]

function sectionFromHash(): PageSectionId {
  const id = window.location.hash.slice(1)
  return PAGE_SECTION_IDS.includes(id as PageSectionId)
    ? (id as PageSectionId)
    : 'home'
}

function updateHash(id: PageSectionId, replace = false) {
  const url = new URL(window.location.href)
  url.hash = id === 'home' ? '' : id
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url)
}

export function useSectionNavigation(initialSection?: PageSectionId) {
  const [activeId, setActiveId] = useState<PageSectionId>(
    () => initialSection ?? sectionFromHash(),
  )

  useEffect(() => {
    if (!initialSection) return
    updateHash(initialSection, true)
    document.getElementById(initialSection)?.scrollIntoView?.({
      behavior: 'instant',
      block: 'start',
    })
  }, [initialSection])

  useEffect(() => {
    const ids = PAGE_SECTION_IDS
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)
    if (sections.length === 0 || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          )[0]
        if (!current) return
        const id = current.target.id as PageSectionId
        setActiveId(id)
        updateHash(id, true)
      },
      { rootMargin: '-18% 0px -72% 0px', threshold: 0 },
    )

    for (const section of sections) observer.observe(section)

    const onPopState = () => {
      const id = sectionFromHash()
      setActiveId(id)
      document.getElementById(id)?.scrollIntoView?.({
        behavior: 'instant',
        block: 'start',
      })
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onPopState)
    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onPopState)
    }
  }, [])

  const navigateTo = useCallback((id: string) => {
    if (!PAGE_SECTION_IDS.includes(id as PageSectionId)) return
    const section = document.getElementById(id)
    if (!section) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 'instant'
      : 'smooth'
    section.scrollIntoView?.({ behavior, block: 'start' })
    updateHash(id as PageSectionId)
    setActiveId(id as PageSectionId)
  }, [])

  return { activeId, navigateTo }
}
