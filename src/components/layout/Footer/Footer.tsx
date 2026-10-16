import { Container } from '@/components/ui/Container'
import { useTranslation } from '@/i18n'
import { CURRENT_YEAR, SOCIAL_LINKS } from '@/constants/footer-constants'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-fg-muted">
          &copy; {CURRENT_YEAR} {t.common.copyright}
        </p>
        <nav aria-label={t.accessibility.socialLinks} className="flex gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.translationKey}
              href={link.href}
              className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
            >
              {t.footer[link.translationKey]}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  )
}
