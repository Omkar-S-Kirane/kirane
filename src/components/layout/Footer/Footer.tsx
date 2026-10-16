import { Container } from '@/components/ui/Container'
import { CURRENT_YEAR, SOCIAL_LINKS } from '@/constants/footer-constants'

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <Container className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-fg-muted">&copy; {CURRENT_YEAR} KIRANE</p>
        <nav aria-label="Social links" className="flex gap-6">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  )
}
