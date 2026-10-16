import { Container } from '@/components/ui/Container'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
] as const

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-bg/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-fg"
          aria-label="KIRANE — home"
        >
          KIRANE
        </a>

        <nav aria-label="Main navigation" className="hidden gap-8 sm:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-fg-muted transition-colors duration-200 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  )
}
