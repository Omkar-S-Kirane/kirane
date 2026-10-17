import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useTranslation } from '@/i18n'
import type { NavItem } from '@/constants/navbar-constants'
import {
  CONTACT_ITEM,
  NAVBAR_HEIGHT,
  NAV_ITEMS,
} from '@/constants/navbar-constants'
import { useActiveSection } from '@/hooks/use-active-section'
import { useSpotlight } from '@/hooks/use-spotlight'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'

function scrollToSection(targetId: string, reducedMotion: boolean) {
  const element = document.getElementById(targetId)
  if (!element) return false

  const top =
    element.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 16
  window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' })
  return true
}

// ---------------------------------------------------------------------------
// NavLink
// ---------------------------------------------------------------------------

function NavLink({
  item,
  isActive,
  onClick,
  reducedMotion,
}: {
  item: NavItem
  isActive: boolean
  onClick: () => void
  reducedMotion: boolean
}) {
  const { t } = useTranslation()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const targetId = item.href.slice(1)
    if (document.getElementById(targetId)) {
      e.preventDefault()
      onClick()
      scrollToSection(targetId, reducedMotion)
    }
    // If element doesn't exist, let the browser handle it normally
  }

  return (
    <a
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative px-3 py-1.5 text-sm transition-colors duration-200',
        isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {/* Active pill background */}
      {isActive && (
        <motion.span
          layoutId="active-pill"
          className="absolute inset-0 rounded-full bg-fg/[0.08]"
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 350,
            mass: 0.8,
          }}
        />
      )}
      <span className="relative z-10">{t.navigation[item.translationKey]}</span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// MobileMenu
// ---------------------------------------------------------------------------

function MobileMenu({
  isOpen,
  onClose,
  activeId,
  onNavClick,
  reducedMotion,
}: {
  isOpen: boolean
  onClose: () => void
  activeId: string | null
  onNavClick: (id: string) => void
  reducedMotion: boolean
}) {
  const { t } = useTranslation()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const handleItemClick = (href: string) => {
    const targetId = href.slice(1)
    onNavClick(targetId)
    onClose()

    scrollToSection(targetId, reducedMotion)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{
            duration: reducedMotion ? 0.01 : 0.2,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-border/80 bg-bg-muted/95 p-2 shadow-xl shadow-fg/5 backdrop-blur-md sm:hidden"
        >
          <nav
            aria-label={t.accessibility.mobileNavigation}
            className="flex flex-col gap-0.5"
          >
            {NAV_ITEMS.map((item) => {
              const id = item.href.slice(1)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    handleItemClick(item.href)
                  }}
                  aria-current={activeId === id ? 'page' : undefined}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-sm transition-colors duration-150',
                    activeId === id
                      ? 'bg-fg/[0.08] text-fg'
                      : 'text-fg-muted hover:bg-fg/[0.04] hover:text-fg',
                  )}
                >
                  {t.navigation[item.translationKey]}
                </a>
              )
            })}
            {/* Contact item in mobile menu */}
            <a
              href={CONTACT_ITEM.href}
              onClick={(e) => {
                e.preventDefault()
                handleItemClick(CONTACT_ITEM.href)
              }}
              aria-current={activeId === 'contact' ? 'page' : undefined}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm transition-colors duration-150',
                activeId === 'contact'
                  ? 'bg-fg/[0.08] text-fg'
                  : 'text-fg-muted hover:bg-fg/[0.04] hover:text-fg',
              )}
            >
              {t.navigation.contactMe}
            </a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Navbar (SpotlightNavbar)
// ---------------------------------------------------------------------------

export function Navbar() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion() === true
  const navRef = useRef<HTMLElement>(null)
  const [activeId, setActiveFromClick] = useActiveSection()
  const [mobileOpen, setMobileOpen] = useState(false)

  useSpotlight(navRef)

  const handleNavClick = useCallback(
    (id: string) => {
      setActiveFromClick(id)
    },
    [setActiveFromClick],
  )

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <header
      ref={navRef}
      className="spotlight-navbar fixed top-[calc(1rem+var(--layout-safe-area-top))] right-4 left-4 z-50 mx-auto max-w-[900px] rounded-full border border-border/80 bg-bg/90 backdrop-blur-sm sm:top-[calc(1.25rem+var(--layout-safe-area-top))]"
    >
      {/* Spotlight overlay — CSS-driven, no React state */}
      <div
        aria-hidden
        className="spotlight-glow pointer-events-none absolute inset-0 rounded-full"
      />

      <div className="relative flex h-14 items-center justify-between px-5 sm:px-6">
        {/* Brand */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            window.history.pushState(null, '', '/')
            window.scrollTo({
              top: 0,
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
            })
          }}
          className="text-base font-semibold tracking-tight text-fg"
          aria-label={t.accessibility.homeLink}
        >
          {t.common.brandName}
        </a>

        {/* Desktop nav — centred */}
        <nav
          aria-label={t.accessibility.mainNavigation}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:flex"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={activeId === item.href.slice(1)}
              onClick={() => handleNavClick(item.href.slice(1))}
              reducedMotion={prefersReducedMotion}
            />
          ))}
        </nav>

        {/* Right side — Language Switcher + Contact CTA (desktop) + mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />

          <a
            href={CONTACT_ITEM.href}
            onClick={(e) => {
              if (document.getElementById('contact')) {
                e.preventDefault()
                handleNavClick('contact')
                scrollToSection('contact', prefersReducedMotion)
              }
            }}
            className={cn(
              'hidden rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 sm:block',
              'bg-fg/[0.1] text-fg hover:bg-fg/[0.15]',
            )}
          >
            {t.navigation.contactMe}
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={
              mobileOpen ? t.accessibility.closeMenu : t.accessibility.openMenu
            }
            className="inline-flex items-center justify-center rounded-full p-2 text-fg-muted transition-colors duration-150 hover:text-fg sm:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeId={activeId}
        onNavClick={handleNavClick}
        reducedMotion={prefersReducedMotion}
      />
    </header>
  )
}
